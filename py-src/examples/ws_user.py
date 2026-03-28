"""Example: Subscribe to Polymarket user channel WebSocket.

Requires L2 API credentials (derived from private key via TradingClient).

Usage:
    POLYMARKET_PRIVATE_KEY=0x... uv run python py-src/examples/ws_user.py

    # Optionally filter by condition ID:
    POLYMARKET_PRIVATE_KEY=0x... uv run python py-src/examples/ws_user.py <condition_id>

Prints order and trade events for your account in real-time.
"""

import asyncio
import os
import sys

from polymarket_kit.ws import OrderEvent, PolymarketWebSocket, TradeEvent
from polymarket_kit.clob.trading import TradingClient


def on_order(evt: OrderEvent) -> None:
    print(
        f"[ORDER] {evt.type:12s} id={evt.id[:16]}... "
        f"side={evt.side} price={evt.price} size={evt.original_size} "
        f"matched={evt.size_matched} status={evt.status} type={evt.order_type}"
    )


def on_trade(evt: TradeEvent) -> None:
    print(
        f"[TRADE] {evt.status:10s} id={evt.id[:16]}... "
        f"side={evt.side} price={evt.price} size={evt.size} "
        f"role={evt.trader_side}"
    )


async def main(condition_ids: list[str]) -> None:
    private_key = os.environ.get("POLYMARKET_PRIVATE_KEY", "")
    funder = os.environ.get("POLYMARKET_FUNDER", "")
    if not private_key:
        print("Error: POLYMARKET_PRIVATE_KEY env var required")
        sys.exit(1)

    # 先初始化 TradingClient 获取 API credentials
    print("Deriving API credentials...")
    trading = TradingClient(
        private_key=private_key,
        funder=funder,
        signature_type=int(os.environ.get("POLYMARKET_SIGNATURE_TYPE", "0")),
    )
    creds = await trading.initialize()
    print(f"API key: {creds.api_key[:8]}...")

    # 连接 user channel WebSocket
    ws = PolymarketWebSocket("user", api_creds=creds)
    ws.on_order = on_order
    ws.on_trade = on_trade
    ws.on_connect = lambda: print("✓ Connected to user channel")
    ws.on_disconnect = lambda: print("✗ Disconnected")
    ws.on_error = lambda e: print(f"✗ Error: {e}")

    await ws.connect()

    if condition_ids:
        await ws.subscribe_markets(condition_ids)
        print(f"Filtering: {len(condition_ids)} market(s)")

    print("Listening for order/trade events. Ctrl+C to stop.\n")

    try:
        await asyncio.Event().wait()
    except asyncio.CancelledError:
        pass
    finally:
        await ws.close()


if __name__ == "__main__":
    condition_ids = sys.argv[1:]
    try:
        asyncio.run(main(condition_ids))
    except KeyboardInterrupt:
        print("\nDone.")
