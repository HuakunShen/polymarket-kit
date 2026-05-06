# 2026-05-07 — go-client V2 alignment

Migrated `go-client/` from the V1 CTF Exchange protocol to V2 and aligned the
type / wire / signing surface with the canonical `clob-client-v2` reference
(`vendors/clob-client-v2/` in this submodule). Background: the live CLOB had
already cut over to V2; V1-shaped orders were rejected with
`order_version_mismatch`. The Rust (`rs-clob-client`), TS (`ts-clob-client`),
and Python (`py-clob-client`) official SDKs are all still V1.

## What changed

### EIP-712 V2 (`order/v2.go`, new)

- New typehash: `Order(uint256 salt, address maker, address signer,
  uint256 tokenId, uint256 makerAmount, uint256 takerAmount, uint8 side,
  uint8 signatureType, uint256 timestamp, bytes32 metadata, bytes32 builder)`.
  V1's `taker` / `expiration` / `nonce` / `feeRateBps` are gone; `timestamp`
  / `metadata` / `builder` take their place.
- Domain `version` is `"2"`.
- Verifying contracts changed:
  - CTFExchange `0xE111180000d2663C0091e4f400237545B87B996B`
  - NegRiskCTFExchange `0xe2222d279d744050d28e00520010520000310F59`
- Added a golden-vector test (`order/v2_test.go`) anchored against an
  `eth_account` Python reference.

### Wire format (`types/types.go`, `client/orders.go`)

- `SignedOrder` reshaped to V2: dropped `taker` / `nonce` / `feeRateBps`,
  added `timestamp` / `metadata` / `builder`. `expiration` is wire-only
  (carried in the body, not in the struct hash).
- JSON encoding quirks documented inline:
  - `salt` → JSON number (uint64), not string
  - `makerAmount` / `takerAmount` → strings (uint256 doesn't fit a JSON
    number reliably)
  - `signatureType` → JSON number
  - `metadata` / `builder` → bytes32 hex
- `NewOrder.Owner` is the **derived API key UUID** (`creds.Key`), not the
  wallet address. Matches `py-clob-client` / `ts-clob-client`.

### `SignatureType` constants completed (`types/types.go`)

V2 has four signature types; we only had two (one with the wrong name):

| Value | V2 reference name | Old Go name (if any) | New Go name |
| --- | --- | --- | --- |
| 0 | `EOA` | `SignatureTypeEIP712` | `SignatureTypeEOA` |
| 1 | `POLY_PROXY` | — | `SignatureTypePolyProxy` |
| 2 | `POLY_GNOSIS_SAFE` | `SignatureTypeEthSign` (misnamed) | `SignatureTypePolyGnosisSafe` |
| 3 | `POLY_1271` | — | `SignatureTypePoly1271` |

The two old names are kept as deprecated aliases so existing imports don't
break, but `SignatureTypeEthSign` was actively misleading — value 2 is
`POLY_GNOSIS_SAFE`, not eth_sign. Polymarket UI deposits create a
POLY_PROXY (sig_type=1) wallet, which couldn't be referenced by name before.

### Simplified user-order types modernised (`types/types.go`)

`UserOrder` and `UserMarketOrder` previously carried V1 fields
(`feeRateBps`, `nonce`, `taker`) that the V2 builder silently ignored.
Replaced with the V2 shape from `clob-client-v2/src/types/ordersV2.ts`:

- `UserOrder`: `metadata`, `builderCode`, `expiration`
- `UserMarketOrder`: `metadata`, `builderCode`, `userUSDCBalance`,
  optional `orderType` (FOK/FAK), optional `price`

### Builder API (`order/order.go`, `order/rounding.go`)

- `BuildSignedLimitOrder(LimitOrderOpts)` produces a `SignedOrderResult`
  exposing `Inputs` (the resolved EIP-712 fields), `Signature`, and
  `OrderHash`. The hash is computed before the network call, so callers
  can persist a pending row keyed on the venue order ID before sending —
  enables the write-ahead pattern used by Polyquant's datasvc.
- `BuildSignedMarketOrder(MarketOrderOpts)` for FOK / FAK. Matches the
  polymarket.com web UI semantics: BUY input is a USDC budget, SELL input
  is a share count. Mirrors `clob-client-v2`'s `getMarketOrderRawAmounts`
  and `rs-clob-client`'s `OrderBuilder<Market>::build`.
- Rounding aligned with `clob-client-v2/getOrderRawAmounts.ts` and
  `getMarketOrderRawAmounts.ts`. The TS reference applies a
  `roundUp(amount + 4)` → `roundDown(amount)` dance to cancel JS float64
  noise; the Go port uses `big.Rat` exact arithmetic, so a single
  truncation produces the same result. Documented inline.

### HMAC URL-safe base64 (`auth/hmac.go`)

CLOB-issued L2 secrets are URL-safe base64 (contain `-` / `_`). The old
code used `base64.StdEncoding.DecodeString` and silently produced the
wrong HMAC for any secret with those characters → `Unauthorized` 401.
Fixed: prefer `URLEncoding`, fall back to `StdEncoding` for older keys.
Added a golden test against a `py-clob-client` reference vector.

### Pagination (`client/orders.go`)

`GetOpenOrders` now walks the `{data, next_cursor, limit, count}` envelope
(matches `py-clob-client.client.get_orders`). Previously it tried to
unmarshal a flat array and failed with `cannot unmarshal object`. Added a
`Limit *int` to `OpenOrderParams` so callers can tune page size.

### User-channel WS raw payload (`client/user_ws.go`)

The WS callback now passes the raw `json.RawMessage` alongside the typed
event. Lets the caller persist the original bytes (so fields the typed
struct doesn't model — `asset_id`, `outcome`, `fee_rate_bps`,
`maker_orders[].price/side` — aren't lost in a marshal-roundtrip).

## Verification

- `go test ./order/... ./auth/...` — all passing, including the V2 EIP-712
  golden vector and the HMAC URL-safe base64 vector.
- End-to-end smoke: `examples/place_order/main.go` posts a 5-share
  GTC limit BUY against `clob.polymarket.com` (mainnet) with a real
  POLY_PROXY-derived API key, gets `success=true`, then cancels.
- Production: this client now drives Polyquant's paper-trade pipeline
  (`apps/datasvc` → `POST /api/orders` → CLOB), with first FOK BUY of 5
  shares at 0.864 matched cleanly.

## Not done (intentional)

- `PostOrders` (batch), `CancelMarketOrders`, `GetTrades`,
  `GetBalanceAllowance` — present in the official SDKs but not on our
  current path. Easy adds when needed.
- `postOnly` validation for market orders — CLOB rejects server-side; a
  client-side check is duplication.
- Auto price lookup for market orders without an explicit `price` —
  callers always pass the best-ask / best-bid at submission time.

## References

- `vendors/clob-client-v2/src/order-utils/model/ctfExchangeV2TypedData.ts`
- `vendors/clob-client-v2/src/order-utils/model/signatureTypeV2.ts`
- `vendors/clob-client-v2/src/order-builder/helpers/getOrderRawAmounts.ts`
- `vendors/clob-client-v2/src/order-builder/helpers/getMarketOrderRawAmounts.ts`
- `vendors/clob-client-v2/src/types/ordersV2.ts`
- `vendors/py-clob-client/py_clob_client/client.py` (pagination, owner UUID)
- `vendors/rs-clob-client/src/clob/order_builder.rs` (rounding semantics)
