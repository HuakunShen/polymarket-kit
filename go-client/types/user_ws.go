package types

import (
	"encoding/json"
	"fmt"
)

// User Channel WebSocket Message Types
// Based on: https://docs.polymarket.com/api-reference/wss/user

// UserEventType represents the type of user channel WebSocket message
type UserEventType string

const (
	UserEventTypeOrder UserEventType = "order"
	UserEventTypeTrade UserEventType = "trade"
)

// OrderActionType represents the type of order action
type OrderActionType string

const (
	OrderActionPlacement    OrderActionType = "PLACEMENT"
	OrderActionUpdate       OrderActionType = "UPDATE"
	OrderActionCancellation OrderActionType = "CANCELLATION"
)

// OrderStatus represents order status
type OrderStatus string

const (
	OrderStatusLive     OrderStatus = "LIVE"
	OrderStatusMatched  OrderStatus = "MATCHED"
	OrderStatusCanceled OrderStatus = "CANCELED"
)

// TradeStatus represents trade lifecycle status
type TradeStatus string

const (
	TradeStatusMatched   TradeStatus = "MATCHED"
	TradeStatusMined     TradeStatus = "MINED"
	TradeStatusConfirmed TradeStatus = "CONFIRMED"
	TradeStatusRetrying  TradeStatus = "RETRYING"
	TradeStatusFailed    TradeStatus = "FAILED"
)

// TraderSide represents whether the user was taker or maker
type TraderSide string

const (
	TraderSideTaker TraderSide = "TAKER"
	TraderSideMaker TraderSide = "MAKER"
)

// OrderEvent represents an order event from the user channel
type OrderEvent struct {
	EventType    UserEventType   `json:"event_type"`
	Type         OrderActionType `json:"type"`
	ID           string          `json:"id"`
	Owner        string          `json:"owner"`
	Market       string          `json:"market"`
	AssetID      string          `json:"asset_id"`
	Side         Side            `json:"side"`
	Status       OrderStatus     `json:"status"`
	Price        string          `json:"price"`
	OriginalSize string          `json:"original_size"`
	SizeMatched  string          `json:"size_matched"`
	OrderType    string          `json:"order_type"` // GTC, GTD, FOK
	Timestamp    string          `json:"timestamp"`
}

// TradeMatchedOrder represents a maker order matched in a trade
type TradeMatchedOrder struct {
	OrderID       string `json:"order_id"`
	MakerAddress  string `json:"maker_address"`
	MatchedAmount string `json:"matched_amount"`
}

// TradeEvent represents a trade event from the user channel
type TradeEvent struct {
	EventType    UserEventType     `json:"event_type"`
	Type         string            `json:"type"` // always "TRADE"
	ID           string            `json:"id"`
	TakerOrderID string            `json:"taker_order_id"`
	Market       string            `json:"market"`
	Side         Side              `json:"side"`
	Size         string            `json:"size"`
	Price        string            `json:"price"`
	Status       TradeStatus       `json:"status"`
	TraderSide   TraderSide        `json:"trader_side"`
	MakerOrders  []TradeMatchedOrder `json:"maker_orders"`
	Timestamp    string            `json:"timestamp"`
}

// UserChannelMessage is a union interface for user channel messages
type UserChannelMessage interface {
	GetUserEventType() UserEventType
}

func (e *OrderEvent) GetUserEventType() UserEventType { return e.EventType }
func (e *TradeEvent) GetUserEventType() UserEventType { return e.EventType }

// ParseUserChannelMessage parses a raw JSON message from the user channel
func ParseUserChannelMessage(data []byte) (UserChannelMessage, error) {
	var wrapper struct {
		EventType UserEventType `json:"event_type"`
	}
	if err := json.Unmarshal(data, &wrapper); err != nil {
		return nil, fmt.Errorf("failed to parse event_type: %w", err)
	}

	switch wrapper.EventType {
	case UserEventTypeOrder:
		var msg OrderEvent
		if err := json.Unmarshal(data, &msg); err != nil {
			return nil, fmt.Errorf("failed to parse order event: %w", err)
		}
		return &msg, nil
	case UserEventTypeTrade:
		var msg TradeEvent
		if err := json.Unmarshal(data, &msg); err != nil {
			return nil, fmt.Errorf("failed to parse trade event: %w", err)
		}
		return &msg, nil
	default:
		return nil, fmt.Errorf("unknown user event_type: %s", wrapper.EventType)
	}
}
