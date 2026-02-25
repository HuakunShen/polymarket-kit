"""CLOB API client for Polymarket."""

from __future__ import annotations

from typing import Any, Mapping

import httpx
from pydantic import BaseModel

from .models import (
    ClobRequestError,
    PriceHistoryQuery,
    PriceHistoryResponse,
)

DEFAULT_BASE_URL = "https://clob.polymarket.com"
DEFAULT_TIMEOUT = 30.0


def _normalize_params(query: BaseModel | Mapping[str, Any] | None) -> dict[str, Any]:
    """Normalize query parameters for HTTP request."""
    if query is None:
        return {}

    if isinstance(query, BaseModel):
        data = query.model_dump(exclude_none=True, by_alias=True)
    else:
        data = dict(query)

    params: dict[str, Any] = {}
    for key, value in data.items():
        if value is None:
            continue
        if isinstance(value, bool):
            params[key] = "true" if value else "false"
        else:
            params[key] = str(value)

    return params


class ClobClient:
    """Client for Polymarket CLOB API.

    Usage:
        with ClobClient() as client:
            history = client.get_price_history(market="token_id")

        # With proxy
        with ClobClient(proxy="http://user:pass@proxy:8080") as client:
            history = client.get_price_history(market="token_id")
    """

    def __init__(
        self,
        *,
        proxy: str | None = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float | httpx.Timeout = DEFAULT_TIMEOUT,
        headers: Mapping[str, str] | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        if client is not None:
            self._client = client
            self._owns_client = False
            return

        default_headers = {
            "User-Agent": "polymarket-kit/0.1.0",
            "Content-Type": "application/json",
        }
        if headers:
            default_headers.update(dict(headers))

        self._client = httpx.Client(
            base_url=base_url,
            timeout=timeout,
            headers=default_headers,
            proxy=proxy,
        )
        self._owns_client = True

    def __enter__(self) -> "ClobClient":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    @property
    def http_client(self) -> httpx.Client:
        """Get the underlying HTTP client."""
        return self._client

    def close(self) -> None:
        """Close the HTTP client."""
        if self._owns_client:
            self._client.close()

    def _request(
        self, endpoint: str, query: BaseModel | Mapping[str, Any] | None
    ) -> tuple[httpx.Response, Any | None]:
        """Make a GET request to the CLOB API."""
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

    def _get_data(
        self, endpoint: str, query: BaseModel | Mapping[str, Any] | None, operation: str
    ) -> Any:
        """Get data from endpoint, raising on error."""
        response, data = self._request(endpoint, query)
        if not response.is_success:
            raise ClobRequestError(
                f"[ClobClient] {operation} failed: status {response.status_code}",
                status_code=response.status_code,
                error_data=data,
            )
        if data is None:
            raise ClobRequestError(
                f"[ClobClient] {operation} returned no data",
                status_code=response.status_code,
            )
        return data

    def _get_optional_data(
        self, endpoint: str, query: BaseModel | Mapping[str, Any] | None, operation: str
    ) -> Any | None:
        """Get data from endpoint, returning None on 404."""
        response, data = self._request(endpoint, query)
        if response.status_code == 404:
            return None
        if not response.is_success:
            raise ClobRequestError(
                f"[ClobClient] {operation} failed: status {response.status_code}",
                status_code=response.status_code,
                error_data=data,
            )
        return data

    def get_price_history(
        self,
        market: str,
        *,
        interval: str | None = None,
        start_ts: int | None = None,
        end_ts: int | None = None,
        fidelity: int | None = None,
    ) -> PriceHistoryResponse:
        """Fetch price history for a CLOB token.

        Args:
            market: CLOB token ID
            interval: Time interval (max, 1m, 1h, 6h, 1d, 1w)
            start_ts: Start timestamp (Unix seconds)
            end_ts: End timestamp (Unix seconds)
            fidelity: Resolution in minutes

        Returns:
            PriceHistoryResponse with history list
        """
        query = PriceHistoryQuery(
            market=market,
            interval=interval,
            start_ts=start_ts,
            end_ts=end_ts,
            fidelity=fidelity,
        )
        data = self._get_data("/prices-history", query, "Get price history")
        return PriceHistoryResponse.model_validate(data)

    def get_price_history_raw(
        self, query: PriceHistoryQuery | Mapping[str, Any]
    ) -> PriceHistoryResponse:
        """Fetch price history with raw query object.

        Args:
            query: Query parameters as PriceHistoryQuery or dict

        Returns:
            PriceHistoryResponse with history list
        """
        data = self._get_data("/prices-history", query, "Get price history")
        return PriceHistoryResponse.model_validate(data)


# Alias for consistency with GammaSDK
ClobSDK = ClobClient
