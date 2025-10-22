package main

import (
	"fmt"
	"log"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/gamma"
)

// collectAllActiveEvents collects all active events using pagination
// Similar to the TypeScript collect-active-events command
func collectAllActiveEvents(sdk *gamma.GammaSDK, limit int, maxEvents *int) ([]gamma.Event, error) {
	var allEvents []gamma.Event
	offset := 0
	batchCount := 0
	hasMore := true

	fmt.Printf("Collecting active events with pagination (limit: %d)...\n", limit)
	if maxEvents != nil {
		fmt.Printf("Maximum total events: %d\n", *maxEvents)
	}

	for hasMore {
		batchCount++
		fmt.Printf("\n🔄 Fetching batch %d (offset: %d, limit: %d)\n", batchCount, offset, limit)

		// Create query for active events
		active := true
		closed := false
		query := &gamma.UpdatedEventQuery{
			Limit:     &limit,
			Offset:    &offset,
			Active:    &active,
			Closed:    &closed,
		}

		// Fetch events
		events, err := sdk.GetEvents(query)
		if err != nil {
			fmt.Printf("❌ Error in batch %d (offset %d): %v\n", batchCount, offset, err)

			// Continue with next batch instead of stopping completely
			fmt.Printf("➡️ Continuing with next batch (offset %d)...\n", offset+limit)
			offset += limit

			// Add delay after errors to avoid overwhelming the API
			time.Sleep(500 * time.Millisecond)

			// Stop if we've hit too many consecutive errors
			if batchCount > 10 && len(allEvents) == 0 {
				fmt.Printf("🛑 Too many consecutive errors without successful fetches, stopping pagination\n")
				hasMore = false
			}
			continue
		}

		fmt.Printf("✅ Batch %d: Fetched %d events\n", batchCount, len(events))

		// Handle case where we get 0 events but it's not the first batch
		if batchCount > 1 && len(events) == 0 && len(allEvents) > 0 {
			fmt.Printf("⚠️ Warning: Got 0 events in batch %d after successful previous batches\n", batchCount)
			fmt.Printf("💡 This might indicate validation errors in this batch range (offset %d-%d)\n", offset, offset+limit)
			fmt.Printf("➡️ Continuing with next batch to be safe...\n")
			offset += limit
			hasMore = true // Force continue even though we got 0 events

			time.Sleep(200 * time.Millisecond)
			continue
		}

		allEvents = append(allEvents, events...)

		// Check if we've reached the maximum total events
		if maxEvents != nil && len(allEvents) >= *maxEvents {
			fmt.Printf("🛑 Reached maximum total events limit (%d)\n", *maxEvents)
			allEvents = allEvents[:*maxEvents] // Trim to maxEvents
			hasMore = false
		} else {
			hasMore = len(events) >= limit // Continue if we got a full batch
		}

		if !hasMore {
			reason := ""
			if len(events) < limit {
				reason = fmt.Sprintf("🏁 Pagination complete (got %d < %d events)", len(events), limit)
			} else {
				reason = "🛑 Stopped at maximum limit"
			}
			fmt.Printf("%s\n", reason)
		} else {
			fmt.Printf("➡️ Continuing with offset %d...\n", offset)
		}

		// Add a small delay to avoid hitting rate limits
		if hasMore {
			time.Sleep(100 * time.Millisecond)
		}

		offset += limit
	}

	return allEvents, nil
}

func main() {
	fmt.Println("Polymarket Active Events Collector")
	fmt.Println("===================================")

	// Initialize Gamma SDK
	sdk := gamma.NewGammaSDK(nil)

	// Test health first
	health, err := sdk.GetHealth()
	if err != nil {
		log.Fatalf("Failed to get health: %v", err)
	}
	fmt.Printf("Health check: %v\n\n", health)

	// Configuration
	limit := 100 // Default limit per batch (similar to TypeScript version)
	var maxEvents *int

	// Collect all active events
	startTime := time.Now()
	events, err := collectAllActiveEvents(sdk, limit, maxEvents)
	if err != nil {
		log.Fatalf("Failed to collect events: %v", err)
	}

	duration := time.Since(startTime)

	// Summary statistics
	fmt.Printf("\n📊 Collection Summary:\n")
	fmt.Printf("- Total events fetched: %d\n", len(events))
	fmt.Printf("- Duration: %v\n", duration)
	if duration > 0 {
		fmt.Printf("- Average rate: %.2f events/second\n", float64(len(events))/duration.Seconds())
	}

	// Event activity breakdown
	activeCount := 0
	closedCount := 0
	withMarkets := 0

	for _, event := range events {
		if event.Active {
			activeCount++
		}
		if event.Closed {
			closedCount++
		}
		if len(event.Markets) > 0 {
			withMarkets++
		}
	}

	fmt.Printf("\n📋 Event Activity:\n")
	fmt.Printf("- Active events: %d\n", activeCount)
	fmt.Printf("- Closed events: %d\n", closedCount)
	fmt.Printf("- Events with markets: %d\n", withMarkets)

	// Show some sample events
	if len(events) > 0 {
		fmt.Printf("\n📝 Sample Events (first 3):\n")
		maxSample := min(3, len(events))

		for i := 0; i < maxSample; i++ {
			event := events[i]
			fmt.Printf("%d. %s", i+1, event.Title)
			if event.Slug != "" {
				fmt.Printf(" (%s)", event.Slug)
			}
			fmt.Printf("\n")
			if event.Description != nil && len(*event.Description) > 0 {
				desc := *event.Description
				if len(desc) > 100 {
					desc = desc[:100] + "..."
				}
				fmt.Printf("   %s\n", desc)
			}
			fmt.Printf("   Markets: %d\n", len(event.Markets))
			fmt.Printf("\n")
		}
	}

	fmt.Printf("✅ Event collection completed successfully!\n")
}