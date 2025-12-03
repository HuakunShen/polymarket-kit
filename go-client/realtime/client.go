package realtime

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	DefaultHost         = "wss://ws-live-data.polymarket.com"
	DefaultPingInterval = 5 * time.Second
)

// RealTimeDataClientArgs Interface representing the arguments for initializing a RealTimeDataClient.
type RealTimeDataClientArgs struct {
	// Optional callback function that is called when the client successfully connects.
	OnConnect func(client *RealTimeDataClient)

	// Optional callback function that is called when the client receives a message.
	OnMessage func(client *RealTimeDataClient, message Message)

	// Optional callback function that is called when the client receives a connection status update.
	OnStatusChange func(status ConnectionStatus)

	// Optional host address to connect to.
	Host string

	// Optional interval for sending ping messages to keep the connection alive.
	PingInterval time.Duration

	// Optional flag to enable or disable automatic reconnection when the connection is lost.
	// Defaults to true.
	AutoReconnect *bool
}

// RealTimeDataClient A client for managing real-time WebSocket connections.
type RealTimeDataClient struct {
	host          string
	pingInterval  time.Duration
	autoReconnect bool

	onConnect       func(client *RealTimeDataClient)
	onCustomMessage func(client *RealTimeDataClient, message Message)
	onStatusChange  func(status ConnectionStatus)

	conn *websocket.Conn
	mu   sync.Mutex // Protects conn and writing to it

	stopChan chan struct{}
	wg       sync.WaitGroup
}

// NewRealTimeDataClient Constructs a new RealTimeDataClient instance.
func NewRealTimeDataClient(args RealTimeDataClientArgs) *RealTimeDataClient {
	host := args.Host
	if host == "" {
		host = DefaultHost
	}

	pingInterval := args.PingInterval
	if pingInterval == 0 {
		pingInterval = DefaultPingInterval
	}

	autoReconnect := true
	if args.AutoReconnect != nil {
		autoReconnect = *args.AutoReconnect
	}

	return &RealTimeDataClient{
		host:            host,
		pingInterval:    pingInterval,
		autoReconnect:   autoReconnect,
		onConnect:       args.OnConnect,
		onCustomMessage: args.OnMessage,
		onStatusChange:  args.OnStatusChange,
		stopChan:        make(chan struct{}),
	}
}

// Connect Establishes a WebSocket connection to the server.
func (c *RealTimeDataClient) Connect() *RealTimeDataClient {
	c.notifyStatusChange(ConnectionStatusConnecting)
	go c.connectLoop()
	return c
}

func (c *RealTimeDataClient) connectLoop() {
	for {
		select {
		case <-c.stopChan:
			return
		default:
		}

		conn, _, err := websocket.DefaultDialer.Dial(c.host, nil)
		if err != nil {
			log.Printf("dial error: %v", err)
			if c.autoReconnect {
				time.Sleep(1 * time.Second) // Wait before reconnecting
				continue
			}
			return
		}

		c.mu.Lock()
		c.conn = conn
		c.mu.Unlock()

		c.notifyStatusChange(ConnectionStatusConnected)
		if c.onConnect != nil {
			c.onConnect(c)
		}

		// Start ping loop
		stopPing := make(chan struct{})
		go c.pingLoop(stopPing)

		// Read loop
		for {
			_, message, err := c.conn.ReadMessage()
			if err != nil {
				log.Printf("read error: %v", err)
				break
			}
			c.handleMessage(message)
		}

		close(stopPing)
		c.mu.Lock()
		c.conn.Close()
		c.conn = nil
		c.mu.Unlock()
		c.notifyStatusChange(ConnectionStatusDisconnected)

		if !c.autoReconnect {
			break
		}
		time.Sleep(1 * time.Second)
	}
}

func (c *RealTimeDataClient) pingLoop(stop <-chan struct{}) {
	ticker := time.NewTicker(c.pingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-stop:
			return
		case <-ticker.C:
			c.mu.Lock()
			if c.conn != nil {
				err := c.conn.WriteMessage(websocket.TextMessage, []byte("ping"))
				if err != nil {
					log.Printf("ping error: %v", err)
				}
			}
			c.mu.Unlock()
		}
	}
}

func (c *RealTimeDataClient) handleMessage(data []byte) {
	if len(data) == 0 {
		return
	}
	// Check if it's a pong or just ignore non-json if needed, but the TS client checks for "payload" in string
	// Here we try to unmarshal
	var msg Message
	if err := json.Unmarshal(data, &msg); err == nil {
		// Basic check if it looks like a valid message
		if msg.Topic != "" || msg.Type != "" { // Or check payload != nil
			if c.onCustomMessage != nil {
				c.onCustomMessage(c, msg)
			}
		}
	} else {
		// log.Printf("onMessage error: %v, data: %s", err, string(data))
		// The TS client logs "onMessage error" if it doesn't contain "payload".
		// We can be silent or log debug.
	}
}

// Disconnect Closes the WebSocket connection.
func (c *RealTimeDataClient) Disconnect() {
	c.autoReconnect = false
	close(c.stopChan)
	c.mu.Lock()
	if c.conn != nil {
		c.conn.Close()
	}
	c.mu.Unlock()
}

// Subscribe Subscribes to a data stream by sending a subscription message.
func (c *RealTimeDataClient) Subscribe(msg SubscriptionMessage) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		log.Println("Socket not open.")
		return
	}

	msg.Action = "subscribe"
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("subscribe marshal error: %v", err)
		return
	}

	err = c.conn.WriteMessage(websocket.TextMessage, data)
	if err != nil {
		log.Printf("subscribe error: %v", err)
		c.conn.Close()
	}
}

// Unsubscribe Unsubscribes from a data stream by sending an unsubscription message.
func (c *RealTimeDataClient) Unsubscribe(msg SubscriptionMessage) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		log.Println("Socket not open.")
		return
	}

	msg.Action = "unsubscribe"
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("unsubscribe marshal error: %v", err)
		return
	}

	log.Printf("unsubscribing: %v", msg)
	err = c.conn.WriteMessage(websocket.TextMessage, data)
	if err != nil {
		log.Printf("unsubscribe error: %v", err)
		c.conn.Close()
	}
}

func (c *RealTimeDataClient) notifyStatusChange(status ConnectionStatus) {
	if c.onStatusChange != nil {
		c.onStatusChange(status)
	}
}
