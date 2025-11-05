package types

import (
	"math/big"
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

// SignatureType represents signature types
type SignatureType int

const (
	SignatureTypeEIP712 SignatureType = 0
	SignatureTypeEthSign SignatureType = 2
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

// L2WithBuilderHeader represents L2 headers with builder authentication
type L2WithBuilderHeader struct {
	L2PolyHeader
	POLYBuilderAPIKey    string `json:"POLY_BUILDER_API_KEY"`
	POLYBuilderTimestamp string `json:"POLY_BUILDER_TIMESTAMP"`
	POLYBuilderPassphrase string `json:"POLY_BUILDER_PASSPHRASE"`
	POLYBuilderSignature string `json:"POLY_BUILDER_SIGNATURE"`
}

// SignedOrder represents a signed order
type SignedOrder struct {
	Salt         string        `json:"salt"`
	Maker        string        `json:"maker"`
	Signer       string        `json:"signer"`
	Taker        string        `json:"taker"`
	TokenID      string        `json:"tokenId"`
	MakerAmount  *big.Int      `json:"makerAmount"`
	TakerAmount  *big.Int      `json:"takerAmount"`
	Expiration   string        `json:"expiration"`
	Nonce        string        `json:"nonce"`
	FeeRateBps   string        `json:"feeRateBps"`
	Side         Side          `json:"side"`
	SignatureType SignatureType `json:"signatureType"`
	Signature    string        `json:"signature"`
}

// PostOrdersArgs represents arguments for posting orders
type PostOrdersArgs struct {
	Order     SignedOrder `json:"order"`
	OrderType OrderType   `json:"orderType"`
}

// NewOrder represents a new order
type NewOrder struct {
	Order      SignedOrder `json:"order"`
	Owner      string      `json:"owner"`
	OrderType  OrderType   `json:"orderType"`
	DeferExec  bool        `json:"deferExec"`
}

// UserOrder represents a simplified user order
type UserOrder struct {
	TokenID     string  `json:"tokenID"`
	Price       float64 `json:"price"`
	Size        float64 `json:"size"`
	Side        Side    `json:"side"`
	FeeRateBps  *int    `json:"feeRateBps,omitempty"`
	Nonce       *int    `json:"nonce,omitempty"`
	Expiration  *int    `json:"expiration,omitempty"`
	Taker       string  `json:"taker,omitempty"`
}

// UserMarketOrder represents a simplified market order
type UserMarketOrder struct {
	TokenID     string        `json:"tokenID"`
	Price       *float64      `json:"price,omitempty"`
	Amount      float64       `json:"amount"`
	Side        Side          `json:"side"`
	FeeRateBps  *int          `json:"feeRateBps,omitempty"`
	Nonce       *int          `json:"nonce,omitempty"`
	Taker       string        `json:"taker,omitempty"`
	OrderType   *OrderType    `json:"orderType,omitempty"`
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