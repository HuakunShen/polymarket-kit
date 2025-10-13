package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/HuakunShen/polymarket-kit/go-client/gamma"
)

func main() {
	fmt.Println("🔗 Simple Gamma Proxy Test")

	// ===== PROXY URL PLACEHOLDER =====
	// Replace with your actual proxy URL
	proxyURL := "http://127.0.0.1:9090" // 👈 REPLACE: Your proxy URL
	// For authenticated proxy: "http://username:password@proxy.example.com:8080"
	// For HTTPS proxy: "https://proxy.example.com:3128"
	// For SOCKS proxy: "socks5://127.0.0.1:1080"

	fmt.Printf("\n📡 Testing proxy configuration: %s\n", proxyURL)

	// Create proxy config from URL
	proxyConfig, err := gamma.ProxyConfigFromURL(proxyURL)
	if err != nil {
		log.Fatalf("❌ Failed to parse proxy URL: %v", err)
	}

	fmt.Printf("✅ Proxy config created:\n")
	fmt.Printf("   Host: %s\n", proxyConfig.Host)
	fmt.Printf("   Port: %d\n", proxyConfig.Port)
	fmt.Printf("   Protocol: %s\n", *proxyConfig.Protocol)
	if proxyConfig.Username != nil {
		fmt.Printf("   Username: %s\n", *proxyConfig.Username)
		fmt.Printf("   Password: [hidden]\n")
	}

	// Create Gamma SDK with proxy
	config := &gamma.GammaSDKConfig{
		Proxy: proxyConfig,
	}

	sdk := gamma.NewGammaSDK(config)

	// Test basic connectivity through proxy
	fmt.Println("\n🌐 Testing connectivity through proxy...")

	// Create a simple HTTP request to check proxy connectivity
	req, err := http.NewRequest("GET", "https://ifconfig.me", nil)
	if err != nil {
		log.Printf("❌ Failed to create request: %v", err)
		return
	}

	// Use the SDK's HTTP client (which has proxy configured)
	resp, err := sdk.GetHttpClient().Do(req)
	if err != nil {
		log.Printf("❌ Connectivity test failed: %v", err)
		fmt.Println("\n💡 Troubleshooting:")
		fmt.Println("   1. Verify proxy server is running")
		fmt.Println("   2. Check proxy URL format")
		fmt.Println("   3. Verify proxy credentials if required")
		fmt.Println("   4. Test proxy with curl first:")
		fmt.Printf("      curl -x %s https://ifconfig.me\n", proxyURL)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("❌ Unexpected status code: %d", resp.StatusCode)
		return
	}

	// Read the response body (should contain IP address)
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("❌ Failed to read response: %v", err)
		return
	}

	ip := strings.TrimSpace(string(body))
	fmt.Printf("✅ Connectivity test succeeded - Your IP through proxy: %s\n", ip)

	// Test IP detection through proxy
	fmt.Println("\n🌍 Testing IP address through proxy...")
	proxyIP, err := sdk.TestProxyIP()
	if err != nil {
		log.Printf("❌ IP detection through proxy failed: %v", err)
	} else {
		fmt.Printf("✅ IP through proxy: %s\n", proxyIP.IP)
		if proxyIP.Country != "" {
			fmt.Printf("   📍 Location: %s, %s, %s\n", proxyIP.City, proxyIP.Region, proxyIP.Country)
		}
		if proxyIP.ISP != "" {
			fmt.Printf("   🌐 ISP: %s\n", proxyIP.ISP)
		}
	}

	// Test API calls
	fmt.Println("\n📊 Testing API calls through proxy...")

	// Get tags
	tags, err := sdk.GetTags(gamma.TagQuery{
		Limit:     gamma.IntPtr(5),
		Ascending: gamma.BoolPtr(true),
	})
	if err != nil {
		log.Printf("❌ Tags API failed: %v", err)
	} else {
		fmt.Printf("✅ Tags API succeeded: %d tags retrieved\n", len(tags))
	}

	// Get events
	events, err := sdk.GetEvents(&gamma.UpdatedEventQuery{
		Limit:  gamma.IntPtr(3),
		Active: gamma.BoolPtr(true),
	})
	if err != nil {
		log.Printf("❌ Events API failed: %v", err)
	} else {
		fmt.Printf("✅ Events API succeeded: %d events retrieved\n", len(events))
	}

	fmt.Println("\n🎉 Proxy test completed successfully!")
	fmt.Println("   Your requests are being routed through the proxy server.")

	fmt.Println("\n📋 Quick reference for proxy URLs:")
	fmt.Println("   HTTP proxy:     http://host:port")
	fmt.Println("   HTTPS proxy:    https://host:port")
	fmt.Println("   Auth proxy:     http://user:pass@host:port")
	fmt.Println("   SOCKS proxy:    socks5://host:port")

	fmt.Println("\n🔍 For detailed IP verification, run:")
	fmt.Println("   go run examples/ip_test_demo.go")
}
