"""
Polymarket Data API Python SDK Example

This example demonstrates how to use the Polymarket Data API Python client
to fetch user positions, trades, activity, and market analytics.

To run this example:
    python examples/data/data_example.py

Or install the package first:
    pip install -e .
    # or
    uv pip install -e .
"""

from __future__ import annotations

# Import after path setup
from polymarket_kit.data import (  # noqa: E402
    DataClient,
    PositionsQuery,
    TradesQuery,
    UserActivityQuery,
)


def main() -> None:
    print("Testing Python Polymarket Data SDK")

    with DataClient() as client:
        print("\n1. Testing health check...")
        try:
            health = client.health_check()
            print(f"OK: Health check passed: {health.data}")
        except Exception as exc:
            print(f"Health check failed: {exc}")

        # Note: The following examples require a valid user address
        # Replace with an actual user address to test these endpoints
        test_user = "0x440DA1E647bE59E5C8990f191b2dB7b2cE20b69e"  # Placeholder

        print("\n2. Testing get current positions...")
        try:
            positions = client.get_current_positions(PositionsQuery(user=test_user, limit=10))
            print(f"OK: Found {len(positions)} positions")
            if positions:
                pos = positions[0]
                print(f"   First position: {pos.title}")
                print(f"   Size: {pos.size}, PnL: {pos.cashPnl}")
        except Exception as exc:
            print(f"Failed to get positions: {exc}")

        print("\n3. Testing get trades...")
        try:
            trades = client.get_trades(TradesQuery(limit=10))
            print(f"OK: Found {len(trades)} trades")
            if trades:
                trade = trades[0]
                print(f"   First trade: {trade.side} {trade.size} @ {trade.price}")
                print(f"   Market: {trade.title}")
        except Exception as exc:
            print(f"Failed to get trades: {exc}")

        print("\n4. Testing get user activity...")
        try:
            activity = client.get_user_activity(UserActivityQuery(user=test_user, limit=10))
            print(f"OK: Found {len(activity)} activities")
            if activity:
                act = activity[0]
                print(f"   First activity: {act.type} - {act.title}")
        except Exception as exc:
            print(f"Failed to get user activity: {exc}")

        print("\n5. Testing convenience methods...")
        try:
            all_positions = client.get_all_positions(test_user, {"limit": 5})
            print(f"OK: Current positions: {len(all_positions['current'])}")
            print(f"   Closed positions: {len(all_positions['closed'])}")
        except Exception as exc:
            print(f"Failed to get all positions: {exc}")

        try:
            portfolio = client.get_portfolio_summary(test_user)
            print("OK: Portfolio summary retrieved")
            print(f"   Total value entries: {len(portfolio['totalValue'])}")
            print(f"   Markets traded: {portfolio['marketsTraded'].traded}")
            print(f"   Current positions: {len(portfolio['currentPositions'])}")
        except Exception as exc:
            print(f"Failed to get portfolio summary: {exc}")

    print("\nData SDK demo completed!")  # noqa: F541


if __name__ == "__main__":
    main()

