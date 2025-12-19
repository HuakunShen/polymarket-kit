from __future__ import annotations

from polymarket_kit.gamma import (
    GammaClient,
    SearchQuery,
    SeriesQuery,
    TagQuery,
    TeamQuery,
    UpdatedEventQuery,
    UpdatedMarketQuery,
)


def extract_event_id(event_id: str) -> int | None:
    try:
        return int(event_id)
    except ValueError:
        return None


def main() -> None:
    print("Testing Python Polymarket Gamma SDK")

    with GammaClient() as client:
        print("\n1. Testing health check...")
        try:
            health = client.get_health()
            print(f"OK: Health check passed: {health}")
        except Exception as exc:
            print(f"Health check failed: {exc}")

        print("\n2. Testing teams API...")
        try:
            teams = client.get_teams(TeamQuery(limit=5, league=["NFL"], ascending=True))
            print(f"OK: Found {len(teams)} teams")
            if teams:
                print(f"   First team: {teams[0].name} ({teams[0].league})")
        except Exception as exc:
            print(f"Failed to get teams: {exc}")

        print("\n3. Testing tags API...")
        try:
            tags = client.get_tags(TagQuery(limit=10, ascending=False))
            print(f"OK: Found {len(tags)} tags")
            if tags:
                print(f"   First tag: {tags[0].label} ({tags[0].slug})")
        except Exception as exc:
            print(f"Failed to get tags: {exc}")

        print("\n4. Testing events API...")
        try:
            events = client.get_events(UpdatedEventQuery(limit=5, active=True, ascending=False))
            print(f"OK: Found {len(events)} events")
            if events:
                event = events[0]
                print(f"   First event: {event.title}")
                print(f"   Markets: {len(event.markets)}")
                if event.markets:
                    print(f"   First market: {event.markets[0].question}")
        except Exception as exc:
            print(f"Failed to get events: {exc}")
            events = []

        print("\n5. Testing markets API...")
        try:
            markets = client.get_markets(UpdatedMarketQuery(limit=5, active=True))
            print(f"OK: Found {len(markets)} markets")
            if markets:
                market = markets[0]
                print(f"   First market: {market.question}")
                print(f"   Outcomes: {market.outcomes}")
                print(f"   Active: {market.active}")
        except Exception as exc:
            print(f"Failed to get markets: {exc}")

        print("\n6. Testing series API...")
        try:
            series = client.get_series(SeriesQuery(limit=5, offset=0, closed=False))
            print(f"OK: Found {len(series)} series")
            if series:
                ticker = series[0].ticker or ""
                print(f"   First series: {series[0].title} ({ticker})")
        except Exception as exc:
            print(f"Failed to get series: {exc}")

        print("\n7. Testing search API...")
        try:
            search_results = client.search(SearchQuery(q="election", limit_per_type=3))
            events_count = len(search_results.events or [])
            tags_count = len(search_results.tags or [])
            profiles_count = len(search_results.profiles or [])
            print("OK: Search completed")
            print(f"   Events: {events_count}")
            print(f"   Tags: {tags_count}")
            print(f"   Profiles: {profiles_count}")
        except Exception as exc:
            print(f"Failed to search: {exc}")

        print("\n8. Testing convenience methods...")
        try:
            active_events = client.get_active_events(UpdatedEventQuery(limit=3))
            print(f"OK: Found {len(active_events)} active events")
        except Exception as exc:
            print(f"Failed to get active events: {exc}")

        try:
            featured_events = client.get_featured_events(UpdatedEventQuery(limit=3))
            print(f"OK: Found {len(featured_events)} featured events")
        except Exception as exc:
            print(f"Failed to get featured events: {exc}")

        try:
            active_markets = client.get_active_markets(UpdatedMarketQuery(limit=3))
            print(f"OK: Found {len(active_markets)} active markets")
        except Exception as exc:
            print(f"Failed to get active markets: {exc}")

        print("\n9. Testing specific item retrieval...")
        try:
            tag = client.get_tag_by_slug("politics")
            if tag is not None:
                print(f"OK: Found tag: {tag.label} (ID: {tag.id})")
            else:
                print("Tag not found")
        except Exception as exc:
            print(f"Failed to get tag by slug: {exc}")

        if events:
            event_id = extract_event_id(events[0].id)
            if event_id is not None:
                try:
                    event = client.get_event_by_id(event_id)
                    if event is not None:
                        print(f"OK: Found event by ID: {event.title}")
                except Exception as exc:
                    print(f"Failed to get event by ID: {exc}")

            if events[0].slug:
                try:
                    event = client.get_event_by_slug(events[0].slug)
                    if event is not None:
                        print(f"OK: Found event by slug: {event.title}")
                except Exception as exc:
                    print(f"Failed to get event by slug: {exc}")

    print("\nGamma SDK demo completed successfully!")


if __name__ == "__main__":
    main()
