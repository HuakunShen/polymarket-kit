package auth

import (
	"crypto/ecdsa"
	"fmt"
	"strconv"
	"time"

	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/HuakunShen/polymarket-kit/go-client/types"
)

// CreateL1Headers creates Level 1 authentication headers for API key creation
func CreateL1Headers(privateKey *ecdsa.PrivateKey, chainID types.Chain, nonce *uint64, timestamp *int64) (*types.L1PolyHeader, error) {
	// Default timestamp to current time if not provided
	ts := time.Now().Unix()
	if timestamp != nil {
		ts = *timestamp
	}

	// Default nonce to 0 if not provided
	var n uint64 = 0
	if nonce != nil {
		n = *nonce
	}

	// Build EIP712 signature
	sig, err := BuildClobEip712Signature(privateKey, int64(chainID), ts, n)
	if err != nil {
		return nil, fmt.Errorf("failed to build EIP712 signature: %w", err)
	}

	// Get address from private key
	address := crypto.PubkeyToAddress(privateKey.PublicKey).Hex()

	headers := &types.L1PolyHeader{
		POLYAddress:   address,
		POLYSignature: sig,
		POLYTimestamp: strconv.FormatInt(ts, 10),
		POLYNonce:     strconv.FormatUint(n, 10),
	}

	return headers, nil
}

// CreateL2Headers creates Level 2 authentication headers for API operations
func CreateL2Headers(privateKey *ecdsa.PrivateKey, creds *types.ApiKeyCreds, l2HeaderArgs *types.L2HeaderArgs, timestamp *int64) (*types.L2PolyHeader, error) {
	// Default timestamp to current time if not provided
	ts := time.Now().Unix()
	if timestamp != nil {
		ts = *timestamp
	}

	// Get address from private key
	address := crypto.PubkeyToAddress(privateKey.PublicKey).Hex()

	// Build HMAC signature
	var body *string
	if l2HeaderArgs.Body != "" {
		body = &l2HeaderArgs.Body
	}

	sig := BuildPolyHmacSignature(creds.Secret, ts, l2HeaderArgs.Method, l2HeaderArgs.RequestPath, body)

	headers := &types.L2PolyHeader{
		POLYAddress:    address,
		POLYSignature:  sig,
		POLYTimestamp:  strconv.FormatInt(ts, 10),
		POLYAPIKey:     creds.Key,
		POLYPassphrase: creds.Passphrase,
	}

	return headers, nil
}

// L2WithBuilderHeader represents headers with builder authentication
type L2WithBuilderHeader struct {
	types.L2PolyHeader
	POLYBuilderAPIKey     string `json:"POLY_BUILDER_API_KEY"`
	POLYBuilderTimestamp  string `json:"POLY_BUILDER_TIMESTAMP"`
	POLYBuilderPassphrase string `json:"POLY_BUILDER_PASSPHRASE"`
	POLYBuilderSignature  string `json:"POLY_BUILDER_SIGNATURE"`
}

// BuilderConfig represents builder configuration
type BuilderConfig struct {
	APIKey     string `json:"apiKey"`
	Secret     string `json:"secret"`
	Passphrase string `json:"passphrase"`
}

// IsValid checks if the builder config is valid
func (bc *BuilderConfig) IsValid() bool {
	return bc != nil && bc.APIKey != "" && bc.Secret != "" && bc.Passphrase != ""
}

// GenerateBuilderHeaders generates builder headers
func (bc *BuilderConfig) GenerateBuilderHeaders(method string, path string, body *string) (*L2WithBuilderHeader, error) {
	if !bc.IsValid() {
		return nil, fmt.Errorf("invalid builder config")
	}

	ts := time.Now().Unix()

	var bodyStr *string
	if body != nil {
		bodyStr = body
	}

	// Generate builder signature using same HMAC method
	sig := BuildPolyHmacSignature(bc.Secret, ts, method, path, bodyStr)

	builderHeaders := &L2WithBuilderHeader{
		POLYBuilderAPIKey:     bc.APIKey,
		POLYBuilderTimestamp:  strconv.FormatInt(ts, 10),
		POLYBuilderPassphrase: bc.Passphrase,
		POLYBuilderSignature:  sig,
	}

	return builderHeaders, nil
}

// InjectBuilderHeaders injects builder headers into L2 headers
func InjectBuilderHeaders(l2Headers *types.L2PolyHeader, builderHeaders *L2WithBuilderHeader) *L2WithBuilderHeader {
	combined := &L2WithBuilderHeader{
		L2PolyHeader:           *l2Headers,
		POLYBuilderAPIKey:     builderHeaders.POLYBuilderAPIKey,
		POLYBuilderTimestamp:  builderHeaders.POLYBuilderTimestamp,
		POLYBuilderPassphrase: builderHeaders.POLYBuilderPassphrase,
		POLYBuilderSignature:  builderHeaders.POLYBuilderSignature,
	}
	return combined
}

// VerifyEIP712Signature verifies an EIP712 signature
func VerifyEIP712Signature(address string, signature string, timestamp int64, nonce uint64, chainID types.Chain) (bool, error) {
	// Parse the signature
	_, err := hexutil.Decode(signature)
	if err != nil {
		return false, fmt.Errorf("failed to decode signature: %w", err)
	}

	// Create the typed data hash
	domain := EIP712Domain{
		Name:    "ClobAuthDomain",
		Version: "1",
		ChainID: int64(chainID),
	}

	message := ClobAuthData{
		Address:   address,
		Timestamp: fmt.Sprintf("%d", timestamp),
		Nonce:     nonce,
		Message:   MSG_TO_SIGN,
	}

	typedData := TypedData{
		Types: map[string][]EIP712Type{
			"ClobAuth": {
				{Name: "address", Type: "address"},
				{Name: "timestamp", Type: "string"},
				{Name: "nonce", Type: "uint256"},
				{Name: "message", Type: "string"},
			},
		},
		PrimaryType: "ClobAuth",
		Domain:      domain,
		Message:     message,
	}

	hash, err := getTypedDataHash(typedData)
	if err != nil {
		return false, fmt.Errorf("failed to get typed data hash: %w", err)
	}

	// Recover the address
	recoveredAddress, err := RecoverAddress(hash, signature)
	if err != nil {
		return false, fmt.Errorf("failed to recover address: %w", err)
	}

	return recoveredAddress.Hex() == address, nil
}