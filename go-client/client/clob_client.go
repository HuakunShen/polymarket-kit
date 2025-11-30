package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/HuakunShen/polymarket-kit/go-client/auth"
	"github.com/HuakunShen/polymarket-kit/go-client/types"
)

// ClobClient represents a Polymarket CLOB client
type ClobClient struct {
	host          string
	chainID       types.Chain
	wallet        *auth.Wallet
	creds         *types.ApiKeyCreds
	builderConfig *auth.BuilderConfig
	geoBlockToken string
	useServerTime bool
	httpClient    *http.Client
}

// ClientConfig represents configuration for the Clob client
type ClientConfig struct {
	Host          string
	ChainID       types.Chain
	PrivateKey    string
	APIKey        *types.ApiKeyCreds
	BuilderConfig *auth.BuilderConfig
	GeoBlockToken string
	UseServerTime bool
	Timeout       time.Duration
}

// NewClobClient creates a new CLOB client
// PrivateKey is optional - if not provided, the client can only access public endpoints
func NewClobClient(config *ClientConfig) (*ClobClient, error) {
	// Normalize host URL
	host := config.Host
	if len(host) > 0 && host[len(host)-1] == '/' {
		host = host[:len(host)-1]
	}

	// Create wallet from private key (optional for public endpoints)
	var wallet *auth.Wallet
	if config.PrivateKey != "" {
		var err error
		wallet, err = auth.NewWalletFromHex(config.PrivateKey)
		if err != nil {
			return nil, fmt.Errorf("failed to create wallet from private key: %w", err)
		}
	}

	// Set default timeout
	timeout := config.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	client := &ClobClient{
		host:          host,
		chainID:       config.ChainID,
		wallet:        wallet,
		creds:         config.APIKey,
		builderConfig: config.BuilderConfig,
		geoBlockToken: config.GeoBlockToken,
		useServerTime: config.UseServerTime,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}

	return client, nil
}

// GetOK makes a GET request to check if the API is OK
func (c *ClobClient) GetOK() (interface{}, error) {
	return c.get("/")
}

// GetServerTime gets the server time
func (c *ClobClient) GetServerTime() (int64, error) {
	var result int64
	err := c.getJSON(Time, &result)
	return result, err
}

// GetSamplingSimplifiedMarkets gets sampling simplified markets
func (c *ClobClient) GetSamplingSimplifiedMarkets(nextCursor string) (*types.PaginationPayload, error) {
	params := url.Values{}
	if nextCursor != "" {
		params.Add("next_cursor", nextCursor)
	}

	var result types.PaginationPayload
	err := c.getJSONWithParams(GetSamplingSimplifiedMarkets, params, &result)
	return &result, err
}

// GetMarkets gets markets
func (c *ClobClient) GetMarkets(nextCursor string) (*types.PaginationPayload, error) {
	params := url.Values{}
	if nextCursor != "" {
		params.Add("next_cursor", nextCursor)
	}

	var result types.PaginationPayload
	err := c.getJSONWithParams(GetMarkets, params, &result)
	return &result, err
}

// GetMarket gets a specific market
func (c *ClobClient) GetMarket(conditionID string) (interface{}, error) {
	return c.get(GetMarket + conditionID)
}

// GetOrderBook gets order book for a token
func (c *ClobClient) GetOrderBook(tokenID string) (*types.OrderBookSummary, error) {
	params := url.Values{}
	params.Add("token_id", tokenID)

	var result types.OrderBookSummary
	err := c.getJSONWithParams(GetOrderBook, params, &result)
	return &result, err
}

// GetOrderBooks gets multiple order books
func (c *ClobClient) GetOrderBooks(params []types.BookParams) ([]types.OrderBookSummary, error) {
	var result []types.OrderBookSummary
	err := c.postJSON(GetOrderBooks, params, &result)
	return result, err
}

