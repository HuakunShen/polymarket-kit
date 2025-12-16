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
	// Parse payload based on topic and type
	payloadBytes, _ := json.Marshal(message.Payload)

	switch {
	case message.Topic == "clob_market":
		switch message.Type {
		case "price_change":
			var payload realtime.PriceChangePayload
			if err := json.Unmarshal(payloadBytes, &payload); err == nil {
				fmt.Printf("PriceChange: market=%s, changes=%d, timestamp=%s\n",
					payload.Market, len(payload.PriceChanges), payload.Timestamp)
				for i, pc := range payload.PriceChanges {
					if i < 3 { // Show first 3 changes
						fmt.Printf("  [%d] asset=%s, price=%s, side=%s, size=%s\n",
							i+1, pc.AssetID, pc.Price, pc.Side, pc.Size)
					}
				}
			}
		case "agg_orderbook":
			var entries []realtime.OrderBookEntry
			if err := json.Unmarshal(payloadBytes, &entries); err == nil {
				fmt.Printf("Orderbook: entries=%d\n", len(entries))
				for i, entry := range entries {
					if i < 2 { // Show first 2 entries
						fmt.Printf("  [%d] market=%s, asset_id=%s, bids=%d, asks=%d\n",
							i+1, entry.Market, entry.AssetID, len(entry.Bids), len(entry.Asks))
					}
				}
			} else {
				// Try as single object
				var entry realtime.OrderBookEntry
				if err2 := json.Unmarshal(payloadBytes, &entry); err2 == nil {
					fmt.Printf("Orderbook: market=%s, asset_id=%s, bids=%d, asks=%d\n",
						entry.Market, entry.AssetID, len(entry.Bids), len(entry.Asks))
				}
			}
		case "last_trade_price":
			var payload realtime.LastTradePricePayload
			if err := json.Unmarshal(payloadBytes, &payload); err == nil {
				fmt.Printf("LastTrade: asset_id=%s, market=%s, price=%s, size=%s, side=%s\n",
					payload.AssetID, payload.Market, payload.Price, payload.Size, payload.Side)
			}
		case "tick_size_change":
			var payload realtime.TickSizeChangePayload
			if err := json.Unmarshal(payloadBytes, &payload); err == nil {
				fmt.Printf("TickSizeChange: market=%s, old=%s, new=%s\n",
					payload.Market, payload.OldTickSize, payload.NewTickSize)
			}
		case "market_created", "market_resolved":
			var payload realtime.ClobMarketPayload
			if err := json.Unmarshal(payloadBytes, &payload); err == nil {
				fmt.Printf("MarketEvent (%s): market=%s, asset_ids=%v, tick_size=%s\n",
					message.Type, payload.Market, payload.AssetIDs, payload.TickSize)
			}
		default:
			// Fallback to generic output
			output := map[string]interface{}{
				"topic":         message.Topic,
				"type":          message.Type,
				"timestamp":     message.Timestamp,
				"connection_id": message.ConnectionID,
				"payload":       message.Payload,
			}
			data, _ := json.MarshalIndent(output, "", "  ")
			fmt.Println(string(data))
		}
	default:
		// Pretty print other messages
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
}

func onConnect(client *realtime.RealTimeDataClient) {
	log.Println("Connected!")
	// Subscribe to various clob_market types to demonstrate payload parsing
	client.Subscribe(realtime.SubscriptionMessage{
		Subscriptions: []realtime.Subscription{
			// Subscribe to all clob_market types to see different payload structures
			{
				Topic: "clob_market",
				Type:  "*",
				// Filters: `["95439201103958291841222373625424698303339849105476314992984252617398188905150"]`,
			},
			// You can also subscribe to specific types:
			// {
			// 	Topic: "clob_market",
			// 	Type:  "price_change",
			// },
			// {
			// 	Topic: "clob_market",
			// 	Type:  "agg_orderbook",
			// },
			// {
			// 	Topic: "clob_market",
			// 	Type:  "last_trade_price",
			// },
			// {
			// 	Topic: "clob_market",
			// 	Type:  "tick_size_change",
			// },
			// {
			// 	Topic: "clob_market",
			// 	Type:  "market_created",
			// },
			// {
			// 	Topic: "clob_market",
			// 	Type:  "market_resolved",
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
