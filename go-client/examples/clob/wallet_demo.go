package main

import (
	"fmt"
	"log"

	"github.com/HuakunShen/polymarket-kit/go-client/auth"
)

func main() {
	fmt.Println("🧪 Testing Go Polymarket CLOB Client - Wallet Operations")

	// Create a random wallet for testing
	fmt.Println("\n1. Creating random wallet...")
	wallet, err := auth.NewRandomWallet()
	if err != nil {
		log.Fatalf("Failed to create random wallet: %v", err)
	}

	fmt.Printf("✅ Wallet created successfully\n")
	fmt.Printf("   Address: %s\n", wallet.GetAddressHex())

	// Test private key operations
	fmt.Println("\n2. Testing private key operations...")
	privateKeyHex := auth.PrivateKeyToHex(wallet.GetPrivateKey())
	fmt.Printf("✅ Private key converted to hex: %s...%s\n", privateKeyHex[:10], privateKeyHex[len(privateKeyHex)-6:])

	// Test private key validation
	fmt.Println("\n3. Testing private key validation...")
	err = auth.ValidatePrivateKey(privateKeyHex)
	if err != nil {
		log.Fatalf("Private key validation failed: %v", err)
	}
	fmt.Printf("✅ Private key validation passed\n")

	// Test address validation
	fmt.Println("\n4. Testing address validation...")
	err = auth.ValidateAddress(wallet.GetAddressHex())
	if err != nil {
		log.Fatalf("Address validation failed: %v", err)
	}
	fmt.Printf("✅ Address validation passed\n")

	// Test wallet recreation from private key
	fmt.Println("\n5. Testing wallet recreation...")
	wallet2, err := auth.NewWalletFromHex(privateKeyHex)
	if err != nil {
		log.Fatalf("Failed to recreate wallet: %v", err)
	}

	if wallet2.GetAddressHex() != wallet.GetAddressHex() {
		log.Fatalf("Wallet addresses don't match!")
	}
	fmt.Printf("✅ Wallet recreation successful - addresses match\n")

	// Test message signing
	fmt.Println("\n6. Testing message signing...")
	message := []byte("Hello, Polymarket Go Client!")
	signature, err := wallet.SignMessage(message)
	if err != nil {
		log.Fatalf("Failed to sign message: %v", err)
	}
	fmt.Printf("✅ Message signed successfully\n")
	fmt.Printf("   Signature: %s...%s\n", signature[:20], signature[len(signature)-20:])

	// Test signature verification
	fmt.Println("\n7. Testing signature verification...")
	valid, err := auth.VerifyMessageSignature(message, signature, wallet.GetAddress())
	if err != nil {
		log.Fatalf("Failed to verify signature: %v", err)
	}

	if !valid {
		log.Fatalf("Signature verification failed - signature is invalid!")
	}
	fmt.Printf("✅ Signature verification passed\n")

	// Test EIP712 signature
	fmt.Println("\n8. Testing EIP712 signature...")
	timestamp := int64(1640995200) // Example timestamp
	nonce := uint64(0)
	chainID := int64(137) // Polygon

	eip712Sig, err := auth.BuildClobEip712Signature(wallet.GetPrivateKey(), chainID, timestamp, nonce)
	if err != nil {
		log.Fatalf("Failed to build EIP712 signature: %v", err)
	}
	fmt.Printf("✅ EIP712 signature built successfully\n")
	fmt.Printf("   Signature: %s...%s\n", eip712Sig[:20], eip712Sig[len(eip712Sig)-20:])

	// Test HMAC signature
	fmt.Println("\n9. Testing HMAC signature...")
	secret := "dGVzdF9zZWNyZXRfd2l0aF9iYXNlNjRfa2V5" // base64 encoded test secret
	method := "GET"
	requestPath := "/get/trades"
	body := string("{\"test\": \"data\"}")

	hmacSig := auth.BuildPolyHmacSignature(secret, timestamp, method, requestPath, &body)
	fmt.Printf("✅ HMAC signature built successfully\n")
	fmt.Printf("   Signature: %s...%s\n", hmacSig[:20], hmacSig[len(hmacSig)-20:])

	// Test HMAC verification
	fmt.Println("\n10. Testing HMAC verification...")
	valid = auth.VerifyHmacSignature(secret, timestamp, method, requestPath, &body, hmacSig)
	if !valid {
		log.Fatalf("HMAC signature verification failed!")
	}
	fmt.Printf("✅ HMAC signature verification passed\n")

	fmt.Println("\n🎉 All wallet tests passed successfully!")
	fmt.Println("\nThe Go Polymarket CLOB Client is ready to use!")
}