package gamma

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
	// GammaAPIBase is the base URL for the Gamma API
	GammaAPIBase = "https://gamma-api.polymarket.com"
)

// GammaSDKConfig represents configuration for the Gamma SDK
type GammaSDKConfig struct {
	Proxy *ProxyConfig `json:"proxy,omitempty"` // HTTP/HTTPS proxy configuration
}

// GammaSDK represents the Polymarket Gamma API SDK
type GammaSDK struct {
	baseURL     string
	proxyConfig *ProxyConfig
	httpClient  *http.Client
}

// NewGammaSDK creates a new Gamma SDK instance
func NewGammaSDK(config *GammaSDKConfig) *GammaSDK {
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

	client := &GammaSDK{
		baseURL:     GammaAPIBase,
		proxyConfig: proxyConfig,
		httpClient:  httpClient,
	}

	return client
}

// GetHttpClient returns the underlying HTTP client (useful for custom requests)
func (g *GammaSDK) GetHttpClient() *http.Client {
	return g.httpClient
}

// buildURL constructs a URL with query parameters
func (g *GammaSDK) buildURL(endpoint string, query interface{}) (string, error) {
	u, err := url.Parse(g.baseURL + endpoint)
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

			values.Add(fieldName, strValue)
		}

		u.RawQuery = values.Encode()
	}

	return u.String(), nil
}

// createRequest creates an HTTP request with proper headers and proxy support
func (g *GammaSDK) createRequest(method, url string) (*http.Request, error) {
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "gamma-go-sdk/1.0")

	return req, nil
}

