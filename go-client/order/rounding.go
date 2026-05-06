// Limit / market order amount computation, aligned with the V2 reference:
//
//   - clob-client-v2 getOrderRawAmounts.ts (BUY: roundDown size, then
//     roundUp(amount+4)→roundDown(amount); SELL symmetric)
//   - clob-client-v2 getMarketOrderRawAmounts.ts (market BUY: roundDown
//     amount as USDC budget; SELL: roundDown amount as shares)
//   - rs-clob-client OrderBuilder<Limit>::build / Market::build
//     (`(size * price).trunc_with_scale(decimals + LOT_SIZE_SCALE)`)
//
// Polymarket convention:
//   - LOT_SIZE_SCALE = 2 (share precision is always 2 decimals)
//   - tick_decimals = decimal places in the market's minimum tick
//     (tick=0.01 → 2, tick=0.001 → 3)
//   - amount cap = tick_decimals + LOT_SIZE_SCALE
//
// Why we don't replicate the TS roundUp(amount+4)→roundDown(amount) dance:
// it exists to cancel JS float64 noise (e.g. 100/0.34 produces a number
// with binary trailing digits beyond the intended cap). We use big.Rat
// exact arithmetic, so the product / quotient already has finite decimal
// places equal to the inputs', and a single truncation to the cap matches
// what TS produces after its noise-removal round trip. The rs SDK uses
// the same single-trunc strategy via Decimal::trunc_with_scale.
//
// Market-buy maker-decimal cap (CLOB-side validation): for limit BUY at
// a price that produces a 3+-decimal notional (e.g. 2 shares × 0.871 =
// 1.742), CLOB's stricter "market buy" path will reject the order.
// Callers should either pick a price that keeps notional ≤ 2 decimals or
// use BuildSignedMarketOrder (which takes a USDC budget, not share count).
package order

import (
	"fmt"
	"math/big"
	"strconv"
)

// tickDecimalsFor returns the number of decimal places in the given tick
// size string. "" defaults to "0.01" (the most common Polymarket tick).
func tickDecimalsFor(tickSize string) (int, error) {
	switch tickSize {
	case "", "0.01":
		return 2, nil
	case "0.1":
		return 1, nil
	case "0.001":
		return 3, nil
	case "0.0001":
		return 4, nil
	}
	return 0, fmt.Errorf("unsupported tickSize %q (want 0.1, 0.01, 0.001, or 0.0001)", tickSize)
}

// computeAmounts returns (makerAmount, takerAmount) as 6-decimal-encoded
// uint strings. Matches rs-clob-client limit-order semantics exactly:
// notional = (size*price).trunc_with_scale(tickDecimals + LOT_SIZE_SCALE).
func computeAmounts(side string, size, price float64, tickDecimals int) (string, string) {
	const lotSizeScale = 2 // shares always quoted to 2 decimals on Polymarket
	notionalScale := tickDecimals + lotSizeScale

	pRat := floatToRat(price)
	sizeRat := floatToRat(size)
	notional := truncToScale(new(big.Rat).Mul(sizeRat, pRat), notionalScale)

	if side == "SELL" {
		return ratToDecimal6(sizeRat), ratToDecimal6(notional)
	}
	// BUY (default): maker = notional (USDC), taker = size (shares)
	return ratToDecimal6(notional), ratToDecimal6(sizeRat)
}

// computeMarketAmounts mirrors rs-clob-client's market builder
// (vendors/rs-clob-client/src/clob/order_builder.rs::OrderBuilder<Market>::build).
//
// Inputs:
//   - side: "BUY" → amount is USDC budget; "SELL" → amount is shares.
//   - amount: USDC for BUY, shares for SELL (matching TS UserMarketOrderV2.amount
//     and py MarketOrderArgs.amount).
//   - price: limit cap; truncated to tickDecimals upstream.
//
// Wire shape (matches CLOB's "market buy/sell" amount validation):
//   - BUY:  maker = USDC trunc(2 dec); taker = USDC/price trunc(amount cap dec)
//   - SELL: maker = shares trunc(2 dec); taker = shares*price trunc(amount cap dec)
func computeMarketAmounts(side string, amount, price float64, tickDecimals int) (string, string) {
	const lotSizeScale = 2
	notionalScale := tickDecimals + lotSizeScale

	pRat := floatToRat(price)
	amountRat := truncToScale(floatToRat(amount), lotSizeScale)

	if side == "SELL" {
		// amount = shares → maker; taker = shares * price
		taker := truncToScale(new(big.Rat).Mul(amountRat, pRat), notionalScale)
		return ratToDecimal6(amountRat), ratToDecimal6(taker)
	}
	// BUY: amount = USDC budget → maker; taker = USDC / price
	taker := truncToScale(new(big.Rat).Quo(amountRat, pRat), notionalScale)
	return ratToDecimal6(amountRat), ratToDecimal6(taker)
}

// truncToScale truncates r toward zero at n decimal places. Equivalent to
// Rust's Decimal::trunc_with_scale.
func truncToScale(r *big.Rat, n int) *big.Rat {
	scale := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(n)), nil)
	scaled := new(big.Rat).Mul(r, new(big.Rat).SetInt(scale))
	q := new(big.Int).Quo(scaled.Num(), scaled.Denom()) // truncates toward zero
	out := new(big.Rat).SetInt(q)
	out.Quo(out, new(big.Rat).SetInt(scale))
	return out
}

func floatToRat(v float64) *big.Rat {
	r, ok := new(big.Rat).SetString(strconv.FormatFloat(v, 'f', -1, 64))
	if !ok {
		return new(big.Rat).SetFloat64(v)
	}
	return r
}

// ratToDecimal6 multiplies by 10^6 and rounds half-up to integer string.
func ratToDecimal6(r *big.Rat) string {
	r = new(big.Rat).Mul(r, new(big.Rat).SetInt64(decimalsMul))
	return roundRatToInt(r).String()
}
