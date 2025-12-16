package realtime

// ClobApiKeyCreds API key credentials for CLOB authentication.
type ClobApiKeyCreds struct {
	// API key used for authentication
	Key string `json:"key"`

	// API secret associated with the key
	Secret string `json:"secret"`

	// Passphrase required for authentication
	Passphrase string `json:"passphrase"`
}

// GammaAuth Authentication details for Gamma authentication.
type GammaAuth struct {
	// Address used for authentication
	Address string `json:"address"`
}

// Subscription represents a single subscription item
type Subscription struct {
	// Topic to subscribe to
	Topic string `json:"topic"`

	// Type of subscription
	Type string `json:"type"`

	// Optional filters for the subscription (can be JSON string)
	Filters string `json:"filters,omitempty"`

	// Optional CLOB authentication credentials
	ClobAuth *ClobApiKeyCreds `json:"clob_auth,omitempty"`

	// Optional Gamma authentication credentials
	GammaAuth *GammaAuth `json:"gamma_auth,omitempty"`
}

// SubscriptionMessage Message structure for subscription requests.
type SubscriptionMessage struct {
	Action        string         `json:"action"`
	Subscriptions []Subscription `json:"subscriptions"`
}

// Message Represents a real-time message received from the WebSocket server.
type Message struct {
	// Topic of the message
	Topic string `json:"topic"`

	// Type of the message
	Type string `json:"type"`

	// Timestamp of when the message was sent
	Timestamp int64 `json:"timestamp"`

	// Payload containing the message data
	Payload interface{} `json:"payload"`

	// Connection ID
	ConnectionID string `json:"connection_id"`
}

// ConnectionStatus Represents websocket connection status
type ConnectionStatus string

const (
	ConnectionStatusConnecting   ConnectionStatus = "CONNECTING"
	ConnectionStatusConnected    ConnectionStatus = "CONNECTED"
	ConnectionStatusDisconnected ConnectionStatus = "DISCONNECTED"
)

// --- CLOB Market Payload Schemas ---
// These types represent the JSON payload structures for different clob_market message types

// OrderBookLevel represents a single price level in an order book
type OrderBookLevel struct {
	Price string `json:"price"`
	Size  string `json:"size"`
}

// PriceChange represents a single price change entry in a price_change message
type PriceChange struct {
	AssetID string `json:"a"`  // asset_id
	Hash    string `json:"h"`  // hash
	Price   string `json:"p"`  // price
	Side    string `json:"s"`  // side
	Size    string `json:"si"` // size
	BestAsk string `json:"ba"` // best_ask
	BestBid string `json:"bb"` // best_bid
}

// PriceChangePayload represents the payload for clob_market price_change messages
type PriceChangePayload struct {
	Market       string        `json:"m"`  // market
	PriceChanges []PriceChange `json:"pc"` // price_changes
	Timestamp    string        `json:"t"`  // timestamp
}

// OrderBookEntry represents a single order book entry in an agg_orderbook message
type OrderBookEntry struct {
	Market       string           `json:"market"`
	AssetID      string           `json:"asset_id"`
	Timestamp    string           `json:"timestamp"`
	Hash         string           `json:"hash"`
	Bids         []OrderBookLevel `json:"bids"`
	Asks         []OrderBookLevel `json:"asks"`
	MinOrderSize string           `json:"min_order_size"`
	TickSize     string           `json:"tick_size"`
	NegRisk      bool             `json:"neg_risk"`
}

// LastTradePricePayload represents the payload for clob_market last_trade_price messages
type LastTradePricePayload struct {
	AssetID    string `json:"asset_id"`
	FeeRateBps string `json:"fee_rate_bps"`
	Market     string `json:"market"`
	Price      string `json:"price"`
	Side       string `json:"side"`
	Size       string `json:"size"`
}

// TickSizeChangePayload represents the payload for clob_market tick_size_change messages
type TickSizeChangePayload struct {
	Market      string   `json:"market"`
	AssetID     []string `json:"asset_id"`
	OldTickSize string   `json:"old_tick_size"`
	NewTickSize string   `json:"new_tick_size"`
}

// ClobMarketPayload represents the payload for clob_market market_created and market_resolved messages
type ClobMarketPayload struct {
	Market       string   `json:"market"`
	AssetIDs     []string `json:"asset_ids"`
	MinOrderSize string   `json:"min_order_size"`
	TickSize     string   `json:"tick_size"`
	NegRisk      bool     `json:"neg_risk"`
}
