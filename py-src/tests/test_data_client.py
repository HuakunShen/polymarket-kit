"""Integration tests for DataClient — hit live Polymarket Data API."""

import pytest

from polymarket_kit.data import (
    DataClient,
    BuilderLeaderboardQuery,
    BuilderVolumeQuery,
    TraderLeaderboardQuery,
)


@pytest.fixture(scope="module")
def client() -> DataClient:
    return DataClient()


# ── Health ───────────────────────────────────────────────────────────────────

def test_health_check(client: DataClient) -> None:
    result = client.health_check()
    assert result.data


# ── Trader leaderboard ────────────────────────────────────────────────────────

def test_get_trader_leaderboard_default(client: DataClient) -> None:
    result = client.get_trader_leaderboard()
    assert isinstance(result, list)


def test_get_trader_leaderboard_with_options(client: DataClient) -> None:
    result = client.get_trader_leaderboard(
        TraderLeaderboardQuery(
            category="OVERALL",
            timePeriod="WEEK",
            orderBy="PNL",
            limit=10,
        )
    )
    assert isinstance(result, list)
    assert len(result) <= 10


def test_get_trader_leaderboard_vol_order(client: DataClient) -> None:
    result = client.get_trader_leaderboard(
        TraderLeaderboardQuery(orderBy="VOL", limit=5)
    )
    assert isinstance(result, list)


# ── Builder leaderboard ───────────────────────────────────────────────────────

def test_get_aggregated_builder_leaderboard_default(client: DataClient) -> None:
    result = client.get_aggregated_builder_leaderboard()
    assert isinstance(result, list)


def test_get_aggregated_builder_leaderboard_with_period(client: DataClient) -> None:
    result = client.get_aggregated_builder_leaderboard(
        BuilderLeaderboardQuery(timePeriod="WEEK", limit=10)
    )
    assert isinstance(result, list)
    assert len(result) <= 10


# ── Builder volume timeseries ─────────────────────────────────────────────────

def test_get_daily_builder_volume_timeseries_default(client: DataClient) -> None:
    result = client.get_daily_builder_volume_timeseries()
    assert isinstance(result, list)


def test_get_daily_builder_volume_timeseries_with_period(client: DataClient) -> None:
    result = client.get_daily_builder_volume_timeseries(
        BuilderVolumeQuery(timePeriod="WEEK")
    )
    assert isinstance(result, list)
