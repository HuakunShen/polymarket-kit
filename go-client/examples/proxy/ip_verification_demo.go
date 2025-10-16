package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/gamma"
)

// IPResponse represents the response from IP detection services
type IPResponse struct {
	IP       string `json:"ip"`
	Country  string `json:"country,omitempty"`
	Region   string `json:"region,omitempty"`
	City     string `json:"city,omitempty"`
	ISP      string `json:"isp,omitempty"`
	Org      string `json:"org,omitempty"`
	AS       string `json:"as,omitempty"`
	Hostname string `json:"hostname,omitempty"`
}

func main() {
	fmt.Println("🌍 IP Address Verification Test for Gamma Proxy")

	// Test 1: Get IP without proxy
	fmt.Println("\n1. Detecting IP address without proxy...")
	directIP, err := getIPAddress()
	if err != nil {
		log.Printf("❌ Failed to get direct IP: %v", err)
	} else {
		fmt.Printf("✅ Direct IP: %s\n", directIP.IP)
		if directIP.Country != "" {
			fmt.Printf("   Location: %s, %s\n", directIP.City, directIP.Country)
		}
		if directIP.ISP != "" {
			fmt.Printf("   ISP: %s\n", directIP.ISP)
		}
	}

	// Test 2: Configure proxy
	fmt.Println("\n2. Configuring HTTP proxy...")

	// ===== PROXY CONFIGURATION PLACEHOLDER =====
	// Replace with your actual proxy details
	proxyURL := "http://127.0.0.1:8080" // 👈 REPLACE: Your proxy URL
	// For authenticated proxy: "http://username:password@proxy.example.com:8080"

	// Parse proxy URL
	parsedProxyURL, err := url.Parse(proxyURL)
	if err != nil {
		log.Fatalf("❌ Failed to parse proxy URL: %v", err)
	}

	fmt.Printf("✅ Proxy configured: %s\n", parsedProxyURL.String())

	// Test 3: Get IP through proxy
	fmt.Println("\n3. Detecting IP address through proxy...")
	proxyIP, err := getIPThroughProxy(parsedProxyURL)
	if err != nil {
		log.Printf("❌ Failed to get IP through proxy: %v", err)
		fmt.Println("💡 This could mean:")
		fmt.Println("   - Proxy server is not running or accessible")
		fmt.Println("   - Proxy authentication failed")
		fmt.Println("   - Proxy doesn't support HTTP requests")
		fmt.Println("   - Network connectivity issues to proxy")
	} else {
		fmt.Printf("✅ Proxy IP: %s\n", proxyIP.IP)
		if proxyIP.Country != "" {
			fmt.Printf("   Location: %s, %s\n", proxyIP.City, proxyIP.Country)
		}
		if proxyIP.ISP != "" {
			fmt.Printf("   ISP: %s\n", proxyIP.ISP)
		}
	}

	// Test 4: Compare IPs
	fmt.Println("\n4. Comparing IP addresses...")
	if directIP != nil && proxyIP != nil {
		if directIP.IP == proxyIP.IP {
			fmt.Printf("⚠️  Same IP detected (%s) - proxy may not be working\n", directIP.IP)
			fmt.Println("💡 Possible reasons:")
			fmt.Println("   - Proxy is transparent (not changing IP)")
			fmt.Println("   - Proxy configuration is not being applied")
			fmt.Println("   - Network routing is bypassing proxy")
		} else {
			fmt.Printf("✅ Different IPs detected!\n")
			fmt.Printf("   Direct:  %s (%s)\n", directIP.IP, directIP.ISP)
			fmt.Printf("   Proxy:   %s (%s)\n", proxyIP.IP, proxyIP.ISP)
			fmt.Println("🎉 Proxy is working correctly!")
		}
	}

	// Test 5: Test Gamma API through proxy
	fmt.Println("\n5. Testing Gamma API through configured proxy...")
	testGammaAPIWithProxy(parsedProxyURL)

	fmt.Println("\n🎯 IP Verification Summary:")
	if directIP != nil && proxyIP != nil && directIP.IP != proxyIP.IP {
		fmt.Println("   ✅ Proxy successfully changes IP address")
		fmt.Println("   ✅ Gamma API can be accessed through proxy")
		fmt.Println("   ✅ Proxy configuration is working correctly")
	} else {
		fmt.Println("   ⚠️  IP verification inconclusive")
		fmt.Println("   💡 Check proxy configuration and connectivity")
	}

	fmt.Println("\n📋 Additional IP Detection Services:")
	fmt.Println("   - https://api.ipify.org?format=json")
	fmt.Println("   - https://ipinfo.io/json")
	fmt.Println("   - https://api.my-ip.io/v1/ip")
	fmt.Println("   - https://checkip.amazonaws.com")
}