// GetTickSize gets tick size for a token
func (c *ClobClient) GetTickSize(tokenID string) (types.TickSize, error) {
	params := url.Values{}
	params.Add("token_id", tokenID)

	var result struct {
		MinimumTickSize types.TickSize `json:"minimum_tick_size"`
	}

	err := c.getJSONWithParams(GetTickSize, params, &result)
	return result.MinimumTickSize, err
}

// GetNegRisk gets negative risk flag for a token
func (c *ClobClient) GetNegRisk(tokenID string) (bool, error) {
	params := url.Values{}
	params.Add("token_id", tokenID)

	var result struct {
		NegRisk bool `json:"neg_risk"`
	}

	err := c.getJSONWithParams(GetNegRisk, params, &result)
	return result.NegRisk, err
}

// GetFeeRateBps gets fee rate in basis points for a token
func (c *ClobClient) GetFeeRateBps(tokenID string) (int, error) {
	params := url.Values{}
	params.Add("token_id", tokenID)

	var result struct {
		BaseFee int `json:"base_fee"`
	}

	err := c.getJSONWithParams(GetFeeRate, params, &result)
	return result.BaseFee, err
}

// GetMidpoint gets midpoint price for a token
func (c *ClobClient) GetMidpoint(tokenID string) (interface{}, error) {
	params := url.Values{}
	params.Add("token_id", tokenID)
	return c.getWithParams(GetMidpoint, params)
}

// GetMidpoints gets midpoint prices for multiple tokens
func (c *ClobClient) GetMidpoints(params []types.BookParams) (interface{}, error) {
	var result interface{}
	err := c.postJSON(GetMidpoints, params, &result)
	return result, err
}

// GetPrice gets price for a token
func (c *ClobClient) GetPrice(tokenID string, side types.Side) (interface{}, error) {
	params := url.Values{}
	params.Add("token_id", tokenID)
	params.Add("side", string(side))
	return c.getWithParams(GetPrice, params)
}

// GetPrices gets prices for multiple tokens
func (c *ClobClient) GetPrices(params []types.BookParams) (interface{}, error) {
	var result interface{}
	err := c.postJSON(GetPrices, params, &result)
	return result, err
}

// GetLastTradePrice gets last trade price for a token
func (c *ClobClient) GetLastTradePrice(tokenID string) (interface{}, error) {
	params := url.Values{}
	params.Add("token_id", tokenID)
	return c.getWithParams(GetLastTradePrice, params)
}

// GetLastTradesPrices gets last trade prices for multiple tokens
func (c *ClobClient) GetLastTradesPrices(params []types.BookParams) (interface{}, error) {
	var result interface{}
	err := c.postJSON(GetLastTradesPrices, params, &result)
	return result, err
}

// GetPricesHistory gets price history for a market
func (c *ClobClient) GetPricesHistory(params types.PriceHistoryFilterParams) (interface{}, error) {
	queryParams := url.Values{}
	if params.Market != nil {
		queryParams.Add("market", *params.Market)
	}
	if params.StartTs != nil {
		queryParams.Add("startTs", fmt.Sprintf("%d", *params.StartTs))
	}
	if params.EndTs != nil {
		queryParams.Add("endTs", fmt.Sprintf("%d", *params.EndTs))
	}
	if params.Fidelity != nil {
		queryParams.Add("fidelity", fmt.Sprintf("%d", *params.Fidelity))
	}
	if params.Interval != nil {
		queryParams.Add("interval", string(*params.Interval))
	}

	return c.getWithParams(GetPricesHistory, queryParams)
}

