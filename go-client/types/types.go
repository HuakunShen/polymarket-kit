package types

import (
	"time"
)

// Chain represents Ethereum chain IDs
type Chain int

const (
	ChainPolygon Chain = 137
	ChainAmoy    Chain = 80002
)

// Side represents order side
type Side string

const (
	SideBuy  Side = "BUY"
	SideSell Side = "SELL"
)

// OrderType represents order types
type OrderType string

const (
	OrderTypeGTC OrderType = "GTC"
	OrderTypeFOK OrderType = "FOK"
	OrderTypeGTD OrderType = "GTD"
	OrderTypeFAK OrderType = "FAK"
)

// SignatureType matches Polymarket CTF Exchange V2 signature types.
// Mirrors clob-client-v2 SignatureTypeV2 enum:
// vendors/clob-client-v2/src/order-utils/model/signatureTypeV2.ts.
type SignatureType int

const (
	// SignatureTypeEOA: ECDSA EIP-712 signature signed by an externally
	// owned account.
	SignatureTypeEOA SignatureType = 0
	// SignatureTypePolyProxy: EIP-712 signature signed by an EOA that owns
	// a Polymarket proxy wallet (created when depositing via the UI).
	SignatureTypePolyProxy SignatureType = 1
	// SignatureTypePolyGnosisSafe: EIP-712 signature signed by an EOA that
	// owns a Polymarket Gnosis Safe.
	SignatureTypePolyGnosisSafe SignatureType = 2
	// SignatureTypePoly1271: EIP-1271 signature signed by a smart-contract
	// wallet (e.g. vaults). New in V2.
	SignatureTypePoly1271 SignatureType = 3

	// Deprecated: use SignatureTypeEOA. Kept for source compatibility.
	SignatureTypeEIP712 = SignatureTypeEOA
	// Deprecated: this name was incorrect — value 2 is POLY_GNOSIS_SAFE,
	// not eth_sign. Use SignatureTypePolyGnosisSafe.
	SignatureTypeEthSign = SignatureTypePolyGnosisSafe
)

// ApiKeyCreds represents API key credentials
type ApiKeyCreds struct {
	Key        string `json:"key"`
	Secret     string `json:"secret"`
	Passphrase string `json:"passphrase"`
}

// ApiKeyRaw represents raw API key response
type ApiKeyRaw struct {
	APIKey    string `json:"apiKey"`
	Secret    string `json:"secret"`
	Passphrase string `json:"passphrase"`
}

// L2HeaderArgs represents L2 header arguments
type L2HeaderArgs struct {
	Method     string `json:"method"`
	RequestPath string `json:"requestPath"`
	Body       string `json:"body,omitempty"`
}

// L1PolyHeader represents Level 1 authentication headers
type L1PolyHeader struct {
	POLYAddress   string `json:"POLY_ADDRESS"`
	POLYSignature string `json:"POLY_SIGNATURE"`
	POLYTimestamp string `json:"POLY_TIMESTAMP"`
	POLYNonce     string `json:"POLY_NONCE"`
}

// L2PolyHeader represents Level 2 authentication headers
type L2PolyHeader struct {
	POLYAddress   string `json:"POLY_ADDRESS"`
	POLYSignature string `json:"POLY_SIGNATURE"`
	POLYTimestamp string `json:"POLY_TIMESTAMP"`
	POLYAPIKey    string `json:"POLY_API_KEY"`
	POLYPassphrase string `json:"POLY_PASSPHRASE"`
}

