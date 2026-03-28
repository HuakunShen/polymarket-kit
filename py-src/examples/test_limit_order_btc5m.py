"""Test: Place limit orders on both UP and DOWN of the next BTC 5m event.

1. 从环境变量加载 Polymarket 凭证 (POLYMARKET_ACCOUNT_1_*)
2. 找到下一个尚未开始的 BTC 5m event
3. 获取 UP 和 DOWN 的 token IDs
4. 在两边各挂 0.5 share @ $0.47 GTC limit buy
5. 打印订单状态
6. 等待用户确认后 cancel

Usage:
    source env.sh && uv run python vendors/polymarket-kit/py-src/examples/test_limit_order_btc5m.py
"""

from __future__ import annotations

import asyncio
import os
import sys
import time

from polymarket_kit import GammaClient
from polymarket_kit.clob.trading import TradingClient
from polymarket_kit.ws import PolymarketWebSocket


def next_5m_slot_epoch() -> int:
    """计算下一个 5m event 的 start timestamp (Unix seconds, 对齐到 300s 边界)."""
    now = int(time.time())
    current_slot = now // 300 * 300
    return current_slot + 300


def build_slug(symbol: str, interval: str, epoch_s: int) -> str:
    return f"{symbol.lower()}-updown-{interval}-{epoch_s}"


async def main() -> None:
    # ── 1. 从环境变量加载凭证 (account 1) ────────────────────────────────
    private_key = os.environ.get("POLYMARKET_ACCOUNT_1_PRIVATE_KEY", "")
    funder = os.environ.get("POLYMARKET_ACCOUNT_1_FUNDER", "")

    if not private_key:
        print("Error: POLYMARKET_ACCOUNT_1_PRIVATE_KEY not set.")
        print("Run: source env.sh")
        sys.exit(1)

    print("Using account 1:")
    print(f"  private_key: {private_key[:10]}...")
    print(f"  funder: {funder[:10]}..." if funder else "  funder: (none)")

    # ── 2. 初始化 TradingClient ──────────────────────────────────────────
    print("\nInitializing TradingClient (deriving L2 API creds)...")
    trading = TradingClient(
        private_key=private_key,
        funder=funder,
        signature_type=1,  # Magic/email wallet
    )
    creds = await trading.initialize()
    print(f"  API key: {creds.api_key[:12]}...")

    # ── 3. 找下一个 BTC 5m event ─────────────────────────────────────────
    next_epoch = next_5m_slot_epoch()
    slug = build_slug("btc", "5m", next_epoch)
    print(f"\nNext BTC 5m event slug: {slug}")
    print(
        f"  Start time: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(next_epoch))}"
    )
    print(f"  Starts in: {next_epoch - int(time.time())}s")

    # Fetch event from Gamma API
    print("\nFetching event from Gamma API...")
    gamma = GammaClient()
    event = gamma.get_event_by_slug(slug)

    if event is None:
        # 还没创建, 试 current slot
        current_epoch = next_epoch - 300
        slug = build_slug("btc", "5m", current_epoch)
        print(f"  Next event not found, trying current: {slug}")
        event = gamma.get_event_by_slug(slug)

    if event is None:
        print("Error: Could not find BTC 5m event.")
        return

    print(f"  Event: {event.slug}")
    print(f"  Title: {event.title}")

    if not event.markets:
        print("Error: No markets found for this event")
        return

    market = event.markets[0]
    if len(market.clobTokenIds) < 2:
        print(f"Error: Expected 2 token IDs, got {len(market.clobTokenIds)}")
        return

    up_token = market.clobTokenIds[0]
    down_token = market.clobTokenIds[1]
    print(f"\n  UP token:   {up_token[:20]}...")
    print(f"  DOWN token: {down_token[:20]}...")
    print(f"  Condition:  {market.conditionId[:20]}...")

    # ── 4. 下单参数 ──────────────────────────────────────────────────────
    price = 0.45
    size = 5.0  # minimum order size on Polymarket is 5 shares
    cost_each = price * size
    print(f"\n{'=' * 60}")
    print("Order plan:")
    print(f"  BUY {size} shares UP  @ ${price:.2f} = ${cost_each:.3f}")
    print(f"  BUY {size} shares DOWN @ ${price:.2f} = ${cost_each:.3f}")
    print(f"  Total cost if both fill: ${cost_each * 2:.3f}")
    print(f"  Win payout: ${size:.2f} (one side resolves to $1)")
    print(f"  Net PnL if one fills: ${size - cost_each * 2:.3f}")
    print(f"{'=' * 60}")

    # ── 5. 连接 user channel WebSocket (后台监听) ────────────────────────
    ws = PolymarketWebSocket("user", api_creds=creds)
    ws.on_order = lambda evt: print(
        f"  [WS ORDER] {evt.type} side={evt.side} price={evt.price} status={evt.status}"
    )
    ws.on_trade = lambda evt: print(
        f"  [WS TRADE] {evt.status} side={evt.side} price={evt.price} size={evt.size}"
    )
    await ws.connect()
    await ws.subscribe_markets([market.conditionId])
    print("\nUser channel WebSocket connected, listening for events...")

    # ── 6. 挂单 ──────────────────────────────────────────────────────────
    print(f"\nPlacing UP limit order: {size} shares @ ${price:.2f}...")
    resp_up = await trading.place_limit_order(
        up_token, price=price, size=size, side="BUY", neg_risk=True
    )
    up_id = resp_up.order_id[:16] if resp_up.order_id else "N/A"
    print(
        f"  Result: success={resp_up.success} id={up_id}... latency={resp_up.latency_ms:.0f}ms"
    )
    if not resp_up.success:
        print(f"  Error: {resp_up.error}")

    print(f"\nPlacing DOWN limit order: {size} shares @ ${price:.2f}...")
    resp_down = await trading.place_limit_order(
        down_token, price=price, size=size, side="BUY", neg_risk=True
    )
    down_id = resp_down.order_id[:16] if resp_down.order_id else "N/A"
    print(
        f"  Result: success={resp_down.success} id={down_id}... latency={resp_down.latency_ms:.0f}ms"
    )
    if not resp_down.success:
        print(f"  Error: {resp_down.error}")

    # ── 7. 查看 open orders ──────────────────────────────────────────────
    await asyncio.sleep(1)
    open_orders = await trading.get_open_orders()
    print(f"\nOpen orders: {len(open_orders)}")
    for o in open_orders:
        print(
            f"  {o.get('side', '?'):4s} price={o.get('price', '?')} "
            f"size={o.get('original_size', '?')} "
            f"matched={o.get('size_matched', '?')} status={o.get('status', '?')}"
        )

    # ── 8. 等待 15 秒观察 WS 事件, 然后 cancel ─────────────────────────
    print("\n" + "=" * 60)
    print("Orders are LIVE. Waiting 15s for WS events, then cancelling...")
    print("=" * 60)

    await asyncio.sleep(15)

    # ── 9. Cancel ─────────────────────────────────────────────────────────
    print("\nCancelling all orders...")
    cancelled = await trading.cancel_all()
    print(f"  Cancel all: {cancelled}")

    await asyncio.sleep(1)
    open_orders = await trading.get_open_orders()
    print(f"  Open orders after cancel: {len(open_orders)}")

    await ws.close()
    print("\nDone!")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nCancelled.")
