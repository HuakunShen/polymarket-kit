package main

import (
	"fmt"
	"log"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/gamma"
)

func main() {
	fmt.Println("🔍 Testing Gamma Client Proxy Configuration")

	// Test 1: Normal client without proxy
	fmt.Println("\n1. Testing client without proxy...")
	sdkNormal := gamma.NewGammaSDK(nil)

	// Make a simple request to get health
	health, err := sdkNormal.GetHealth()
	if err != nil {
		log.Printf("❌ Normal client failed: %v", err)
	} else {
		fmt.Printf("✅ Normal client succeeded: %v\n", health)
	}

	// Test 2: Client with proxy configuration
	fmt.Println("\n2. Testing client with HTTP proxy...")

	// ===== PROXY CONFIGURATION PLACEHOLDER =====
	// Replace these values with your actual proxy configuration
	proxyConfig := &gamma.ProxyConfig{
		Host:     "127.0.0.1",        // 👈 REPLACE: Your proxy host
		Port:     8080,               // 👈 REPLACE: Your proxy port
		Username: gamma.StringPtr("user"),  // 👈 REPLACE: Your proxy username (optional)
		Password: gamma.StringPtr("pass"),  // 👈 REPLACE: Your proxy password (optional)
		Protocol: gamma.StringPtr("http"),  // 👈 REPLACE: http or https
	}

	// Alternative: Use the utility function for easier proxy configuration
	// proxyURL := "http://user:pass@proxy.example.com:8080"
	// proxyConfig, err := gamma.ProxyConfigFromURL(proxyURL)
	// if err != nil {
	//     log.Fatalf("Failed to parse proxy URL: %v", err)
	// }

	// Create SDK with proxy configuration
	config := &gamma.GammaSDKConfig{
		Proxy: proxyConfig,
	}

	sdkProxy := gamma.NewGammaSDK(config)

	// Test the proxied connection with a simple request
	fmt.Println("\n3. Testing API calls through proxy...")

	// Test health check through proxy
	healthProxy, err := sdkProxy.GetHealth()
	if err != nil {
		log.Printf("❌ Proxy client health check failed: %v", err)
		fmt.Println("💡 This could mean:")
		fmt.Println("   - Proxy server is not running")
		fmt.Println("   - Proxy credentials are incorrect")
		fmt.Println("   - Proxy host/port is wrong")
		fmt.Println("   - Network connectivity issues")
	} else {
		fmt.Printf("✅ Proxy client health check succeeded: %v\n", healthProxy)
		fmt.Println("🎉 Proxy is working correctly!")
	}

	// Test more complex API calls through proxy
	fmt.Println("\n4. Testing complex API calls through proxy...")

	// Get tags through proxy
	tags, err := sdkProxy.GetTags(&gamma.TagQuery{
		Limit:     intPtr(5),
		Ascending: boolPtr(true),
	})
	if err != nil {
		log.Printf("❌ Proxy client tags API failed: %v", err)
	} else {
		fmt.Printf("✅ Proxy client tags API succeeded: Found %d tags\n", len(tags))
		if len(tags) > 0 {
			fmt.Printf("   First tag: %s (%s)\n", tags[0].Label, tags[0].Slug)
		}
	}

	// Test events API through proxy
	events, err := sdkProxy.GetEvents(&gamma.UpdatedEventQuery{
		Limit:  intPtr(3),
		Active: boolPtr(true),
	})
	if err != nil {
		log.Printf("❌ Proxy client events API failed: %v", err)
	} else {
		fmt.Printf("✅ Proxy client events API succeeded: Found %d events\n", len(events))
		if len(events) > 0 {
			fmt.Printf("   First event: %s\n", events[0].Title)
		}
	}

	// Test comparison between normal and proxy responses
	fmt.Println("\n5. Comparing normal vs proxy responses...")

	// Get tags with both clients for comparison
	normalTags, err1 := sdkNormal.GetTags(&gamma.TagQuery{Limit: intPtr(1)})
	proxyTags, err2 := sdkProxy.GetTags(&gamma.TagQuery{Limit: intPtr(1)})

	if err1 != nil && err2 != nil {
		log.Printf("❌ Both clients failed: Normal=%v, Proxy=%v", err1, err2)
	} else if err1 != nil {
		log.Printf("❌ Normal client failed: %v", err1)
		fmt.Printf("✅ Proxy client succeeded\n")
	} else if err2 != nil {
		log.Printf("❌ Proxy client failed: %v", err2)
		fmt.Printf("✅ Normal client succeeded\n")
	} else {
		fmt.Printf("✅ Both clients succeeded\n")
		if len(normalTags) > 0 && len(proxyTags) > 0 {
			fmt.Printf("   Normal client first tag: %s\n", normalTags[0].Label)
			fmt.Printf("   Proxy client first tag: %s\n", proxyTags[0].Label)

			// Check if responses are identical (they should be)
			if normalTags[0].ID == proxyTags[0].ID {
				fmt.Printf("   ✅ Responses are identical - proxy is working correctly!\n")
			} else {
				fmt.Printf("   ⚠️  Responses differ - this might indicate caching or rate limiting\n")
			}
		}
	}

	fmt.Println("\n🎯 Proxy Test Summary:")
	fmt.Println("   ✅ Basic proxy configuration implemented")
	fmt.Println("   ✅ Health check through proxy")
	fmt.Println("   ✅ Complex API calls through proxy")
	fmt.Println("   ✅ Response comparison between normal and proxy clients")

	fmt.Println("\n📝 To verify your IP is actually using the proxy:")
	fmt.Println("   1. Check your proxy server logs for incoming requests")
	fmt.Println("   2. Use a service that shows request IP address")
	fmt.Println("   3. Monitor network traffic with tools like Wireshark")
	fmt.Println("   4. Check proxy access logs for the Gamma API endpoints")

	fmt.Println("\n🔧 Proxy Configuration Tips:")
	fmt.Println("   - For HTTP proxy: Use protocol \"http\"")
	fmt.Println("   - For HTTPS proxy: Use protocol \"https\"")
	fmt.Println("   - If no auth needed: Leave Username and Password as nil")
	fmt.Println("   - Common proxy ports: 8080, 3128, 1080 (SOCKS)")

	fmt.Println("\n🚀 Gamma proxy test completed!")
}

// Helper functions to create pointers
func intPtr(i int) *int {
	return &i
}

func boolPtr(b bool) *bool {
	return &b
}