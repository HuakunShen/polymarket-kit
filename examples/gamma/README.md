# Gamma API Examples

This directory contains examples for using the Polymarket Gamma API Go and Python clients.

## Files

### `gamma_example.go`
Comprehensive example demonstrating Gamma API functionality:
- Market browsing and searching
- Event discovery and filtering
- Tag-based market discovery
- Series and market relationships

### `gamma_example.py`
Comprehensive example demonstrating Gamma API functionality using the Python SDK.

## Running the Example

```bash
go run gamma_example.go
```

```bash
python gamma_example.py
```
## Features Demonstrated

- **Market Discovery**: Browse and search prediction markets
- **Event Management**: Find markets by events and categories
- **Tag System**: Filter markets by tags and categories
- **Series Support**: Explore related market series
- **Search Functionality**: Full-text search across markets

## Requirements

- Go 1.19 or later
- Python 3.12 or later (for the Python example)
- Internet connection (no API keys required for Gamma API)

## Output

The example will display:
- Available prediction markets
- Event information and categories
- Market details and pricing
- Search results and filtered data