// SignedOrder is the V2 signed order wire format used by Polymarket CLOB.
//
// V2 dropped taker / nonce / feeRateBps from the EIP-712 struct and added
// timestamp / metadata / builder. The CLOB API rejects V1-shaped orders
// with `order_version_mismatch`. See clob-client-v2/src/order-utils/model/
// ctfExchangeV2TypedData.ts and ordersV2.ts for the canonical shape.
//
// Wire-format quirks (any one wrong → `Invalid order payload`):
//
//   - makerAmount / takerAmount: JSON **strings** (uint256 doesn't fit
//     reliably in a JSON number).
//   - salt: JSON **number** (u64). rs-SDK comment: "CLOB expects salt as
//     a JSON number".
//   - Other uint256 fields (timestamp, expiration, tokenId): strings.
//   - signatureType: JSON number (on-chain enum).
//   - metadata / builder: bytes32 hex strings, default 0x000…000.
//   - expiration sits in the body but is **not** in the struct hash.
type SignedOrder struct {
	Salt          uint64        `json:"salt"`        // JSON number (u64)
	Maker         string        `json:"maker"`
	Signer        string        `json:"signer"`
	TokenID       string        `json:"tokenId"`
	MakerAmount   string        `json:"makerAmount"` // string-encoded uint256
	TakerAmount   string        `json:"takerAmount"` // string-encoded uint256
	Side          Side          `json:"side"`
	SignatureType SignatureType `json:"signatureType"`
	Timestamp     string        `json:"timestamp"`  // unix milliseconds (matches TS Date.now())
	Expiration    string        `json:"expiration"` // wire-only, "0" for non-GTD
	Metadata      string        `json:"metadata"`   // bytes32 hex
	Builder       string        `json:"builder"`    // bytes32 hex
	Signature     string        `json:"signature"`
}

// PostOrdersArgs represents arguments for posting orders
type PostOrdersArgs struct {
	Order     SignedOrder `json:"order"`
	OrderType OrderType   `json:"orderType"`
}

// NewOrder represents a new order (V2 wire format).
type NewOrder struct {
	Order     SignedOrder `json:"order"`
	Owner     string      `json:"owner"`
	OrderType OrderType   `json:"orderType"`
	DeferExec bool        `json:"deferExec"`
	PostOnly  bool        `json:"postOnly"`
}

// UserOrder is the simplified V2 limit-order request shape, mirroring
// clob-client-v2 UserOrderV2:
// vendors/clob-client-v2/src/types/ordersV2.ts.
//
// V1's taker / nonce / feeRateBps fields were removed — V2 uses
// metadata / builderCode / expiration instead.
type UserOrder struct {
	TokenID string  `json:"tokenID"`
	Price   float64 `json:"price"`
	Size    float64 `json:"size"`
	Side    Side    `json:"side"`
	// Metadata is a bytes32 hex string. Defaults to zero on the wire.
	Metadata string `json:"metadata,omitempty"`
	// BuilderCode is a bytes32 hex string identifying a fee-share recipient.
	BuilderCode string `json:"builderCode,omitempty"`
	// Expiration is unix seconds; only honoured for GTD order type. 0 = none.
	Expiration *int64 `json:"expiration,omitempty"`
}

// UserMarketOrder is the simplified V2 market-order (FOK / FAK) shape,
// mirroring clob-client-v2 UserMarketOrderV2.
//
//   - BUY: Amount is the USDC budget to spend.
//   - SELL: Amount is the share count to sell.
type UserMarketOrder struct {
	TokenID string `json:"tokenID"`
	// Price is optional; when nil the SDK should fetch from the order book.
	Price  *float64 `json:"price,omitempty"`
	Amount float64  `json:"amount"`
	Side   Side     `json:"side"`
	// OrderType must be FOK or FAK when set.
	OrderType *OrderType `json:"orderType,omitempty"`
	// UserUSDCBalance: when sufficient, the order Amount is used as-is.
	// Otherwise CLOB deducts fees from the amount.
	UserUSDCBalance *float64 `json:"userUSDCBalance,omitempty"`
	// Metadata is a bytes32 hex string. Defaults to zero on the wire.
	Metadata string `json:"metadata,omitempty"`
	// BuilderCode is a bytes32 hex string identifying a fee-share recipient.
	BuilderCode string `json:"builderCode,omitempty"`
}

// OrderPayload represents order payload for cancellation
type OrderPayload struct {
	OrderID string `json:"orderID"`
}

// ApiKeysResponse represents API keys response
type ApiKeysResponse struct {
	APIKeys []ApiKeyCreds `json:"apiKeys"`
}

// BanStatus represents ban status
type BanStatus struct {
	ClosedOnly bool `json:"closed_only"`
}

// OrderResponse represents order response
type OrderResponse struct {
	Success          bool     `json:"success"`
	ErrorMsg         string   `json:"errorMsg"`
	OrderID          string   `json:"orderID"`
	TransactionsHashes []string `json:"transactionsHashes"`
	Status           string   `json:"status"`
	TakingAmount     string   `json:"takingAmount"`
	MakingAmount     string   `json:"makingAmount"`
}