// getIPAddress gets the current IP address using a simple HTTP request
func getIPAddress() (*IPResponse, error) {
	client := &http.Client{Timeout: 10 * time.Second}

	// Try multiple IP detection services
	services := []string{
		"https://ipinfo.io/json",
		"https://api.ipify.org?format=json",
		"https://api.my-ip.io/v1/ip",
	}

	for _, service := range services {
		resp, err := client.Get(service)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			continue
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			continue
		}

		var ipResp IPResponse
		if err := json.Unmarshal(body, &ipResp); err != nil {
			continue
		}

		if ipResp.IP != "" {
			return &ipResp, nil
		}
	}

	return nil, fmt.Errorf("failed to get IP from any service")
}

// getIPThroughProxy gets IP address through a proxy server
func getIPThroughProxy(proxyURL *url.URL) (*IPResponse, error) {
	// Create HTTP client with proxy
	transport := &http.Transport{
		Proxy: http.ProxyURL(proxyURL),
	}

	client := &http.Client{
		Transport: transport,
		Timeout:   30 * time.Second,
	}

	// Try multiple IP detection services
	services := []string{
		"https://ipinfo.io/json",
		"https://api.ipify.org?format=json",
		"https://api.my-ip.io/v1/ip",
	}

	for _, service := range services {
		resp, err := client.Get(service)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			continue
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			continue
		}

		var ipResp IPResponse
		if err := json.Unmarshal(body, &ipResp); err != nil {
			continue
		}

		if ipResp.IP != "" {
			return &ipResp, nil
		}
	}

	return nil, fmt.Errorf("failed to get IP through proxy from any service")
}

// testGammaAPIWithProxy tests the Gamma API with proxy configuration
func testGammaAPIWithProxy(proxyURL *url.URL) {
	// Extract proxy details from URL
	proxyConfig := &gamma.ProxyConfig{
		Host:     proxyURL.Hostname(),
		Port:     0, // Will be set below
		Protocol: stringPtr(proxyURL.Scheme),
	}

	// Parse port
	if proxyURL.Port() != "" {
		var port int
		_, err := fmt.Sscanf(proxyURL.Port(), "%d", &port)
		if err == nil {
			proxyConfig.Port = port
		}
	}

	// Extract username and password if provided
	if proxyURL.User != nil {
		username := proxyURL.User.Username()
		password, _ := proxyURL.User.Password()
		if username != "" {
			proxyConfig.Username = &username
		}
		if password != "" {
			proxyConfig.Password = &password
		}
	}

	// Create Gamma SDK with proxy
	config := &gamma.GammaSDKConfig{
		Proxy:   proxyConfig,
		Timeout: 30 * time.Second,
	}

	sdk := gamma.NewGammaSDK(config)

	// Test health check
	health, err := sdk.GetHealth()
	if err != nil {
		log.Printf("❌ Gamma API through proxy failed: %v", err)
		return
	}

	fmt.Printf("✅ Gamma API health check through proxy: %v\n", health)

	// Test a simple API call
	tags, err := sdk.GetTags(&gamma.TagQuery{
		Limit:     intPtr(1),
		Ascending: boolPtr(true),
	})
	if err != nil {
		log.Printf("❌ Gamma API tags call through proxy failed: %v", err)
		return
	}

	fmt.Printf("✅ Gamma API tags call through proxy succeeded: %d tags found\n", len(tags))
	if len(tags) > 0 {
		fmt.Printf("   Sample tag: %s (%s)\n", tags[0].Label, tags[0].Slug)
	}
}

// Helper functions to create pointers
func intPtr(i int) *int {
	return &i
}

func boolPtr(b bool) *bool {
	return &b
}