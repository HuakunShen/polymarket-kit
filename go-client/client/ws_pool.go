// Package client provides a redundant WebSocket pool for the Polymarket CLOB
// market channel. RedundantWSPool maintains N parallel connections, all subscribing
// to the same tokens, with an Aggregator that deduplicates messages before
// forwarding them to the consumer callback.
package client

import (
	"context"
	"log/slog"
	"sync"
	"time"
)

// PoolConfig 配置冗余 WS 连接池。
type PoolConfig struct {
	Redundancy       int           // 并行连接数（默认 2）
	StaggerDelay     time.Duration // 连接间启动延迟（默认 3s）
	PingInterval     time.Duration // PING 间隔（默认 10s）
	PongTimeout      time.Duration // PONG 超时，超时则重连（默认 30s）
	HealthCheckEvery time.Duration // 健康检查间隔（默认 5s）
	ReconnectBase    time.Duration // 重连初始退避（默认 1s）
	ReconnectMax     time.Duration // 重连最大退避（默认 30s）
	DedupTTL         time.Duration // 去重 TTL（默认 60s）
	DedupCap         int           // 去重缓存容量（默认 10000）
	CustomFeature    bool          // 订阅时发送 custom_feature_enabled（默认 true）
	OnMessage        func([]byte)  // 去重后消息回调（必填）
	OnConnState      func(connID int, connected bool) // 连接状态变化回调（可选）
	Logger           *slog.Logger  // 日志（可选，默认 slog.Default）
}

func (c *PoolConfig) applyDefaults() {
	if c.Redundancy <= 0 {
		c.Redundancy = 2
	}
	if c.StaggerDelay == 0 {
		c.StaggerDelay = 3 * time.Second
	}
	if c.PingInterval == 0 {
		c.PingInterval = 10 * time.Second
	}
	if c.PongTimeout == 0 {
		c.PongTimeout = 30 * time.Second
	}
	if c.HealthCheckEvery == 0 {
		c.HealthCheckEvery = 5 * time.Second
	}
	if c.ReconnectBase == 0 {
		c.ReconnectBase = 1 * time.Second
	}
	if c.ReconnectMax == 0 {
		c.ReconnectMax = 30 * time.Second
	}
	if c.DedupTTL == 0 {
		c.DedupTTL = 60 * time.Second
	}
	if c.DedupCap <= 0 {
		c.DedupCap = 10000
	}
	if c.Logger == nil {
		c.Logger = slog.Default()
	}
}

// PoolStats 供调用方读取指标，汇报给自己的 metrics 系统。
type PoolStats struct {
	Conns         []ConnStats
	MessagesIn    int64
	MessagesDedup int64
	MessagesOut   int64
	SubscribedIDs int
}

// ConnStats 单连接状态。
type ConnStats struct {
	ID          int
	Connected   bool
	LastPongAt  time.Time
	PongLatency time.Duration // 最近一次 PING→PONG
	MsgCount    int64
	PingsSent   int64
	PongsRecvd  int64
	Reconnects  int64
}

// RedundantWSPool 管理 N 个冗余 WS 连接，通过 Aggregator 去重后输出。
type RedundantWSPool struct {
	cfg        PoolConfig
	conns      []*ManagedConn
	aggregator *Aggregator
	mu         sync.RWMutex
	assetIDs   map[string]struct{}
	ctx        context.Context
	cancel     context.CancelFunc
}

// NewRedundantWSPool 创建连接池。调用 Start() 启动连接。
func NewRedundantWSPool(cfg PoolConfig) *RedundantWSPool {
	cfg.applyDefaults()
	return &RedundantWSPool{
		cfg:        cfg,
		aggregator: NewAggregator(cfg.DedupCap, cfg.DedupTTL),
		assetIDs:   make(map[string]struct{}),
	}
}

// Start 按 StaggerDelay 间隔逐个启动连接 + 健康检查 goroutine。
func (p *RedundantWSPool) Start(ctx context.Context) error {
	p.ctx, p.cancel = context.WithCancel(ctx)

	p.conns = make([]*ManagedConn, p.cfg.Redundancy)
	for i := range p.conns {
		p.conns[i] = newManagedConn(i, p)
	}

	// 逐个启动，间隔 StaggerDelay
	for i, mc := range p.conns {
		if i > 0 {
			select {
			case <-p.ctx.Done():
				return p.ctx.Err()
			case <-time.After(p.cfg.StaggerDelay):
			}
		}
		if err := mc.connect(); err != nil {
			p.log(slog.LevelWarn, "Initial connection failed, will retry in background",
				"conn_id", i, "error", err)
			go mc.reconnect()
		}
	}

	go p.healthMonitor()
	return nil
}

