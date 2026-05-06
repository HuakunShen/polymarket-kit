package order

import (
	"math/big"
	"strings"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// Golden vector reproduced via eth_account (Python). Generator script:
// /tmp/gen_v2_golden.py — kept out-of-tree because the inputs are static.
//
// EOA:                0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (anvil key #0)
// verifyingContract:  0xE111180000d2663C0091e4f400237545B87B996B (V2 CTF Exchange)
// salt:               1000000000
// timestamp:          1700000000000  (ms)
// domainSeparator:    0x3264e159346253e26a64e00b69032db0e7d32f94628de3e6eecb50304d7af3d2
// structHash:         0x4def79d69d9821dd78f5cb9fc391c882f1e9deebee21f19acc3ea587adfef82e
// orderHash (digest): 0xe75c1f9585917ca309e0825ef517be6a45b4df747eb8a8353a32de2c27e9e609
// signature:          0xe0437bf6f2fb7a740e244647d8cdbd9b36d456b80e51fff61238ae6290f510d6
//                       2a036338d0a4860aa6f78c0a7f4154e6a90ac1423bb877ae07b5bc5bad2e2f101b
const (
	anvilKey0PrivHex      = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
	anvilKey0Address      = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
	expectedDomainSep     = "0x3264e159346253e26a64e00b69032db0e7d32f94628de3e6eecb50304d7af3d2"
	expectedOrderHashV2   = "0xe75c1f9585917ca309e0825ef517be6a45b4df747eb8a8353a32de2c27e9e609"
	expectedSignatureV2Hx = "0xe0437bf6f2fb7a740e244647d8cdbd9b36d456b80e51fff61238ae6290f510d62a036338d0a4860aa6f78c0a7f4154e6a90ac1423bb877ae07b5bc5bad2e2f101b"
)

func goldenInputs(t *testing.T) *v2OrderInputs {
	t.Helper()
	addr := common.HexToAddress(anvilKey0Address)
	tokenID := big.NewInt(1234567890)
	makerAmt := big.NewInt(500000)
	takerAmt := big.NewInt(1000000)
	return &v2OrderInputs{
		ChainID:       137,
		NegRisk:       false,
		Salt:          big.NewInt(1000000000),
		Maker:         addr,
		Signer:        addr,
		TokenID:       tokenID,
		MakerAmount:   makerAmt,
		TakerAmount:   takerAmt,
		Side:          0, // BUY
		SignatureType: 0, // EOA
		Timestamp:     big.NewInt(1700000000000),
		Metadata:      [32]byte{},
		Builder:       [32]byte{},
	}
}

// TestV2HashMatchesEthAccount asserts our V2 EIP-712 implementation produces
// the exact same digest as eth_account (a battle-tested Python reference) for
// a fully-determined input. If this drifts, the on-chain CTFExchangeV2
// contract will reject our signatures with `order_version_mismatch` (or
// silently fail signature recovery).
func TestV2HashMatchesEthAccount(t *testing.T) {
	in := goldenInputs(t)
	domainSep, orderHash, err := hashV2Order(in)
	if err != nil {
		t.Fatalf("hashV2Order: %v", err)
	}
	if !strings.EqualFold(domainSep.Hex(), expectedDomainSep) {
		t.Fatalf("domainSeparator:\n  got  %s\n  want %s", domainSep.Hex(), expectedDomainSep)
	}
	if !strings.EqualFold(orderHash.Hex(), expectedOrderHashV2) {
		t.Fatalf("orderHash:\n  got  %s\n  want %s", orderHash.Hex(), expectedOrderHashV2)
	}
}

// TestV2SignatureMatchesEthAccount asserts the 65-byte ECDSA signature is
// byte-identical to eth_account's output for the same digest + private key.
func TestV2SignatureMatchesEthAccount(t *testing.T) {
	in := goldenInputs(t)
	priv, err := crypto.HexToECDSA(anvilKey0PrivHex)
	if err != nil {
		t.Fatalf("HexToECDSA: %v", err)
	}
	orderHash, sig, err := signV2Order(priv, in)
	if err != nil {
		t.Fatalf("signV2Order: %v", err)
	}
	if !strings.EqualFold(orderHash.Hex(), expectedOrderHashV2) {
		t.Fatalf("orderHash:\n  got  %s\n  want %s", orderHash.Hex(), expectedOrderHashV2)
	}
	gotSig := "0x" + bytesHexLower(sig)
	if !strings.EqualFold(gotSig, expectedSignatureV2Hx) {
		t.Fatalf("signature:\n  got  %s\n  want %s", gotSig, expectedSignatureV2Hx)
	}
}

func bytesHexLower(b []byte) string {
	const hexdigits = "0123456789abcdef"
	out := make([]byte, len(b)*2)
	for i, v := range b {
		out[i*2] = hexdigits[v>>4]
		out[i*2+1] = hexdigits[v&0x0f]
	}
	return string(out)
}