// OpenOrder represents an open order
type OpenOrder struct {
	ID            string    `json:"id"`
	Status        string    `json:"status"`
	Owner         string    `json:"owner"`
	MakerAddress  string    `json:"maker_address"`
	Market        string    `json:"market"`
	AssetID       string    `json:"asset_id"`
	Side          string    `json:"side"`
	OriginalSize  string    `json:"original_size"`
	SizeMatched   string    `json:"size_matched"`
	Price         string    `json:"price"`
	AssociateTrades []string `json:"associate_trades"`
	Outcome       string    `json:"outcome"`
	CreatedAt     int64     `json:"created_at"`
	Expiration    string    `json:"expiration"`
	OrderType     string    `json:"order_type"`
}

// OpenOrdersResponse represents open orders response
type OpenOrdersResponse []OpenOrder

// TradeParams represents trade query parameters
type TradeParams struct {
	ID            *string `json:"id,omitempty"`
	MakerAddress  *string `json:"maker_address,omitempty"`
	Market        *string `json:"market,omitempty"`
	AssetID       *string `json:"asset_id,omitempty"`
	Before        *string `json:"before,omitempty"`
	After         *string `json:"after,omitempty"`
}

// OpenOrderParams represents open order query parameters
type OpenOrderParams struct {
	ID      *string `json:"id,omitempty"`
	Market  *string `json:"market,omitempty"`
	AssetID *string `json:"asset_id,omitempty"`
	// Limit is the page size hint sent to CLOB. Default server-side is small;
	// set this to a larger number to reduce round-trips when fetching many
	// open orders. The cursor walk in GetOpenOrders honours it per page.
	Limit *int `json:"limit,omitempty"`
}

// MakerOrder represents a maker order
type MakerOrder struct {
	OrderID     string `json:"order_id"`
	Owner       string `json:"owner"`
	MakerAddress string `json:"maker_address"`
	MatchedAmount string `json:"matched_amount"`
	Price       string `json:"price"`
	FeeRateBps  string `json:"fee_rate_bps"`
	AssetID     string `json:"asset_id"`
	Outcome     string `json:"outcome"`
	Side        Side   `json:"side"`
}

// Trade represents a trade
type Trade struct {
	ID              string       `json:"id"`
	TakerOrderID    string       `json:"taker_order_id"`
	Market          string       `json:"market"`
	AssetID         string       `json:"asset_id"`
	Side            Side         `json:"side"`
	Size            string       `json:"size"`
	FeeRateBps      string       `json:"fee_rate_bps"`
	Price           string       `json:"price"`
	Status          string       `json:"status"`
	MatchTime       string       `json:"match_time"`
	LastUpdate      string       `json:"last_update"`
	Outcome         string       `json:"outcome"`
	BucketIndex     int          `json:"bucket_index"`
	Owner           string       `json:"owner"`
	MakerAddress    string       `json:"maker_address"`
	MakerOrders     []MakerOrder `json:"maker_orders"`
	TransactionHash string       `json:"transaction_hash"`
	TraderSide      string       `json:"trader_side"`
}

// MarketPrice represents market price data
type MarketPrice struct {
	T int64   `json:"t"` // timestamp
	P float64 `json:"p"` // price
}

// PriceHistoryResponse represents the response from /prices-history
type PriceHistoryResponse struct {
	History []MarketPrice `json:"history"`
}

// PriceHistoryFilterParams represents price history filter parameters
type PriceHistoryFilterParams struct {
	Market    *string            `json:"market,omitempty"`
	StartTs   *int64             `json:"startTs,omitempty"`
	EndTs     *int64             `json:"endTs,omitempty"`
	Fidelity  *int               `json:"fidelity,omitempty"`
	Interval  *PriceHistoryInterval `json:"interval,omitempty"`
}

// PriceHistoryInterval represents price history intervals
type PriceHistoryInterval string

const (
	PriceHistoryIntervalMax       PriceHistoryInterval = "max"
	PriceHistoryIntervalOneWeek   PriceHistoryInterval = "1w"
	PriceHistoryIntervalOneDay    PriceHistoryInterval = "1d"
	PriceHistoryIntervalSixHours  PriceHistoryInterval = "6h"
	PriceHistoryIntervalOneHour   PriceHistoryInterval = "1h"
)