// makeRequest makes an HTTP request and returns the response
func (g *GammaSDK) makeRequest(method, endpoint string, query interface{}) (*APIResponse, error) {
	// Build URL with query parameters
	fullURL, err := g.buildURL(endpoint, query)
	if err != nil {
		return nil, fmt.Errorf("failed to build URL: %w", err)
	}

	// Create request
	req, err := g.createRequest(method, fullURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Make the request
	resp, err := g.httpClient.Do(req)
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
			var errData GammaError
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
func (g *GammaSDK) extractResponseData(resp *APIResponse, operation string) ([]byte, error) {
	if !resp.OK {
		return nil, fmt.Errorf("[GammaSDK] %s failed: status %d", operation, resp.Status)
	}

	if resp.Data == nil {
		return nil, fmt.Errorf("[GammaSDK] %s returned null data despite successful response", operation)
	}

	return resp.Data, nil
}

// unmarshalTeamsResponse extracts and unmarshals teams response
func (g *GammaSDK) unmarshalTeamsResponse(resp *APIResponse, operation string) ([]Team, error) {
	data, err := g.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []Team
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

// unmarshalTagsResponse extracts and unmarshals tags response
func (g *GammaSDK) unmarshalTagsResponse(resp *APIResponse, operation string) ([]UpdatedTag, error) {
	data, err := g.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []UpdatedTag
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

// unmarshalTagResponse extracts and unmarshals single tag response
func (g *GammaSDK) unmarshalTagResponse(resp *APIResponse, operation string) (*UpdatedTag, error) {
	if resp.Status == 404 {
		return nil, nil
	}

	data, err := g.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result UpdatedTag
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return &result, nil
}

// unmarshalRelatedTagRelationshipsResponse extracts and unmarshals related tag relationships
func (g *GammaSDK) unmarshalRelatedTagRelationshipsResponse(resp *APIResponse, operation string) ([]RelatedTagRelationship, error) {
	data, err := g.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []RelatedTagRelationship
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

// unmarshalSeriesResponse extracts and unmarshals series response
func (g *GammaSDK) unmarshalSeriesResponse(resp *APIResponse, operation string) ([]Series, error) {
	data, err := g.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []Series
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

// unmarshalSeriesSingleResponse extracts and unmarshals single series response
func (g *GammaSDK) unmarshalSeriesSingleResponse(resp *APIResponse, operation string) (*Series, error) {
	if resp.Status == 404 {
		return nil, nil
	}

	data, err := g.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result Series
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return &result, nil
}

// unmarshalCommentsResponse extracts and unmarshals comments response
func (g *GammaSDK) unmarshalCommentsResponse(resp *APIResponse, operation string) ([]Comment, error) {
	data, err := g.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result []Comment
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return result, nil
}

// unmarshalEventsResponse extracts and unmarshals events response
func (g *GammaSDK) unmarshalEventsResponse(resp *APIResponse, operation string) ([]Event, error) {
	data, err := g.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	// Parse as array of maps first to transform each item
	var rawItems []map[string]interface{}
	if err := json.Unmarshal(data, &rawItems); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s data: %w", operation, err)
	}

	// Transform each event
	events := make([]Event, len(rawItems))
	for i, item := range rawItems {
		events[i] = g.transformEventData(item)
	}

	return events, nil
}

// unmarshalMarketsResponse extracts and unmarshals markets response
func (g *GammaSDK) unmarshalMarketsResponse(resp *APIResponse, operation string) ([]Market, error) {
	data, err := g.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	// Parse as array of maps first to transform each item
	var rawItems []map[string]interface{}
	if err := json.Unmarshal(data, &rawItems); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s data: %w", operation, err)
	}

	// Transform each market
	markets := make([]Market, len(rawItems))
	for i, item := range rawItems {
		markets[i] = g.transformMarketData(item)
	}

	return markets, nil
}

// unmarshalSearchResponse extracts and unmarshals search response
func (g *GammaSDK) unmarshalSearchResponse(resp *APIResponse, operation string) (*SearchResponse, error) {
	data, err := g.extractResponseData(resp, operation)
	if err != nil {
		return nil, err
	}

	var result SearchResponse
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s response: %w", operation, err)
	}

	return &result, nil
}

// parseJSONArray parses a JSON array from either string or already parsed array
func (g *GammaSDK) parseJSONArray(value interface{}) []string {
	if value == nil {
		return []string{}
	}

	switch v := value.(type) {
	case []interface{}:
		// Already an array of interfaces
		result := make([]string, len(v))
		for i, item := range v {
			result[i] = fmt.Sprintf("%v", item)
		}
		return result
	case []string:
		// Already a string array
		return v
	case string:
		// JSON string that needs to be parsed
		var result []string
		if err := json.Unmarshal([]byte(v), &result); err != nil {
			// If parsing fails, return empty array
			return []string{}
		}
		return result
	default:
		// Any other type, convert to string
		return []string{fmt.Sprintf("%v", v)}
	}
}

// transformMarketData transforms market data to parse JSON string fields
func (g *GammaSDK) transformMarketData(item map[string]interface{}) Market {
	market := Market{}

	// Use json.Unmarshal for proper type conversion
	itemBytes, _ := json.Marshal(item)
	json.Unmarshal(itemBytes, &market)

	// Parse JSON array fields that might be strings
	if outcomes, ok := item["outcomes"]; ok {
		market.Outcomes = g.parseJSONArray(outcomes)
	}

	if outcomePrices, ok := item["outcomePrices"]; ok {
		market.OutcomePrices = g.parseJSONArray(outcomePrices)
	}

	if clobTokenIds, ok := item["clobTokenIds"]; ok {
		market.ClobTokenIDs = g.parseJSONArray(clobTokenIds)
	}

	return market
}

// transformEventData transforms event data to parse JSON string fields in nested markets
func (g *GammaSDK) transformEventData(item map[string]interface{}) Event {
	event := Event{}

	// Use json.Unmarshal for proper type conversion
	itemBytes, _ := json.Marshal(item)
	json.Unmarshal(itemBytes, &event)

	// Transform nested markets
	if marketsData, ok := item["markets"]; ok {
		if markets, ok := marketsData.([]interface{}); ok {
			event.Markets = make([]EventMarket, len(markets))
			for i, marketItem := range markets {
				if marketMap, ok := marketItem.(map[string]interface{}); ok {
					market := EventMarket{}
					marketBytes, _ := json.Marshal(marketMap)
					json.Unmarshal(marketBytes, &market)

					// Parse JSON array fields
					if outcomes, ok := marketMap["outcomes"]; ok {
						market.Outcomes = g.parseJSONArray(outcomes)
					}

					if outcomePrices, ok := marketMap["outcomePrices"]; ok {
						market.OutcomePrices = g.parseJSONArray(outcomePrices)
					}

					if clobTokenIds, ok := marketMap["clobTokenIds"]; ok {
						market.ClobTokenIDs = g.parseJSONArray(clobTokenIds)
					}

					event.Markets[i] = market
				}
			}
		}
	}

	return event
}

// Health check
// GetHealth performs a health check on the Gamma API
func (g *GammaSDK) GetHealth() (map[string]interface{}, error) {
	resp, err := g.makeRequest("GET", "/health", nil)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if resp.Data != nil {
		if err := json.Unmarshal(resp.Data, &result); err != nil {
			return nil, fmt.Errorf("failed to unmarshal health response: %w", err)
		}
	}

	return result, nil
}

// Teams API
// GetTeams gets list of teams with optional filtering
func (g *GammaSDK) GetTeams(query *TeamQuery) ([]Team, error) {
	if query == nil {
		query = &TeamQuery{}
	}

	resp, err := g.makeRequest("GET", "/teams", query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalTeamsResponse(resp, "Get teams")
}

// Tags API
// GetTags gets list of tags with optional filtering
func (g *GammaSDK) GetTags(query TagQuery) ([]UpdatedTag, error) {
	resp, err := g.makeRequest("GET", "/tags", query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalTagsResponse(resp, "Get tags")
}

// GetTagById gets a specific tag by ID
func (g *GammaSDK) GetTagById(id int, query *TagByIdQuery) (*UpdatedTag, error) {
	if query == nil {
		query = &TagByIdQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/tags/%d", id), query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalTagResponse(resp, "Get tag by ID")
}

// GetTagBySlug gets a specific tag by slug
func (g *GammaSDK) GetTagBySlug(slug string, query *TagByIdQuery) (*UpdatedTag, error) {
	if query == nil {
		query = &TagByIdQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/tags/slug/%s", slug), query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalTagResponse(resp, "Get tag by slug")
}

// GetRelatedTagsRelationshipsByTagId gets related tags relationships by tag ID
func (g *GammaSDK) GetRelatedTagsRelationshipsByTagId(id int, query *RelatedTagsQuery) ([]RelatedTagRelationship, error) {
	if query == nil {
		query = &RelatedTagsQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/tags/%d/related-tags", id), query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalRelatedTagRelationshipsResponse(resp, "Get related tags relationships")
}

// GetRelatedTagsRelationshipsByTagSlug gets related tags relationships by tag slug
func (g *GammaSDK) GetRelatedTagsRelationshipsByTagSlug(slug string, query *RelatedTagsQuery) ([]RelatedTagRelationship, error) {
	if query == nil {
		query = &RelatedTagsQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/tags/slug/%s/related-tags", slug), query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalRelatedTagRelationshipsResponse(resp, "Get related tags relationships")
}

// GetTagsRelatedToTagId gets tags related to a tag ID
func (g *GammaSDK) GetTagsRelatedToTagId(id int, query *RelatedTagsQuery) ([]UpdatedTag, error) {
	if query == nil {
		query = &RelatedTagsQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/tags/%d/related-tags/tags", id), query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalTagsResponse(resp, "Get related tags")
}

// GetTagsRelatedToTagSlug gets tags related to a tag slug
func (g *GammaSDK) GetTagsRelatedToTagSlug(slug string, query *RelatedTagsQuery) ([]UpdatedTag, error) {
	if query == nil {
		query = &RelatedTagsQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/tags/slug/%s/related-tags/tags", slug), query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalTagsResponse(resp, "Get related tags")
}

// Events API
// GetEvents gets list of events with optional filtering
func (g *GammaSDK) GetEvents(query *UpdatedEventQuery) ([]Event, error) {
	if query == nil {
		query = &UpdatedEventQuery{}
	}

	resp, err := g.makeRequest("GET", "/events", query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalEventsResponse(resp, "Get events")
}

// GetEventsPaginated gets paginated list of events
func (g *GammaSDK) GetEventsPaginated(query PaginatedEventQuery) (*PaginatedEventsResponse, error) {
	resp, err := g.makeRequest("GET", "/events/pagination", query)
	if err != nil {
		return nil, err
	}

	data, err := g.extractResponseData(resp, "Get paginated events")
	if err != nil {
		return nil, err
	}

	// Parse the paginated response
	var rawResponse struct {
		Data       []map[string]interface{} `json:"data"`
		Pagination Pagination               `json:"pagination"`
	}

	if err := json.Unmarshal(data, &rawResponse); err != nil {
		return nil, fmt.Errorf("failed to unmarshal paginated events response: %w", err)
	}

	// Transform each event
	events := make([]Event, len(rawResponse.Data))
	for i, item := range rawResponse.Data {
		events[i] = g.transformEventData(item)
	}

	return &PaginatedEventsResponse{
		Data:       events,
		Pagination: rawResponse.Pagination,
	}, nil
}

// GetEventById gets a specific event by ID
func (g *GammaSDK) GetEventById(id int, query *EventByIdQuery) (*Event, error) {
	if query == nil {
		query = &EventByIdQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/events/%d", id), query)
	if err != nil {
		return nil, err
	}

	if resp.Status == 404 {
		return nil, nil
	}

	data, err := g.extractResponseData(resp, "Get event by ID")
	if err != nil {
		return nil, err
	}

	// Parse and transform the event
	var rawEvent map[string]interface{}
	if err := json.Unmarshal(data, &rawEvent); err != nil {
		return nil, fmt.Errorf("failed to unmarshal event data: %w", err)
	}

	event := g.transformEventData(rawEvent)
	return &event, nil
}

// GetEventTags gets tags for a specific event
func (g *GammaSDK) GetEventTags(id int) ([]UpdatedTag, error) {
	resp, err := g.makeRequest("GET", fmt.Sprintf("/events/%d/tags", id), nil)
	if err != nil {
		return nil, err
	}

	return g.unmarshalTagsResponse(resp, "Get event tags")
}

// GetEventBySlug gets a specific event by slug
func (g *GammaSDK) GetEventBySlug(slug string, query *EventByIdQuery) (*Event, error) {
	if query == nil {
		query = &EventByIdQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/events/slug/%s", slug), query)
	if err != nil {
		return nil, err
	}

	if resp.Status == 404 {
		return nil, nil
	}

	data, err := g.extractResponseData(resp, "Get event by slug")
	if err != nil {
		return nil, err
	}

	// Parse and transform the event
	var rawEvent map[string]interface{}
	if err := json.Unmarshal(data, &rawEvent); err != nil {
		return nil, fmt.Errorf("failed to unmarshal event data: %w", err)
	}

	event := g.transformEventData(rawEvent)
	return &event, nil
}

// Markets API
// GetMarkets gets list of markets with optional filtering
func (g *GammaSDK) GetMarkets(query *UpdatedMarketQuery) ([]Market, error) {
	if query == nil {
		query = &UpdatedMarketQuery{}
	}

	resp, err := g.makeRequest("GET", "/markets", query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalMarketsResponse(resp, "Get markets")
}

// GetMarketById gets a specific market by ID
func (g *GammaSDK) GetMarketById(id int, query *MarketByIdQuery) (*Market, error) {
	if query == nil {
		query = &MarketByIdQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/markets/%d", id), query)
	if err != nil {
		return nil, err
	}

	if resp.Status == 404 {
		return nil, nil
	}

	data, err := g.extractResponseData(resp, "Get market by ID")
	if err != nil {
		return nil, err
	}

	// Parse and transform the market
	var rawMarket map[string]interface{}
	if err := json.Unmarshal(data, &rawMarket); err != nil {
		return nil, fmt.Errorf("failed to unmarshal market data: %w", err)
	}

	market := g.transformMarketData(rawMarket)
	return &market, nil
}

// GetMarketTags gets tags for a specific market
func (g *GammaSDK) GetMarketTags(id int) ([]UpdatedTag, error) {
	resp, err := g.makeRequest("GET", fmt.Sprintf("/markets/%d/tags", id), nil)
	if err != nil {
		return nil, err
	}

	return g.unmarshalTagsResponse(resp, "Get market tags")
}

// GetMarketBySlug gets a specific market by slug
func (g *GammaSDK) GetMarketBySlug(slug string, query *MarketByIdQuery) (*Market, error) {
	if query == nil {
		query = &MarketByIdQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/markets/slug/%s", slug), query)
	if err != nil {
		return nil, err
	}

	if resp.Status == 404 {
		return nil, nil
	}

	data, err := g.extractResponseData(resp, "Get market by slug")
	if err != nil {
		return nil, err
	}

	// Parse and transform the market
	var rawMarket map[string]interface{}
	if err := json.Unmarshal(data, &rawMarket); err != nil {
		return nil, fmt.Errorf("failed to unmarshal market data: %w", err)
	}

	market := g.transformMarketData(rawMarket)
	return &market, nil
}

// Series API
// GetSeries gets list of series with filtering and pagination
func (g *GammaSDK) GetSeries(query SeriesQuery) ([]Series, error) {
	resp, err := g.makeRequest("GET", "/series", query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalSeriesResponse(resp, "Get series")
}

// GetSeriesById gets a specific series by ID
func (g *GammaSDK) GetSeriesById(id int, query *SeriesByIdQuery) (*Series, error) {
	if query == nil {
		query = &SeriesByIdQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/series/%d", id), query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalSeriesSingleResponse(resp, "Get series by ID")
}

// Comments API
// GetComments gets list of comments with optional filtering
func (g *GammaSDK) GetComments(query *CommentQuery) ([]Comment, error) {
	if query == nil {
		query = &CommentQuery{}
	}

	resp, err := g.makeRequest("GET", "/comments", query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalCommentsResponse(resp, "Get comments")
}

// GetCommentsByCommentId gets comments by comment ID
func (g *GammaSDK) GetCommentsByCommentId(id int, query *CommentByIdQuery) ([]Comment, error) {
	if query == nil {
		query = &CommentByIdQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/comments/%d", id), query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalCommentsResponse(resp, "Get comments by comment ID")
}

// GetCommentsByUserAddress gets comments by user address
func (g *GammaSDK) GetCommentsByUserAddress(userAddress string, query *CommentsByUserQuery) ([]Comment, error) {
	if query == nil {
		query = &CommentsByUserQuery{}
	}

	resp, err := g.makeRequest("GET", fmt.Sprintf("/comments/user_address/%s", userAddress), query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalCommentsResponse(resp, "Get comments by user address")
}

// Search API
// Search searches across markets, events, and profiles
func (g *GammaSDK) Search(query SearchQuery) (*SearchResponse, error) {
	resp, err := g.makeRequest("GET", "/public-search", query)
	if err != nil {
		return nil, err
	}

	return g.unmarshalSearchResponse(resp, "Search")
}

// Convenience methods for common use cases

// GetActiveEvents gets active events
func (g *GammaSDK) GetActiveEvents(query *UpdatedEventQuery) ([]Event, error) {
	if query == nil {
		query = &UpdatedEventQuery{}
	}

	active := true
	query.Active = &active
	return g.GetEvents(query)
}

// GetClosedEvents gets closed events
func (g *GammaSDK) GetClosedEvents(query *UpdatedEventQuery) ([]Event, error) {
	if query == nil {
		query = &UpdatedEventQuery{}
	}

	closed := true
	query.Closed = &closed
	return g.GetEvents(query)
}

// GetFeaturedEvents gets featured events
func (g *GammaSDK) GetFeaturedEvents(query *UpdatedEventQuery) ([]Event, error) {
	if query == nil {
		query = &UpdatedEventQuery{}
	}

	featured := true
	query.Featured = &featured
	return g.GetEvents(query)
}

// GetActiveMarkets gets active markets
func (g *GammaSDK) GetActiveMarkets(query *UpdatedMarketQuery) ([]Market, error) {
	if query == nil {
		query = &UpdatedMarketQuery{}
	}

	active := true
	query.Active = &active
	return g.GetMarkets(query)
}

// GetClosedMarkets gets closed markets
func (g *GammaSDK) GetClosedMarkets(query *UpdatedMarketQuery) ([]Market, error) {
	if query == nil {
		query = &UpdatedMarketQuery{}
	}

	closed := true
	query.Closed = &closed
	return g.GetMarkets(query)
}

// TestProxyIP tests the current IP address by making requests to IP detection services
// This method is useful for verifying that proxy configuration is working correctly
func (g *GammaSDK) TestProxyIP() (*IPResponse, error) {
	// List of IP detection services to try (in order of preference)
	services := []string{
		"https://ipinfo.io/json",
		"https://api.ipify.org?format=json",
		"https://api.my-ip.io/v1/ip",
		"https://checkip.amazonaws.com",
	}

	for _, service := range services {
		// Create HTTP request
		req, err := http.NewRequest("GET", service, nil)
		if err != nil {
			continue
		}

		// Set headers
		req.Header.Set("User-Agent", "gamma-go-sdk/1.0")
		req.Header.Set("Accept", "application/json")

		// Make request using the configured HTTP client (with proxy)
		resp, err := g.httpClient.Do(req)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			continue
		}

		// Read response body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			continue
		}

		// Parse JSON response
		var ipResp IPResponse
		if err := json.Unmarshal(body, &ipResp); err != nil {
			// For simple IP services that just return the IP as plain text
			ipResp.IP = strings.TrimSpace(string(body))
		}

		// Validate that we got an IP address
		if ipResp.IP != "" && ipResp.IP != "0.0.0.0" {
			return &ipResp, nil
		}
	}

	return nil, fmt.Errorf("failed to get IP address from any detection service")
}

// TestProxyIPComparison compares IP addresses with and without proxy
// Returns direct IP, proxy IP, and whether they differ
func (g *GammaSDK) TestProxyIPComparison() (*struct {
	DirectIP   *IPResponse `json:"direct_ip"`
	ProxyIP    *IPResponse `json:"proxy_ip"`
	UsingProxy bool        `json:"using_proxy"`
}, error) {
	// Create direct client (no proxy)
	directClient := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Get direct IP
	var directIP *IPResponse
	services := []string{
		"https://ipinfo.io/json",
		"https://api.ipify.org?format=json",
		"https://api.my-ip.io/v1/ip",
	}

	for _, service := range services {
		req, err := http.NewRequest("GET", service, nil)
		if err != nil {
			continue
		}

		req.Header.Set("User-Agent", "gamma-go-sdk/1.0")
		resp, err := directClient.Do(req)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			continue
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			continue
		}

		var ipResp IPResponse
		if err := json.Unmarshal(body, &ipResp); err != nil {
			ipResp.IP = strings.TrimSpace(string(body))
		}

		if ipResp.IP != "" && ipResp.IP != "0.0.0.0" {
			directIP = &ipResp
			break
		}
	}

	// Get proxy IP using configured client
	proxyIP, err := g.TestProxyIP()
	if err != nil {
		return nil, fmt.Errorf("failed to get proxy IP: %w", err)
	}

	// Determine if proxy is being used
	usingProxy := false
	if directIP != nil && proxyIP != nil {
		usingProxy = directIP.IP != proxyIP.IP
	}

	return &struct {
		DirectIP   *IPResponse `json:"direct_ip"`
		ProxyIP    *IPResponse `json:"proxy_ip"`
		UsingProxy bool        `json:"using_proxy"`
	}{
		DirectIP:   directIP,
		ProxyIP:    proxyIP,
		UsingProxy: usingProxy,
	}, nil
}
