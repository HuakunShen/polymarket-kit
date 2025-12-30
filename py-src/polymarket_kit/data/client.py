"""
Polymarket Data API SDK Client

A fully typed wrapper SDK for the Polymarket Data API endpoints.
Provides type-safe methods for all available API operations including
health checks, positions, trades, user activity, holders, and more.
"""

from __future__ import annotations

from typing import Any, Mapping

import httpx
from pydantic import BaseModel, TypeAdapter

from .models import (
    Activity,
    ClosedPosition,
    ClosedPositionsQuery,
    DataHealthResponse,
    DataTrade,
    LiveVolumeQuery,
    LiveVolumeResponse,
    MetaHolder,
    OpenInterest,
    OpenInterestQuery,
    Position,
    PositionsQuery,
    ProxyConfig,
    TradesQuery,
    TotalMarketsTraded,
    TotalMarketsTradedQuery,
    TotalValue,
    TotalValueQuery,
    TopHoldersQuery,
    UserActivityQuery,
)

DEFAULT_BASE_URL = "https://data-api.polymarket.com"
DEFAULT_TIMEOUT = 30.0


class DataRequestError(RuntimeError):
    def __init__(self, message: str, *, status_code: int, error_data: Any | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error_data = error_data


def _stringify_param(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def _normalize_params(query: Any) -> dict[str, Any]:
    if query is None:
        return {}

    if isinstance(query, BaseModel):
        data = query.model_dump(exclude_none=True)
    else:
        data = dict(query)

    params: dict[str, Any] = {}
    for key, value in data.items():
        if value is None:
            continue
        if isinstance(value, (list, tuple, set)):
            # For lists, httpx will handle multiple values with the same key
            params[key] = [_stringify_param(item) for item in value if item is not None]
        else:
            params[key] = _stringify_param(value)

    return params


class DataClient:
    """
    Polymarket Data API SDK for user data and on-chain activities

    This SDK provides a comprehensive interface to the Polymarket Data API
    covering all available endpoints for user data, holdings, positions,
    trades, activity, and market analytics.
    """

    def __init__(
        self,
        *,
        proxy: ProxyConfig | str | None = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float | httpx.Timeout = DEFAULT_TIMEOUT,
        headers: Mapping[str, str] | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        if client is not None:
            self._client = client
            self._owns_client = False
            return

        proxy_url: str | None = None
        if isinstance(proxy, ProxyConfig):
            proxy_url = proxy.to_url()
        elif isinstance(proxy, str):
            proxy_url = proxy

        default_headers = {"User-Agent": "polymarket-kit/0.1.0", "Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)

        self._client = httpx.Client(
            base_url=base_url,
            timeout=timeout,
            headers=default_headers,
            proxy=proxy_url,
        )
        self._owns_client = True

    def __enter__(self) -> "DataClient":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    @property
    def http_client(self) -> httpx.Client:
        return self._client

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def _request(self, endpoint: str, query: BaseModel | Mapping[str, Any] | None) -> tuple[httpx.Response, Any | None]:
        response = self._client.get(endpoint, params=_normalize_params(query))
        if response.status_code == 204:
            return response, None

        data: Any | None = None
        if response.content:
            try:
                data = response.json()
            except ValueError:
                data = response.text

        return response, data

    def _get_data(self, endpoint: str, query: BaseModel | Mapping[str, Any] | None, operation: str) -> Any:
        response, data = self._request(endpoint, query)
        if not response.is_success:
            raise DataRequestError(
                f"[DataSDK] {operation} failed: status {response.status_code}",
                status_code=response.status_code,
                error_data=data,
            )
        if data is None:
            raise DataRequestError(
                f"[DataSDK] {operation} returned null data despite successful response",
                status_code=response.status_code,
            )
        return data

    # Health Check API
    def health_check(self) -> DataHealthResponse:
        """
        Health check for the Data API

        Returns:
            DataHealthResponse: Health check response

        Raises:
            DataRequestError: When API request fails

        Example:
            ```python
            health = data.health_check()
            print(health.data)  # "OK"
            ```
        """
        data = self._get_data("/", None, "Health check")
        return DataHealthResponse.model_validate(data)

    # Positions API
    def get_current_positions(self, query: PositionsQuery | Mapping[str, Any]) -> list[Position]:
        """
        Get current positions for a user

        Args:
            query: Query parameters including required user address

        Returns:
            list[Position]: Array of position objects

        Raises:
            DataRequestError: When API request fails

        Example:
            ```python
            positions = data.get_current_positions({
                "user": "0x123...",
                "limit": 50
            })
            ```
        """
        data = self._get_data("/positions", query, "Get current positions")
        return TypeAdapter(list[Position]).validate_python(data)

    def get_closed_positions(self, query: ClosedPositionsQuery | Mapping[str, Any]) -> list[ClosedPosition]:
        """
        Get closed positions for a user

        Args:
            query: Query parameters including required user address

        Returns:
            list[ClosedPosition]: Array of closed position objects

        Raises:
            DataRequestError: When API request fails

        Example:
            ```python
            closed_positions = data.get_closed_positions({
                "user": "0x123...",
                "limit": 50
            })
            ```
        """
        data = self._get_data("/closed-positions", query, "Get closed positions")
        return TypeAdapter(list[ClosedPosition]).validate_python(data)

    # Trades API
    def get_trades(self, query: TradesQuery | Mapping[str, Any] | None = None) -> list[DataTrade]:
        """
        Get trades for a user or markets

        Args:
            query: Optional query parameters for filtering and pagination

        Returns:
            list[DataTrade]: Array of trade objects

        Raises:
            DataRequestError: When API request fails

        Example:
            ```python
            trades = data.get_trades({
                "user": "0x123...",
                "limit": 100,
                "side": "BUY"
            })
            ```
        """
        data = self._get_data("/trades", query, "Get trades")
        return TypeAdapter(list[DataTrade]).validate_python(data)

    # User Activity API
    def get_user_activity(self, query: UserActivityQuery | Mapping[str, Any]) -> list[Activity]:
        """
        Get user activity

        Args:
            query: Query parameters including required user address

        Returns:
            list[Activity]: Array of activity objects

        Raises:
            DataRequestError: When API request fails

        Example:
            ```python
            activity = data.get_user_activity({
                "user": "0x123...",
                "limit": 100,
                "type": "TRADE"
            })
            ```
        """
        data = self._get_data("/activity", query, "Get user activity")
        return TypeAdapter(list[Activity]).validate_python(data)

    # Holders API
    def get_top_holders(self, query: TopHoldersQuery | Mapping[str, Any]) -> list[MetaHolder]:
        """
        Get top holders for markets

        Args:
            query: Query parameters including required market array

        Returns:
            list[MetaHolder]: Array of meta holder objects

        Raises:
            DataRequestError: When API request fails

        Example:
            ```python
            holders = data.get_top_holders({
                "market": ["0xabc...", "0xdef..."],
                "limit": 50,
                "minBalance": 10
            })
            ```
        """
        data = self._get_data("/holders", query, "Get top holders")
        return TypeAdapter(list[MetaHolder]).validate_python(data)

    # Value API
    def get_total_value(self, query: TotalValueQuery | Mapping[str, Any]) -> list[TotalValue]:
        """
        Get total value of a user's positions

        Args:
            query: Query parameters including required user address

        Returns:
            list[TotalValue]: Total value response

        Raises:
            DataRequestError: When API request fails

        Example:
            ```python
            total_value = data.get_total_value({
                "user": "0x123...",
                "market": ["0xabc..."]  # optional
            })
            ```
        """
        data = self._get_data("/value", query, "Get total value")
        return TypeAdapter(list[TotalValue]).validate_python(data)

    # Markets Traded API
    def get_total_markets_traded(self, query: TotalMarketsTradedQuery | Mapping[str, Any]) -> TotalMarketsTraded:
        """
        Get total markets a user has traded

        Args:
            query: Query parameters including required user address

        Returns:
            TotalMarketsTraded: Total markets traded response

        Raises:
            DataRequestError: When API request fails

        Example:
            ```python
            total_markets = data.get_total_markets_traded({
                "user": "0x123..."
            })
            print(total_markets.traded)  # number of markets traded
            ```
        """
        data = self._get_data("/traded", query, "Get total markets traded")
        return TotalMarketsTraded.model_validate(data)

    # Open Interest API
    def get_open_interest(self, query: OpenInterestQuery | Mapping[str, Any]) -> list[OpenInterest]:
        """
        Get open interest for markets

        Args:
            query: Query parameters including required market array

        Returns:
            list[OpenInterest]: Array of open interest objects

        Raises:
            DataRequestError: When API request fails

        Example:
            ```python
            open_interest = data.get_open_interest({
                "market": ["0xabc...", "0xdef..."]
            })
            ```
        """
        data = self._get_data("/oi", query, "Get open interest")
        return TypeAdapter(list[OpenInterest]).validate_python(data)

    # Live Volume API
    def get_live_volume(self, query: LiveVolumeQuery | Mapping[str, Any]) -> LiveVolumeResponse:
        """
        Get live volume for an event

        Args:
            query: Query parameters including required event ID

        Returns:
            LiveVolumeResponse: Live volume response

        Raises:
            DataRequestError: When API request fails

        Example:
            ```python
            live_volume = data.get_live_volume({
                "id": 12345
            })
            print(live_volume.total)  # total volume
            print(live_volume.markets)  # array of market volumes
            ```
        """
        data = self._get_data("/live-volume", query, "Get live volume")
        return LiveVolumeResponse.model_validate(data)

    # Convenience methods for common use cases

    def get_all_positions(
        self,
        user: str,
        options: Mapping[str, Any] | None = None,
    ) -> dict[str, list[Position] | list[ClosedPosition]]:
        """
        Get all positions (current and closed) for a user

        Args:
            user: User address
            options: Optional query parameters

        Returns:
            dict with 'current' and 'closed' keys containing position lists

        Example:
            ```python
            all_positions = data.get_all_positions("0x123...", {
                "limit": 100
            })
            ```
        """
        query_base: dict[str, Any] = {"user": user}
        if options:
            query_base.update(options)

        current, closed = (
            self.get_current_positions(query_base),
            self.get_closed_positions(query_base),
        )

        return {"current": current, "closed": closed}

    def get_portfolio_summary(self, user: str) -> dict[str, Any]:
        """
        Get comprehensive user portfolio summary

        Args:
            user: User address

        Returns:
            dict with 'totalValue', 'marketsTraded', and 'currentPositions' keys

        Example:
            ```python
            portfolio = data.get_portfolio_summary("0x123...")
            print(portfolio["totalValue"])
            print(portfolio["marketsTraded"])
            ```
        """
        total_value, markets_traded, current_positions = (
            self.get_total_value(TotalValueQuery(user=user)),
            self.get_total_markets_traded(TotalMarketsTradedQuery(user=user)),
            self.get_current_positions(PositionsQuery(user=user)),
        )

        return {
            "totalValue": total_value,
            "marketsTraded": markets_traded,
            "currentPositions": current_positions,
        }


DataSDK = DataClient

if __name__ == "__main__":
    data = DataClient()
    print(data.health_check())
