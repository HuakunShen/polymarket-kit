# Gamma SDK Proxy Support

The Go Polymarket Gamma SDK includes comprehensive proxy support for routing API requests through HTTP/HTTPS proxy servers.

## Features

- ✅ **HTTP/HTTPS Proxy Support**: Full support for standard web proxies
- ✅ **Authentication**: Username/password authentication supported
- ✅ **URL Parsing**: Easy proxy configuration from URL strings
- ✅ **IP Verification**: Built-in tools to verify proxy usage
- ✅ **Error Handling**: Detailed error messages for troubleshooting

## Quick Start

### Basic Proxy Configuration

```go
package main

import (
    "log"
    "github.com/HuakunShen/polymarket-kit/go-client/gamma"
)

func main() {
    // Method 1: Use proxy URL (recommended)
    proxyURL := "http://proxy.example.com:8080"
    proxyConfig, err := gamma.ProxyConfigFromURL(proxyURL)
    if err != nil {
        log.Fatalf("Failed to parse proxy URL: %v", err)
    }

    // Method 2: Manual configuration
    proxyConfig := &gamma.ProxyConfig{
        Host:     "proxy.example.com",
        Port:     8080,
        Username: gamma.StringPtr("user"),     // Optional
        Password: gamma.StringPtr("pass"),     // Optional
        Protocol: gamma.StringPtr("http"),     // http or https
    }

    // Create SDK with proxy
    config := &gamma.GammaSDKConfig{
        Proxy: proxyConfig,
    }

    sdk := gamma.NewGammaSDK(config)

    // All API calls now go through proxy
    health, err := sdk.GetHealth()
    if err != nil {
        log.Printf("Proxy error: %v", err)
    } else {
        log.Printf("Health check through proxy: %v", health)
    }
}
```

## Proxy URL Formats

### HTTP Proxy
```go
proxyURL := "http://proxy.example.com:8080"
```

### HTTPS Proxy
```go
proxyURL := "https://proxy.example.com:3128"
```

### Authenticated Proxy
```go
proxyURL := "http://username:password@proxy.example.com:8080"
```

### SOCKS Proxy
```go
proxyURL := "socks5://127.0.0.1:1080"
```

## Examples

The SDK includes several proxy testing examples:

### 1. Simple Proxy Demo
```bash
go run examples/simple_proxy_demo.go
```

Basic proxy connectivity test with health check, IP detection, and API calls. Includes location and ISP information.

### 2. Comprehensive Proxy Demo
```bash
go run examples/proxy_demo.go
```

Advanced proxy testing with detailed comparison between direct and proxied connections.

### 3. IP Verification Demo
```bash
go run examples/ip_verification_demo.go
```

Verifies that your IP address changes when using a proxy, confirming proper routing.

### 4. IP Testing Demo
```bash
go run examples/ip_test_demo.go
```

Comprehensive IP testing with detailed location information, ISP details, and proxy verification.

## Configuration Options

### ProxyConfig Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Host` | `string` | ✅ | Proxy server hostname or IP address |
| `Port` | `int` | ✅ | Proxy server port number |
| `Protocol` | `*string` | ❌ | Protocol: "http" or "https" (defaults to "http") |
| `Username` | `*string` | ❌ | Authentication username (optional) |
| `Password` | `*string` | ❌ | Authentication password (optional) |

### GammaSDKConfig Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Proxy` | `*ProxyConfig` | ❌ | Proxy configuration (optional) |

### IPResponse Type

```go
type IPResponse struct {
    IP       string `json:"ip"`               // IP address
    Country  string `json:"country,omitempty"`  // Country code
    Region   string `json:"region,omitempty"`   // State/region
    City     string `json:"city,omitempty"`     // City
    ISP      string `json:"isp,omitempty"`      // Internet Service Provider
    Org      string `json:"org,omitempty"`      // Organization
    AS       string `json:"as,omitempty"`       // Autonomous System
    Hostname string `json:"hostname,omitempty"` // Hostname
}
```

## Helper Functions

The SDK provides utility functions for creating pointers:

```go
// String pointer
protocol := gamma.StringPtr("https")

// Integer pointer
port := gamma.IntPtr(8080)

// Boolean pointer
enabled := gamma.BoolPtr(true)
```

## IP Testing Methods

### TestProxyIP()

Gets the current IP address through the configured proxy by querying multiple IP detection services.

```go
ipInfo, err := sdk.TestProxyIP()
if err != nil {
    log.Printf("IP detection failed: %v", err)
    return
}

fmt.Printf("IP: %s\n", ipInfo.IP)
fmt.Printf("Location: %s, %s, %s\n", ipInfo.City, ipInfo.Region, ipInfo.Country)
fmt.Printf("ISP: %s\n", ipInfo.ISP)
```

### TestProxyIPComparison()

Compares IP addresses with and without proxy to verify proxy is working correctly.

