package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"

	"github.com/HuakunShen/polymarket-kit/go-client/order"
	"github.com/HuakunShen/polymarket-kit/go-client/types"
)

// GetOpenOrders retrieves all open orders for the authenticated user.
//
// CLOB returns `/data/orders` as a paginated envelope
// `{data: [...], next_cursor, limit, count}`; we walk the cursor and
// accumulate. py-clob-client.client.get_orders does the exact same thing
// (vendors/py-clob-client/py_clob_client/client.py:750+).
func (c *ClobClient) GetOpenOrders(params *types.OpenOrderParams) ([]types.OpenOrder, error) {
	if c.creds == nil {
		return nil, fmt.Errorf("API credentials required")
	}

	const (
		endCursor = "LTE=" // CLOB sentinel for "end of pagination"
		// maxPages caps the cursor walk to bound a buggy / hostile server
		// that returns a non-terminal cursor that never advances. 200 pages
		// at the default 100-orders-per-page = 20k orders, well above any
		// realistic open-order count for a single account.
		maxPages = 200
	)
	cursor := "MA==" // start
	var all []types.OpenOrder

	for page := 0; cursor != endCursor; page++ {
		if page >= maxPages {
			return all, fmt.Errorf("GetOpenOrders: bailed after %d pages (cursor=%q); server may be misbehaving", page, cursor)
		}
		headerArgs := &types.L2HeaderArgs{
			Method:      "GET",
			RequestPath: GetOpenOrders,
		}
		headers, err := c.createL2Headers(headerArgs)
		if err != nil {
			return nil, fmt.Errorf("create L2 headers: %w", err)
		}

		queryParams := url.Values{}
		queryParams.Set("next_cursor", cursor)
		if params != nil {
			if params.ID != nil {
				queryParams.Add("id", *params.ID)
			}
			if params.Market != nil {
				queryParams.Add("market", *params.Market)
			}
			if params.AssetID != nil {
				queryParams.Add("asset_id", *params.AssetID)
			}
			if params.Limit != nil {
				queryParams.Set("limit", strconv.Itoa(*params.Limit))
			}
		}

		var page struct {
			Data       []types.OpenOrder `json:"data"`
			NextCursor string            `json:"next_cursor"`
			Limit      int               `json:"limit"`
			Count      int               `json:"count"`
		}
		if err := c.getJSONWithHeadersAndParams(GetOpenOrders, headers, queryParams, &page); err != nil {
			return nil, err
		}
		all = append(all, page.Data...)
		if page.NextCursor == "" || page.NextCursor == cursor {
			break // server didn't advance — stop to avoid infinite loop
		}
		cursor = page.NextCursor
	}
	return all, nil
}

// CancelOrder cancels a specific order by its order ID.
func (c *ClobClient) CancelOrder(orderID string) error {
	if c.creds == nil {
		return fmt.Errorf("API credentials required")
	}

	body := map[string]string{"orderID": orderID}
	return c.deleteWithBody(CancelOrder, body)
}

// CancelAll cancels all open orders.
func (c *ClobClient) CancelAll() error {
	if c.creds == nil {
		return fmt.Errorf("API credentials required")
	}

	headerArgs := &types.L2HeaderArgs{
		Method:      "DELETE",
		RequestPath: CancelAll,
	}
	headers, err := c.createL2Headers(headerArgs)
	if err != nil {
		return fmt.Errorf("create L2 headers: %w", err)
	}

	_, err = c.deleteWithHeaders(CancelAll, headers)
	return err
}

// CancelOrders cancels multiple orders by ID.
func (c *ClobClient) CancelOrders(orderIDs []string) error {
	if c.creds == nil {
		return fmt.Errorf("API credentials required")
	}

	body := map[string][]string{"orderIDs": orderIDs}
	return c.deleteWithBody(CancelOrders, body)
}

// bytesToHex returns the lowercase hex of b without 0x prefix.
func bytesToHex(b []byte) string {
	const hexdigits = "0123456789abcdef"
	out := make([]byte, len(b)*2)
	for i, v := range b {
		out[i*2] = hexdigits[v>>4]
		out[i*2+1] = hexdigits[v&0x0f]
	}
	return string(out)
}

