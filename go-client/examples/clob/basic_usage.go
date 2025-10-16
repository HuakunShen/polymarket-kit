package main

import (
	"fmt"
	"log"

	"github.com/HuakunShen/polymarket-kit/go-client/auth"
	"github.com/HuakunShen/polymarket-kit/go-client/client"
	"github.com/HuakunShen/polymarket-kit/go-client/types"
)

func main() {
	// Example private key (replace with your actual private key)
	privateKey := "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

	// Example API credentials (you can create these using the client)
	var apiCreds *types.ApiKeyCreds

	// Create client configuration
	config := &client.ClientConfig{
		Host:          "https://clob.polymarket.com",
		ChainID:       types.ChainPolygon, // 137 for Polygon
		PrivateKey:    privateKey,
		APIKey:        apiCreds,
		UseServerTime: true,
		Timeout:       30 * 0, // 30 seconds timeout
	}

	// Create CLOB client
	clobClient, err := client.NewClobClient(config)
	if err != nil {
		log.Fatalf("Failed to create CLOB client: %v", err)
	}

	fmt.Println("✅ CLOB client created successfully")

	// Test public endpoints
	fmt.Println("\n🔍 Testing public endpoints...")

	// Test server time
	serverTime, err := clobClient.GetServerTime()
	if err != nil {
		log.Printf("Failed to get server time: %v", err)
	} else {
		fmt.Printf("Server time: %d\n", serverTime)
	}

	// Test get OK
	ok, err := clobClient.GetOK()
	if err != nil {
		log.Printf("Failed to get OK status: %v", err)
	} else {
		fmt.Printf("API OK status: %v\n", ok)
	}

	// Get markets
	markets, err := clobClient.GetMarkets("0")
	if err != nil {
		log.Printf("Failed to get markets: %v", err)
	} else {
		fmt.Printf("Markets count: %d\n", markets.Count)
	}

	// Get tick size for a token (example token ID)
	tokenID := "0x1234567890abcdef1234567890abcdef12345678"
	tickSize, err := clobClient.GetTickSize(tokenID)
	if err != nil {
		log.Printf("Failed to get tick size: %v", err)
	} else {
		fmt.Printf("Tick size for token %s: %s\n", tokenID, tickSize)
	}

	// Example: Create API key (if you don't have one)
	fmt.Println("\n🔐 Creating API key...")
	apiKey, err := clobClient.CreateApiKey(nil)
	if err != nil {
		log.Printf("Failed to create API key: %v", err)
		fmt.Println("Note: This might fail if you already have an API key")
	} else {
		fmt.Printf("API Key created successfully:\n")
		fmt.Printf("  Key: %s\n", apiKey.Key)
		fmt.Printf("  (Secret and passphrase are sensitive)\n")

		// Update client configuration with new API key
		apiCreds = apiKey
		config.APIKey = apiCreds

		// Recreate client with API key
		clobClient, err = client.NewClobClient(config)
		if err != nil {
			log.Fatalf("Failed to recreate client with API key: %v", err)
		}
	}

	// If we have API credentials, test authenticated endpoints
	if apiCreds != nil {
		fmt.Println("\n🔐 Testing authenticated endpoints...")

		// Get API keys
		apiKeys, err := clobClient.GetApiKeys()
		if err != nil {
			log.Printf("Failed to get API keys: %v", err)
		} else {
			fmt.Printf("Found %d API keys\n", len(apiKeys.APIKeys))
		}

		// Get closed only mode
		banStatus, err := clobClient.GetClosedOnlyMode()
		if err != nil {
			log.Printf("Failed to get closed only mode: %v", err)
		} else {
			fmt.Printf("Closed only mode: %v\n", banStatus.ClosedOnly)
		}

		// Get trades
		trades, err := clobClient.GetTrades(nil, true, "0")
		if err != nil {
			log.Printf("Failed to get trades: %v", err)
		} else {
			fmt.Printf("Found %d trades\n", len(trades))
		}
	}

	// Example wallet operations
	fmt.Println("\n💳 Testing wallet operations...")

	// Create wallet from private key
	wallet, err := auth.NewWalletFromHex(privateKey)
	if err != nil {
		log.Fatalf("Failed to create wallet: %v", err)
	}

	fmt.Printf("Wallet address: %s\n", wallet.GetAddressHex())

	// Sign a message
	message := []byte("Hello, Polymarket!")
	signature, err := wallet.SignMessage(message)
	if err != nil {
		log.Printf("Failed to sign message: %v", err)
	} else {
		fmt.Printf("Message signature: %s\n", signature)

		// Verify signature
		valid, err := auth.VerifyMessageSignature(message, signature, wallet.GetAddress())
		if err != nil {
			log.Printf("Failed to verify signature: %v", err)
		} else {
			fmt.Printf("Signature verification: %v\n", valid)
		}
	}

	// Test EIP712 signature
	fmt.Println("\n✍️ Testing EIP712 signature...")
	timestamp := int64(1640995200) // Example timestamp
	nonce := uint64(0)

	eip712Sig, err := auth.BuildClobEip712Signature(wallet.GetPrivateKey(), int64(types.ChainPolygon), timestamp, nonce)
	if err != nil {
		log.Printf("Failed to build EIP712 signature: %v", err)
	} else {
		fmt.Printf("EIP712 signature: %s\n", eip712Sig)

		// Verify EIP712 signature
		valid, err := auth.VerifyEIP712Signature(wallet.GetAddressHex(), eip712Sig, timestamp, nonce, types.ChainPolygon)
		if err != nil {
			log.Printf("Failed to verify EIP712 signature: %v", err)
		} else {
			fmt.Printf("EIP712 signature verification: %v\n", valid)
		}
	}

	// Test HMAC signature
	fmt.Println("\n🔐 Testing HMAC signature...")
	if apiCreds != nil {
		method := "GET"
		requestPath := "/get/trades"

		hmacSig := auth.BuildPolyHmacSignature(apiCreds.Secret, timestamp, method, requestPath, nil)
		fmt.Printf("HMAC signature: %s\n", hmacSig)

		// Verify HMAC signature
		valid := auth.VerifyHmacSignature(apiCreds.Secret, timestamp, method, requestPath, nil, hmacSig)
		fmt.Printf("HMAC signature verification: %v\n", valid)
	}

	fmt.Println("\n✅ Example completed successfully!")
}