```go
comparison, err := sdk.TestProxyIPComparison()
if err != nil {
    log.Printf("IP comparison failed: %v", err)
    return
}

fmt.Printf("Direct IP: %s\n", comparison.DirectIP.IP)
fmt.Printf("Proxy IP: %s\n", comparison.ProxyIP.IP)
fmt.Printf("Using Proxy: %v\n", comparison.UsingProxy)

if comparison.UsingProxy {
    fmt.Println("✅ Proxy is working!")
} else {
    fmt.Println("⚠️  Proxy may not be working correctly")
}
```

## Testing Proxy Connectivity

### Health Check

```go
health, err := sdk.GetHealth()
if err != nil {
    log.Printf("Proxy health check failed: %v", err)
} else {
    log.Printf("Proxy working: %v", health)
}
```

### IP Testing Through Proxy

```go
// Get IP address through proxy
ipInfo, err := sdk.TestProxyIP()
if err != nil {
    log.Printf("IP detection failed: %v", err)
} else {
    log.Printf("IP through proxy: %s", ipInfo.IP)
    log.Printf("Location: %s, %s, %s", ipInfo.City, ipInfo.Region, ipInfo.Country)
    log.Printf("ISP: %s", ipInfo.ISP)
}
```

### Compare IP Addresses

```go
// Compare direct IP vs proxy IP
comparison, err := sdk.TestProxyIPComparison()
if err != nil {
    log.Printf("IP comparison failed: %v", err)
} else {
    log.Printf("Direct IP: %s", comparison.DirectIP.IP)
    log.Printf("Proxy IP: %s", comparison.ProxyIP.IP)
    log.Printf("Using proxy: %v", comparison.UsingProxy)

    if comparison.UsingProxy {
        log.Printf("✅ Proxy is working!")
    } else {
        log.Printf("⚠️  Proxy may not be working correctly")
    }
}
```

### API Calls Through Proxy

```go
// Get tags through proxy
tags, err := sdk.GetTags(gamma.TagQuery{
    Limit:     gamma.IntPtr(10),
    Ascending: gamma.BoolPtr(true),
})
if err != nil {
    log.Printf("Tags API failed: %v", err)
} else {
    log.Printf("Found %d tags through proxy", len(tags))
}
```

## Troubleshooting

### Common Issues

1. **Proxy Not Running**
   ```
   Error: failed to make request: ...
   ```
   **Solution**: Verify proxy server is running and accessible

2. **Authentication Failed**
   ```
   Error: failed to make request: 407 Proxy Authentication Required
   ```
   **Solution**: Check proxy credentials

3. **Wrong Protocol**
   ```
   Error: failed to make request: ...
   ```
   **Solution**: Use correct protocol (http vs https)

4. **Connection Timeout**
   ```
   Error: failed to make request: context deadline exceeded
   ```
   **Solution**: Check network connectivity and proxy settings

### Debug Steps

1. **Test with curl first**:
   ```bash
   curl -x http://proxy.example.com:8080 https://gamma-api.polymarket.com/health
   ```

2. **Check proxy server logs** for incoming requests

3. **Use IP verification demo** to confirm proxy usage:
   ```bash
   go run examples/ip_verification_demo.go
   ```

4. **Network monitoring** with tools like Wireshark

### Error Messages

The SDK provides detailed error messages:

```go
if err != nil {
    // Error includes context about what failed
    log.Printf("Failed to get events: %v", err)

    // Common error scenarios:
    // - Network connectivity issues
    // - Proxy authentication failed
    // - Invalid proxy configuration
    // - Server errors (5xx)
}
```

## Best Practices

1. **Use URL parsing** for complex proxy configurations
2. **Handle errors gracefully** with user-friendly messages
3. **Test proxy connectivity** before making API calls
4. **Use environment variables** for proxy configuration
5. **Log proxy usage** for debugging and monitoring

### Environment Variable Example

```go
func getProxyConfig() *gamma.ProxyConfig {
    proxyURL := os.Getenv("POLYMARKET_PROXY_URL")
    if proxyURL == "" {
        return nil // No proxy configured
    }

    config, err := gamma.ProxyConfigFromURL(proxyURL)
    if err != nil {
        log.Printf("Invalid proxy URL: %v", err)
        return nil
    }

    return config
}

// Usage
proxyConfig := getProxyConfig()
sdk := gamma.NewGammaSDK(&gamma.GammaSDKConfig{
    Proxy: proxyConfig,
})
```

## Security Considerations

1. **Credentials**: Store proxy credentials securely (environment variables, secrets management)
2. **HTTPS**: Use HTTPS proxies when possible for encrypted communication
3. **Verification**: Always verify proxy is working before making sensitive API calls
4. **Logging**: Avoid logging proxy credentials in production

## Performance

- **Connection Pooling**: Go's HTTP client handles connection pooling automatically
- **Timeouts**: Default HTTP client timeout is 30 seconds
- **Retries**: Implement retry logic for transient network errors

## Support

For issues with proxy functionality:

1. Check the troubleshooting section above
2. Test with the provided examples
3. Verify proxy server is accessible and properly configured
4. Create an issue with detailed error information and proxy configuration