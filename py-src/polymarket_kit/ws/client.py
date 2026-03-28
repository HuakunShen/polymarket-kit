"""Async WebSocket client for Polymarket CLOB market and user channels."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Callable, Literal

import websockets
from websockets.asyncio.client import ClientConnection

from .types import (
    ApiCreds,
    BookMessage,
    LastTradePriceMessage,
    OrderEvent,
    PriceChangeMessage,
    TickSizeChangeMessage,
    TradeEvent,
)

logger = logging.getLogger(__name__)

WS_BASE_URL = "wss://ws-subscriptions-clob.polymarket.com/ws"
PING_INTERVAL_S = 10
RECONNECT_BASE_S = 1.0
RECONNECT_MAX_S = 30.0


class PolymarketWebSocket:
    """Async WebSocket client for Polymarket CLOB.

    Supports two channel types:
    - ``"market"``: public orderbook data (book, price_change, last_trade_price)
    - ``"user"``: authenticated order/trade events (requires ``api_creds``)

    Usage::

        ws = PolymarketWebSocket("market")
        ws.on_book = lambda msg: print(msg)
        await ws.connect()
        await ws.subscribe(["<asset_id_1>", "<asset_id_2>"])
        # ... runs until ws.close() is called

    User channel::

        ws = PolymarketWebSocket("user", api_creds=ApiCreds(...))
        ws.on_order = lambda evt: print(evt)
        ws.on_trade = lambda evt: print(evt)
        await ws.connect()
    """

    def __init__(
        self,
        channel: Literal["market", "user"],
        *,
        api_creds: ApiCreds | None = None,
        url: str | None = None,
    ) -> None:
        if channel == "user" and api_creds is None:
            raise ValueError("api_creds required for user channel")

        self._channel = channel
        self._api_creds = api_creds
        self._url = url or f"{WS_BASE_URL}/{channel}"

        # 回调
        self.on_book: Callable[[BookMessage], Any] | None = None
        self.on_price_change: Callable[[PriceChangeMessage], Any] | None = None
        self.on_last_trade: Callable[[LastTradePriceMessage], Any] | None = None
        self.on_tick_size_change: Callable[[TickSizeChangeMessage], Any] | None = None
        self.on_order: Callable[[OrderEvent], Any] | None = None
        self.on_trade: Callable[[TradeEvent], Any] | None = None
        self.on_error: Callable[[Exception], Any] | None = None
        self.on_connect: Callable[[], Any] | None = None
        self.on_disconnect: Callable[[], Any] | None = None
        # 通用 raw message 回调 (for debugging)
        self.on_raw_message: Callable[[dict], Any] | None = None

        self._conn: ClientConnection | None = None
        self._read_task: asyncio.Task[None] | None = None
        self._ping_task: asyncio.Task[None] | None = None
        self._reconnect_task: asyncio.Task[None] | None = None
        self._closing = False
        self._subscribed_assets: list[str] = []
        self._subscribed_markets: list[str] = []

    @property
    def connected(self) -> bool:
        return self._conn is not None

    # ── Public API ────────────────────────────────────────────────────────

    async def connect(self) -> None:
        """Connect and start read + ping loops. Auto-reconnects on failure."""
        self._closing = False
        await self._do_connect()

    async def close(self) -> None:
        """Gracefully close the connection."""
        self._closing = True
        for task in (self._read_task, self._ping_task, self._reconnect_task):
            if task and not task.done():
                task.cancel()
        if self._conn:
            await self._conn.close()
            self._conn = None

    async def subscribe(self, asset_ids: list[str]) -> None:
        """Subscribe to market channel asset IDs (additive)."""
        if self._channel != "market":
            raise ValueError(
                "subscribe() is for market channel; use subscribe_markets() for user channel"
            )
        self._subscribed_assets.extend(asset_ids)
        if self._conn:
            await self._send_market_subscribe(asset_ids)

    async def unsubscribe(self, asset_ids: list[str]) -> None:
        """Unsubscribe from market channel asset IDs."""
        if self._channel != "market":
            raise ValueError("unsubscribe() is for market channel")
        self._subscribed_assets = [
            a for a in self._subscribed_assets if a not in asset_ids
        ]
        if self._conn:
            msg = {"operation": "unsubscribe", "assets_ids": asset_ids}
            await self._conn.send(json.dumps(msg))

    async def subscribe_markets(self, condition_ids: list[str]) -> None:
        """Subscribe to user channel market filter (additive)."""
        if self._channel != "user":
            raise ValueError("subscribe_markets() is for user channel")
        self._subscribed_markets.extend(condition_ids)
        if self._conn:
            msg = {"operation": "subscribe", "markets": condition_ids}
            await self._conn.send(json.dumps(msg))

    async def unsubscribe_markets(self, condition_ids: list[str]) -> None:
        """Unsubscribe from user channel markets."""
        if self._channel != "user":
            raise ValueError("unsubscribe_markets() is for user channel")
        self._subscribed_markets = [
            m for m in self._subscribed_markets if m not in condition_ids
        ]
        if self._conn:
            msg = {"operation": "unsubscribe", "markets": condition_ids}
            await self._conn.send(json.dumps(msg))

    # ── Internal ──────────────────────────────────────────────────────────

    async def _do_connect(self) -> None:
        """Establish WebSocket connection and send initial subscription."""
        try:
            self._conn = await websockets.connect(self._url)
            logger.info("Connected to %s", self._url)

            # 初始订阅
            if self._channel == "market":
                if self._subscribed_assets:
                    await self._send_market_subscribe(self._subscribed_assets)
            else:
                await self._send_user_subscribe()

            if self.on_connect:
                self.on_connect()

            # 启动 read + ping loops
            self._read_task = asyncio.create_task(self._read_loop())
            self._ping_task = asyncio.create_task(self._ping_loop())
        except Exception as e:
            logger.error("Connection failed: %s", e)
            if not self._closing:
                self._schedule_reconnect()

    async def _send_market_subscribe(self, asset_ids: list[str]) -> None:
        if not self._conn:
            return
        msg = {
            "assets_ids": asset_ids,
            "type": "market",
        }
        await self._conn.send(json.dumps(msg))
        logger.debug("Market subscribe: %d assets", len(asset_ids))

    async def _send_user_subscribe(self) -> None:
        if not self._conn or not self._api_creds:
            return
        msg: dict[str, Any] = {
            "auth": {
                "apiKey": self._api_creds.api_key,
                "secret": self._api_creds.secret,
                "passphrase": self._api_creds.passphrase,
            },
            "type": "user",
        }
        if self._subscribed_markets:
            msg["markets"] = self._subscribed_markets
        await self._conn.send(json.dumps(msg))
        logger.debug("User subscribe sent")

    async def _read_loop(self) -> None:
        """Read messages from WebSocket and dispatch to callbacks."""
        assert self._conn is not None
        try:
            async for raw in self._conn:
                if isinstance(raw, bytes):
                    raw = raw.decode("utf-8")

                # PONG 回复
                if raw == "PONG":
                    continue

                try:
                    data = json.loads(raw)
                except json.JSONDecodeError:
                    logger.warning("Non-JSON message: %s", raw[:200])
                    continue

                if self.on_raw_message:
                    self.on_raw_message(data)

                self._dispatch(data)

        except websockets.ConnectionClosed as e:
            logger.warning("Connection closed: %s", e)
        except asyncio.CancelledError:
            return
        except Exception as e:
            logger.error("Read loop error: %s", e)
            if self.on_error:
                self.on_error(e)

        # 连接断开
        self._conn = None
        if self.on_disconnect:
            self.on_disconnect()
        if not self._closing:
            self._schedule_reconnect()

    async def _ping_loop(self) -> None:
        """Send PING every 10s to keep connection alive."""
        try:
            while self._conn and not self._closing:
                await asyncio.sleep(PING_INTERVAL_S)
                if self._conn:
                    try:
                        await self._conn.send("PING")
                    except Exception:
                        break
        except asyncio.CancelledError:
            return

    def _schedule_reconnect(self) -> None:
        """Schedule reconnection with exponential backoff."""
        if self._closing:
            return
        if self._reconnect_task and not self._reconnect_task.done():
            return
        self._reconnect_task = asyncio.create_task(self._reconnect_loop())

    async def _reconnect_loop(self) -> None:
        delay = RECONNECT_BASE_S
        while not self._closing:
            logger.info("Reconnecting in %.1fs...", delay)
            await asyncio.sleep(delay)
            if self._closing:
                return
            try:
                await self._do_connect()
                return  # 成功
            except Exception as e:
                logger.error("Reconnect failed: %s", e)
                delay = min(delay * 2, RECONNECT_MAX_S)

    def _dispatch(self, data: dict) -> None:
        """根据 event_type 分发到对应 callback."""
        event_type = data.get("event_type", "")

        if event_type == "book" and self.on_book:
            self.on_book(BookMessage.from_dict(data))
        elif event_type == "price_change" and self.on_price_change:
            self.on_price_change(PriceChangeMessage.from_dict(data))
        elif event_type == "last_trade_price" and self.on_last_trade:
            self.on_last_trade(LastTradePriceMessage.from_dict(data))
        elif event_type == "tick_size_change" and self.on_tick_size_change:
            self.on_tick_size_change(TickSizeChangeMessage.from_dict(data))
        elif event_type == "order" and self.on_order:
            self.on_order(OrderEvent.from_dict(data))
        elif event_type == "trade" and self.on_trade:
            self.on_trade(TradeEvent.from_dict(data))
        elif event_type:
            logger.debug("Unhandled event_type: %s", event_type)
