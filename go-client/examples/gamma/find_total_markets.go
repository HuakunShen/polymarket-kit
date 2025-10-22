package main

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/gamma"
)

// BatchResult represents the result of a batch query
type BatchResult struct {
	Offset    int
	EventCount int
	Duration  time.Duration
	Error     error
}

// fetchBatch fetches events at a specific offset
func fetchBatch(sdk *gamma.GammaSDK, offset, limit int) BatchResult {
	start := time.Now()

	active := true
	closed := false
	query := &gamma.UpdatedEventQuery{
		Limit:  &limit,
		Offset: &offset,
		Active: &active,
		Closed: &closed,
	}

	events, err := sdk.GetEvents(query)

	return BatchResult{
		Offset:     offset,
		EventCount: len(events),
		Duration:   time.Since(start),
		Error:      err,
	}
}

// exponentialSearch finds the upper bound using exponential growth
func exponentialSearch(sdk *gamma.GammaSDK, limit int) (int, []BatchResult) {
	fmt.Printf("🔍 Starting exponential search...\n")

	var results []BatchResult
	offset := 2000 // Start at 2000 as suggested

	for {
		fmt.Printf("   Testing offset %d... ", offset)
		result := fetchBatch(sdk, offset, limit)
		results = append(results, result)

		if result.Error != nil {
			fmt.Printf("❌ Error: %v\n", result.Error)
			break
		}

		fmt.Printf("✅ %d events (%v)\n", result.EventCount, result.Duration)

		// If we got 0 events, we've found the upper bound
		if result.EventCount == 0 {
			fmt.Printf("🔍 Found upper bound at offset %d\n", offset)
			return offset, results
		}

		// If we got a full batch, double the offset and continue
		if result.EventCount >= limit {
			offset *= 2
			// Safety check to avoid infinite loops
			if offset > 50000 { // Arbitrary high limit
				fmt.Printf("⚠️ Reached safety limit at offset %d\n", offset)
				return offset, results
			}
		} else {
			// If we got less than a full batch, we're near the end
			fmt.Printf("🔍 Found partial batch at offset %d\n", offset)
			return offset + result.EventCount, results
		}

		// Small delay to avoid rate limiting
		time.Sleep(50 * time.Millisecond)
	}

	return offset, results
}

// binarySearch finds the exact boundary using binary search
func binarySearch(sdk *gamma.GammaSDK, low, high, limit int) (int, BatchResult) {
	fmt.Printf("🔍 Starting binary search between %d and %d...\n", low, high)

	var bestResult BatchResult
	iterations := 0

	for low <= high {
		iterations++
		mid := (low + high) / 2

		fmt.Printf("   Iteration %d: Testing offset %d... ", iterations, mid)
		result := fetchBatch(sdk, mid, limit)

		if result.Error != nil {
			fmt.Printf("❌ Error: %v\n", result.Error)
			high = mid - 1
			continue
		}

		fmt.Printf("✅ %d events\n", result.EventCount)

		if result.EventCount >= limit {
			// More events available, search higher
			low = mid + 1
			bestResult = result
		} else {
			// Fewer than limit events, this might be the end
			if result.EventCount > 0 {
				bestResult = result
			}
			high = mid - 1
		}

		// Small delay to avoid rate limiting
		time.Sleep(50 * time.Millisecond)
	}

	return bestResult.Offset, bestResult
}

// concurrentValidation validates the final count with multiple concurrent requests
func concurrentValidation(sdk *gamma.GammaSDK, estimatedTotal, limit int) (int, error) {
	fmt.Printf("🔍 Running concurrent validation...\n")

	// Test a few points around the estimated boundary
	testOffsets := []int{
		max(0, estimatedTotal-200),
		max(0, estimatedTotal-100),
		max(0, estimatedTotal-50),
		max(0, estimatedTotal-10),
		estimatedTotal,
	}

	var wg sync.WaitGroup
	results := make(chan BatchResult, len(testOffsets))

	// Launch concurrent requests
	for _, offset := range testOffsets {
		wg.Add(1)
		go func(off int) {
			defer wg.Done()
			result := fetchBatch(sdk, off, limit)
			results <- result
		}(offset)
	}

	// Wait for all requests to complete
	go func() {
		wg.Wait()
		close(results)
	}()

	// Process results
	maxOffset := 0

	for result := range results {
		if result.Error != nil {
			fmt.Printf("   ❌ Offset %d: Error %v\n", result.Offset, result.Error)
			continue
		}

		if result.EventCount > 0 {
			totalAtOffset := result.Offset + result.EventCount
			if totalAtOffset > maxOffset {
				maxOffset = totalAtOffset
			}
		}

		fmt.Printf("   ✅ Offset %d: %d events\n", result.Offset, result.EventCount)
	}

	return maxOffset, nil
}

// findTotalActiveMarkets finds the total number of active markets using optimized search
func findTotalActiveMarkets(sdk *gamma.GammaSDK, limit int) (int, error) {
	fmt.Printf("🚀 Finding total active markets (limit: %d)...\n", limit)
	fmt.Printf("📊 Using exponential search + binary search + concurrent validation\n\n")

	startTime := time.Now()

	// Step 1: Exponential search to find upper bound
	upperBound, expResults := exponentialSearch(sdk, limit)

	// Step 2: Binary search to find exact boundary
	var lowerBound int
	if len(expResults) > 0 && expResults[len(expResults)-1].EventCount >= limit {
		lowerBound = expResults[len(expResults)-1].Offset
	} else {
		lowerBound = 0
	}

	finalOffset, finalResult := binarySearch(sdk, lowerBound, upperBound, limit)

	// Step 3: Concurrent validation to ensure accuracy
	estimatedTotal := finalOffset + finalResult.EventCount
	validatedTotal, err := concurrentValidation(sdk, estimatedTotal, limit)
	if err != nil {
		return estimatedTotal, err
	}

	duration := time.Since(startTime)

	fmt.Printf("\n📊 Search Results:\n")
	fmt.Printf("- Exponential search iterations: %d\n", len(expResults))
	fmt.Printf("- Final binary search result: offset %d, %d events\n", finalOffset, finalResult.EventCount)
	fmt.Printf("- Validated total markets: %d\n", validatedTotal)
	fmt.Printf("- Total duration: %v\n", duration)

	return validatedTotal, nil
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func main() {
	fmt.Println("Polymarket Active Markets Counter")
	fmt.Println("=================================")

	// Initialize Gamma SDK
	sdk := gamma.NewGammaSDK(nil)

	// Test health first
	health, err := sdk.GetHealth()
	if err != nil {
		log.Fatalf("Failed to get health: %v", err)
	}
	fmt.Printf("Health check: %v\n\n", health)

	// Find total active markets
	limit := 100
	totalMarkets, err := findTotalActiveMarkets(sdk, limit)
	if err != nil {
		log.Fatalf("Failed to find total markets: %v", err)
	}

	fmt.Printf("\n🎯 Final Result: %d active markets found\n", totalMarkets)
	fmt.Printf("✅ Search completed successfully!\n")
}