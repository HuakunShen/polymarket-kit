// Package order provides high-level helpers for building signed Polymarket
// orders using the V2 EIP-712 typed data (see v2.go for the canonical
// reference). V1 (taker / nonce / feeRateBps) is no longer accepted by CLOB.
package order

import (
	"crypto/ecdsa"
	"encoding/hex"
	"fmt"
	"math/big"
	"strconv"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/polymarket/go-order-utils/pkg/utils"
)

// USDC and outcome tokens both use 6 decimals on Polymarket.
const decimalsMul = 1_000_000 // 10^6

// LimitOrderOpts contains the parameters for building a V2 limit order.
type LimitOrderOpts struct {
	TokenID string  // CLOB token ID for the outcome token
	Price   float64 // price per share [0.01, 0.99]
	Size    float64 // number of shares
	Side    string  // "BUY" or "SELL"
	NegRisk bool    // true for crypto up/down markets (uses NegRiskCTFExchange)
	ChainID int64   // 137 for Polygon mainnet (default)
	// Funder: leave empty for EOA flow (maker = signer = EOA). Set to the
	// Polymarket proxy / safe address for users who deposited via the UI.
	Funder string
	// SignatureType: 0=EOA (default), 1=POLY_PROXY, 2=POLY_GNOSIS_SAFE.
	// Must match how the funder address was provisioned.
	SignatureType uint8
	// Expiration is the unix-seconds deadline. **Only GTD orders may have
	// a non-zero expiration** — GTC/FOK/FAK must send 0, otherwise CLOB
	// rejects with `Invalid order payload`. Wire-only field; not in struct
	// hash for V2.
	Expiration int64
	// TickSize selects the amount precision. Valid values: "0.1", "0.01",
	// "0.001", "0.0001". Default "0.01". Mirrors rs-clob-client's limit
	// builder: notional = (size*price).trunc_with_scale(tickDec+2).
	//
	// NB: this builder produces *limit-order* amounts only. FOK/FAK BUY
	// orders trigger CLOB's stricter "market buy" maker-decimal cap, which
	// limit math doesn't satisfy when notional spills past 2 decimals
	// (e.g. 2 shares × 0.871 = 1.742). For market BUY, callers should
	// either pick a price that keeps notional ≤ 2 decimals, or use a
	// dedicated market-order builder (input = USDC budget, not shares).
	TickSize string

	// V2-specific optional fields. Defaults preserve TS behaviour:
	//   timestamp = time.Now().UnixMilli()
	//   metadata  = bytes32 zero
	//   builder   = bytes32 zero
	//   salt      = utils.GenerateRandomSalt()  (uint32 range)

	// Timestamp is unix milliseconds. Default = time.Now().UnixMilli().
	Timestamp int64
	// Metadata is a 32-byte hex string (with or without 0x prefix).
	Metadata string
	// Builder is a 32-byte hex string (with or without 0x prefix).
	Builder string
	// Salt overrides the random salt; tests rely on this for golden vectors.
	Salt int64
}

// MarketOrderOpts contains the parameters for building a V2 market order
// (FOK / FAK). Mirrors rs-clob-client's `OrderBuilder<Market>` and TS
// `UserMarketOrderV2` / py `MarketOrderArgs`:
//
//   - BUY: Amount is the USDC budget to spend. maker = USDC, taker = USDC/price.
//   - SELL: Amount is the share count to sell. maker = shares, taker = shares*price.
//
// This matches the polymarket.com web UI "market" buy where the user types
// dollars and gets fractional shares back.
type MarketOrderOpts struct {
	TokenID string  // CLOB token ID for the outcome token
	Side    string  // "BUY" | "SELL"
	Price   float64 // limit cap; for FOK/FAK this is the worst-case price (≥ best-ask for BUY, ≤ best-bid for SELL)
	Amount  float64 // BUY: USDC budget. SELL: shares to sell.
	NegRisk bool
	ChainID int64
	Funder  string
	// SignatureType: 0=EOA, 1=POLY_PROXY, 2=POLY_GNOSIS_SAFE.
	SignatureType uint8
	// TickSize selects amount precision. Default "0.01".
	TickSize string

	// V2-specific optional fields. Defaults preserve TS / py behaviour.
	Timestamp int64
	Metadata  string
	Builder   string
	Salt      int64
}

