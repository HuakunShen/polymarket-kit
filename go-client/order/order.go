// Package order provides high-level helpers for building signed Polymarket orders.
//
// It wraps github.com/polymarket/go-order-utils to provide a simple API
// that converts price/size to the makerAmount/takerAmount format required
// by the CTF Exchange contract.
package order

import (
	"crypto/ecdsa"
	"fmt"
	"math"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/polymarket/go-order-utils/pkg/builder"
	"github.com/polymarket/go-order-utils/pkg/model"
)

const (
	// USDC has 6 decimals; outcome tokens also use 6 decimals on Polymarket.
	decimals    = 6
	decimalsMul = 1_000_000 // 10^6
)

// LimitOrderOpts contains the parameters for building a limit order.
type LimitOrderOpts struct {
	TokenID  string  // CLOB token ID for the outcome token
	Price    float64 // price per share [0.01, 0.99]
	Size     float64 // number of shares
	Side     string  // "BUY" or "SELL"
	NegRisk  bool    // true for crypto up/down markets (uses NegRiskCTFExchange)
	ChainID  int64   // 137 for Polygon mainnet (default)
	Nonce    string  // optional, default "0"
	Funder   string  // optional funder/maker address override
}

// SignedOrderResult wraps the signed order with convenience fields.
type SignedOrderResult struct {
	SignedOrder *model.SignedOrder
	OrderData  *model.OrderData
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
	nonce := opts.Nonce
	if nonce == "" {
		nonce = "0"
	}

	// 计算 makerAmount 和 takerAmount (6 decimal places)
	var makerAmt, takerAmt string
	side := model.BUY
	if opts.Side == "SELL" {
		side = model.SELL
	}

	if side == model.BUY {
		// BUY: pay makerAmount USDC, receive takerAmount tokens
		makerAmt = toDecimal6(opts.Size * opts.Price)
		takerAmt = toDecimal6(opts.Size)
	} else {
		// SELL: provide makerAmount tokens, receive takerAmount USDC
		makerAmt = toDecimal6(opts.Size)
		takerAmt = toDecimal6(opts.Size * opts.Price)
	}

	// 确定 maker 地址
	maker := crypto.PubkeyToAddress(privateKey.PublicKey).Hex()
	if opts.Funder != "" {
		maker = opts.Funder
	}

	orderData := &model.OrderData{
		Maker:       maker,
		Taker:       common.HexToAddress("0x0").Hex(),
		TokenId:     opts.TokenID,
		MakerAmount: makerAmt,
		TakerAmount: takerAmt,
		Side:        side,
		FeeRateBps:  "0",
		Nonce:       nonce,
		Expiration:  fmt.Sprintf("%d", time.Now().Add(365*24*time.Hour).Unix()),
	}

	contract := model.CTFExchange
	if opts.NegRisk {
		contract = model.NegRiskCTFExchange
	}

	orderBuilder := builder.NewExchangeOrderBuilderImpl(big.NewInt(chainID), nil)
	signed, err := orderBuilder.BuildSignedOrder(privateKey, orderData, contract)
	if err != nil {
		return nil, fmt.Errorf("build signed order: %w", err)
	}

	return &SignedOrderResult{
		SignedOrder: signed,
		OrderData:  orderData,
	}, nil
}

// toDecimal6 converts a float to a string integer with 6 decimal places.
// e.g., 0.50 → "500000", 10.0 → "10000000"
func toDecimal6(v float64) string {
	raw := v * float64(decimalsMul)
	rounded := math.Round(raw)
	return big.NewInt(int64(rounded)).String()
}
