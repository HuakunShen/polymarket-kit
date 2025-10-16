package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/HuakunShen/polymarket-kit/go-client/gamma"
)

func main() {
	fmt.Println("🌍 Gamma SDK IP Testing - Proxy Verification")
	fmt.Println(strings.Repeat("=", 50))

	// ===== PROXY CONFIGURATION PLACEHOLDER =====
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

	fmt.Println("\n" + strings.Repeat("=", 50))
	fmt.Println("🧪 IP Address Testing")
	fmt.Println(strings.Repeat("=", 50))

	// Test 1: Get IP through proxy
	fmt.Println("\n1. Testing IP address through proxy...")
	proxyIP, err := sdk.TestProxyIP()
	if err != nil {
		log.Printf("❌ Failed to get IP through proxy: %v", err)
		fmt.Println("\n💡 Troubleshooting:")
		fmt.Println("   1. Verify proxy server is running")
		fmt.Println("   2. Check proxy URL format and credentials")
		fmt.Println("   3. Test proxy with curl first:")
		fmt.Printf("      curl -x %s https://ipinfo.io/json\n", proxyURL)
		return
	}

	fmt.Printf("✅ IP through proxy: %s\n", proxyIP.IP)
	if proxyIP.Country != "" {
		fmt.Printf("   Location: %s, %s, %s\n", proxyIP.City, proxyIP.Region, proxyIP.Country)
	}
	if proxyIP.ISP != "" {
		fmt.Printf("   ISP: %s\n", proxyIP.ISP)
	}
	if proxyIP.Org != "" {
		fmt.Printf("   Organization: %s\n", proxyIP.Org)
	}

	// Test 2: Compare IP with and without proxy
	fmt.Println("\n2. Comparing IP addresses (direct vs proxy)...")
	comparison, err := sdk.TestProxyIPComparison()
	if err != nil {
		log.Printf("❌ Failed to compare IP addresses: %v", err)
	} else {
		fmt.Printf("✅ Direct IP:  %s\n", func() string {
			if comparison.DirectIP != nil {
				return comparison.DirectIP.IP
			}
			return "Unknown"
		}())
		fmt.Printf("✅ Proxy IP:   %s\n", comparison.ProxyIP.IP)
		fmt.Printf("✅ Using Proxy: %v\n", comparison.UsingProxy)

		if comparison.UsingProxy {
			fmt.Println("\n🎉 SUCCESS: Your requests are being routed through the proxy!")
			if comparison.DirectIP != nil && comparison.ProxyIP != nil {
				fmt.Printf("   ✅ IP address changed from %s to %s\n", comparison.DirectIP.IP, comparison.ProxyIP.IP)

				// Show location change if available
				if comparison.DirectIP.Country != "" && comparison.ProxyIP.Country != "" {
					fmt.Printf("   📍 Location changed from %s to %s\n", comparison.DirectIP.Country, comparison.ProxyIP.Country)
				}
			}
		} else {
			fmt.Println("\n⚠️  WARNING: Proxy may not be working correctly")
			fmt.Println("   - IP address is the same with and without proxy")
			fmt.Println("   - This could indicate:")
			fmt.Println("     * Transparent proxy (doesn't change IP)")
			fmt.Println("     * Proxy configuration not applied")
			fmt.Println("     * Network routing bypassing proxy")
		}
	}

	// Test 3: Test Gamma API calls through proxy
	fmt.Println("\n3. Testing Gamma API calls through proxy...")

	// Health check
	_, err = sdk.GetHealth()
	if err != nil {
		log.Printf("❌ Health check through proxy failed: %v", err)
	} else {
		fmt.Printf("✅ Health check through proxy succeeded\n")
	}

	// Get tags through proxy
	tags, err := sdk.GetTags(gamma.TagQuery{
		Limit:     gamma.IntPtr(3),
		Ascending: gamma.BoolPtr(true),
	})
	if err != nil {
		log.Printf("❌ Tags API through proxy failed: %v", err)
	} else {
		fmt.Printf("✅ Tags API through proxy succeeded: %d tags retrieved\n", len(tags))
	}

	// Get events through proxy
	events, err := sdk.GetEvents(&gamma.UpdatedEventQuery{
		Limit:  gamma.IntPtr(2),
		Active: gamma.BoolPtr(true),
	})
	if err != nil {
		log.Printf("❌ Events API through proxy failed: %v", err)
	} else {
		fmt.Printf("✅ Events API through proxy succeeded: %d events retrieved\n", len(events))
	}

	fmt.Println("\n" + strings.Repeat("=", 50))
	fmt.Println("📋 Summary")
	fmt.Println(strings.Repeat("=", 50))

	if comparison != nil && comparison.UsingProxy {
		fmt.Println("🎉 Proxy Configuration: WORKING")
		fmt.Printf("   Direct IP:  %s\n", func() string {
			if comparison.DirectIP != nil {
				return comparison.DirectIP.IP
			}
			return "Unknown"
		}())
		fmt.Printf("   Proxy IP:   %s\n", comparison.ProxyIP.IP)
		fmt.Printf("   Location:   %s, %s, %s\n", proxyIP.City, proxyIP.Region, proxyIP.Country)
		fmt.Printf("   ISP:        %s\n", proxyIP.ISP)
		fmt.Println("   ✅ All Gamma API calls successful through proxy")
	} else {
		fmt.Println("⚠️  Proxy Configuration: ISSUE DETECTED")
		fmt.Println("   - IP address verification failed")
		fmt.Println("   - Check proxy server and configuration")
		fmt.Println("   - Verify network connectivity")
	}

	fmt.Println("\n📚 Additional Information:")
	fmt.Println("   - IP detection services used:")
	fmt.Println("     * https://ipinfo.io/json (detailed location info)")
	fmt.Println("     * https://api.ipify.org?format=json")
	fmt.Println("     * https://api.my-ip.io/v1/ip")
	fmt.Println("     * https://checkip.amazonaws.com")
	fmt.Println("   - Multiple services are tried for reliability")
	fmt.Println("   - Location and ISP info may vary by service")

	fmt.Println("\n🔧 Proxy Testing Tips:")
	fmt.Println("   1. Test with curl first:")
	fmt.Printf("      curl -x %s https://ipinfo.io/json\n", proxyURL)
	fmt.Println("   2. Check proxy server logs")
	fmt.Println("   3. Use different proxy locations to verify IP changes")
	fmt.Println("   4. Monitor network traffic with Wireshark")
	fmt.Println("   5. Some proxies may be transparent (don't change IP)")

	fmt.Println("\n🚀 IP testing completed!")
}