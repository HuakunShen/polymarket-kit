"""Example: Place and cancel a GTC limit order on Polymarket.

Usage:
    POLYMARKET_PRIVATE_KEY=0x... uv run python py-src/examples/place_limit_order.py <token_id> <price> <size>

Example:
    POLYMARKET_PRIVATE_KEY=0x... uv run python py-src/examples/place_limit_order.py \
        71321045679252212594626385532706912750332728571942532289631379312455583992563 \
        0.01 10.0
"""

import asyncio
import os
import sys

from polymarket_kit.clob.trading import TradingClient


async def main(token_id: str, price: float, size: float) -> None:
    private_key = os.environ.get("POLYMARKET_PRIVATE_KEY", "")
    funder = os.environ.get("POLYMARKET_FUNDER", "")
    if not private_key:
        print("Error: POLYMARKET_PRIVATE_KEY env var required")
        sys.exit(1)

    client = TradingClient(
        private_key=private_key,
        funder=funder,
        signature_type=int(os.environ.get("POLYMARKET_SIGNATURE_TYPE", "0")),
    )

    print("Initializing (deriving API credentials)...")
    creds = await client.initialize()
    print(f"API key: {creds.api_key[:8]}...")

    # 查看现有 open orders
    open_orders = await client.get_open_orders()
    print(f"\nOpen orders: {len(open_orders)}")

    # 下单
    print(
        f"\nPlacing GTC limit BUY: token={token_id[:20]}... price={price} size={size}"
    )
    resp = await client.place_limit_order(token_id, price=price, size=size, side="BUY")
    print(
        f"Result: success={resp.success} order_id={resp.order_id} status={resp.status}"
    )
    print(f"Latency: {resp.latency_ms:.0f}ms")

    if not resp.success:
        print(f"Error: {resp.error}")
        return

    # 查询订单状态
    print("\nQuerying order status...")
    status = await client.get_order(resp.order_id)
    if status:
        print(
            f"Status: {status.get('status', '?')} matched: {status.get('size_matched', '?')}"
        )

    # 取消
    print(f"\nCancelling order {resp.order_id[:16]}...")
    cancelled = await client.cancel_order(resp.order_id)
    print(f"Cancelled: {cancelled}")

    # 再查一次
    open_orders = await client.get_open_orders()
    print(f"\nOpen orders after cancel: {len(open_orders)}")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python place_limit_order.py <token_id> <price> <size>")
        sys.exit(1)

    token_id = sys.argv[1]
    price = float(sys.argv[2])
    size = float(sys.argv[3])

    try:
        asyncio.run(main(token_id, price, size))
    except KeyboardInterrupt:
        print("\nCancelled.")
