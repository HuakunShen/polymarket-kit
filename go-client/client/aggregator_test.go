package client

import (
	"fmt"
	"testing"
	"time"
)

func TestAggregator_BookDedup(t *testing.T) {
	agg := NewAggregator(100, 60*time.Second)

	msg := []byte(`{"event_type":"book","asset_id":"123","market":"m1","timestamp":"1234","hash":"abc123","bids":[],"asks":[]}`)

	// 第一次: 新消息
	if !agg.Process(msg) {
		t.Fatal("first message should be forwarded")
	}
	// 第二次: 重复
	if agg.Process(msg) {
		t.Fatal("duplicate message should be dropped")
	}

	if agg.TotalIn.Load() != 2 {
		t.Fatalf("expected TotalIn=2, got %d", agg.TotalIn.Load())
	}
	if agg.TotalDedup.Load() != 1 {
		t.Fatalf("expected TotalDedup=1, got %d", agg.TotalDedup.Load())
	}
	if agg.TotalOut.Load() != 1 {
		t.Fatalf("expected TotalOut=1, got %d", agg.TotalOut.Load())
	}
}

func TestAggregator_DifferentHash(t *testing.T) {
	agg := NewAggregator(100, 60*time.Second)

	msg1 := []byte(`{"event_type":"book","asset_id":"123","market":"m1","timestamp":"1234","hash":"hash1","bids":[],"asks":[]}`)
	msg2 := []byte(`{"event_type":"book","asset_id":"123","market":"m1","timestamp":"1235","hash":"hash2","bids":[],"asks":[]}`)

	if !agg.Process(msg1) {
		t.Fatal("msg1 should be forwarded")
	}
	if !agg.Process(msg2) {
		t.Fatal("msg2 (different hash) should be forwarded")
	}
	if agg.TotalOut.Load() != 2 {
		t.Fatalf("expected 2 out, got %d", agg.TotalOut.Load())
	}
}

func TestAggregator_LastTradePrice(t *testing.T) {
	agg := NewAggregator(100, 60*time.Second)

	msg := []byte(`{"event_type":"last_trade_price","asset_id":"tok1","price":"0.55","size":"100","side":"BUY"}`)

	if !agg.Process(msg) {
		t.Fatal("first ltp should be forwarded")
	}
	if agg.Process(msg) {
		t.Fatal("duplicate ltp should be dropped")
	}

	// 不同 price = 不同消息
	msg2 := []byte(`{"event_type":"last_trade_price","asset_id":"tok1","price":"0.56","size":"100","side":"BUY"}`)
	if !agg.Process(msg2) {
		t.Fatal("different price ltp should be forwarded")
	}
}

func TestAggregator_TTLExpiry(t *testing.T) {
	// 短 TTL 用于测试
	agg := NewAggregator(100, 50*time.Millisecond)

	msg := []byte(`{"event_type":"book","asset_id":"123","market":"m1","timestamp":"1234","hash":"h1","bids":[],"asks":[]}`)

	if !agg.Process(msg) {
		t.Fatal("should forward")
	}
	if agg.Process(msg) {
		t.Fatal("should dedup")
	}

	// 等 TTL 过期
	time.Sleep(60 * time.Millisecond)

	// 过期后应该再次转发
	if !agg.Process(msg) {
		t.Fatal("should forward after TTL expiry")
	}
}

func TestAggregator_CapEviction(t *testing.T) {
	agg := NewAggregator(10, 60*time.Second)

	// 填满 + 超出
	for i := 0; i < 15; i++ {
		msg := []byte(fmt.Sprintf(`{"event_type":"book","asset_id":"%d","market":"m","timestamp":"t","hash":"h%d","bids":[],"asks":[]}`, i, i))
		if !agg.Process(msg) {
			t.Fatalf("msg %d should be new", i)
		}
	}

	// eviction 应该已经清理了一些条目
	agg.mu.Lock()
	size := len(agg.seen)
	agg.mu.Unlock()
	if size > 15 {
		t.Fatalf("seen map should have been evicted, got %d entries", size)
	}
}

func TestAggregator_UnknownType(t *testing.T) {
	agg := NewAggregator(100, 60*time.Second)

	// 无法识别的消息类型 → 无 dedup key → 直接转发
	msg := []byte(`{"event_type":"unknown","foo":"bar"}`)
	if !agg.Process(msg) {
		t.Fatal("unknown type should be forwarded")
	}
	if !agg.Process(msg) {
		t.Fatal("unknown type with no key should always forward")
	}
}

func TestSplitArrayMessage(t *testing.T) {
	// 数组
	arr := []byte(`[{"event_type":"book"},{"event_type":"price_change"}]`)
	parts := SplitArrayMessage(arr)
	if len(parts) != 2 {
		t.Fatalf("expected 2 parts, got %d", len(parts))
	}

	// 非数组
	single := []byte(`{"event_type":"book"}`)
	if SplitArrayMessage(single) != nil {
		t.Fatal("non-array should return nil")
	}

	// 空
	if SplitArrayMessage(nil) != nil {
		t.Fatal("nil should return nil")
	}
}
