# CLOB Examples

This directory contains examples for using the Polymarket CLOB (Centralized Order Book) Go client.

## Files

### `basic_usage.go`
Basic CLOB client setup and trading operations:
- Client initialization with credentials
- Market price fetching
- Order placement and management
- Balance checking

### `wallet_demo.go`
Wallet operations and management:
- Wallet connection and authentication
- Token balance checking
- Transaction signing and execution

## Running the Examples

```bash
# Run basic CLOB usage
go run basic_usage.go

# Run wallet operations demo
go run wallet_demo.go
```

## Requirements

- Go 1.19 or later
- Valid Polymarket API credentials
- Environment variables:
  - `POLYMARKET_KEY` - Private key for signing transactions
  - `POLYMARKET_FUNDER` - Funder address for gas fees

## Features Demonstrated

- **Order Management**: Place, cancel, and monitor orders
- **Price Discovery**: Get current market prices and order books
- **Wallet Integration**: Connect and manage wallet operations
- **Transaction Signing**: Secure transaction signing with private keys
- **Balance Management**: Track token balances and positions

## Security Notes

- Never commit private keys to version control
- Use environment variables for sensitive credentials
- Ensure secure key storage in production environments

## Output

The examples will demonstrate:
- Real-time market data
- Order execution and confirmation
- Wallet balance updates
- Transaction status monitoring