package client

import (
	"crypto/ecdsa"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/HuakunShen/polymarket-kit/go-client/order"
	"github.com/HuakunShen/polymarket-kit/go-client/types"
	"github.com/ethereum/go-ethereum/crypto"
)

// TestPostSignedOrderUsesAPIKeyAsOwner asserts that PostSignedOrder sets the
// `owner` field of the order body to the API key UUID (creds.Key), matching
// the official TS / Python SDKs. Previously this was set to so.Maker.Hex()
// (wallet address), which Polymarket rejected/ambiguated.
func TestPostSignedOrderUsesAPIKeyAsOwner(t *testing.T) {
	const wantOwner = "00000000-0000-4000-8000-000000000000"

	var capturedBody []byte
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != PostOrder {
			http.Error(w, "unexpected path", http.StatusNotFound)
			return
		}
		b, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		capturedBody = b
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"success":true,"orderID":"0xdead","status":"LIVE"}`))
	}))
	defer srv.Close()

	pk, err := crypto.GenerateKey()
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	pkHex := hexEncode(pk)

	c, err := NewClobClient(&ClientConfig{
		Host:       srv.URL,
		ChainID:    types.ChainPolygon,
		PrivateKey: pkHex,
		APIKey: &types.ApiKeyCreds{
			Key:        wantOwner,
			Secret:     "c2VjcmV0",
			Passphrase: "passphrase",
		},
	})
	if err != nil {
		t.Fatalf("NewClobClient: %v", err)
	}

	_, err = c.CreateAndPostOrder(order.LimitOrderOpts{
		TokenID: "1",
		Price:   0.5,
		Size:    5,
		Side:    "BUY",
		ChainID: 137,
	}, types.OrderType("GTC"))
	if err != nil {
		t.Fatalf("CreateAndPostOrder: %v", err)
	}

	var body struct {
		Owner     string `json:"owner"`
		PostOnly  any    `json:"postOnly"`
		DeferExec any    `json:"deferExec"`
		Order     struct {
			MakerAmount any            `json:"makerAmount"`
			TakerAmount any            `json:"takerAmount"`
			Salt        any            `json:"salt"`
			Timestamp   any            `json:"timestamp"`
			Expiration  any            `json:"expiration"`
			SigType     any            `json:"signatureType"`
			Metadata    string         `json:"metadata"`
			Builder     string         `json:"builder"`
			Extra       map[string]any `json:"-"`
		} `json:"order"`
	}
	// also unmarshal the order into a generic map to detect *removed* V1 fields.
	var rawWrap struct {
		Order map[string]any `json:"order"`
	}
	if err := json.Unmarshal(capturedBody, &body); err != nil {
		t.Fatalf("unmarshal body: %v\nraw: %s", err, capturedBody)
	}
	if err := json.Unmarshal(capturedBody, &rawWrap); err != nil {
		t.Fatalf("unmarshal raw: %v\nraw: %s", err, capturedBody)
	}
	if body.Owner != wantOwner {
		t.Fatalf("Owner = %q, want %q (API key UUID, not wallet address)", body.Owner, wantOwner)
	}
	// V2 envelope must carry both deferExec and postOnly booleans.
	if _, ok := body.PostOnly.(bool); !ok {
		t.Fatalf("postOnly must be bool, got %T (%v)", body.PostOnly, body.PostOnly)
	}
	if _, ok := body.DeferExec.(bool); !ok {
		t.Fatalf("deferExec must be bool, got %T (%v)", body.DeferExec, body.DeferExec)
	}
	// Polymarket CLOB rejects orders whose uint256 fields are encoded as
	// JSON numbers (`Invalid order payload`). Both rs-clob-client
	// (DisplayFromStr) and py-clob-client (str(...)) send strings; assert
	// our Go client matches that contract.
	if _, ok := body.Order.MakerAmount.(string); !ok {
		t.Fatalf("makerAmount must be string, got %T (%v)", body.Order.MakerAmount, body.Order.MakerAmount)
	}
	if _, ok := body.Order.TakerAmount.(string); !ok {
		t.Fatalf("takerAmount must be string, got %T (%v)", body.Order.TakerAmount, body.Order.TakerAmount)
	}
	// salt is the one numeric exception: rs-SDK explicitly serializes as
	// JSON number (u64), and string forms are rejected as Invalid order
	// payload by CLOB. Asserting json.Number / float64 here catches a
	// regression where someone "uniformly" types the field as string.
	if _, ok := body.Order.Salt.(float64); !ok {
		t.Fatalf("salt must be JSON number, got %T (%v)", body.Order.Salt, body.Order.Salt)
	}
	// timestamp is V2-only, sent as a string of unix milliseconds (matches
	// TS Date.now().toString()).
	if _, ok := body.Order.Timestamp.(string); !ok {
		t.Fatalf("timestamp must be string, got %T (%v)", body.Order.Timestamp, body.Order.Timestamp)
	}
	if _, ok := body.Order.Expiration.(string); !ok {
		t.Fatalf("expiration must be string, got %T (%v)", body.Order.Expiration, body.Order.Expiration)
	}
	// signatureType is a JSON number (matches the on-chain enum index).
	if _, ok := body.Order.SigType.(float64); !ok {
		t.Fatalf("signatureType must be JSON number, got %T (%v)", body.Order.SigType, body.Order.SigType)
	}
	// metadata + builder are bytes32 hex strings; default = 32 zero bytes
	// (66 chars including 0x prefix).
	if len(body.Order.Metadata) != 66 || body.Order.Metadata[:2] != "0x" {
		t.Fatalf("metadata must be 0x-prefixed bytes32 hex, got %q", body.Order.Metadata)
	}
	if len(body.Order.Builder) != 66 || body.Order.Builder[:2] != "0x" {
		t.Fatalf("builder must be 0x-prefixed bytes32 hex, got %q", body.Order.Builder)
	}
	// V1 fields must NOT appear (CLOB returns order_version_mismatch otherwise).
	for _, banned := range []string{"taker", "nonce", "feeRateBps"} {
		if _, present := rawWrap.Order[banned]; present {
			t.Fatalf("V1-only field %q must not be in V2 wire body; got=%v", banned, rawWrap.Order[banned])
		}
	}
}

func hexEncode(pk *ecdsa.PrivateKey) string {
	b := crypto.FromECDSA(pk)
	const hexdigits = "0123456789abcdef"
	out := make([]byte, len(b)*2)
	for i, v := range b {
		out[i*2] = hexdigits[v>>4]
		out[i*2+1] = hexdigits[v&0x0f]
	}
	return string(out)
}
