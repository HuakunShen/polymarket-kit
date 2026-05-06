package auth

import (
	"strings"
	"testing"
)

// TestHmacSignatureURLSafeSecret asserts the HMAC signature matches the
// Python / TS reference for a secret that contains URL-safe base64 chars
// (`-_`). The Go client previously used base64.StdEncoding which fails on
// these chars and silently fell back to the literal-string secret as the
// HMAC key, producing HTTP 401 "Unauthorized/Invalid api key" against
// CLOB.
//
// Reference (regenerate with):
//   python3 -c "
//   from py_clob_client.signing.hmac import build_hmac_signature
//   print(build_hmac_signature('-_8E5kpO4xV3qHcG9j2lYwBvKtQzNa1RfMdSiTbXyAo=',
//     1700000000, 'POST', '/order', '{\"foo\":\"bar\"}'))
//   "
func TestHmacSignatureURLSafeSecret(t *testing.T) {
	secret := "-_8E5kpO4xV3qHcG9j2lYwBvKtQzNa1RfMdSiTbXyAo="
	body := `{"foo":"bar"}`
	got := BuildPolyHmacSignature(secret, 1700000000, "POST", "/order", &body)

	// expected captured from py-clob-client.signing.hmac.build_hmac_signature
	const want = "uRqO1_k30yPrx0_IE5OQxlj7xlPuGwYNv5n_9qeG9G4="

	if got != want {
		t.Fatalf("HMAC mismatch on URL-safe secret\n  got  %s\n  want %s", got, want)
	}
	if !strings.HasSuffix(got, "=") {
		t.Fatalf("expected trailing '=' padding preserved, got %q", got)
	}
}