// DropNotificationParams represents drop notification parameters
type DropNotificationParams struct {
	IDs []string `json:"ids"`
}

// Notification represents a notification
type Notification struct {
	Type    int         `json:"type"`
	Owner   string      `json:"owner"`
	Payload interface{} `json:"payload"`
}

// OrderMarketCancelParams represents order market cancel parameters
type OrderMarketCancelParams struct {
	Market  *string `json:"market,omitempty"`
	AssetID *string `json:"asset_id,omitempty"`
}

// OrderSummary represents order summary
type OrderSummary struct {
	Price string `json:"price"`
	Size  string `json:"size"`
}

// OrderBookSummary represents order book summary
type OrderBookSummary struct {
	Market      string         `json:"market"`
	AssetID     string         `json:"asset_id"`
	Timestamp   string         `json:"timestamp"`
	Bids        []OrderSummary `json:"bids"`
	Asks        []OrderSummary `json:"asks"`
	MinOrderSize string         `json:"min_order_size"`
	TickSize    string         `json:"tick_size"`
	NegRisk     bool           `json:"neg_risk"`
	Hash        string         `json:"hash"`
}

// AssetType represents asset types
type AssetType string

const (
	AssetTypeCollateral   AssetType = "COLLATERAL"
	AssetTypeConditional  AssetType = "CONDITIONAL"
)

// BalanceAllowanceParams represents balance allowance parameters
type BalanceAllowanceParams struct {
	AssetType AssetType `json:"asset_type"`
	TokenID   *string   `json:"token_id,omitempty"`
}

// BalanceAllowanceResponse represents balance allowance response
type BalanceAllowanceResponse struct {
	Balance  string `json:"balance"`
	Allowance string `json:"allowance"`
}

// OrderScoringParams represents order scoring parameters
type OrderScoringParams struct {
	OrderID string `json:"order_id"`
}

// OrderScoring represents order scoring response
type OrderScoring struct {
	Scoring bool `json:"scoring"`
}

// OrdersScoringParams represents orders scoring parameters
type OrdersScoringParams struct {
	OrderIDs []string `json:"orderIds"`
}

// OrdersScoring represents orders scoring response
type OrdersScoring map[string]bool

// CreateOrderOptions represents create order options
type CreateOrderOptions struct {
	TickSize TickSize `json:"tickSize"`
	NegRisk  *bool    `json:"negRisk,omitempty"`
}

// TickSize represents tick sizes
type TickSize string

const (
	TickSize01    TickSize = "0.1"
	TickSize001   TickSize = "0.01"
	TickSize0001  TickSize = "0.001"
	TickSize00001 TickSize = "0.0001"
)

// RoundConfig represents rounding configuration
type RoundConfig struct {
	Price  float64 `json:"price"`
	Size   float64 `json:"size"`
	Amount float64 `json:"amount"`
}

// TickSizes represents tick sizes mapping
type TickSizes map[string]TickSize

// NegRisk represents negative risk mapping
type NegRisk map[string]bool

// FeeRates represents fee rates mapping
type FeeRates map[string]int

// PaginationPayload represents pagination payload
type PaginationPayload struct {
	Limit     int         `json:"limit"`
	Count     int         `json:"count"`
	NextCursor string     `json:"next_cursor"`
	Data      interface{} `json:"data"`
}

// MarketTradeEvent represents market trade event
type MarketTradeEvent struct {
	EventType string `json:"event_type"`
	Market    struct {
		ConditionID string `json:"condition_id"`
		AssetID     string `json:"asset_id"`
		Question    string `json:"question"`
		Icon        string `json:"icon"`
		Slug        string `json:"slug"`
	} `json:"market"`
	User struct {
		Address                string `json:"address"`
		Username               string `json:"username"`
		ProfilePicture         string `json:"profile_picture"`
		OptimizedProfilePicture string `json:"optimized_profile_picture"`
		Pseudonym              string `json:"pseudonym"`
	} `json:"user"`
	Side           Side   `json:"side"`
	Size           string `json:"size"`
	FeeRateBps     string `json:"fee_rate_bps"`
	Price          string `json:"price"`
	Outcome        string `json:"outcome"`
	OutcomeIndex   int    `json:"outcome_index"`
	TransactionHash string `json:"transaction_hash"`
	Timestamp      string `json:"timestamp"`
}

