package auth

import (
	"crypto/ecdsa"
	"fmt"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
)

// Wallet represents an Ethereum wallet
type Wallet struct {
	privateKey *ecdsa.PrivateKey
	address    common.Address
}

// NewWalletFromPrivateKey creates a new wallet from a private key
func NewWalletFromPrivateKey(privateKey *ecdsa.PrivateKey) *Wallet {
	address := crypto.PubkeyToAddress(privateKey.PublicKey)
	return &Wallet{
		privateKey: privateKey,
		address:    address,
	}
}

// NewWalletFromHex creates a new wallet from a hex-encoded private key
func NewWalletFromHex(privateKeyHex string) (*Wallet, error) {
	// Remove 0x prefix if present
	if len(privateKeyHex) >= 2 && privateKeyHex[:2] == "0x" {
		privateKeyHex = privateKeyHex[2:]
	}

	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	return NewWalletFromPrivateKey(privateKey), nil
}

// GetAddress returns the wallet address
func (w *Wallet) GetAddress() common.Address {
	return w.address
}

// GetAddressHex returns the wallet address as a hex string
func (w *Wallet) GetAddressHex() string {
	return w.address.Hex()
}

// GetPrivateKey returns the private key
func (w *Wallet) GetPrivateKey() *ecdsa.PrivateKey {
	return w.privateKey
}

// SignMessage signs a message using the wallet's private key
func (w *Wallet) SignMessage(message []byte) (string, error) {
	hash := crypto.Keccak256Hash(message)
	signature, err := crypto.Sign(hash.Bytes(), w.privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign message: %w", err)
	}

	// Convert to hex string
	signatureHex := hexutil.Encode(signature)
	return signatureHex, nil
}

// SignHash signs a hash using the wallet's private key
func (w *Wallet) SignHash(hash common.Hash) (string, error) {
	signature, err := crypto.Sign(hash.Bytes(), w.privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign hash: %w", err)
	}

	// Convert to hex string
	signatureHex := hexutil.Encode(signature)
	return signatureHex, nil
}

// RecoverAddressFromMessage recovers an address from a signature and message
func RecoverAddressFromMessage(message []byte, signature string) (common.Address, error) {
	sig, err := hexutil.Decode(signature)
	if err != nil {
		return common.Address{}, fmt.Errorf("failed to decode signature: %w", err)
	}

	if len(sig) != 65 {
		return common.Address{}, fmt.Errorf("signature must be 65 bytes long")
	}

	// Compute message hash
	hash := crypto.Keccak256Hash(message)

	// Adjust v value if needed (go-ethereum expects 27 or 28)
	if sig[64] != 27 && sig[64] != 28 {
		sig[64] += 27
	}

	pubkey, err := crypto.SigToPub(hash.Bytes(), sig)
	if err != nil {
		return common.Address{}, fmt.Errorf("failed to recover public key: %w", err)
	}

	recoveredAddress := crypto.PubkeyToAddress(*pubkey)
	return recoveredAddress, nil
}

// VerifyMessageSignature verifies that a signature is valid for a message and address
func VerifyMessageSignature(message []byte, signature string, expectedAddress common.Address) (bool, error) {
	recoveredAddress, err := RecoverAddressFromMessage(message, signature)
	if err != nil {
		return false, err
	}

	return recoveredAddress == expectedAddress, nil
}

// NewRandomWallet creates a new wallet with a random private key
func NewRandomWallet() (*Wallet, error) {
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate private key: %w", err)
	}

	return NewWalletFromPrivateKey(privateKey), nil
}

// PrivateKeyToHex converts a private key to hex string
func PrivateKeyToHex(privateKey *ecdsa.PrivateKey) string {
	return hexutil.Encode(crypto.FromECDSA(privateKey))
}

// HexToPrivateKey converts a hex string to private key
func HexToPrivateKey(privateKeyHex string) (*ecdsa.PrivateKey, error) {
	// Remove 0x prefix if present
	if len(privateKeyHex) >= 2 && privateKeyHex[:2] == "0x" {
		privateKeyHex = privateKeyHex[2:]
	}

	return crypto.HexToECDSA(privateKeyHex)
}

// ValidatePrivateKey validates if a private key hex is valid
func ValidatePrivateKey(privateKeyHex string) error {
	_, err := HexToPrivateKey(privateKeyHex)
	return err
}

// ValidateAddress validates if an address hex is valid
func ValidateAddress(addressHex string) error {
	if !common.IsHexAddress(addressHex) {
		return fmt.Errorf("invalid address format")
	}

	// This will also normalize the address
	common.HexToAddress(addressHex)
	return nil
}