# Signature Examples

This directory contains examples for cryptographic signatures and authentication with Polymarket.

## Files

### `test_sig.go`
Signature generation and testing example:
- Private key management
- Message signing and verification
- API authentication
- Signature validation

### `test_sig_debug.go`
Debug signature functionality example:
- Detailed signature debugging
- Step-by-step signing process
- Error diagnostics
- Signature analysis tools

## Running the Examples

```bash
# Run signature testing
go run test_sig.go

# Run signature debugging
go run test_sig_debug.go
```

## Requirements

- Go 1.19 or later
- Valid Ethereum private key
- Environment variables:
  - `POLYMARKET_KEY` - Private key for signing

## Features Demonstrated

- **Key Management**: Secure private key handling
- **Digital Signatures**: ECDSA signature generation
- **Message Authentication**: Sign and verify API messages
- **Debug Tools**: Analyze signature components
- **Error Diagnostics**: Detailed error reporting

## Security Notes

⚠️ **Important Security Considerations:**
- Never commit private keys to version control
- Use secure key storage solutions
- Consider using hardware wallets for production
- Rotate keys regularly
- Use environment variables or secure vaults

## Cryptographic Details

The examples demonstrate:
- ECDSA signature generation (secp256k1 curve)
- Ethereum-compatible message signing
- Personal message signing (EIP-191)
- Signature verification and validation

## Output

The examples will display:
- Generated signatures
- Verification results
- Debug information about signature components
- Error diagnostics for failed operations

## Best Practices

1. **Key Security**: Store private keys securely
2. **Message Integrity**: Always verify message content before signing
3. **Signature Validation**: Verify all incoming signatures
4. **Error Handling**: Implement proper error handling for cryptographic operations
5. **Testing**: Thoroughly test signature functionality in development