"""Authenticated CLOB trading client for Polymarket.

Thin async wrapper around ``py_clob_client`` for order placement, cancellation,
and status queries. All blocking py_clob_client calls are bridged to a thread pool
via ``asyncio.to_thread()``.

Usage::

    client = TradingClient(private_key="0x...", funder="0x...")
    creds = await client.initialize()
    # creds can be reused for WebSocket user channel auth

    resp = await client.place_limit_order(token_id, price=0.50, size=10.0)
    print(resp)

    await client.cancel_order(resp.order_id)
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any

from ..ws.types import ApiCreds

logger = logging.getLogger(__name__)

CLOB_HOST = "https://clob.polymarket.com"


@dataclass
class OrderResponse:
    """下单结果."""

    success: bool
    order_id: str = ""
    status: str = ""
    error: str = ""
    raw: dict[str, Any] = field(default_factory=dict)
    latency_ms: float = 0.0


class TradingClient:
    """Authenticated async CLOB client for Polymarket order operations.

    Wraps ``py_clob_client.ClobClient`` internally. Call :meth:`initialize` before
    any trading operations to derive L2 API credentials.

    The ``api_creds`` property exposes L2 credentials for reuse with
    :class:`~polymarket_kit.ws.PolymarketWebSocket` user channel.
    """

    def __init__(
        self,
        *,
        private_key: str,
        chain_id: int = 137,
        signature_type: int = 0,
        funder: str = "",
        host: str = CLOB_HOST,
    ) -> None:
        self._private_key = private_key
        self._chain_id = chain_id
        self._signature_type = signature_type
        self._funder = funder
        self._host = host
        self._client: Any = None  # py_clob_client.ClobClient
        self._api_creds: ApiCreds | None = None

    @property
    def api_creds(self) -> ApiCreds:
        """L2 API credentials (available after initialize())."""
        if self._api_creds is None:
            raise RuntimeError("Call initialize() first")
        return self._api_creds

    @property
    def initialized(self) -> bool:
        return self._client is not None

    # ── Lifecycle ─────────────────────────────────────────────────────────

    async def initialize(self) -> ApiCreds:
        """Derive L2 API credentials from private key (L1 → L2 auth).

        Must be called before any trading operations. Returns ``ApiCreds``
        which can be passed to ``PolymarketWebSocket("user", api_creds=...)``.
        """
        from py_clob_client.client import ClobClient

        def _init_sync() -> tuple[Any, ApiCreds]:
            kwargs: dict[str, Any] = {
                "host": self._host,
                "key": self._private_key,
                "chain_id": self._chain_id,
                "signature_type": self._signature_type,
            }
            if self._funder:
                kwargs["funder"] = self._funder

            client = ClobClient(**kwargs)
            raw_creds = client.create_or_derive_api_creds()
            client.set_api_creds(raw_creds)

            creds = ApiCreds(
                api_key=raw_creds.api_key,
                secret=raw_creds.api_secret,
                passphrase=raw_creds.api_passphrase,
            )
            return client, creds

        self._client, self._api_creds = await asyncio.to_thread(_init_sync)
        logger.info(
            "TradingClient initialized (api_key=%s...)",
            self._api_creds.api_key[:8],
        )
        return self._api_creds

    # ── Order Placement ───────────────────────────────────────────────────

    async def place_limit_order(
        self,
        token_id: str,
        price: float,
        size: float,
        side: str = "BUY",
        *,
        neg_risk: bool = True,
    ) -> OrderResponse:
        """Place a GTC limit order.

        Args:
            token_id: CLOB token ID
            price: price per share [0.01, 0.99]
            size: number of shares
            side: "BUY" or "SELL"
            neg_risk: True for crypto up/down markets
        """
        self._ensure_init()
        client = self._client

        def _sync() -> dict[str, Any]:
            from py_clob_client.clob_types import OrderArgs, OrderType
            from py_clob_client.order_builder.constants import BUY, SELL

            side_const = BUY if side.upper() == "BUY" else SELL
            args = OrderArgs(token_id=token_id, price=price, size=size, side=side_const)
            signed = client.create_order(args)
            return client.post_order(signed, OrderType.GTC)  # type: ignore[no-any-return]

        return await self._execute("place_limit_order", _sync)

    async def place_market_order(
        self,
        token_id: str,
        amount: float,
        side: str = "BUY",
        *,
        price: float = 0.0,
    ) -> OrderResponse:
        """Place a FAK (Fill-and-Kill) market order.

        Args:
            token_id: CLOB token ID
            amount: USD amount (BUY) or shares (SELL)
            side: "BUY" or "SELL"
            price: worst acceptable price (slippage protection, 0 = no limit)
        """
        self._ensure_init()
        client = self._client

        def _sync() -> dict[str, Any]:
            from py_clob_client.clob_types import MarketOrderArgs, OrderType
            from py_clob_client.order_builder.constants import BUY, SELL

            side_const = BUY if side.upper() == "BUY" else SELL
            kwargs: dict[str, Any] = {
                "token_id": token_id,
                "amount": amount,
                "side": side_const,
                "order_type": OrderType.FAK,
            }
            if price > 0:
                kwargs["price"] = price
            args = MarketOrderArgs(**kwargs)
            signed = client.create_market_order(args)
            return client.post_order(signed, OrderType.FAK)  # type: ignore[no-any-return]

        return await self._execute("place_market_order", _sync)

    # ── Order Management ──────────────────────────────────────────────────

    async def cancel_order(self, order_id: str) -> bool:
        """Cancel a specific order by order ID."""
        self._ensure_init()

        def _sync() -> bool:
            self._client.cancel(order_id)
            return True

        try:
            return await asyncio.to_thread(_sync)
        except Exception:
            logger.exception("Failed to cancel order %s", order_id)
            return False

    async def cancel_all(self) -> bool:
        """Cancel all open orders."""
        self._ensure_init()

        def _sync() -> bool:
            self._client.cancel_all()
            return True

        try:
            return await asyncio.to_thread(_sync)
        except Exception:
            logger.exception("Failed to cancel all orders")
            return False

    async def get_order(self, order_id: str) -> dict[str, Any] | None:
        """Get order details by order ID. Returns None on error."""
        self._ensure_init()

        def _sync() -> dict[str, Any]:
            return self._client.get_order(order_id)  # type: ignore[no-any-return]

        try:
            return await asyncio.to_thread(_sync)
        except Exception:
            logger.debug("Failed to get order %s", order_id, exc_info=True)
            return None

    async def get_open_orders(self) -> list[dict[str, Any]]:
        """Get all open orders for this account."""
        self._ensure_init()

        def _sync() -> list[dict[str, Any]]:
            from py_clob_client.clob_types import OpenOrderParams

            return self._client.get_orders(OpenOrderParams())  # type: ignore[no-any-return]

        try:
            return await asyncio.to_thread(_sync)
        except Exception:
            logger.exception("Failed to get open orders")
            return []

    # ── Helpers ────────────────────────────────────────────────────────────

    def _ensure_init(self) -> None:
        if self._client is None:
            raise RuntimeError("Call initialize() first")

    async def _execute(
        self,
        op_name: str,
        sync_fn: Any,
    ) -> OrderResponse:
        """Execute a sync order function and wrap result in OrderResponse."""
        try:
            t0 = time.monotonic()
            result = await asyncio.to_thread(sync_fn)
            latency = (time.monotonic() - t0) * 1000
            order_id = result.get("orderID", result.get("id", ""))
            return OrderResponse(
                success=bool(order_id),
                order_id=order_id,
                status=result.get("status", ""),
                raw=result,
                latency_ms=latency,
            )
        except Exception as exc:
            logger.error("%s failed: %s", op_name, exc)
            return OrderResponse(success=False, error=str(exc))
