//go:build smoke

package client

import (
	"context"
	"log/slog"
	"sync/atomic"
	"testing"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/gamma"
)

// TestWSPoolSmoke 集成测试：连接真实 Polymarket WS，验证数据流和动态订阅。
// 运行: go test -tags smoke -run TestWSPoolSmoke -v -timeout 120s
func TestWSPoolSmoke(t *testing.T) {
	// ── 1. 获取活跃 token IDs ──
	sdk := gamma.NewGammaSDK(nil)

	// 获取最新的活跃 crypto updown events
	events, err := sdk.GetActiveEvents(nil)
	if err != nil {
		t.Skipf("Cannot fetch events from Gamma API: %v", err)
	}

	// 过滤 crypto updown 5m events，提取 token IDs
	var tokenIDs []string
	for _, ev := range events {
		for _, m := range ev.Markets {
			if len(m.ClobTokenIDs) >= 2 && containsUpDown(m.Question) {
				tokenIDs = append(tokenIDs, m.ClobTokenIDs...)
				if len(tokenIDs) >= 8 { // 够了
					break
				}
			}
		}
		if len(tokenIDs) >= 8 {
			break
		}
	}
	if len(tokenIDs) == 0 {
		t.Skip("No crypto updown token IDs found in active events")
	}
	t.Logf("Found %d token IDs", len(tokenIDs))

	// 用前 4 个 tokens（2 events × 2 tokens）
	if len(tokenIDs) > 4 {
		tokenIDs = tokenIDs[:4]
	}

	// ── 2. 创建 WSPool (Redundancy=2) ──
	var msgCount atomic.Int64
	var connStateChanges atomic.Int64

	pool := NewRedundantWSPool(PoolConfig{
		Redundancy:    2,
		StaggerDelay:  1 * time.Second, // 短延迟加速测试
		CustomFeature: true,
		OnMessage: func(data []byte) {
			msgCount.Add(1)
		},
		OnConnState: func(connID int, connected bool) {
			connStateChanges.Add(1)
			t.Logf("Conn %d state: connected=%v", connID, connected)
		},
		Logger: slog.Default(),
	})

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	// ── 3. 启动 + 订阅 ──
	if err := pool.Start(ctx); err != nil {
		t.Fatalf("Start failed: %v", err)
	}
	defer pool.Shutdown()

	pool.Subscribe(tokenIDs)

	// ── 4. 收集 15 秒数据 ──
	t.Log("Collecting data for 15 seconds...")
	time.Sleep(15 * time.Second)

	stats := pool.Stats()
	t.Logf("Stats after 15s: in=%d dedup=%d out=%d subscribed=%d",
		stats.MessagesIn, stats.MessagesDedup, stats.MessagesOut, stats.SubscribedIDs)

	for _, cs := range stats.Conns {
		t.Logf("  Conn %d: connected=%v msgs=%d pings=%d pongs=%d latency=%dms",
			cs.ID, cs.Connected, cs.MsgCount, cs.PingsSent, cs.PongsRecvd, cs.PongLatency.Milliseconds())
	}

	// 验证: 两个连接都活着且 PONG 正常
	for _, cs := range stats.Conns {
		if !cs.Connected {
			t.Fatalf("Conn %d not connected", cs.ID)
		}
		if cs.PongsRecvd == 0 {
			t.Fatalf("Conn %d received 0 PONGs — PING/PONG broken", cs.ID)
		}
		if cs.PongLatency > 5*time.Second {
			t.Errorf("Conn %d PONG latency too high: %v", cs.ID, cs.PongLatency)
		}
	}

	// 市场数据量取决于实际交易活跃度，不强制要求 >0
	if stats.MessagesOut == 0 {
		t.Log("NOTE: 0 market messages received — tokens may be inactive. Connection + PING/PONG verified OK.")
	} else {
		t.Logf("Received %d unique messages (deduped %d)", stats.MessagesOut, stats.MessagesDedup)
	}

	// 验证: subscribed 数量正确
	if stats.SubscribedIDs != 4 {
		t.Errorf("Expected 4 subscribed IDs, got %d", stats.SubscribedIDs)
	}

	// ── 5. 动态 Unsubscribe ──
	if len(tokenIDs) >= 2 {
		unsubTokens := tokenIDs[:2]
		t.Logf("Unsubscribing %d tokens...", len(unsubTokens))
		pool.Unsubscribe(unsubTokens)

		stats2 := pool.Stats()
		if stats2.SubscribedIDs != len(tokenIDs)-2 {
			t.Errorf("Expected %d subscribed after unsub, got %d",
				len(tokenIDs)-2, stats2.SubscribedIDs)
		}
	}

	// ── 6. 动态 Subscribe 新 token ──
	// 用剩余的 token IDs（如果我们一开始只订阅了前 4 个）
	if len(tokenIDs) > 4 {
		newTokens := tokenIDs[4:]
		t.Logf("Subscribing to %d new tokens...", len(newTokens))
		pool.Subscribe(newTokens)

		time.Sleep(5 * time.Second)
		stats3 := pool.Stats()
		t.Logf("Stats after new sub: out=%d subscribed=%d",
			stats3.MessagesOut, stats3.SubscribedIDs)
	}

	t.Log("Smoke test passed")
}

// containsUpDown 简单判断 market question 是否是 crypto updown
func containsUpDown(question string) bool {
	for _, kw := range []string{"up", "Up", "UP", "down", "Down", "DOWN"} {
		if len(question) > 0 {
			for i := 0; i <= len(question)-len(kw); i++ {
				if question[i:i+len(kw)] == kw {
					return true
				}
			}
		}
	}
	return false
}
