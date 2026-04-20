"""Example: Polymarket Data API — leaderboards and user data.

Usage:
    uv run python py-src/examples/data_example.py
"""

from polymarket_kit.data import (
    DataClient,
    BuilderLeaderboardQuery,
    BuilderVolumeQuery,
    TraderLeaderboardQuery,
)


def main() -> None:
    client = DataClient()

    # ── 1. Health check ───────────────────────────────────────────────────────
    print("1. Health check")
    health = client.health_check()
    print(f"   {health.data}")

    # ── 2. Trader leaderboard ─────────────────────────────────────────────────
    print("\n2. Trader leaderboard — top 5 by PnL this week")
    traders = client.get_trader_leaderboard(
        TraderLeaderboardQuery(
            category="OVERALL",
            timePeriod="WEEK",
            orderBy="PNL",
            limit=5,
        )
    )
    for t in traders:
        print(
            f"   #{t.rank}  {t.userName or t.proxyWallet or 'anon'}"
            f"  pnl={t.pnl}  vol={t.vol}"
        )

    # ── 3. Trader leaderboard by volume ───────────────────────────────────────
    print("\n3. Trader leaderboard — top 5 by volume (all time)")
    vol_traders = client.get_trader_leaderboard(
        TraderLeaderboardQuery(timePeriod="ALL", orderBy="VOL", limit=5)
    )
    for t in vol_traders:
        print(f"   #{t.rank}  vol={t.vol}")

    # ── 4. Builder leaderboard ────────────────────────────────────────────────
    print("\n4. Builder leaderboard (this month)")
    builders = client.get_aggregated_builder_leaderboard(
        BuilderLeaderboardQuery(timePeriod="MONTH", limit=5)
    )
    for b in builders:
        print(
            f"   #{b.rank}  {b.builder or 'unknown'}"
            f"  volume={b.volume}  active_users={b.activeUsers}"
        )

    # ── 5. Builder daily volume timeseries ────────────────────────────────────
    print("\n5. Builder daily volume timeseries (this week)")
    volume_series = client.get_daily_builder_volume_timeseries(
        BuilderVolumeQuery(timePeriod="WEEK")
    )
    print(f"   {len(volume_series)} entries")
    for entry in volume_series[:3]:
        print(f"   {entry.dt}  {entry.builder}  volume={entry.volume}")


if __name__ == "__main__":
    main()