// BuildPostOrderBody constructs the JSON body that PostSignedOrder will send,
// without performing the network call. Lets callers persist the exact
// payload alongside the eventual CLOB response.
func (c *ClobClient) BuildPostOrderBody(signedResult *order.SignedOrderResult, orderType types.OrderType) (*types.NewOrder, []byte, error) {
	if c.creds == nil {
		return nil, nil, fmt.Errorf("API credentials required")
	}

	in := signedResult.Inputs
	side := types.Side(signedResult.Side)
	if side == "" {
		side = types.SideBuy
	}

	newOrder := &types.NewOrder{
		Order: types.SignedOrder{
			Salt:          in.Salt.Uint64(),
			Maker:         in.Maker.Hex(),
			Signer:        in.Signer.Hex(),
			TokenID:       in.TokenID.String(),
			MakerAmount:   in.MakerAmount.String(),
			TakerAmount:   in.TakerAmount.String(),
			Side:          side,
			SignatureType: types.SignatureType(in.SignatureType),
			Timestamp:     in.Timestamp.String(),
			Expiration:    signedResult.Expiration,
			Metadata:      "0x" + bytesToHex(in.Metadata[:]),
			Builder:       "0x" + bytesToHex(in.Builder[:]),
			Signature:     signedResult.Signature,
		},
		OrderType: orderType,
		// Owner must be the API key UUID (creds.Key), not the wallet address.
		Owner: c.creds.Key,
	}
	bodyJSON, err := json.Marshal(newOrder)
	if err != nil {
		return nil, nil, fmt.Errorf("marshal order: %w", err)
	}
	return newOrder, bodyJSON, nil
}

// PostSignedOrder posts a pre-signed order to the CLOB.
func (c *ClobClient) PostSignedOrder(signedResult *order.SignedOrderResult, orderType types.OrderType) (*types.OrderResponse, error) {
	newOrder, bodyJSON, err := c.BuildPostOrderBody(signedResult, orderType)
	if err != nil {
		return nil, err
	}

	headerArgs := &types.L2HeaderArgs{
		Method:      "POST",
		RequestPath: PostOrder,
		Body:        string(bodyJSON),
	}
	headers, err := c.createL2Headers(headerArgs)
	if err != nil {
		return nil, fmt.Errorf("create L2 headers: %w", err)
	}

	var result types.OrderResponse
	err = c.postJSONWithHeaders(PostOrder, headers, newOrder, &result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

// CreateSignedLimitOrder builds and signs a limit order without posting it.
// Returns the signed order (including the EIP-712 hash, used by Polymarket as
// the venue order ID). Callers can persist a pending DB row keyed on the
// hash before invoking PostSignedOrder — this gives crash-safety and lets
// concurrent user-channel trade events resolve to the right local order even
// if the trade fires before the CLOB POST returns.
func (c *ClobClient) CreateSignedLimitOrder(opts order.LimitOrderOpts) (*order.SignedOrderResult, error) {
	if c.wallet == nil {
		return nil, fmt.Errorf("wallet required for order creation")
	}

	if opts.ChainID == 0 {
		opts.ChainID = int64(c.chainID)
	}

	signed, err := order.BuildSignedLimitOrder(c.wallet.GetPrivateKey(), opts)
	if err != nil {
		return nil, fmt.Errorf("build signed order: %w", err)
	}
	return signed, nil
}

// CreateSignedMarketOrder builds and signs a V2 market order (FOK / FAK).
// For BUY, opts.Amount is the USDC budget; for SELL, it's the share count.
// See order.MarketOrderOpts for the full contract.
func (c *ClobClient) CreateSignedMarketOrder(opts order.MarketOrderOpts) (*order.SignedOrderResult, error) {
	if c.wallet == nil {
		return nil, fmt.Errorf("wallet required for order creation")
	}
	if opts.ChainID == 0 {
		opts.ChainID = int64(c.chainID)
	}
	signed, err := order.BuildSignedMarketOrder(c.wallet.GetPrivateKey(), opts)
	if err != nil {
		return nil, fmt.Errorf("build signed market order: %w", err)
	}
	return signed, nil
}

// CreateAndPostOrder builds, signs, and posts a limit order in one call.
func (c *ClobClient) CreateAndPostOrder(opts order.LimitOrderOpts, orderType types.OrderType) (*types.OrderResponse, error) {
	if c.creds == nil {
		return nil, fmt.Errorf("API credentials required")
	}

	signed, err := c.CreateSignedLimitOrder(opts)
	if err != nil {
		return nil, err
	}

	return c.PostSignedOrder(signed, orderType)
}

// deleteWithBody performs an authenticated DELETE request with a JSON body.
func (c *ClobClient) deleteWithBody(endpoint string, body any) error {
	bodyJSON, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal body: %w", err)
	}

	headerArgs := &types.L2HeaderArgs{
		Method:      "DELETE",
		RequestPath: endpoint,
		Body:        string(bodyJSON),
	}
	headers, err := c.createL2Headers(headerArgs)
	if err != nil {
		return fmt.Errorf("create L2 headers: %w", err)
	}

	req, err := http.NewRequest("DELETE", c.host+endpoint, bytes.NewReader(bodyJSON))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	c.addHeadersToRequest(req, headers)

	if c.geoBlockToken != "" {
		q := req.URL.Query()
		q.Add("geo_block_token", c.geoBlockToken)
		req.URL.RawQuery = q.Encode()
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}