// BookParams represents book parameters
type BookParams struct {
	TokenID string `json:"token_id"`
	Side    Side   `json:"side"`
}

// UserEarning represents user earning
type UserEarning struct {
	Date         string  `json:"date"`
	ConditionID  string  `json:"condition_id"`
	AssetAddress string  `json:"asset_address"`
	MakerAddress string  `json:"maker_address"`
	Earnings     float64 `json:"earnings"`
	AssetRate    float64 `json:"asset_rate"`
}

// TotalUserEarning represents total user earning
type TotalUserEarning struct {
	Date         string  `json:"date"`
	AssetAddress string  `json:"asset_address"`
	MakerAddress string  `json:"maker_address"`
	Earnings     float64 `json:"earnings"`
	AssetRate    float64 `json:"asset_rate"`
}

// RewardsPercentages represents rewards percentages
type RewardsPercentages map[string]float64

// Token represents token data
type Token struct {
	TokenID string  `json:"token_id"`
	Outcome string  `json:"outcome"`
	Price   float64 `json:"price"`
}

// RewardsConfig represents rewards configuration
type RewardsConfig struct {
	AssetAddress string  `json:"asset_address"`
	StartDate    string  `json:"start_date"`
	EndDate      string  `json:"end_date"`
	RatePerDay   float64 `json:"rate_per_day"`
	TotalRewards float64 `json:"total_rewards"`
}

// MarketReward represents market reward
type MarketReward struct {
	ConditionID             string          `json:"condition_id"`
	Question                string          `json:"question"`
	MarketSlug              string          `json:"market_slug"`
	EventSlug               string          `json:"event_slug"`
	Image                   string          `json:"image"`
	RewardsMaxSpread        float64         `json:"rewards_max_spread"`
	RewardsMinSize          float64         `json:"rewards_min_size"`
	Tokens                  []Token         `json:"tokens"`
	RewardsConfig           []RewardsConfig `json:"rewards_config"`
}

// Earning represents earning data
type Earning struct {
	AssetAddress string  `json:"asset_address"`
	Earnings     float64 `json:"earnings"`
	AssetRate    float64 `json:"asset_rate"`
}

// UserRewardsEarning represents user rewards earning
type UserRewardsEarning struct {
	ConditionID             string          `json:"condition_id"`
	Question                string          `json:"question"`
	MarketSlug              string          `json:"market_slug"`
	EventSlug               string          `json:"event_slug"`
	Image                   string          `json:"image"`
	RewardsMaxSpread        float64         `json:"rewards_max_spread"`
	RewardsMinSize          float64         `json:"rewards_min_size"`
	MarketCompetitiveness   float64         `json:"market_competitiveness"`
	Tokens                  []Token         `json:"tokens"`
	RewardsConfig           []RewardsConfig `json:"rewards_config"`
	MakerAddress            string          `json:"maker_address"`
	EarningPercentage       float64         `json:"earning_percentage"`
	Earnings                []Earning       `json:"earnings"`
}

// BuilderTrade represents builder trade
type BuilderTrade struct {
	ID             string     `json:"id"`
	TradeType      string     `json:"tradeType"`
	TakerOrderHash string     `json:"takerOrderHash"`
	Builder        string     `json:"builder"`
	Market         string     `json:"market"`
	AssetID        string     `json:"assetId"`
	Side           string     `json:"side"`
	Size           string     `json:"size"`
	SizeUSDC       string     `json:"sizeUsdc"`
	Price          string     `json:"price"`
	Status         string     `json:"status"`
	Outcome        string     `json:"outcome"`
	OutcomeIndex   int        `json:"outcomeIndex"`
	Owner          string     `json:"owner"`
	Maker          string     `json:"maker"`
	TransactionHash string    `json:"transactionHash"`
	MatchTime      string     `json:"matchTime"`
	BucketIndex    int        `json:"bucketIndex"`
	Fee            string     `json:"fee"`
	FeeUSDC        string     `json:"feeUsdc"`
	ErrMsg         *string    `json:"err_msg,omitempty"`
	CreatedAt      *time.Time `json:"createdAt,omitempty"`
	UpdatedAt      *time.Time `json:"updatedAt,omitempty"`
}