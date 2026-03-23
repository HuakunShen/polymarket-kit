package client

import (
	"encoding/json"
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

// Aggregator deduplicates WebSocket messages from multiple redundant connections
// using the message hash field (book, price_change) or a composite key (last_trade_price).
type Aggregator struct {
	mu    sync.Mutex
	seen  map[string]int64 // dedupKey → receiveTimeMs
	cap   int
	ttlMs int64

	TotalIn    atomic.Int64
	TotalDedup atomic.Int64
	TotalOut   atomic.Int64
}

// NewAggregator creates an aggregator with the given capacity and TTL.
func NewAggregator(cap int, ttl time.Duration) *Aggregator {
	return &Aggregator{
		seen:  make(map[string]int64, cap),
		cap:   cap,
		ttlMs: ttl.Milliseconds(),
	}
}

// Process checks if a message is a duplicate. Returns true if the message is new
// and should be forwarded to the consumer.
func (a *Aggregator) Process(data []byte) bool {
	key := extractDedupKey(data)
	if key == "" {
		// 无法提取 key，保守地转发
		a.TotalIn.Add(1)
		a.TotalOut.Add(1)
		return true
	}

	nowMs := time.Now().UnixMilli()

	a.mu.Lock()
	defer a.mu.Unlock()

	a.TotalIn.Add(1)

	if ts, exists := a.seen[key]; exists && (nowMs-ts) < a.ttlMs {
		a.TotalDedup.Add(1)
		return false
	}

	a.seen[key] = nowMs

	// 超容量时清理过期 entries
	if len(a.seen) > a.cap {
		a.evictLocked(nowMs)
	}

	a.TotalOut.Add(1)
	return true
}

// evictLocked 清理过期条目（必须持有锁调用）
func (a *Aggregator) evictLocked(nowMs int64) {
	for k, ts := range a.seen {
		if (nowMs - ts) >= a.ttlMs {
			delete(a.seen, k)
		}
	}
}

// Reset 清空去重缓存
func (a *Aggregator) Reset() {
	a.mu.Lock()
	a.seen = make(map[string]int64, a.cap)
	a.mu.Unlock()
}

// extractDedupKey 从原始 WS 消息 JSON 中快速提取去重 key。
// book / price_change 消息使用 hash 字段；last_trade_price 使用组合 key。
func extractDedupKey(data []byte) string {
	// 快速 JSON 解析：只提取 event_type 和 hash
	var probe struct {
		EventType string `json:"event_type"`
		Hash      string `json:"hash"`
		// last_trade_price 字段
		AssetID string `json:"asset_id"`
		Price   string `json:"price"`
		Size    string `json:"size"`
	}

	if err := json.Unmarshal(data, &probe); err != nil {
		return ""
	}

	switch probe.EventType {
	case "book", "tick_size_change":
		if probe.Hash != "" {
			return probe.EventType + ":" + probe.Hash
		}
	case "price_change":
		// price_change 消息可能包含多个 changes，但消息本身的 hash 可能不唯一。
		// 使用整个消息的 hash（如果有）或消息内容 hash。
		if probe.Hash != "" {
			return "pc:" + probe.Hash
		}
		// price_change 可能没有顶层 hash，用 market + timestamp
		var pc struct {
			Market    string `json:"market"`
			Timestamp string `json:"timestamp"`
		}
		if json.Unmarshal(data, &pc) == nil && pc.Market != "" {
			return fmt.Sprintf("pc:%s:%s", pc.Market, pc.Timestamp)
		}
	case "last_trade_price":
		// 无 hash 字段，用组合 key
		if probe.AssetID != "" && probe.Price != "" {
			return fmt.Sprintf("ltp:%s:%s:%s", probe.AssetID, probe.Price, probe.Size)
		}
	}

	return ""
}

// SplitArrayMessage 将 JSON 数组消息拆分为单条消息。
// 如果输入不是数组，返回 nil（调用方应按单条处理）。
func SplitArrayMessage(data []byte) []json.RawMessage {
	if len(data) == 0 || data[0] != '[' {
		return nil
	}
	var messages []json.RawMessage
	if err := json.Unmarshal(data, &messages); err != nil {
		return nil
	}
	return messages
}