// CreateApiKey creates a new API key
func (c *ClobClient) CreateApiKey(nonce *uint64) (*types.ApiKeyCreds, error) {
	if c.wallet == nil {
		return nil, fmt.Errorf("wallet is required to create API key")
	}

	var timestamp *int64
	if c.useServerTime {
		serverTime, err := c.GetServerTime()
		if err != nil {
			return nil, fmt.Errorf("failed to get server time: %w", err)
		}
		timestamp = &serverTime
	}

	headers, err := auth.CreateL1Headers(c.wallet.GetPrivateKey(), c.chainID, nonce, timestamp)
	if err != nil {
		return nil, fmt.Errorf("failed to create L1 headers: %w", err)
	}

	var apiKeyRaw types.ApiKeyRaw
	err = c.postJSONWithHeaders(CreateApiKey, headers, nil, &apiKeyRaw)
	if err != nil {
		return nil, err
	}

	apiKey := &types.ApiKeyCreds{
		Key:        apiKeyRaw.APIKey,
		Secret:     apiKeyRaw.Secret,
		Passphrase: apiKeyRaw.Passphrase,
	}

	return apiKey, nil
}

// DeriveApiKey derives an existing API key
func (c *ClobClient) DeriveApiKey(nonce *uint64) (*types.ApiKeyCreds, error) {
	if c.wallet == nil {
		return nil, fmt.Errorf("wallet is required to derive API key")
	}

	// Note: Unlike the Go implementation, the TypeScript version only requires L1 auth (signer)
	// for deriving API keys, not existing credentials. This matches the TypeScript behavior.

	var timestamp *int64
	if c.useServerTime {
		serverTime, err := c.GetServerTime()
		if err != nil {
			return nil, fmt.Errorf("failed to get server time: %w", err)
		}
		timestamp = &serverTime
	}

	headers, err := auth.CreateL1Headers(c.wallet.GetPrivateKey(), c.chainID, nonce, timestamp)
	if err != nil {
		return nil, fmt.Errorf("failed to create L1 headers: %w", err)
	}

	var apiKeyRaw types.ApiKeyRaw
	err = c.getJSONWithHeaders(DeriveApiKey, headers, &apiKeyRaw)
	if err != nil {
		return nil, err
	}

	apiKey := &types.ApiKeyCreds{
		Key:        apiKeyRaw.APIKey,
		Secret:     apiKeyRaw.Secret,
		Passphrase: apiKeyRaw.Passphrase,
	}

	return apiKey, nil
}

// GetApiKeys gets API keys
func (c *ClobClient) GetApiKeys() (*types.ApiKeysResponse, error) {
	if c.creds == nil {
		return nil, fmt.Errorf("API credentials are required")
	}

	headerArgs := &types.L2HeaderArgs{
		Method:      "GET",
		RequestPath: GetApiKeys,
	}

	headers, err := c.createL2Headers(headerArgs)
	if err != nil {
		return nil, fmt.Errorf("failed to create L2 headers: %w", err)
	}

	var result types.ApiKeysResponse
	err = c.getJSONWithHeaders(GetApiKeys, headers, &result)
	return &result, err
}

// GetClosedOnlyMode gets closed only mode status
func (c *ClobClient) GetClosedOnlyMode() (*types.BanStatus, error) {
	if c.creds == nil {
		return nil, fmt.Errorf("API credentials are required")
	}

	headerArgs := &types.L2HeaderArgs{
		Method:      "GET",
		RequestPath: ClosedOnly,
	}

	headers, err := c.createL2Headers(headerArgs)
	if err != nil {
		return nil, fmt.Errorf("failed to create L2 headers: %w", err)
	}

	var result types.BanStatus
	err = c.getJSONWithHeaders(ClosedOnly, headers, &result)
	return &result, err
}

// DeleteApiKey deletes API key
func (c *ClobClient) DeleteApiKey() (interface{}, error) {
	if c.creds == nil {
		return nil, fmt.Errorf("API credentials are required")
	}

	headerArgs := &types.L2HeaderArgs{
		Method:      "DELETE",
		RequestPath: DeleteApiKey,
	}

	headers, err := c.createL2Headers(headerArgs)
	if err != nil {
		return nil, fmt.Errorf("failed to create L2 headers: %w", err)
	}

	return c.deleteWithHeaders(DeleteApiKey, headers)
}

