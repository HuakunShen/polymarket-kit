package main

import (
	"fmt"
	"log"

	"github.com/HuakunShen/polymarket-kit/go-client/gamma"
)

func main() {
	fmt.Println("🚀 Testing Go Polymarket Gamma SDK")

	// Create Gamma SDK client
	sdk := gamma.NewGammaSDK(nil)

	// Test health check
	fmt.Println("\n1. Testing health check...")
	health, err := sdk.GetHealth()
	if err != nil {
		log.Printf("Health check failed: %v", err)
	} else {
		fmt.Printf("✅ Health check passed: %v\n", health)
	}

	// Test getting teams
	fmt.Println("\n2. Testing teams API...")
	teams, err := sdk.GetTeams(&gamma.TeamQuery{
		Limit:     intPtr(5),
		League:    stringPtr("NFL"),
		Ascending: boolPtr(true),
	})
	if err != nil {
		log.Printf("Failed to get teams: %v", err)
	} else {
		fmt.Printf("✅ Found %d teams\n", len(teams))
		if len(teams) > 0 {
			fmt.Printf("   First team: %s (%s)\n", teams[0].Name, teams[0].League)
		}
	}

	// Test getting tags
	fmt.Println("\n3. Testing tags API...")
	tags, err := sdk.GetTags(gamma.TagQuery{
		Limit:     intPtr(10),
		Ascending: boolPtr(false),
	})
	if err != nil {
		log.Printf("Failed to get tags: %v", err)
	} else {
		fmt.Printf("✅ Found %d tags\n", len(tags))
		if len(tags) > 0 {
			fmt.Printf("   First tag: %s (%s)\n", tags[0].Label, tags[0].Slug)
		}
	}

	// Test getting events
	fmt.Println("\n4. Testing events API...")
	events, err := sdk.GetEvents(&gamma.UpdatedEventQuery{
		Limit:     intPtr(5),
		Active:    boolPtr(true),
		Ascending: boolPtr(false),
	})
	if err != nil {
		log.Printf("Failed to get events: %v", err)
	} else {
		fmt.Printf("✅ Found %d events\n", len(events))
		if len(events) > 0 {
			event := events[0]
			fmt.Printf("   First event: %s\n", event.Title)
			fmt.Printf("   Markets: %d\n", len(event.Markets))
			if len(event.Markets) > 0 {
				fmt.Printf("   First market: %s\n", event.Markets[0].Question)
			}
		}
	}

	// Test getting markets
	fmt.Println("\n5. Testing markets API...")
	markets, err := sdk.GetMarkets(&gamma.UpdatedMarketQuery{
		Limit:  intPtr(5),
		Active: boolPtr(true),
	})
	if err != nil {
		log.Printf("Failed to get markets: %v", err)
	} else {
		fmt.Printf("✅ Found %d markets\n", len(markets))
		if len(markets) > 0 {
			market := markets[0]
			fmt.Printf("   First market: %s\n", market.Question)
			fmt.Printf("   Outcomes: %v\n", market.Outcomes)
			fmt.Printf("   Active: %v\n", market.Active)
		}
	}

	// Test getting series
	fmt.Println("\n6. Testing series API...")
	series, err := sdk.GetSeries(gamma.SeriesQuery{
		Limit:     intPtr(5),
		Active:    boolPtr(true),
		Ascending: boolPtr(false),
	})
	if err != nil {
		log.Printf("Failed to get series: %v", err)
	} else {
		fmt.Printf("✅ Found %d series\n", len(series))
		if len(series) > 0 {
			fmt.Printf("   First series: %s (%s)\n", series[0].Title, series[0].Ticker)
		}
	}

	// Test search functionality
	fmt.Println("\n7. Testing search API...")
	searchResults, err := sdk.Search(gamma.SearchQuery{
		Q:             stringPtr("election"),
		LimitPerType:  intPtr(3),
		EventsActive:  boolPtr(true),
		MarketsActive: boolPtr(true),
	})
	if err != nil {
		log.Printf("Failed to search: %v", err)
	} else {
		fmt.Printf("✅ Search completed\n")
		fmt.Printf("   Events: %d\n", len(searchResults.Events))
		fmt.Printf("   Tags: %d\n", len(searchResults.Tags))
		fmt.Printf("   Profiles: %d\n", len(searchResults.Profiles))
	}

	// Test convenience methods
	fmt.Println("\n8. Testing convenience methods...")
	activeEvents, err := sdk.GetActiveEvents(&gamma.UpdatedEventQuery{
		Limit: intPtr(3),
	})
	if err != nil {
		log.Printf("Failed to get active events: %v", err)
	} else {
		fmt.Printf("✅ Found %d active events\n", len(activeEvents))
	}

	featuredEvents, err := sdk.GetFeaturedEvents(&gamma.UpdatedEventQuery{
		Limit: intPtr(3),
	})
	if err != nil {
		log.Printf("Failed to get featured events: %v", err)
	} else {
		fmt.Printf("✅ Found %d featured events\n", len(featuredEvents))
	}

	activeMarkets, err := sdk.GetActiveMarkets(&gamma.UpdatedMarketQuery{
		Limit: intPtr(3),
	})
	if err != nil {
		log.Printf("Failed to get active markets: %v", err)
	} else {
		fmt.Printf("✅ Found %d active markets\n", len(activeMarkets))
	}

	// Test getting specific items by ID/slug
	fmt.Println("\n9. Testing specific item retrieval...")

	// Try to get a specific tag (using a common tag)
	tag, err := sdk.GetTagBySlug("politics", nil)
	if err != nil {
		log.Printf("Failed to get tag by slug: %v", err)
	} else if tag != nil {
		fmt.Printf("✅ Found tag: %s (ID: %s)\n", tag.Label, tag.ID)
	} else {
		fmt.Println("ℹ️  Tag not found")
	}

	// Try to get a specific event
	if len(events) > 0 {
		eventID, err := extractEventID(events[0].ID)
		if err == nil {
			event, err := sdk.GetEventById(eventID, nil)
			if err != nil {
				log.Printf("Failed to get event by ID: %v", err)
			} else if event != nil {
				fmt.Printf("✅ Found event by ID: %s\n", event.Title)
			}
		}

		// Try by slug if available
		if events[0].Slug != "" {
			event, err := sdk.GetEventBySlug(events[0].Slug, nil)
			if err != nil {
				log.Printf("Failed to get event by slug: %v", err)
			} else if event != nil {
				fmt.Printf("✅ Found event by slug: %s\n", event.Title)
			}
		}
	}

	fmt.Println("\n🎉 Gamma SDK demo completed successfully!")
}

// Helper functions to create pointers
func intPtr(i int) *int {
	return &i
}

func stringPtr(s string) *string {
	return &s
}

func boolPtr(b bool) *bool {
	return &b
}

// extractEventID extracts numeric ID from string ID
func extractEventID(id string) (int, error) {
	// Try to parse as integer, if fails return 0
	var result int
	_, err := fmt.Sscanf(id, "%d", &result)
	return result, err
}