// Subscribe 动态添加 asset IDs（对 pool 内所有连接广播）。
// 内部使用全量重订阅（type: "market"），确保 Polymarket 服务端正确处理。
func (p *RedundantWSPool) Subscribe(assetIDs []string) {
	if len(assetIDs) == 0 {
		return
	}

	// 过滤已存在的
	p.mu.Lock()
	added := 0
	for _, id := range assetIDs {
		if _, exists := p.assetIDs[id]; !exists {
			p.assetIDs[id] = struct{}{}
			added++
		}
	}
	p.mu.Unlock()

	if added == 0 {
		return
	}

	p.log(slog.LevelInfo, "Subscribing to new tokens", "added", added, "total", p.subscribedCount())

	// 重发全量订阅，避免 dynamic subscribe 在无初始订阅时不生效
	for _, mc := range p.conns {
		if mc.Connected.Load() {
			if err := mc.sendFullSubscription(); err != nil {
				p.log(slog.LevelWarn, "Full re-subscribe failed",
					"conn_id", mc.id, "error", err)
			}
		}
	}
}

func (p *RedundantWSPool) subscribedCount() int {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return len(p.assetIDs)
}

// Unsubscribe 动态移除 asset IDs（对 pool 内所有连接广播）。
func (p *RedundantWSPool) Unsubscribe(assetIDs []string) {
	if len(assetIDs) == 0 {
		return
	}

	p.mu.Lock()
	removed := 0
	for _, id := range assetIDs {
		if _, exists := p.assetIDs[id]; exists {
			delete(p.assetIDs, id)
			removed++
		}
	}
	p.mu.Unlock()

	if removed == 0 {
		return
	}

	p.log(slog.LevelInfo, "Unsubscribing tokens", "removed", removed, "total", p.subscribedCount())

	// 使用 dynamic unsubscribe 协议
	for _, mc := range p.conns {
		if mc.Connected.Load() {
			if err := mc.sendDynamic(assetIDs, "unsubscribe"); err != nil {
				p.log(slog.LevelWarn, "Dynamic unsubscribe failed",
					"conn_id", mc.id, "error", err)
			}
		}
	}
}

// Stats 返回当前 pool 状态（线程安全）。
func (p *RedundantWSPool) Stats() PoolStats {
	p.mu.RLock()
	nIDs := len(p.assetIDs)
	p.mu.RUnlock()

	stats := PoolStats{
		Conns:         make([]ConnStats, len(p.conns)),
		MessagesIn:    p.aggregator.TotalIn.Load(),
		MessagesDedup: p.aggregator.TotalDedup.Load(),
		MessagesOut:   p.aggregator.TotalOut.Load(),
		SubscribedIDs: nIDs,
	}

	for i, mc := range p.conns {
		pongAt := mc.LastPongAt.Load()
		var pongTime time.Time
		if pongAt > 0 {
			pongTime = time.UnixMilli(pongAt)
		}
		stats.Conns[i] = ConnStats{
			ID:          mc.id,
			Connected:   mc.Connected.Load(),
			LastPongAt:  pongTime,
			PongLatency: time.Duration(mc.PongLatency.Load()) * time.Millisecond,
			MsgCount:    mc.MsgCount.Load(),
			PingsSent:   mc.PingsSent.Load(),
			PongsRecvd:  mc.PongsRecvd.Load(),
			Reconnects:  mc.Reconnects.Load(),
		}
	}
	return stats
}

// Shutdown 关闭所有连接。
func (p *RedundantWSPool) Shutdown() {
	p.log(slog.LevelInfo, "Shutting down WS pool")
	if p.cancel != nil {
		p.cancel()
	}
	for _, mc := range p.conns {
		mc.close()
	}
}

// healthMonitor 定期检查每个连接的 PONG 新鲜度，超时则强制重连。
func (p *RedundantWSPool) healthMonitor() {
	ticker := time.NewTicker(p.cfg.HealthCheckEvery)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			p.checkHealth()
		}
	}
}

func (p *RedundantWSPool) checkHealth() {
	now := time.Now().UnixMilli()
	timeoutMs := p.cfg.PongTimeout.Milliseconds()

	for _, mc := range p.conns {
		if !mc.Connected.Load() {
			continue
		}

		pongAt := mc.LastPongAt.Load()
		if pongAt == 0 {
			// 还没收到过 PONG，用连接时间 + 超时判断
			mc.connectedAtMu.RLock()
			connAt := mc.connectedAt.UnixMilli()
			mc.connectedAtMu.RUnlock()
			if now-connAt > timeoutMs {
				p.log(slog.LevelWarn, "No PONG since connect, reconnecting",
					"conn_id", mc.id,
					"age_ms", now-connAt)
				go mc.reconnect()
			}
			continue
		}

		ageMs := now - pongAt
		if ageMs > timeoutMs {
			p.log(slog.LevelWarn, "PONG timeout, reconnecting",
				"conn_id", mc.id,
				"pong_age_ms", ageMs,
				"timeout_ms", timeoutMs)
			go mc.reconnect()
		}
	}
}

func (p *RedundantWSPool) log(level slog.Level, msg string, args ...any) {
	p.cfg.Logger.Log(context.Background(), level, "[WSPool] "+msg, args...)
}
