# Polymarket Gamma API Go SDK

A comprehensive Go implementation of the Polymarket Gamma API SDK, providing type-safe access to all public Polymarket data endpoints including sports, tags, events, markets, series, comments, and search functionality.

## Features

- ✅ **Complete API Coverage**: All Gamma API endpoints implemented
- ✅ **Type Safety**: Comprehensive Go types for all API requests and responses
- ✅ **Data Transformation**: Automatic parsing of JSON string fields in nested objects
- ✅ **Query Support**: Full support for all query parameters and filtering
- ✅ **Proxy Support**: Built-in HTTP/HTTPS proxy configuration
- ✅ **Error Handling**: Detailed error messages with proper context
- ✅ **Pagination**: Support for paginated responses
- ✅ **Convenience Methods**: Helper methods for common use cases

## Installation

```bash
go get github.com/HuakunShen/polymarket-kit/go-client/gamma
```

## Quick Start

```go
package main

import (
    "fmt"
    "log"

    "github.com/HuakunShen/polymarket-kit/go-client/gamma"
)

func main() {
    // Create Gamma SDK client
    sdk := gamma.NewGammaSDK(nil)

    // Get active events
    events, err := sdk.GetActiveEvents(&gamma.UpdatedEventQuery{
        Limit: intPtr(10),
    })
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Found %d active events\n", len(events))
}

// Helper functions for pointer creation
func intPtr(i int) *int { return &i }
func boolPtr(b bool) *bool { return &b }
```

## API Methods

### Health Check

```go
health, err := sdk.GetHealth()
```

### Teams API

```go
// Get all teams
teams, err := sdk.GetTeams(&gamma.TeamQuery{
    Limit:     intPtr(20),
    League:    stringPtr("NFL"),
    Ascending: boolPtr(true),
})

// Teams support filtering by:
// - limit, offset (pagination)
// - order, ascending (sorting)
// - league (NFL, NBA, MLB, etc.)
```

### Tags API

```go
// Get tags
tags, err := sdk.GetTags(gamma.TagQuery{
    Limit:      intPtr(50),
    Search:     stringPtr("politics"),
    IsCarousel: boolPtr(false),
})

// Get tag by ID
tag, err := sdk.GetTagById(123, nil)

// Get tag by slug
tag, err := sdk.GetTagBySlug("politics", nil)

// Get related tags
relatedTags, err := sdk.GetTagsRelatedToTagSlug("politics", nil)
```

### Events API

```go
// Get events with filtering
events, err := sdk.GetEvents(&gamma.UpdatedEventQuery{
    Limit:     intPtr(10),
    Active:    boolPtr(true),
    Featured:  boolPtr(true),
    Search:    stringPtr("election"),
})

// Get paginated events
paginated, err := sdk.GetEventsPaginated(gamma.PaginatedEventQuery{
    Limit:  intPtr(20),
    Offset: intPtr(0),
})

// Get event by ID
event, err := sdk.GetEventById(123, &gamma.EventByIdQuery{
    IncludeChat: boolPtr(true),
})

// Get event by slug
event, err := sdk.GetEventBySlug("election-2024", nil)

// Get event tags
tags, err := sdk.GetEventTags(123)
```

### Markets API

```go
// Get markets with filtering
markets, err := sdk.GetMarkets(&gamma.UpdatedMarketQuery{
    Limit:     intPtr(20),
    Active:    boolPtr(true),
    Event:     stringPtr("123"),
    Search:    stringPtr("trump"),
})

// Get market by ID
market, err := sdk.GetMarketById(456, &gamma.MarketByIdQuery{
    IncludeTag: boolPtr(true),
})

// Get market by slug
market, err := sdk.GetMarketBySlug("trump-2024", nil)

// Get market tags
tags, err := sdk.GetMarketTags(456)
```

### Series API

```go
// Get series
series, err := sdk.GetSeries(gamma.SeriesQuery{
    Limit:     intPtr(10),
    Active:    boolPtr(true),
    Search:    stringPtr("election"),
})

// Get series by ID
series, err := sdk.GetSeriesById(789, &gamma.SeriesByIdQuery{
    IncludeChat: boolPtr(true),
})
```

### Comments API

```go
// Get comments
comments, err := sdk.GetComments(&gamma.CommentQuery{
    Limit:           intPtr(20),
    ParentEntityType: stringPtr("Event"),
    ParentEntityID:  intPtr(123),
})

// Get comments by user address
userComments, err := sdk.GetCommentsByUserAddress(
    "0x1234567890abcdef1234567890abcdef12345678",
    &gamma.CommentsByUserQuery{Limit: intPtr(10)},
)

// Get comment thread
thread, err := sdk.GetCommentsByCommentId(456, nil)
```

### Search API

```go
// Search across all content types
results, err := sdk.Search(gamma.SearchQuery{
    Q:               stringPtr("election"),
    LimitPerType:    intPtr(5),
    EventsActive:    boolPtr(true),
    MarketsActive:   boolPtr(true),
    TagsCarousel:    boolPtr(false),
})

// Results contain:
// - Events: []interface{}
// - Tags: []interface{}
// - Profiles: []interface{}
// - Pagination info
```

## Convenience Methods

