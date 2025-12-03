package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"

	"github.com/HuakunShen/polymarket-kit/go-client/realtime"
)

func onMessage(client *realtime.RealTimeDataClient, message realtime.Message) {
	// Pretty print the message
	output := map[string]interface{}{
		"topic":         message.Topic,
		"type":          message.Type,
		"timestamp":     message.Timestamp,
		"connection_id": message.ConnectionID,
		"payload":       message.Payload,
	}

	data, err := json.MarshalIndent(output, "", "  ")
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}
	fmt.Println(string(data))
}

func onConnect(client *realtime.RealTimeDataClient) {
	log.Println("Connected!")
	// Subscribe to a topic
	client.Subscribe(realtime.SubscriptionMessage{
		Subscriptions: []realtime.Subscription{
			// clob_market
			// crypto_prices
			// {
			// 	Topic: "crypto_prices",
			// 	Type:  "*",
			// 	// Filters: `{"symbol": "btcusdt"}`, // filters: `{"symbol":"btCUSDt"}`,
			// },
			{
				Topic: "clob_market",
				Type:  "market_created",
			},
			{
				Topic: "clob_market",
				Type:  "market_resolved",
			},
			// {
			// 	Topic:   "clob_market",
			// 	Type:    "*",
			// 	Filters: `["95439201103958291841222373625424698303339849105476314992984252617398188905150"]`,
			// },
		},
	})
}

func main() {
	args := realtime.RealTimeDataClientArgs{
		OnConnect: onConnect,
		OnMessage: onMessage,
	}

	client := realtime.NewRealTimeDataClient(args)
	client.Connect()

	// Wait for interrupt signal to gracefully shutdown
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)
	<-interrupt

	client.Disconnect()
	log.Println("Disconnected")
}
