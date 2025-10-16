package data

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"reflect"
	"strings"
	"time"
)

const (
	// DataAPIBase is the base URL for the Data API
	DataAPIBase = "https://data-api.polymarket.com"
)

// DataSDK represents the Polymarket Data API SDK
type DataSDK struct {
	baseURL     string
	proxyConfig *ProxyConfig
	httpClient  *http.Client
}

// NewDataSDK creates a new Data SDK instance
func NewDataSDK(config *DataSDKConfig) *DataSDK {
	var proxyConfig *ProxyConfig
	if config != nil {
		proxyConfig = config.Proxy
	}

	// Create HTTP client with proxy if configured
	httpClient := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Configure proxy if provided
	if proxyConfig != nil {
		protocol := "http"
		if proxyConfig.Protocol != nil {
			protocol = *proxyConfig.Protocol
		}

		// Build proxy URL with authentication if provided
		var proxyURL string
		if proxyConfig.Username != nil && proxyConfig.Password != nil {
			proxyURL = fmt.Sprintf("%s://%s:%s@%s:%d",
				protocol, *proxyConfig.Username, *proxyConfig.Password, proxyConfig.Host, proxyConfig.Port)
		} else {
			proxyURL = fmt.Sprintf("%s://%s:%d", protocol, proxyConfig.Host, proxyConfig.Port)
		}

		parsedProxyURL, err := url.Parse(proxyURL)
		if err != nil {
			fmt.Printf("Warning: Failed to parse proxy URL %s: %v\n", proxyURL, err)
		} else {
			httpClient.Transport = &http.Transport{
				Proxy: http.ProxyURL(parsedProxyURL),
			}
			fmt.Printf("✅ Proxy configured: %s\n", parsedProxyURL.String())
		}
	}

	client := &DataSDK{
		baseURL:     DataAPIBase,
		proxyConfig: proxyConfig,
		httpClient:  httpClient,
	}

	return client
}

// GetHttpClient returns the underlying HTTP client (useful for custom requests)
func (d *DataSDK) GetHttpClient() *http.Client {
	return d.httpClient
}

// buildURL constructs a URL with query parameters
func (d *DataSDK) buildURL(endpoint string, query interface{}) (string, error) {
	u, err := url.Parse(d.baseURL + endpoint)
	if err != nil {
		return "", fmt.Errorf("failed to parse URL: %w", err)
	}

	if query != nil {
		values := url.Values{}
		v := reflect.ValueOf(query)

		// Dereference pointer if necessary
		if v.Kind() == reflect.Ptr {
			if v.IsNil() {
				return u.String(), nil
			}
			v = v.Elem()
		}

		t := v.Type()

		for i := 0; i < t.NumField(); i++ {
			field := t.Field(i)
			fieldValue := v.Field(i)

			// Skip nil pointer fields
			if fieldValue.Kind() == reflect.Ptr && fieldValue.IsNil() {
				continue
			}

			// Get the JSON tag for the field name
			jsonTag := field.Tag.Get("json")
			if jsonTag == "" {
				continue
			}

			// Handle omitempty
			if strings.Contains(jsonTag, "omitempty") && fieldValue.IsZero() {
				continue
			}

			// Extract field name from JSON tag
			fieldName := strings.Split(jsonTag, ",")[0]
			if fieldName == "" {
				continue
			}

			// Convert value to string and add to query params
			var strValue string
			if fieldValue.Kind() == reflect.Ptr {
				strValue = fmt.Sprintf("%v", fieldValue.Elem().Interface())
			} else {
				strValue = fmt.Sprintf("%v", fieldValue.Interface())
			}

			// Handle slice fields for array parameters
			if fieldValue.Kind() == reflect.Slice {
				slice := fieldValue.Interface()
				if sliceValue, ok := slice.([]string); ok {
					for _, item := range sliceValue {
						values.Add(fieldName, item)
					}
				}
			} else {
				values.Add(fieldName, strValue)
			}
		}

		u.RawQuery = values.Encode()
	}

	return u.String(), nil
}

