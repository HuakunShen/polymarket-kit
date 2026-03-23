package client

import (
	"fmt"
	"log/slog"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
)

const wsMarketURL = "wss://ws-subscriptions-clob.polymarket.com/ws/market"

// ManagedConn is a single WebSocket connection with PING/PONG tracking,
// automatic reconnection, and health monitoring.
type ManagedConn struct {
	id   int
	pool *RedundantWSPool

	conn *websocket.Conn
	mu   sync.Mutex // protects conn writes + close
	stop chan struct{}
	once sync.Once

	// 防止并发 reconnect（healthMonitor + readLoop 可能同时触发）
	reconnecting atomic.Bool

	// 健康状态（atomic，供外部读取）
	LastPongAt    atomic.Int64 // UnixMilli
	LastPingAt    atomic.Int64 // UnixMilli，最近一次 PING 发送时间
	PongLatency   atomic.Int64 // 最近一次 PING→PONG 延迟 ms
	Connected     atomic.Bool
	MsgCount      atomic.Int64
	PingsSent     atomic.Int64
	PongsRecvd    atomic.Int64
	Reconnects    atomic.Int64
	connectedAtMu sync.RWMutex
	connectedAt   time.Time
}

func newManagedConn(id int, pool *RedundantWSPool) *ManagedConn {
	return &ManagedConn{
		id:   id,
		pool: pool,
		stop: make(chan struct{}),
	}
}

// connect 建立 WS 连接，发送订阅消息，启动 readLoop 和 pingLoop。
func (mc *ManagedConn) connect() error {
	conn, _, err := websocket.DefaultDialer.Dial(wsMarketURL, nil)
	if err != nil {
		return fmt.Errorf("conn[%d] dial: %w", mc.id, err)
	}

	mc.mu.Lock()
	mc.conn = conn
	mc.Connected.Store(true)
	mc.stop = make(chan struct{})
	mc.once = sync.Once{}
	mc.mu.Unlock()

	mc.connectedAtMu.Lock()
	mc.connectedAt = time.Now()
	mc.connectedAtMu.Unlock()

	// 发送全量订阅
	if err := mc.sendFullSubscription(); err != nil {
		conn.Close()
		mc.Connected.Store(false)
		return fmt.Errorf("conn[%d] subscribe: %w", mc.id, err)
	}

	mc.pool.log(slog.LevelInfo, "WS connection established", "conn_id", mc.id)

	if mc.pool.cfg.OnConnState != nil {
		mc.pool.cfg.OnConnState(mc.id, true)
	}

	go mc.readLoop(conn)
	go mc.pingLoop(conn)
	return nil
}

// sendFullSubscription 发送当前全量 asset IDs 的初始订阅。
func (mc *ManagedConn) sendFullSubscription() error {
	mc.pool.mu.RLock()
	ids := make([]string, 0, len(mc.pool.assetIDs))
	for id := range mc.pool.assetIDs {
		ids = append(ids, id)
	}
	mc.pool.mu.RUnlock()

	if len(ids) == 0 {
		return nil
	}

	msg := map[string]any{
		"assets_ids":             ids,
		"type":                   "market",
		"custom_feature_enabled": mc.pool.cfg.CustomFeature,
	}

	mc.mu.Lock()
	defer mc.mu.Unlock()
	if mc.conn == nil {
		return fmt.Errorf("not connected")
	}
	return mc.conn.WriteJSON(msg)
}

// sendDynamic 发送动态 subscribe/unsubscribe 消息。
func (mc *ManagedConn) sendDynamic(assetIDs []string, operation string) error {
	if len(assetIDs) == 0 {
		return nil
	}

	msg := map[string]any{
		"assets_ids": assetIDs,
		"operation":  operation,
	}
	if operation == "subscribe" {
		msg["custom_feature_enabled"] = mc.pool.cfg.CustomFeature
	}

	mc.mu.Lock()
	defer mc.mu.Unlock()
	if mc.conn == nil {
		return fmt.Errorf("conn[%d] not connected", mc.id)
	}
	return mc.conn.WriteJSON(msg)
}