// SignedOrderResult wraps the signed V2 order with convenience fields.
type SignedOrderResult struct {
	// Inputs is the resolved set of values that went into the EIP-712 hash.
	// Exposed so callers can serialize the wire body without re-deriving
	// salt/timestamp/etc.
	Inputs *v2OrderInputs
	// Side mirrors Inputs.Side as the wire-string form ("BUY"/"SELL").
	Side string
	// Expiration is the wire-only expiration string (e.g. "0").
	Expiration string
	// Signature is the 65-byte ECDSA signature, hex-encoded with 0x prefix.
	Signature string
	// OrderHash is the EIP-712 hash of the order, hex-encoded with 0x prefix.
	// Polymarket uses this hash as the venue order ID. Computed during build
	// so callers can persist a pending row keyed on the venue ID before the
	// order is sent to the CLOB (write-ahead pattern).
	OrderHash string
}

// BuildSignedLimitOrder creates and signs a GTC limit order.
//
// For BUY orders:
//   - makerAmount = size * price (USDC you pay)
//   - takerAmount = size (outcome tokens you receive)
//
// For SELL orders:
//   - makerAmount = size (outcome tokens you sell)
//   - takerAmount = size * price (USDC you receive)
func BuildSignedLimitOrder(privateKey *ecdsa.PrivateKey, opts LimitOrderOpts) (*SignedOrderResult, error) {
	if opts.Price <= 0 || opts.Price >= 1 {
		return nil, fmt.Errorf("price must be in (0, 1), got %f", opts.Price)
	}
	if opts.Size <= 0 {
		return nil, fmt.Errorf("size must be positive, got %f", opts.Size)
	}

	chainID := opts.ChainID
	if chainID == 0 {
		chainID = 137
	}

	tickDec, err := tickDecimalsFor(opts.TickSize)
	if err != nil {
		return nil, err
	}

	sideEnum := uint8(0) // 0=BUY, 1=SELL — matches V2 typed data
	if opts.Side == "SELL" {
		sideEnum = 1
	}
	makerAmt, takerAmt := computeAmounts(opts.Side, opts.Size, opts.Price, tickDec)

	signerAddr := crypto.PubkeyToAddress(privateKey.PublicKey)
	makerAddr := signerAddr
	if opts.Funder != "" {
		makerAddr = common.HexToAddress(opts.Funder)
	}

	tokenID, ok := new(big.Int).SetString(opts.TokenID, 10)
	if !ok {
		return nil, fmt.Errorf("can't parse TokenID: %s", opts.TokenID)
	}
	makerAmtBig, ok := new(big.Int).SetString(makerAmt, 10)
	if !ok {
		return nil, fmt.Errorf("can't parse makerAmount: %s", makerAmt)
	}
	takerAmtBig, ok := new(big.Int).SetString(takerAmt, 10)
	if !ok {
		return nil, fmt.Errorf("can't parse takerAmount: %s", takerAmt)
	}

	salt := opts.Salt
	if salt == 0 {
		salt = utils.GenerateRandomSalt()
	}

	timestamp := opts.Timestamp
	if timestamp == 0 {
		timestamp = time.Now().UnixMilli()
	}

	metaHex := opts.Metadata
	if metaHex == "" {
		metaHex = Bytes32Zero
	}
	metaBytes, err := hexToBytes32(metaHex)
	if err != nil {
		return nil, fmt.Errorf("metadata: %w", err)
	}
	builderHex := opts.Builder
	if builderHex == "" {
		builderHex = Bytes32Zero
	}
	builderBytes, err := hexToBytes32(builderHex)
	if err != nil {
		return nil, fmt.Errorf("builder: %w", err)
	}

	in := &v2OrderInputs{
		ChainID:       chainID,
		NegRisk:       opts.NegRisk,
		Salt:          big.NewInt(salt),
		Maker:         makerAddr,
		Signer:        signerAddr,
		TokenID:       tokenID,
		MakerAmount:   makerAmtBig,
		TakerAmount:   takerAmtBig,
		Side:          sideEnum,
		SignatureType: opts.SignatureType,
		Timestamp:     big.NewInt(timestamp),
		Metadata:      metaBytes,
		Builder:       builderBytes,
	}

	orderHash, sig, err := signV2Order(privateKey, in)
	if err != nil {
		return nil, err
	}

	sideStr := "BUY"
	if sideEnum == 1 {
		sideStr = "SELL"
	}

	return &SignedOrderResult{
		Inputs:     in,
		Side:       sideStr,
		Expiration: strconv.FormatInt(opts.Expiration, 10),
		Signature:  "0x" + hex.EncodeToString(sig),
		OrderHash:  orderHash.Hex(),
	}, nil
}