// GetOrder gets an order by ID
func (c *ClobClient) GetOrder(orderID string) (*types.OpenOrder, error) {
	if c.creds == nil {
		return nil, fmt.Errorf("API credentials are required")
	}

	endpoint := GetOrder + orderID
	headerArgs := &types.L2HeaderArgs{
		Method:      "GET",
		RequestPath: endpoint,
	}

	headers, err := c.createL2Headers(headerArgs)
	if err != nil {
		return nil, fmt.Errorf("failed to create L2 headers: %w", err)
	}

	var result types.OpenOrder
	err = c.getJSONWithHeaders(endpoint, headers, &result)
	return &result, err
}

// GetTrades gets trades
func (c *ClobClient) GetTrades(params *types.TradeParams, onlyFirstPage bool, nextCursor string) ([]types.Trade, error) {
	if c.creds == nil {
		return nil, fmt.Errorf("API credentials are required")
	}

	headerArgs := &types.L2HeaderArgs{
		Method:      "GET",
		RequestPath: GetTrades,
	}

	headers, err := c.createL2Headers(headerArgs)
	if err != nil {
		return nil, fmt.Errorf("failed to create L2 headers: %w", err)
	}

	queryParams := url.Values{}
	if nextCursor == "" {
		nextCursor = "0"
	}
	queryParams.Add("next_cursor", nextCursor)

	if params != nil {
		if params.ID != nil {
			queryParams.Add("id", *params.ID)
		}
		if params.MakerAddress != nil {
			queryParams.Add("maker_address", *params.MakerAddress)
		}
		if params.Market != nil {
			queryParams.Add("market", *params.Market)
		}
		if params.AssetID != nil {
			queryParams.Add("asset_id", *params.AssetID)
		}
		if params.Before != nil {
			queryParams.Add("before", *params.Before)
		}
		if params.After != nil {
			queryParams.Add("after", *params.After)
		}
	}

	var result struct {
		Data       []types.Trade `json:"data"`
		NextCursor string        `json:"next_cursor"`
	}

	err = c.getJSONWithHeadersAndParams(GetTrades, headers, queryParams, &result)
	if err != nil {
		return nil, err
	}

	if onlyFirstPage || result.NextCursor == "-1" {
		return result.Data, nil
	}

	// Recursively get all pages
	moreTrades, err := c.GetTrades(params, onlyFirstPage, result.NextCursor)
	if err != nil {
		return result.Data, nil // Return what we have so far
	}

	return append(result.Data, moreTrades...), nil
}

// Helper methods for HTTP requests

func (c *ClobClient) get(endpoint string) (interface{}, error) {
	return c.getWithParams(endpoint, url.Values{})
}