// readLoop 读取 WS 消息，过滤 PONG，通过 aggregator 去重后回调。
func (mc *ManagedConn) readLoop(conn *websocket.Conn) {
	abnormal := false
	defer func() {
		mc.Connected.Store(false)
		if mc.pool.cfg.OnConnState != nil {
			mc.pool.cfg.OnConnState(mc.id, false)
		}
		if abnormal {
			mc.pool.log(slog.LevelWarn, "WS connection lost, will reconnect", "conn_id", mc.id)
			go mc.reconnect()
		}
	}()

	for {
		select {
		case <-mc.stop:
			return
		default:
		}

		_, data, err := conn.ReadMessage()
		if err != nil {
			select {
			case <-mc.stop:
				return // 正常关闭
			default:
				mc.pool.log(slog.LevelError, "WS read error", "conn_id", mc.id, "error", err)
				abnormal = true
				return
			}
		}

		// PONG 处理
		if string(data) == "PONG" {
			now := time.Now().UnixMilli()
			mc.LastPongAt.Store(now)
			mc.PongsRecvd.Add(1)
			pingAt := mc.LastPingAt.Load()
			if pingAt > 0 {
				mc.PongLatency.Store(now - pingAt)
			}
			continue
		}

		mc.MsgCount.Add(1)
		mc.pool.log(slog.LevelDebug, "WS message received",
			"conn_id", mc.id, "len", len(data), "preview", string(data[:min(200, len(data))]))

		// 数组消息拆分
		if parts := SplitArrayMessage(data); parts != nil {
			for _, part := range parts {
				if mc.pool.aggregator.Process(part) {
					mc.pool.cfg.OnMessage(part)
				}
			}
		} else {
			if mc.pool.aggregator.Process(data) {
				mc.pool.cfg.OnMessage(data)
			}
		}
	}
}

// pingLoop 每 PingInterval 发送 "PING"。
func (mc *ManagedConn) pingLoop(conn *websocket.Conn) {
	ticker := time.NewTicker(mc.pool.cfg.PingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-mc.stop:
			return
		case <-ticker.C:
			mc.mu.Lock()
			err := conn.WriteMessage(websocket.TextMessage, []byte("PING"))
			mc.mu.Unlock()
			if err != nil {
				select {
				case <-mc.stop:
					return
				default:
					mc.pool.log(slog.LevelWarn, "WS ping failed", "conn_id", mc.id, "error", err)
					mc.close()
					return
				}
			}
			mc.LastPingAt.Store(time.Now().UnixMilli())
			mc.PingsSent.Add(1)
		}
	}
}

// reconnect 指数退避重连。CAS 防止 readLoop + healthMonitor 同时触发。
func (mc *ManagedConn) reconnect() {
	if !mc.reconnecting.CompareAndSwap(false, true) {
		return // 已有另一个 goroutine 在重连
	}
	defer mc.reconnecting.Store(false)

	mc.close()

	backoff := mc.pool.cfg.ReconnectBase
	for {
		select {
		case <-mc.pool.ctx.Done():
			return
		default:
		}

		mc.Reconnects.Add(1)
		mc.pool.log(slog.LevelInfo, "Reconnecting", "conn_id", mc.id, "backoff", backoff)

		time.Sleep(backoff)

		// 重建 stop channel 和 once
		mc.mu.Lock()
		mc.stop = make(chan struct{})
		mc.once = sync.Once{}
		mc.mu.Unlock()

		if err := mc.connect(); err != nil {
			mc.pool.log(slog.LevelWarn, "Reconnect failed", "conn_id", mc.id, "error", err)
			backoff = min(backoff*2, mc.pool.cfg.ReconnectMax)
			continue
		}
		return
	}
}

// close 安全关闭连接。可多次调用。
func (mc *ManagedConn) close() {
	mc.once.Do(func() {
		close(mc.stop)
	})
	mc.mu.Lock()
	if mc.conn != nil {
		mc.conn.Close()
		mc.conn = nil
	}
	mc.mu.Unlock()
	mc.Connected.Store(false)
}
