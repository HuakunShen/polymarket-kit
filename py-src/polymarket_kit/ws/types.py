"""WebSocket message types for Polymarket CLOB channels."""

from __future__ import annotations

from dataclasses import dataclass, field


# ── Market Channel Messages ──────────────────────────────────────────────────


@dataclass
class OrderLevel:
    """单个价格档位 (bid/ask)."""

    price: str
    size: str


@dataclass
class BookMessage:
    """Orderbook 完整快照 (market channel, event_type='book')."""

    asset_id: str
    market: str
    timestamp: str
    hash: str
    bids: list[OrderLevel] = field(default_factory=list)
    asks: list[OrderLevel] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: dict) -> BookMessage:
        return cls(
            asset_id=d.get("asset_id", ""),
            market=d.get("market", ""),
            timestamp=d.get("timestamp", ""),
            hash=d.get("hash", ""),
            bids=[
                OrderLevel(price=b["price"], size=b["size"]) for b in d.get("bids", [])
            ],
            asks=[
                OrderLevel(price=a["price"], size=a["size"]) for a in d.get("asks", [])
            ],
        )


@dataclass
class PriceChange:
    """单个价格变动."""

    asset_id: str
    price: str
    size: str
    side: str  # "BUY" | "SELL"
    hash: str
    best_bid: str = ""
    best_ask: str = ""


@dataclass
class PriceChangeMessage:
    """Orderbook 增量更新 (market channel, event_type='price_change')."""

    market: str
    timestamp: str
    price_changes: list[PriceChange] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: dict) -> PriceChangeMessage:
        return cls(
            market=d.get("market", ""),
            timestamp=d.get("timestamp", ""),
            price_changes=[
                PriceChange(
                    asset_id=pc.get("asset_id", ""),
                    price=pc.get("price", ""),
                    size=pc.get("size", ""),
                    side=pc.get("side", ""),
                    hash=pc.get("hash", ""),
                    best_bid=pc.get("best_bid", ""),
                    best_ask=pc.get("best_ask", ""),
                )
                for pc in d.get("price_changes", [])
            ],
        )


@dataclass
class LastTradePriceMessage:
    """最新成交价 (market channel, event_type='last_trade_price')."""

    asset_id: str
    market: str
    price: str
    side: str
    size: str
    fee_rate_bps: str = ""
    timestamp: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> LastTradePriceMessage:
        return cls(
            asset_id=d.get("asset_id", ""),
            market=d.get("market", ""),
            price=d.get("price", ""),
            side=d.get("side", ""),
            size=d.get("size", ""),
            fee_rate_bps=d.get("fee_rate_bps", ""),
            timestamp=d.get("timestamp", ""),
        )


@dataclass
class TickSizeChangeMessage:
    """Tick size 变更 (market channel, event_type='tick_size_change')."""

    asset_id: str
    market: str
    old_tick_size: str
    new_tick_size: str
    timestamp: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> TickSizeChangeMessage:
        return cls(
            asset_id=d.get("asset_id", ""),
            market=d.get("market", ""),
            old_tick_size=d.get("old_tick_size", ""),
            new_tick_size=d.get("new_tick_size", ""),
            timestamp=d.get("timestamp", ""),
        )


# ── User Channel Messages ────────────────────────────────────────────────────


@dataclass
class OrderEvent:
    """Order 事件 (user channel, event_type='order').

    type: PLACEMENT | UPDATE | CANCELLATION
    status: LIVE | MATCHED | CANCELED | ...
    """

    id: str
    type: str  # PLACEMENT | UPDATE | CANCELLATION
    market: str
    asset_id: str
    side: str  # BUY | SELL
    status: str  # LIVE | MATCHED | CANCELED
    price: str
    original_size: str
    size_matched: str
    order_type: str = ""  # GTC | GTD | FOK
    owner: str = ""
    timestamp: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> OrderEvent:
        return cls(
            id=d.get("id", ""),
            type=d.get("type", ""),
            market=d.get("market", ""),
            asset_id=d.get("asset_id", ""),
            side=d.get("side", ""),
            status=d.get("status", ""),
            price=d.get("price", ""),
            original_size=d.get("original_size", ""),
            size_matched=d.get("size_matched", ""),
            order_type=d.get("order_type", ""),
            owner=d.get("owner", ""),
            timestamp=d.get("timestamp", ""),
        )


@dataclass
class MakerOrder:
    """Maker order detail within a trade event."""

    order_id: str = ""
    maker_address: str = ""
    matched_amount: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> MakerOrder:
        return cls(
            order_id=d.get("order_id", d.get("orderId", "")),
            maker_address=d.get("maker_address", d.get("makerAddress", "")),
            matched_amount=d.get("matched_amount", d.get("matchedAmount", "")),
        )


@dataclass
class TradeEvent:
    """Trade 事件 (user channel, event_type='trade').

    status: MATCHED | MINED | CONFIRMED | RETRYING | FAILED
    trader_side: TAKER | MAKER
    """

    id: str
    taker_order_id: str
    market: str
    side: str  # BUY | SELL
    size: str
    price: str
    status: str  # MATCHED | MINED | CONFIRMED | FAILED | RETRYING
    trader_side: str = ""  # TAKER | MAKER
    maker_orders: list[MakerOrder] = field(default_factory=list)
    timestamp: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> TradeEvent:
        return cls(
            id=d.get("id", ""),
            taker_order_id=d.get("taker_order_id", d.get("takerOrderId", "")),
            market=d.get("market", ""),
            side=d.get("side", ""),
            size=d.get("size", ""),
            price=d.get("price", ""),
            status=d.get("status", ""),
            trader_side=d.get("trader_side", d.get("traderSide", "")),
            maker_orders=[
                MakerOrder.from_dict(m)
                for m in d.get("maker_orders", d.get("makerOrders", []))
            ],
            timestamp=d.get("timestamp", ""),
        )


# ── Auth / Subscription ──────────────────────────────────────────────────────


@dataclass
class ApiCreds:
    """L2 API credentials for authenticated WebSocket connections."""

    api_key: str
    secret: str
    passphrase: str
