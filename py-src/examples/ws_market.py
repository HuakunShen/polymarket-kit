"""Example: Subscribe to Polymarket market channel WebSocket.

Usage:
    uv run python py-src/examples/ws_market.py <asset_id_1> [asset_id_2 ...]

Prints orderbook updates and trades in real-time.
"""

import asyncio
import sys

from polymarket_kit.ws import (
    BookMessage,
    LastTradePriceMessage,
    PolymarketWebSocket,
    PriceChangeMessage,
)


def on_book(msg: BookMessage) -> None:
    n_bids = len(msg.bids)
    n_asks = len(msg.asks)
    best_bid = msg.bids[-1].price if msg.bids else "—"
    best_ask = msg.asks[0].price if msg.asks else "—"
    print(
        f"[BOOK] {msg.asset_id[:16]}... bids={n_bids} asks={n_asks} best_bid={best_bid} best_ask={best_ask}"
    )


def on_price_change(msg: PriceChangeMessage) -> None:
    for pc in msg.price_changes:
        print(
            f"[PRICE] {pc.asset_id[:16]}... {pc.side} {pc.price}×{pc.size} best={pc.best_bid}/{pc.best_ask}"
        )


def on_last_trade(msg: LastTradePriceMessage) -> None:
    print(f"[TRADE] {msg.asset_id[:16]}... {msg.side} {msg.price}×{msg.size}")


async def main(asset_ids: list[str]) -> None:
    ws = PolymarketWebSocket("market")
    ws.on_book = on_book
    ws.on_price_change = on_price_change
    ws.on_last_trade = on_last_trade
    ws.on_connect = lambda: print("✓ Connected to market channel")
    ws.on_disconnect = lambda: print("✗ Disconnected")

    await ws.connect()
    await ws.subscribe(asset_ids)
    print(f"Subscribed to {len(asset_ids)} asset(s). Ctrl+C to stop.\n")

    try:
        await asyncio.Event().wait()  # run forever
    except asyncio.CancelledError:
        pass
    finally:
        await ws.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ws_market.py <asset_id_1> [asset_id_2 ...]")
        sys.exit(1)
    try:
        asyncio.run(main(sys.argv[1:]))
    except KeyboardInterrupt:
        print("\nDone.")