// BuildSignedMarketOrder creates and signs a V2 market order (FOK / FAK).
//
// For BUY orders, opts.Amount is the **USDC budget** (e.g. 1.00 = spend up
// to $1) — matching polymarket.com's market-buy UX. For SELL orders,
// opts.Amount is the **share count** to sell.
//
// The price field acts as a worst-case cap (FAK) or exact-fill price (FOK).
// The web UI passes the best-ask (BUY) / best-bid (SELL) at submission
// time; callers can do the same or pick a tighter limit.
func BuildSignedMarketOrder(privateKey *ecdsa.PrivateKey, opts MarketOrderOpts) (*SignedOrderResult, error) {
	if opts.Price <= 0 || opts.Price >= 1 {
		return nil, fmt.Errorf("price must be in (0, 1), got %f", opts.Price)
	}
	if opts.Amount <= 0 {
		return nil, fmt.Errorf("amount must be positive, got %f", opts.Amount)
	}

	chainID := opts.ChainID
	if chainID == 0 {
		chainID = 137
	}
	tickDec, err := tickDecimalsFor(opts.TickSize)
	if err != nil {
		return nil, err
	}

	sideEnum := uint8(0)
	if opts.Side == "SELL" {
		sideEnum = 1
	}
	makerAmt, takerAmt := computeMarketAmounts(opts.Side, opts.Amount, opts.Price, tickDec)

	signerAddr := crypto.PubkeyToAddress(privateKey.PublicKey)
	makerAddr := signerAddr
	if opts.Funder != "" {
		makerAddr = common.HexToAddress(opts.Funder)
	}

	tokenID, ok := new(big.Int).SetString(opts.TokenID, 10)
	if !ok {
		return nil, fmt.Errorf("can't parse TokenID: %s", opts.TokenID)
	}
	makerAmtBig, ok := new(big.Int).SetString(makerAmt, 10)
	if !ok {
		return nil, fmt.Errorf("can't parse makerAmount: %s", makerAmt)
	}
	takerAmtBig, ok := new(big.Int).SetString(takerAmt, 10)
	if !ok {
		return nil, fmt.Errorf("can't parse takerAmount: %s", takerAmt)
	}

	salt := opts.Salt
	if salt == 0 {
		salt = utils.GenerateRandomSalt()
	}
	timestamp := opts.Timestamp
	if timestamp == 0 {
		timestamp = time.Now().UnixMilli()
	}
	metaHex := opts.Metadata
	if metaHex == "" {
		metaHex = Bytes32Zero
	}
	metaBytes, err := hexToBytes32(metaHex)
	if err != nil {
		return nil, fmt.Errorf("metadata: %w", err)
	}
	builderHex := opts.Builder
	if builderHex == "" {
		builderHex = Bytes32Zero
	}
	builderBytes, err := hexToBytes32(builderHex)
	if err != nil {
		return nil, fmt.Errorf("builder: %w", err)
	}

	in := &v2OrderInputs{
		ChainID:       chainID,
		NegRisk:       opts.NegRisk,
		Salt:          big.NewInt(salt),
		Maker:         makerAddr,
		Signer:        signerAddr,
		TokenID:       tokenID,
		MakerAmount:   makerAmtBig,
		TakerAmount:   takerAmtBig,
		Side:          sideEnum,
		SignatureType: opts.SignatureType,
		Timestamp:     big.NewInt(timestamp),
		Metadata:      metaBytes,
		Builder:       builderBytes,
	}

	orderHash, sig, err := signV2Order(privateKey, in)
	if err != nil {
		return nil, err
	}

	sideStr := "BUY"
	if sideEnum == 1 {
		sideStr = "SELL"
	}
	return &SignedOrderResult{
		Inputs:     in,
		Side:       sideStr,
		Expiration: "0", // FOK / FAK never carry expiration
		Signature:  "0x" + hex.EncodeToString(sig),
		OrderHash:  orderHash.Hex(),
	}, nil
}

// roundRatToInt rounds a big.Rat to the nearest integer (half-up).
func roundRatToInt(r *big.Rat) *big.Int {
	num := new(big.Int).Set(r.Num())
	den := r.Denom()
	result := new(big.Int).Div(num, den)
	rem := new(big.Int).Mod(num, den)
	// Round half-up
	doubled := new(big.Int).Mul(rem, big.NewInt(2))
	if doubled.Cmp(den) >= 0 {
		result.Add(result, big.NewInt(1))
	}
	return result
}