// createRequest creates an HTTP request with proper headers and proxy support
func (d *DataSDK) createRequest(method, url string) (*http.Request, error) {
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "data-go-sdk/1.0")

	return req, nil
}

// makeRequest makes an HTTP request and returns the response
func (d *DataSDK) makeRequest(method, endpoint string, query interface{}) (*APIResponse, error) {
	// Build URL with query parameters
	fullURL, err := d.buildURL(endpoint, query)
	if err != nil {
		return nil, fmt.Errorf("failed to build URL: %w", err)
	}

	// Create request
	req, err := d.createRequest(method, fullURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Make the request
	resp, err := d.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Create API response
	apiResp := &APIResponse{
		Status: resp.StatusCode,
		OK:     resp.StatusCode >= 200 && resp.StatusCode < 300,
	}

	// Handle 204 No Content
	if resp.StatusCode == 204 {
		return apiResp, nil
	}

	// Parse response body if there is content
	if len(body) > 0 {
		if resp.StatusCode >= 400 {
			// Error response
			var errData map[string]interface{}
			if err := json.Unmarshal(body, &errData); err == nil {
				apiResp.ErrorData = errData
			} else {
				apiResp.ErrorData = string(body)
			}
		} else {
			// Success response
			apiResp.Data = json.RawMessage(body)
		}
	}

	return apiResp, nil
}

// extractResponseData safely extracts data from API response
func (d *DataSDK) extractResponseData(resp *APIResponse, operation string) ([]byte, error) {
	if !resp.OK {
		return nil, fmt.Errorf("[DataSDK] %s failed: status %d", operation, resp.Status)
	}

	if resp.Data == nil {
		return nil, fmt.Errorf("[DataSDK] %s returned null data despite successful response", operation)
	}

	return resp.Data, nil
}

// Health check
// GetHealth performs a health check on the Data API
func (d *DataSDK) GetHealth() (*DataHealthResponse, error) {
	resp, err := d.makeRequest("GET", "/", nil)
	if err != nil {
		return nil, err
	}

	var result DataHealthResponse
	if resp.Data != nil {
		if err := json.Unmarshal(resp.Data, &result); err != nil {
			return nil, fmt.Errorf("failed to unmarshal health response: %w", err)
		}
	}

	return &result, nil
}

// Positions API
// GetCurrentPositions gets current positions for a user
func (d *DataSDK) GetCurrentPositions(query *PositionsQuery) ([]Position, error) {
	if query == nil {
		query = &PositionsQuery{}
	}

	resp, err := d.makeRequest("GET", "/positions", query)
	if err != nil {
		return nil, err
	}

	return d.unmarshalPositionsResponse(resp, "Get current positions")
}

// GetClosedPositions gets closed positions for a user
func (d *DataSDK) GetClosedPositions(query *ClosedPositionsQuery) ([]ClosedPosition, error) {
	if query == nil {
		query = &ClosedPositionsQuery{}
	}

	resp, err := d.makeRequest("GET", "/closed-positions", query)
	if err != nil {
		return nil, err
	}

	return d.unmarshalClosedPositionsResponse(resp, "Get closed positions")
}

// Trades API
// GetTrades gets trades for users or markets
func (d *DataSDK) GetTrades(query *TradesQuery) ([]DataTrade, error) {
	if query == nil {
		query = &TradesQuery{}
	}

	resp, err := d.makeRequest("GET", "/trades", query)
	if err != nil {
		return nil, err
	}

	return d.unmarshalTradesResponse(resp, "Get trades")
}

// User Activity API
// GetUserActivity gets user activity
func (d *DataSDK) GetUserActivity(query *UserActivityQuery) ([]Activity, error) {
	if query == nil {
		query = &UserActivityQuery{}
	}

	resp, err := d.makeRequest("GET", "/activity", query)
	if err != nil {
		return nil, err
	}

	return d.unmarshalActivityResponse(resp, "Get user activity")
}

// Holders API
// GetTopHolders gets top holders for markets
func (d *DataSDK) GetTopHolders(query *TopHoldersQuery) ([]MetaHolder, error) {
	if query == nil {
		query = &TopHoldersQuery{}
	}

	resp, err := d.makeRequest("GET", "/holders", query)
	if err != nil {
		return nil, err
	}

	return d.unmarshalMetaHoldersResponse(resp, "Get top holders")
}

// Portfolio Analytics API
// GetTotalValue gets total value of a user's positions
func (d *DataSDK) GetTotalValue(query *TotalValueQuery) ([]TotalValue, error) {
	if query == nil {
		query = &TotalValueQuery{}
	}

	resp, err := d.makeRequest("GET", "/value", query)
	if err != nil {
		return nil, err
	}

	return d.unmarshalTotalValueResponse(resp, "Get total value")
}

// GetTotalMarketsTraded gets total markets a user has traded
func (d *DataSDK) GetTotalMarketsTraded(query *TotalMarketsTradedQuery) (*TotalMarketsTraded, error) {
	if query == nil {
		query = &TotalMarketsTradedQuery{}
	}

	resp, err := d.makeRequest("GET", "/traded", query)
	if err != nil {
		return nil, err
	}

	return d.unmarshalTotalMarketsTradedResponse(resp, "Get total markets traded")
}

// Market Analytics API
// GetOpenInterest gets open interest for markets
func (d *DataSDK) GetOpenInterest(query *OpenInterestQuery) ([]OpenInterest, error) {
	if query == nil {
		query = &OpenInterestQuery{}
	}

	resp, err := d.makeRequest("GET", "/oi", query)
	if err != nil {
		return nil, err
	}

	return d.unmarshalOpenInterestResponse(resp, "Get open interest")
}

// GetLiveVolume gets live volume for an event
func (d *DataSDK) GetLiveVolume(query *LiveVolumeQuery) (*LiveVolumeResponse, error) {
	if query == nil {
		query = &LiveVolumeQuery{}
	}

	resp, err := d.makeRequest("GET", "/live-volume", query)
	if err != nil {
		return nil, err
	}

	return d.unmarshalLiveVolumeResponse(resp, "Get live volume")
}

// Convenience methods

// GetAllPositions gets all positions (current and closed) for a user
func (d *DataSDK) GetAllPositions(user string, options *struct {
	Limit          *int
	Offset         *int
	SortBy         *string
	SortDirection  *string
}) (*struct {
	Current []Position
	Closed  []ClosedPosition
}, error) {
	// Build queries for both endpoints
	currentQuery := &PositionsQuery{
		User:          &user,
		Limit:         options.Limit,
		Offset:        options.Offset,
		SortBy:        options.SortBy,
		SortDirection: options.SortDirection,
	}

	closedQuery := &ClosedPositionsQuery{
		User:          &user,
		Limit:         options.Limit,
		Offset:        options.Offset,
		SortBy:        options.SortBy,
		SortDirection: options.SortDirection,
	}

	// Fetch both in parallel
	currentChan := make(chan []Position, 1)
	closedChan := make(chan []ClosedPosition, 1)
	currentErrChan := make(chan error, 1)
	closedErrChan := make(chan error, 1)

	go func() {
		positions, err := d.GetCurrentPositions(currentQuery)
		currentChan <- positions
		currentErrChan <- err
	}()

	go func() {
		positions, err := d.GetClosedPositions(closedQuery)
		closedChan <- positions
		closedErrChan <- err
	}()

	currentPositions := <-currentChan
	closedPositions := <-closedChan
	currentErr := <-currentErrChan
	closedErr := <-closedErrChan

	if currentErr != nil {
		return nil, fmt.Errorf("failed to get current positions: %w", currentErr)
	}
	if closedErr != nil {
		return nil, fmt.Errorf("failed to get closed positions: %w", closedErr)
	}

	return &struct {
		Current []Position
		Closed  []ClosedPosition
	}{
		Current: currentPositions,
		Closed:  closedPositions,
	}, nil
}

// GetPortfolioSummary gets comprehensive portfolio summary for a user
func (d *DataSDK) GetPortfolioSummary(user string) (*struct {
	TotalValue       []TotalValue
	MarketsTraded    *TotalMarketsTraded
	CurrentPositions []Position
}, error) {
	// Fetch all data in parallel
	totalValueChan := make(chan []TotalValue, 1)
	marketsTradedChan := make(chan *TotalMarketsTraded, 1)
	positionsChan := make(chan []Position, 1)
	totalValueErrChan := make(chan error, 1)
	marketsTradedErrChan := make(chan error, 1)
	positionsErrChan := make(chan error, 1)

	go func() {
		value, err := d.GetTotalValue(&TotalValueQuery{User: &user})
		totalValueChan <- value
		totalValueErrChan <- err
	}()

	go func() {
		traded, err := d.GetTotalMarketsTraded(&TotalMarketsTradedQuery{User: &user})
		marketsTradedChan <- traded
		marketsTradedErrChan <- err
	}()

	go func() {
		positions, err := d.GetCurrentPositions(&PositionsQuery{User: &user})
		positionsChan <- positions
		positionsErrChan <- err
	}()

	totalValue := <-totalValueChan
	marketsTraded := <-marketsTradedChan
	positions := <-positionsChan
	totalValueErr := <-totalValueErrChan
	marketsTradedErr := <-marketsTradedErrChan
	positionsErr := <-positionsErrChan

	if totalValueErr != nil {
		return nil, fmt.Errorf("failed to get total value: %w", totalValueErr)
	}
	if marketsTradedErr != nil {
		return nil, fmt.Errorf("failed to get markets traded: %w", marketsTradedErr)
	}
	if positionsErr != nil {
		return nil, fmt.Errorf("failed to get current positions: %w", positionsErr)
	}

	return &struct {
		TotalValue       []TotalValue
		MarketsTraded    *TotalMarketsTraded
		CurrentPositions []Position
	}{
		TotalValue:       totalValue,
		MarketsTraded:    marketsTraded,
		CurrentPositions: positions,
	}, nil
}

// Unmarshal helper methods

func (d *DataSDK) unmarshalPositionsResponse(resp *APIResponse, operation string) ([]Position, error) {
	data, err := d.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []Position
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

func (d *DataSDK) unmarshalClosedPositionsResponse(resp *APIResponse, operation string) ([]ClosedPosition, error) {
	data, err := d.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []ClosedPosition
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

func (d *DataSDK) unmarshalTradesResponse(resp *APIResponse, operation string) ([]DataTrade, error) {
	data, err := d.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []DataTrade
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

func (d *DataSDK) unmarshalActivityResponse(resp *APIResponse, operation string) ([]Activity, error) {
	data, err := d.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []Activity
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

func (d *DataSDK) unmarshalMetaHoldersResponse(resp *APIResponse, operation string) ([]MetaHolder, error) {
	data, err := d.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []MetaHolder
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

func (d *DataSDK) unmarshalTotalValueResponse(resp *APIResponse, operation string) ([]TotalValue, error) {
	data, err := d.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []TotalValue
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

func (d *DataSDK) unmarshalTotalMarketsTradedResponse(resp *APIResponse, operation string) (*TotalMarketsTraded, error) {
	data, err := d.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result TotalMarketsTraded
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return &result, nil
}

func (d *DataSDK) unmarshalOpenInterestResponse(resp *APIResponse, operation string) ([]OpenInterest, error) {
	data, err := d.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []OpenInterest
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

func (d *DataSDK) unmarshalLiveVolumeResponse(resp *APIResponse, operation string) (*LiveVolumeResponse, error) {
	data, err := d.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result LiveVolumeResponse
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return &result, nil
}

// APIResponse represents a generic API response
type APIResponse struct {
	Status    int                `json:"status"`
	OK        bool               `json:"ok"`
	Data      json.RawMessage    `json:"data,omitempty"`
	ErrorData interface{}        `json:"errorData,omitempty"`
}