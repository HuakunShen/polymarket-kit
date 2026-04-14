package client

import (
	"testing"
	"time"
)

func TestManagedConnResetHealthState(t *testing.T) {
	pool := NewRedundantWSPool(PoolConfig{
		OnMessage: func([]byte) {},
	})
	mc := newManagedConn(0, pool)

	old := time.Now().Add(-2 * time.Minute).UnixMilli()
	mc.LastPongAt.Store(old)
	mc.LastPingAt.Store(old)
	mc.PongLatency.Store(1234)

	resetAt := time.Now()
	mc.resetHealthState(resetAt)

	if got := mc.LastPongAt.Load(); got != 0 {
		t.Fatalf("expected LastPongAt reset to 0, got %d", got)
	}
	if got := mc.LastPingAt.Load(); got != 0 {
		t.Fatalf("expected LastPingAt reset to 0, got %d", got)
	}
	if got := mc.PongLatency.Load(); got != 0 {
		t.Fatalf("expected PongLatency reset to 0, got %d", got)
	}

	mc.connectedAtMu.RLock()
	connectedAt := mc.connectedAt
	mc.connectedAtMu.RUnlock()

	if connectedAt.IsZero() {
		t.Fatal("expected connectedAt to be set")
	}
	if connectedAt.Before(resetAt.Add(-50 * time.Millisecond)) {
		t.Fatalf("expected connectedAt near reset time, got %v before %v", connectedAt, resetAt)
	}
	if connectedAt.After(time.Now().Add(50 * time.Millisecond)) {
		t.Fatalf("expected connectedAt not in the future, got %v", connectedAt)
	}
}
