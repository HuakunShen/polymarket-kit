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
