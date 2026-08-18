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

### `tennis_event.py`
Read-only example that discovers a Polymarket tennis event via the Python `GammaClient`
and annotates it with an **independent** live match state (score, server, break point)
from an external live-scores feed. Executes no trades. The live overlay is opt-in via
`LIVETENNIS_API_KEY`; without a key it prints the Gamma side only. See the module
docstring for the vendor disclosure and free-tier limits.

## Running the Example

```bash
go run gamma_example.go
```

```bash
python gamma_example.py
```

```bash
# Read-only tennis event + independent live-state overlay (overlay needs a free key)
python tennis_event.py
LIVETENNIS_API_KEY=your-free-key python tennis_event.py
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
