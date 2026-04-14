package auth

import (
	"crypto/ecdsa"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
)

const (
	// MSG_TO_SIGN is the constant message to sign
	MSG_TO_SIGN = "This message attests that I control the given wallet"
)

// EIP712Domain represents the EIP-712 domain
type EIP712Domain struct {
	Name              string `json:"name"`
	Version           string `json:"version"`
	ChainID           int64  `json:"chainId"`
	Salt              string `json:"salt,omitempty"`
	VerifyingContract string `json:"verifyingContract,omitempty"`
}

// EIP712Type represents EIP-712 type definition
type EIP712Type struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

// ClobAuthData represents CLOB authentication data
type ClobAuthData struct {
	Address   string `json:"address"`
	Timestamp string `json:"timestamp"`
	Nonce     uint64 `json:"nonce"`
	Message   string `json:"message"`
}

// BuildClobEip712Signature builds the canonical Polymarket CLOB EIP712 signature
func BuildClobEip712Signature(privateKey *ecdsa.PrivateKey, chainID int64, timestamp int64, nonce uint64) (string, error) {
	// Get address from private key
	address := crypto.PubkeyToAddress(privateKey.PublicKey).Hex()

	// Create domain
	domain := EIP712Domain{
		Name:    "ClobAuthDomain",
		Version: "1",
		ChainID: chainID,
	}

	// Create types
	types := map[string][]EIP712Type{
		"ClobAuth": {
			{Name: "address", Type: "address"},
			{Name: "timestamp", Type: "string"},
			{Name: "nonce", Type: "uint256"},
			{Name: "message", Type: "string"},
		},
	}

	// Create message data
	message := ClobAuthData{
		Address:   address,
		Timestamp: fmt.Sprintf("%d", timestamp),
		Nonce:     nonce,
		Message:   MSG_TO_SIGN,
	}

	// Generate the sign hash according to EIP-712
	domainSeparator, err := getDomainSeparator(domain)
	if err != nil {
		return "", fmt.Errorf("failed to get domain separator: %w", err)
	}

	typeHash, err := getTypeHash(types["ClobAuth"])
	if err != nil {
		return "", fmt.Errorf("failed to get type hash: %w", err)
	}

	encodeData, err := encodeClobAuthData(message)
	if err != nil {
		return "", fmt.Errorf("failed to encode data: %w", err)
	}

	// Hash the struct: keccak256(typeHash || encodeData)
	structHash := crypto.Keccak256Hash(append(typeHash.Bytes(), encodeData...))

	// Construct the final hash: keccak256("\x19\x01" || domainSeparator || structHash)
	hash := crypto.Keccak256Hash(
		append(append([]byte("\x19\x01"), domainSeparator.Bytes()...), structHash.Bytes()...),
	)

	// Sign the hash
	signature, err := crypto.Sign(hash.Bytes(), privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign hash: %w", err)
	}

	// Adjust v value from 0/1 to 27/28 (Ethereum standard)
	if signature[64] < 27 {
		signature[64] += 27
	}

	// Convert signature to hex string
	signatureHex := hexutil.Encode(signature)

	return signatureHex, nil
}

// getDomainSeparator creates the domain separator hash according to EIP-712
func getDomainSeparator(domain EIP712Domain) (common.Hash, error) {
	// EIP712Domain(string name,string version,uint256 chainId)
	typeHash := crypto.Keccak256Hash([]byte("EIP712Domain(string name,string version,uint256 chainId)"))

	// Hash the domain fields
	nameHash := crypto.Keccak256Hash([]byte(domain.Name))
	versionHash := crypto.Keccak256Hash([]byte(domain.Version))

	// Encode chainId as uint256 (32 bytes)
	chainId := new(big.Int).SetInt64(domain.ChainID)
	chainIdBytes := make([]byte, 32)
	chainId.FillBytes(chainIdBytes)

	// Concatenate: typeHash || nameHash || versionHash || chainId
	data := append(typeHash.Bytes(), nameHash.Bytes()...)
	data = append(data, versionHash.Bytes()...)
	data = append(data, chainIdBytes...)

	return crypto.Keccak256Hash(data), nil
}

// getTypeHash creates the type hash for ClobAuth
func getTypeHash(types []EIP712Type) (common.Hash, error) {
	// Build the type string: "ClobAuth(address address,string timestamp,uint256 nonce,string message)"
	typeString := "ClobAuth(address address,string timestamp,uint256 nonce,string message)"
	return crypto.Keccak256Hash([]byte(typeString)), nil
}

// encodeClobAuthData encodes the ClobAuth data according to EIP-712
func encodeClobAuthData(data ClobAuthData) ([]byte, error) {
	address := common.HexToAddress(data.Address)
	nonce := new(big.Int).SetUint64(data.Nonce)

	// Encode address (padded to 32 bytes, left-padded)
	addressBytes := make([]byte, 32)
	copy(addressBytes[12:], address.Bytes()) // address is 20 bytes, so left-pad with 12 zeros

	// Encode timestamp as keccak256 hash of the string
	timestampHash := crypto.Keccak256Hash([]byte(data.Timestamp))

	// Encode nonce as uint256 (32 bytes, big-endian)
	nonceBytes := make([]byte, 32)
	nonce.FillBytes(nonceBytes)

	// Encode message as keccak256 hash of the string
	messageHash := crypto.Keccak256Hash([]byte(data.Message))

	// Concatenate all encoded data
	encodedData := append(addressBytes, timestampHash.Bytes()...)
	encodedData = append(encodedData, nonceBytes...)
	encodedData = append(encodedData, messageHash.Bytes()...)

	return encodedData, nil
}


// RecoverAddress recovers the address from a signature.
// The signature must be 65 bytes with v as the last byte (either 0/1 or 27/28).
func RecoverAddress(hash common.Hash, signature string) (common.Address, error) {
	sig, err := hexutil.Decode(signature)
	if err != nil {
		return common.Address{}, fmt.Errorf("failed to decode signature: %w", err)
	}

	if len(sig) != 65 {
		return common.Address{}, fmt.Errorf("signature must be 65 bytes long")
	}

	// crypto.SigToPub expects v = 0 or 1 (the recovery ID).
	// Ethereum convention uses v = 27 or 28, so normalize.
	if sig[64] >= 27 {
		sig[64] -= 27
	}

	pubkey, err := crypto.SigToPub(hash.Bytes(), sig)
	if err != nil {
		return common.Address{}, fmt.Errorf("failed to recover public key: %w", err)
	}

	recoveredAddress := crypto.PubkeyToAddress(*pubkey)
	return recoveredAddress, nil
}
