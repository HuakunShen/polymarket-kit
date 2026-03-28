package client

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/HuakunShen/polymarket-kit/go-client/order"
	"github.com/HuakunShen/polymarket-kit/go-client/types"
)

// GetOpenOrders retrieves all open orders for the authenticated user.
func (c *ClobClient) GetOpenOrders(params *types.OpenOrderParams) ([]types.OpenOrder, error) {
	if c.creds == nil {
		return nil, fmt.Errorf("API credentials required")
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
	}

	var result []types.OpenOrder
	err = c.getJSONWithHeadersAndParams(GetOpenOrders, headers, queryParams, &result)
	return result, err
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

// PostSignedOrder posts a pre-signed order to the CLOB.
func (c *ClobClient) PostSignedOrder(signedResult *order.SignedOrderResult, orderType types.OrderType) (*types.OrderResponse, error) {
	if c.creds == nil {
		return nil, fmt.Errorf("API credentials required")
	}

	so := signedResult.SignedOrder

	// go-order-utils model.SignedOrder → our types.SignedOrder (string fields)
	side := types.SideBuy
	if so.Side != nil && so.Side.Int64() == 1 {
		side = types.SideSell
	}
	sigType := types.SignatureType(0) // EOA
	if so.SignatureType != nil {
		sigType = types.SignatureType(so.SignatureType.Int64())
	}

	newOrder := types.NewOrder{
		Order: types.SignedOrder{
			Salt:          so.Salt.String(),
			Maker:         so.Maker.Hex(),
			Signer:        so.Signer.Hex(),
			Taker:         so.Taker.Hex(),
			TokenID:       so.TokenId.String(),
			MakerAmount:   so.MakerAmount,
			TakerAmount:   so.TakerAmount,
			Expiration:    so.Expiration.String(),
			Nonce:         so.Nonce.String(),
			FeeRateBps:    so.FeeRateBps.String(),
			Side:          side,
			SignatureType: sigType,
			Signature:     "0x" + hex.EncodeToString(so.Signature),
		},
		OrderType: orderType,
		Owner:     so.Maker.Hex(),
	}

	bodyJSON, err := json.Marshal(newOrder)
	if err != nil {
		return nil, fmt.Errorf("marshal order: %w", err)
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

// CreateAndPostOrder builds, signs, and posts a limit order in one call.
func (c *ClobClient) CreateAndPostOrder(opts order.LimitOrderOpts, orderType types.OrderType) (*types.OrderResponse, error) {
	if c.wallet == nil {
		return nil, fmt.Errorf("wallet required for order creation")
	}
	if c.creds == nil {
		return nil, fmt.Errorf("API credentials required")
	}

	if opts.ChainID == 0 {
		opts.ChainID = int64(c.chainID)
	}

	signed, err := order.BuildSignedLimitOrder(c.wallet.GetPrivateKey(), opts)
	if err != nil {
		return nil, fmt.Errorf("build signed order: %w", err)
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
