# Gamma API Examples

This directory contains example usage of the Polymarket Gamma API client.

## collect_events.go

Demonstrates how to collect all active events using pagination, similar to the TypeScript `collect-active-events` command.

## find_total_markets.go

Demonstrates an optimized algorithm to find the total number of active markets using exponential search + binary search + concurrent validation.

### Features

- **Exponential Search**: Quickly finds the upper bound by doubling offsets (starts at 2000)
- **Binary Search**: Precisely locates the exact boundary using divide-and-conquer
- **Concurrent Validation**: Uses goroutines to validate results with multiple concurrent requests
- **Smart Rate Limiting**: Includes delays to avoid overwhelming the API
- **Performance Tracking**: Shows detailed statistics and timing

### Algorithm

1. **Exponential Search**: Start at offset 2000, double until we get 0 events
2. **Binary Search**: Use binary search between the last successful and failed offsets
3. **Concurrent Validation**: Test multiple points around the estimated boundary concurrently

### Usage

```bash
cd examples/gamma
go run find_total_markets.go
```

### Performance

The algorithm is significantly faster than linear pagination:

- **Linear Search**: ~30 API calls, ~48 seconds
- **Optimized Search**: ~20 API calls, ~18 seconds (60% faster)

### Output Example

```
🚀 Finding total active markets (limit: 100)...
📊 Using exponential search + binary search + concurrent validation

🔍 Starting exponential search...
   Testing offset 2000... ✅ 100 events (1.35s)
   Testing offset 4000... ✅ 0 events (325ms)
🔍 Found upper bound at offset 4000

🔍 Starting binary search between 0 and 4000...
   Iteration 1: Testing offset 2000... ✅ 100 events
   Iteration 2: Testing offset 3000... ✅ 2 events
   ... (12 iterations total)

🔍 Running concurrent validation...
   ✅ Offset 3002: 0 events
   ✅ Offset 2992: 10 events
   ✅ Offset 2952: 50 events
   ✅ Offset 2902: 100 events
   ✅ Offset 2802: 100 events

📊 Search Results:
- Exponential search iterations: 2
- Final binary search result: offset 2903, 99 events
- Validated total markets: 3002
- Total duration: 18.49s

🎯 Final Result: 3002 active markets found
```

### Function Reference

#### `findTotalActiveMarkets(sdk *gamma.GammaSDK, limit int) (int, error)`

Finds the total number of active markets using optimized search.

**Parameters:**
- `sdk`: Initialized Gamma SDK client
- `limit`: Batch size for API requests (default: 100)

**Returns:**
- `int`: Total number of active markets
- `error`: Error if search fails

**Example Usage:**

```go
sdk := gamma.NewGammaSDK(nil)
total, err := findTotalActiveMarkets(sdk, 100)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Total active markets: %d\n", total)
```
- **Smart Stopping**: Automatically stops when fewer events are returned than the limit
- **Error Handling**: Continues processing even when individual batches fail
- **Rate Limiting**: Includes delays to avoid overwhelming the API
- **Progress Tracking**: Shows detailed progress and statistics

### Usage

```bash
cd examples/gamma
go run collect_events.go
```

### Configuration

The example uses these default settings:

- **Batch Limit**: 100 events per request (default)
- **Maximum Events**: Unlimited (can be set via `maxEvents` parameter)
- **Rate Limiting**: 100ms delay between batches, 500ms after errors

### Function Reference

#### `collectAllActiveEvents(sdk *gamma.GammaSDK, limit int, maxEvents *int) ([]gamma.Event, error)`

Collects all active events using pagination.

**Parameters:**
- `sdk`: Initialized Gamma SDK client
- `limit`: Number of events per batch (default: 100)
- `maxEvents`: Optional maximum total events to collect

**Returns:**
- `[]gamma.Event`: Slice of collected events
- `error`: Error if collection fails

**Example Usage:**

```go
sdk := gamma.NewGammaSDK(nil)

// Collect all events with default settings
events, err := collectAllActiveEvents(sdk, 100, nil)

// Collect maximum 500 events
maxEvents := 500
events, err := collectAllActiveEvents(sdk, 100, &maxEvents)
```

### Output Example

```
Polymarket Active Events Collector
===================================
Health check: map[]

Collecting active events with pagination (limit: 100)...

🔄 Fetching batch 1 (offset: 0, limit: 100)
✅ Batch 1: Fetched 100 events
➡️ Continuing with offset 100...

🏁 Pagination complete (got 2 < 100 events)

📊 Collection Summary:
- Total events fetched: 3002
- Duration: 48.247999916s
- Average rate: 62.22 events/second

📋 Event Activity:
- Active events: 3002
- Closed events: 0
- Events with markets: 3002

✅ Event collection completed successfully!
```

### Comparison with TypeScript Version

This Go implementation mirrors the behavior of the TypeScript `collect-active-events` command:

- ✅ Same pagination logic (limit/offset pattern)
- ✅ Same stopping condition (events < limit)
- ✅ Similar error handling approach
- ✅ Compatible rate limiting
- ✅ Progress reporting and statistics