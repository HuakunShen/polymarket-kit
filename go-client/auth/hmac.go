package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"strings"
)

// BuildPolyHmacSignature builds the canonical Polymarket CLOB HMAC signature
func BuildPolyHmacSignature(secret string, timestamp int64, method string, requestPath string, body *string) string {
	// Build the message: timestamp + method + requestPath [+ body]
	message := fmt.Sprintf("%d%s%s", timestamp, method, requestPath)
	if body != nil {
		message += *body
	}

	// Decode the base64 secret
	base64Secret, err := base64.StdEncoding.DecodeString(secret)
	if err != nil {
		// If decoding fails, use the secret as-is
		base64Secret = []byte(secret)
	}

	// Create HMAC-SHA256
	h := hmac.New(sha256.New, base64Secret)
	h.Write([]byte(message))
	signature := h.Sum(nil)

	// Encode to base64
	sig := base64.StdEncoding.EncodeToString(signature)

	// Convert to URL-safe base64 (keep "=" suffix)
	sigUrlSafe := strings.ReplaceAll(strings.ReplaceAll(sig, "+", "-"), "/", "_")

	return sigUrlSafe
}

// VerifyHmacSignature verifies an HMAC signature
func VerifyHmacSignature(secret string, timestamp int64, method string, requestPath string, body *string, signature string) bool {
	expectedSig := BuildPolyHmacSignature(secret, timestamp, method, requestPath, body)
	return hmac.Equal([]byte(expectedSig), []byte(signature))
}

// BuildMessage builds the message for HMAC signing
func BuildMessage(timestamp int64, method string, requestPath string, body *string) string {
	message := fmt.Sprintf("%d%s%s", timestamp, method, requestPath)
	if body != nil {
		message += *body
	}
	return message
}