func (c *ClobClient) getWithParams(endpoint string, params url.Values) (interface{}, error) {
	fullURL := c.host + endpoint
	if len(params) > 0 {
		fullURL += "?" + params.Encode()
	}

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add geo block token if present
	if c.geoBlockToken != "" {
		q := req.URL.Query()
		q.Add("geo_block_token", c.geoBlockToken)
		req.URL.RawQuery = q.Encode()
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	var result interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return result, nil
}

func (c *ClobClient) getJSON(endpoint string, result interface{}) error {
	return c.getJSONWithParams(endpoint, url.Values{}, result)
}

func (c *ClobClient) getJSONWithParams(endpoint string, params url.Values, result interface{}) error {
	data, err := c.getWithParams(endpoint, params)
	if err != nil {
		return err
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal response: %w", err)
	}

	return json.Unmarshal(jsonData, result)
}

func (c *ClobClient) getJSONWithHeaders(endpoint string, headers interface{}, result interface{}) error {
	return c.getJSONWithHeadersAndParams(endpoint, headers, url.Values{}, result)
}

func (c *ClobClient) getJSONWithHeadersAndParams(endpoint string, headers interface{}, params url.Values, result interface{}) error {
	fullURL := c.host + endpoint
	if len(params) > 0 {
		fullURL += "?" + params.Encode()
	}

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Add headers
	c.addHeadersToRequest(req, headers)

	// Add geo block token if present
	if c.geoBlockToken != "" {
		q := req.URL.Query()
		q.Add("geo_block_token", c.geoBlockToken)
		req.URL.RawQuery = q.Encode()
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	return json.NewDecoder(resp.Body).Decode(result)
}

func (c *ClobClient) postJSON(endpoint string, data interface{}, result interface{}) error {
	return c.postJSONWithHeaders(endpoint, nil, data, result)
}

func (c *ClobClient) postJSONWithHeaders(endpoint string, headers interface{}, data interface{}, result interface{}) error {
	var bodyReader io.Reader
	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			return fmt.Errorf("failed to marshal request data: %w", err)
		}
		bodyReader = bytes.NewReader(jsonData)
	}

	req, err := http.NewRequest("POST", c.host+endpoint, bodyReader)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	if data != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	// Add headers
	c.addHeadersToRequest(req, headers)

	// Add geo block token if present
	if c.geoBlockToken != "" {
		q := req.URL.Query()
		q.Add("geo_block_token", c.geoBlockToken)
		req.URL.RawQuery = q.Encode()
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	if result != nil {
		return json.NewDecoder(resp.Body).Decode(result)
	}

	return nil
}

func (c *ClobClient) deleteWithHeaders(endpoint string, headers interface{}) (interface{}, error) {
	req, err := http.NewRequest("DELETE", c.host+endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add headers
	c.addHeadersToRequest(req, headers)

	// Add geo block token if present
	if c.geoBlockToken != "" {
		q := req.URL.Query()
		q.Add("geo_block_token", c.geoBlockToken)
		req.URL.RawQuery = q.Encode()
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	var result interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return result, nil
}

func (c *ClobClient) createL2Headers(args *types.L2HeaderArgs) (interface{}, error) {
	if c.wallet == nil {
		return nil, fmt.Errorf("wallet is required for authenticated requests")
	}

	var timestamp *int64
	if c.useServerTime {
		serverTime, err := c.GetServerTime()
		if err != nil {
			return nil, fmt.Errorf("failed to get server time: %w", err)
		}
		timestamp = &serverTime
	}

	return auth.CreateL2Headers(c.wallet.GetPrivateKey(), c.creds, args, timestamp)
}

func (c *ClobClient) addHeadersToRequest(req *http.Request, headers interface{}) {
	switch h := headers.(type) {
	case *types.L1PolyHeader:
		req.Header.Set("POLY_ADDRESS", h.POLYAddress)
		req.Header.Set("POLY_SIGNATURE", h.POLYSignature)
		req.Header.Set("POLY_TIMESTAMP", h.POLYTimestamp)
		req.Header.Set("POLY_NONCE", h.POLYNonce)
	case *types.L2PolyHeader:
		req.Header.Set("POLY_ADDRESS", h.POLYAddress)
		req.Header.Set("POLY_SIGNATURE", h.POLYSignature)
		req.Header.Set("POLY_TIMESTAMP", h.POLYTimestamp)
		req.Header.Set("POLY_API_KEY", h.POLYAPIKey)
		req.Header.Set("POLY_PASSPHRASE", h.POLYPassphrase)
	case *auth.L2WithBuilderHeader:
		req.Header.Set("POLY_ADDRESS", h.POLYAddress)
		req.Header.Set("POLY_SIGNATURE", h.POLYSignature)
		req.Header.Set("POLY_TIMESTAMP", h.POLYTimestamp)
		req.Header.Set("POLY_API_KEY", h.POLYAPIKey)
		req.Header.Set("POLY_PASSPHRASE", h.POLYPassphrase)
		req.Header.Set("POLY_BUILDER_API_KEY", h.POLYBuilderAPIKey)
		req.Header.Set("POLY_BUILDER_TIMESTAMP", h.POLYBuilderTimestamp)
		req.Header.Set("POLY_BUILDER_PASSPHRASE", h.POLYBuilderPassphrase)
		req.Header.Set("POLY_BUILDER_SIGNATURE", h.POLYBuilderSignature)
	}
}