```go
// Get active events
activeEvents, err := sdk.GetActiveEvents(&gamma.UpdatedEventQuery{
    Limit: intPtr(10),
})

// Get featured events
featuredEvents, err := sdk.GetFeaturedEvents(&gamma.UpdatedEventQuery{
    Limit: intPtr(5),
})

// Get closed events
closedEvents, err := sdk.GetClosedEvents(&gamma.UpdatedEventQuery{
    Limit: intPtr(25),
})

// Get active markets
activeMarkets, err := sdk.GetActiveMarkets(&gamma.UpdatedMarketQuery{
    Limit: intPtr(20),
})

// Get closed markets
closedMarkets, err := sdk.GetClosedMarkets(&gamma.UpdatedMarketQuery{
    Limit: intPtr(50),
})
```

## Configuration

### Basic Configuration

```go
sdk := gamma.NewGammaSDK(nil)
```

### With Proxy Support

```go
config := &gamma.GammaSDKConfig{
    Proxy: &gamma.ProxyConfig{
        Host:     "proxy.example.com",
        Port:     8080,
        Username: stringPtr("user"),
        Password: stringPtr("pass"),
        Protocol: stringPtr("http"),
    },
}

sdk := gamma.NewGammaSDK(config)
```

## Query Parameters

All query parameters use pointers to allow optional values:

```go
query := &gamma.UpdatedEventQuery{
    Limit:      intPtr(10),     // Required limit
    Offset:     intPtr(0),      // Optional offset
    Active:     boolPtr(true),   // Optional filter
    Search:     nil,           // Not specified
}
```

## Data Types

The SDK provides comprehensive Go types for all API responses:

### Core Types
- `Team` - Sports team information
- `UpdatedTag` - Tag/categorization data
- `Event` - Event containing related markets
- `Market` - Individual trading market
- `Series` - Collection of related events
- `Comment` - User comments

### Query Types
- `TeamQuery` - Team filtering parameters
- `TagQuery` - Tag filtering parameters
- `UpdatedEventQuery` - Event filtering parameters
- `UpdatedMarketQuery` - Market filtering parameters
- `SeriesQuery` - Series filtering parameters
- `SearchQuery` - Search parameters

### Response Types
- `APIResponse[T]` - Generic API response wrapper
- `PaginatedEventsResponse` - Paginated events response
- `SearchResponse` - Search results response

## Error Handling

The SDK provides detailed error messages:

```go
events, err := sdk.GetEvents(query)
if err != nil {
    // Errors include context about what failed
    log.Printf("Failed to get events: %v", err)
    return
}
```

Common error scenarios:
- Network connectivity issues
- API rate limiting
- Invalid query parameters
- Resource not found (404)
- Server errors (5xx)

## Data Transformation

The SDK automatically handles JSON string fields that the Gamma API returns as strings instead of arrays:

```go
// Markets have these fields automatically parsed:
market.Outcomes      // []string - parsed from JSON string
market.OutcomePrices // []string - parsed from JSON string
market.ClobTokenIDs  // []string - parsed from JSON string

// Events also have nested markets with transformed data
event.Markets[0].Outcomes      // []string
event.Markets[0].OutcomePrices // []string
event.Markets[0].ClobTokenIDs  // []string
```

## Advanced Usage

### Custom Filtering

```go
// Complex query combining multiple filters
events, err := sdk.GetEvents(&gamma.UpdatedEventQuery{
    Limit:        intPtr(25),
    Active:       boolPtr(true),
    Featured:     boolPtr(true),
    MinVolume:    float64Ptr(1000),
    StartDate:    stringPtr("2024-01-01"),
    EndDate:      stringPtr("2024-12-31"),
    Search:       stringPtr("president"),
    Order:        stringPtr("volume"),
    Ascending:    boolPtr(false),
})
```

### Pagination Handling

```go
// Paginate through all results
limit := 50
offset := 0
allEvents := []gamma.Event{}

for {
    paginated, err := sdk.GetEventsPaginated(gamma.PaginatedEventQuery{
        Limit:  intPtr(limit),
        Offset: intPtr(offset),
    })
    if err != nil {
        break
    }

    allEvents = append(allEvents, paginated.Data...)

    if !paginated.Pagination.HasMore {
        break
    }

    offset += limit
}
```

### Working with Search Results

```go
results, err := sdk.Search(gamma.SearchQuery{
    Q:            stringPtr("bitcoin"),
    LimitPerType: intPtr(10),
    EventsActive: boolPtr(true),
})

if err == nil {
    fmt.Printf("Found %d events\n", len(results.Events))
    fmt.Printf("Found %d tags\n", len(results.Tags))

    // Cast results to appropriate types for use
    for _, event := range results.Events {
        // Convert to gamma.Event if needed
        eventData, _ := json.Marshal(event)
        var e gamma.Event
        json.Unmarshal(eventData, &e)
        fmt.Printf("Event: %s\n", e.Title)
    }
}
```

## Dependencies

- Standard library packages only
- No external dependencies required

## Examples

See the `examples/` directory for comprehensive usage examples:

- `gamma_example.go` - Full SDK demonstration
- More examples can be added as needed

## Development Status

### ✅ Completed Features
- All Gamma API endpoints implemented
- Comprehensive type definitions
- Query parameter support
- Error handling and validation
- Data transformation for JSON string fields
- Proxy configuration support
- Pagination support
- Search functionality
- Convenience methods

### 📋 Documentation
- Complete API documentation
- Usage examples
- Type definitions reference

## Support

For issues and questions:
1. Check the Polymarket Gamma API documentation
2. Review the examples in this repository
3. Create an issue with detailed information about the problem

## License

This project is licensed under the MIT License.