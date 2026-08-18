"""Annotate a Polymarket tennis event with an independent live match state.

This mirrors ``examples/gamma/gamma_example.py``: the kit's own ``GammaClient`` is
the sole source of Polymarket market data. This example adds a read-only overlay
that annotates a tennis event with an independent live score/status. It executes
no trades and imports none of the CLOB/trading code.

Vendor disclosure: the live match-state feed is the Live Tennis API
(https://livetennisapi.com), which I run — so this example is vendor-authored;
judge accordingly. It is used only as an external annotation on the kit's Gamma
data, never as an oracle, venue, or resolution source. Always confirm a market's
official resolution criteria on its Polymarket page.

The free keyed tier (https://livetennisapi.com/subscribe/free) returns live
matches, scores, server and break-point state at 30 req/min and 100 req/day —
a develop-and-test / ~15-minute-cadence budget, not continuous fast polling.
Export LIVETENNIS_API_KEY to enable the overlay; without it the Gamma side still
prints and the live annotation is skipped.

Run:
    python tennis_event.py
    LIVETENNIS_API_KEY=your-free-key python tennis_event.py
"""

from __future__ import annotations

import os

import httpx

from polymarket_kit.gamma import GammaClient, SearchQuery, UpdatedEventQuery

LIVE_TENNIS_BASE_URL = "https://api.livetennisapi.com/api/public/v1"


def derive_break_point(score: dict | None) -> int | None:
    """Which player (1 or 2) holds a break point, or None.

    Break point per the Live Tennis API convention: the RECEIVER is at AD, or the
    receiver is at 40 while the server is at 0/15/30. Never in a tiebreak, and
    never when server or points are null.
    """
    if not score or score.get("is_tiebreak"):
        return None
    server = score.get("server")
    if server not in (1, 2):
        return None
    points = score.get("points") or []
    if len(points) < 2:
        return None
    receiver = 2 if server == 1 else 1
    server_point = points[server - 1]
    receiver_point = points[receiver - 1]
    if server_point is None or receiver_point is None:
        return None
    if receiver_point == "AD":
        return receiver
    if receiver_point == "40" and server_point in ("0", "15", "30"):
        return receiver
    return None


def surnames(match: dict) -> list[str]:
    """Lowercase surnames of a live match's two participants, for name matching."""
    players = match.get("players") or {}
    names: list[str] = []
    for key in ("p1", "p2"):
        name = (players.get(key) or {}).get("name")
        if name:
            names.append(name.split()[-1].lower())
    return names


def fetch_live_matches(api_key: str) -> list[dict]:
    """Live matches from the Live Tennis API FREE endpoint (GET /matches?status=live)."""
    with httpx.Client(base_url=LIVE_TENNIS_BASE_URL, timeout=15) as client:
        resp = client.get(
            "/matches",
            params={"status": "live", "limit": 50},
            headers={"X-API-Key": api_key},
        )
        resp.raise_for_status()
        payload = resp.json()
    return payload.get("data", []) if isinstance(payload, dict) else []


def main() -> None:
    print("Polymarket tennis event + independent live-state overlay")

    with GammaClient() as client:
        # 1. Discover a tennis event via the kit's Gamma client (read-only).
        print("\n1. Finding a tennis event...")
        events = []
        try:
            tag = client.get_tag_by_slug("tennis")
            if tag is not None:
                print(f"OK: tennis tag id {tag.id} ({tag.slug})")
                events = client.get_active_events(
                    UpdatedEventQuery(tag_id=int(tag.id), limit=5, closed=False)
                )
        except Exception as exc:  # noqa: BLE001 - example is best-effort
            print(f"Tag lookup failed: {exc}")

        if not events:
            print("   Falling back to search for 'tennis'...")
            try:
                results = client.search(SearchQuery(q="tennis", limit_per_type=5))
                events = list(results.events or [])
            except Exception as exc:  # noqa: BLE001
                print(f"Search failed: {exc}")

        if not events:
            print("No tennis events found right now.")
            return

        event = events[0]
        print(f"\n2. Event: {event.title}")
        print(f"   endDate: {event.endDate}")
        for market in event.markets:
            print(f"   - {market.question}")
            if market.outcomes and market.outcomePrices:
                for name, price in zip(market.outcomes, market.outcomePrices):
                    print(f"       {name}: {price}")

        # 3. Optional independent live-state overlay.
        api_key = os.environ.get("LIVETENNIS_API_KEY", "").strip()
        if not api_key:
            print(
                "\n3. LIVETENNIS_API_KEY not set — skipping the live overlay. "
                "Free key: https://livetennisapi.com/subscribe/free"
            )
            return

        print("\n3. Overlaying independent live match state (Live Tennis API)...")
        try:
            live_matches = fetch_live_matches(api_key)
        except httpx.HTTPError as exc:
            print(f"Live overlay unavailable: {exc}")
            return

        title = (event.title or "").lower()
        matched = next(
            (
                match
                for match in live_matches
                if len(surnames(match)) == 2 and all(s in title for s in surnames(match))
            ),
            None,
        )
        if matched is None:
            print(
                f"   No in-progress match matched \"{event.title}\" by name "
                f"(of {len(live_matches)} live)."
            )
            return

        score = matched.get("score") or {}
        sets = score.get("sets") or []
        points = score.get("points") or []
        print(f"   sets:   {'-'.join(str(s) for s in sets) or '(none)'}")
        print(
            "   points: "
            + ("-".join(str(p) if p is not None else "?" for p in points) or "(none)")
        )
        server = score.get("server")
        if server in (1, 2):
            players = matched.get("players") or {}
            server_name = (players.get(f"p{server}") or {}).get("name", f"P{server}")
            print(f"   serving: {server_name}")
        bp = derive_break_point(score)
        if bp:
            players = matched.get("players") or {}
            bp_name = (players.get(f"p{bp}") or {}).get("name", f"P{bp}")
            print(f"   BREAK POINT for {bp_name}")
        if matched.get("event_status"):
            print(f"   match note: {matched['event_status']}")
        print(
            "\n   The live score is an INDEPENDENT reference — always confirm "
            "official resolution on the market page."
        )

    print("\nDone.")


if __name__ == "__main__":
    main()
