"""Example: Polymarket Gamma API — events, markets, and keyset pagination.

Usage:
    uv run python py-src/examples/gamma_example.py
"""

from polymarket_kit.gamma import (
    GammaClient,
    EventsKeysetQuery,
    MarketsKeysetQuery,
    UpdatedEventQuery,
    UpdatedMarketQuery,
)


def main() -> None:
    client = GammaClient()

    # ── 1. Active events ──────────────────────────────────────────────────────
    print("1. Active events (limit 3)")
    events = client.get_active_events(UpdatedEventQuery(limit=3))
    for e in events:
        print(f"   [{e.id}] {e.title} — markets: {len(e.markets)}")

    # ── 2. Event by ID and slug ───────────────────────────────────────────────
    if events:
        first = events[0]
        print(f"\n2. Event by ID: {first.id}")
        event = client.get_event_by_id(int(first.id))
        if event:
            print(f"   {event.title}")

        print(f"\n3. Event by slug: {first.slug}")
        event = client.get_event_by_slug(first.slug)
        if event:
            print(f"   {event.title}")

    # ── 3. Active markets ─────────────────────────────────────────────────────
    print("\n4. Active markets (limit 3)")
    markets = client.get_active_markets(UpdatedMarketQuery(limit=3))
    for m in markets:
        print(f"   [{m.id}] {m.question[:60]}")

    # ── 4. Keyset pagination — events ─────────────────────────────────────────
    print("\n5. Events keyset pagination")
    page1 = client.get_events_keyset(EventsKeysetQuery(limit=3, active=True))
    print(f"   Page 1: {len(page1.data)} events, next_cursor={page1.next_cursor!r}")

    if page1.next_cursor:
        page2 = client.get_events_keyset(
            EventsKeysetQuery(limit=3, after_cursor=page1.next_cursor)
        )
        print(f"   Page 2: {len(page2.data)} events, next_cursor={page2.next_cursor!r}")
        # Verify pages don't overlap
        ids1 = {e.id for e in page1.data}
        ids2 = {e.id for e in page2.data}
        print(f"   Overlap: {len(ids1 & ids2)} (expected 0)")

    # ── 5. Keyset pagination — markets ────────────────────────────────────────
    print("\n6. Markets keyset pagination")
    mpage1 = client.get_markets_keyset(MarketsKeysetQuery(limit=3, active=True))
    print(f"   Page 1: {len(mpage1.data)} markets, next_cursor={mpage1.next_cursor!r}")

    if mpage1.next_cursor:
        mpage2 = client.get_markets_keyset(
            MarketsKeysetQuery(limit=3, after_cursor=mpage1.next_cursor)
        )
        print(f"   Page 2: {len(mpage2.data)} markets")

    # ── 6. Tag lookup ─────────────────────────────────────────────────────────
    print("\n7. Tags")
    tags = client.get_tags({"limit": 5})
    for tag in tags:
        print(f"   {tag.label} ({tag.slug})")


if __name__ == "__main__":
    main()
