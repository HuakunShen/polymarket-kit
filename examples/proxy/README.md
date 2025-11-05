# Proxy Examples

This directory contains examples for proxy configuration and IP verification with Polymarket APIs.

## Files

### `proxy_demo.go`
HTTP proxy configuration example:
- Proxy setup with authentication
- Custom proxy configuration
- Connection testing through proxy
- Performance monitoring

### `simple_proxy_demo.go`
Basic proxy setup example:
- Simple HTTP proxy configuration
- Basic connectivity testing
- Error handling for proxy failures

### `ip_verification_demo.go`
IP verification with proxy setup:
- IP address verification
- Proxy rotation testing
- Geolocation checking
- Connection validation

### `ip_test_demo.go`
IP testing functionality:
- IP address analysis
- Connection quality testing
- Proxy effectiveness validation

## Running the Examples

```bash
# Run comprehensive proxy demo
go run proxy_demo.go

# Run simple proxy setup
go run simple_proxy_demo.go

# Run IP verification demo
go run ip_verification_demo.go

# Run IP testing demo
go run ip_test_demo.go
```

## Requirements

- Go 1.19 or later
- Internet connection
- Proxy server (for proxy examples)
- Optional: Proxy authentication credentials

## Features Demonstrated

- **Proxy Configuration**: HTTP/HTTPS proxy setup with authentication
- **IP Verification**: Verify IP address and geolocation
- **Connection Testing**: Test API connectivity through proxy
- **Error Handling**: Robust error handling for network issues
- **Performance Monitoring**: Latency and throughput measurements

## Configuration

Proxy configuration can be set via:
- Environment variables
- Direct configuration in code
- Configuration files

## Output

The examples will demonstrate:
- Proxy connection status
- IP address verification results
- Connection quality metrics
- API response times through proxy

## Use Cases

- Access from restricted regions
- Load balancing across multiple IPs
- Privacy and anonymity
- Rate limit circumvention