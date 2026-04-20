"""Integration tests for GammaClient — hit live Polymarket Gamma API."""

import pytest

from polymarket_kit.gamma import (
    GammaClient,
    EventsKeysetQuery,
    MarketsKeysetQuery,
    UpdatedEventQuery,
    UpdatedMarketQuery,
)


@pytest.fixture(scope="module")
def client() -> GammaClient:
    return GammaClient()


@pytest.fixture(scope="module")
def active_event(client: GammaClient):
    events = client.get_events(UpdatedEventQuery(limit=1, active=True))
    assert events, "no active events found — cannot run fixture-dependent tests"
    return events[0]


@pytest.fixture(scope="module")
def active_market(client: GammaClient):
    markets = client.get_markets(UpdatedMarketQuery(limit=1, active=True))
    assert markets, "no active markets found — cannot run fixture-dependent tests"
    return markets[0]


# ── Events ───────────────────────────────────────────────────────────────────

def test_get_events_returns_list(client: GammaClient) -> None:
    events = client.get_events(UpdatedEventQuery(limit=3, active=True))
    assert len(events) > 0
    assert events[0].id
    assert events[0].slug


def test_get_event_by_id(client: GammaClient, active_event) -> None:
    event = client.get_event_by_id(int(active_event.id))
    assert event is not None
    assert event.id == active_event.id


def test_get_event_by_slug(client: GammaClient, active_event) -> None:
    event = client.get_event_by_slug(active_event.slug)
    assert event is not None
    assert event.slug == active_event.slug


def test_get_events_keyset(client: GammaClient) -> None:
    result = client.get_events_keyset(EventsKeysetQuery(limit=5, active=True))
    assert len(result.data) > 0
    assert result.data[0].id


def test_get_events_keyset_pagination(client: GammaClient) -> None:
    page1 = client.get_events_keyset(EventsKeysetQuery(limit=3))
    assert len(page1.data) > 0
    if page1.next_cursor is None:
        pytest.skip("no next_cursor returned — keyset pagination not available")
    page2 = client.get_events_keyset(
        EventsKeysetQuery(limit=3, after_cursor=page1.next_cursor)
    )
    assert isinstance(page2.data, list)


def test_get_active_events(client: GammaClient) -> None:
    events = client.get_active_events(UpdatedEventQuery(limit=3))
    assert len(events) > 0
    assert all(e.active for e in events)


# ── Markets ──────────────────────────────────────────────────────────────────

def test_get_markets_returns_list(client: GammaClient) -> None:
    markets = client.get_markets(UpdatedMarketQuery(limit=3, active=True))
    assert len(markets) > 0
    assert markets[0].id


def test_get_market_by_id(client: GammaClient, active_market) -> None:
    market = client.get_market_by_id(int(active_market.id))
    assert market is not None
    assert market.id == active_market.id


def test_get_market_by_slug(client: GammaClient, active_market) -> None:
    market = client.get_market_by_slug(active_market.slug)
    assert market is not None
    assert market.slug == active_market.slug


def test_get_markets_keyset(client: GammaClient) -> None:
    result = client.get_markets_keyset(MarketsKeysetQuery(limit=5, active=True))
    assert len(result.data) > 0
    assert result.data[0].id


def test_get_markets_keyset_pagination(client: GammaClient) -> None:
    page1 = client.get_markets_keyset(MarketsKeysetQuery(limit=3))
    assert len(page1.data) > 0
    if page1.next_cursor is None:
        pytest.skip("no next_cursor returned — keyset pagination not available")
    page2 = client.get_markets_keyset(
        MarketsKeysetQuery(limit=3, after_cursor=page1.next_cursor)
    )
    assert isinstance(page2.data, list)


def test_get_active_markets(client: GammaClient) -> None:
    markets = client.get_active_markets(UpdatedMarketQuery(limit=3))
    assert len(markets) > 0
    assert all(m.active for m in markets)


# ── Tags ─────────────────────────────────────────────────────────────────────

def test_get_tags(client: GammaClient) -> None:
    tags = client.get_tags({"limit": 5})
    assert len(tags) > 0
    assert tags[0].id


def test_get_tag_by_slug(client: GammaClient) -> None:
    tag = client.get_tag_by_slug("politics")
    if tag is None:
        pytest.skip("'politics' tag not found")
    assert tag.slug == "politics"
