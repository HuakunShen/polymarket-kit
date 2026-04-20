package gamma_test

import (
	"strconv"
	"testing"

	"github.com/HuakunShen/polymarket-kit/go-client/gamma"
)

func newSDK() *gamma.GammaSDK {
	return gamma.NewGammaSDK(nil)
}

// ── Health ────────────────────────────────────────────────────────────────────

func TestGetHealth(t *testing.T) {
	_, err := newSDK().GetHealth()
	if err != nil {
		t.Fatalf("GetHealth: %v", err)
	}
}

// ── Events ────────────────────────────────────────────────────────────────────

func TestGetEvents(t *testing.T) {
	limit := 3
	active := true
	events, err := newSDK().GetEvents(&gamma.UpdatedEventQuery{Limit: &limit, Active: &active})
	if err != nil {
		t.Fatalf("GetEvents: %v", err)
	}
	if len(events) == 0 {
		t.Fatal("expected at least one event")
	}
	if events[0].ID == "" {
		t.Fatal("event ID should not be empty")
	}
}

func TestGetEventById(t *testing.T) {
	limit := 1
	active := true
	events, err := newSDK().GetEvents(&gamma.UpdatedEventQuery{Limit: &limit, Active: &active})
	if err != nil || len(events) == 0 {
		t.Skip("no active events to test with")
	}

	id, err := strconv.Atoi(events[0].ID)
	if err != nil {
		t.Skipf("event ID %q is not numeric: %v", events[0].ID, err)
	}

	event, err := newSDK().GetEventById(id, nil)
	if err != nil {
		t.Fatalf("GetEventById: %v", err)
	}
	if event == nil {
		t.Fatal("expected non-nil event")
	}
	if event.ID != events[0].ID {
		t.Errorf("got ID %q, want %q", event.ID, events[0].ID)
	}
}

func TestGetEventBySlug(t *testing.T) {
	limit := 1
	active := true
	events, err := newSDK().GetEvents(&gamma.UpdatedEventQuery{Limit: &limit, Active: &active})
	if err != nil || len(events) == 0 || events[0].Slug == "" {
		t.Skip("no active events with slug to test with")
	}

	event, err := newSDK().GetEventBySlug(events[0].Slug, nil)
	if err != nil {
		t.Fatalf("GetEventBySlug: %v", err)
	}
	if event == nil {
		t.Fatal("expected non-nil event")
	}
	if event.Slug != events[0].Slug {
		t.Errorf("got slug %q, want %q", event.Slug, events[0].Slug)
	}
}

func TestGetEventsKeyset(t *testing.T) {
	limit := 5
	active := true
	resp, err := newSDK().GetEventsKeyset(&gamma.EventsKeysetQuery{Limit: &limit, Active: &active})
	if err != nil {
		t.Fatalf("GetEventsKeyset: %v", err)
	}
	if len(resp.Data) == 0 {
		t.Fatal("expected at least one event in keyset response")
	}
	if resp.Data[0].ID == "" {
		t.Fatal("event ID should not be empty")
	}
}

func TestGetEventsKeysetPagination(t *testing.T) {
	limit := 3
	resp1, err := newSDK().GetEventsKeyset(&gamma.EventsKeysetQuery{Limit: &limit})
	if err != nil {
		t.Fatalf("first page: %v", err)
	}
	if len(resp1.Data) == 0 {
		t.Skip("no events returned")
	}
	if resp1.NextCursor == nil {
		t.Skip("no next_cursor — keyset pagination not available for this query")
	}

	resp2, err := newSDK().GetEventsKeyset(&gamma.EventsKeysetQuery{
		Limit:       &limit,
		AfterCursor: resp1.NextCursor,
	})
	if err != nil {
		t.Fatalf("second page: %v", err)
	}

	// Pages should not overlap
	ids1 := make(map[string]bool, len(resp1.Data))
	for _, e := range resp1.Data {
		ids1[e.ID] = true
	}
	for _, e := range resp2.Data {
		if ids1[e.ID] {
			t.Errorf("event %q appears in both pages", e.ID)
		}
	}
}

// ── Markets ───────────────────────────────────────────────────────────────────

func TestGetMarkets(t *testing.T) {
	limit := 3
	active := true
	markets, err := newSDK().GetMarkets(&gamma.UpdatedMarketQuery{Limit: &limit, Active: &active})
	if err != nil {
		t.Fatalf("GetMarkets: %v", err)
	}
	if len(markets) == 0 {
		t.Fatal("expected at least one market")
	}
}

func TestGetMarketsKeyset(t *testing.T) {
	limit := 5
	active := true
	resp, err := newSDK().GetMarketsKeyset(&gamma.MarketsKeysetQuery{Limit: &limit, Active: &active})
	if err != nil {
		t.Fatalf("GetMarketsKeyset: %v", err)
	}
	if len(resp.Data) == 0 {
		t.Fatal("expected at least one market in keyset response")
	}
}

func TestGetMarketsKeysetPagination(t *testing.T) {
	limit := 3
	resp1, err := newSDK().GetMarketsKeyset(&gamma.MarketsKeysetQuery{Limit: &limit})
	if err != nil {
		t.Fatalf("first page: %v", err)
	}
	if len(resp1.Data) == 0 {
		t.Skip("no markets returned")
	}
	if resp1.NextCursor == nil {
		t.Skip("no next_cursor")
	}

	resp2, err := newSDK().GetMarketsKeyset(&gamma.MarketsKeysetQuery{
		Limit:       &limit,
		AfterCursor: resp1.NextCursor,
	})
	if err != nil {
		t.Fatalf("second page: %v", err)
	}

	ids1 := make(map[string]bool, len(resp1.Data))
	for _, m := range resp1.Data {
		ids1[m.ID] = true
	}
	for _, m := range resp2.Data {
		if ids1[m.ID] {
			t.Errorf("market %q appears in both pages", m.ID)
		}
	}
}

// ── Convenience methods ───────────────────────────────────────────────────────

func TestGetActiveEvents(t *testing.T) {
	limit := 3
	events, err := newSDK().GetActiveEvents(&gamma.UpdatedEventQuery{Limit: &limit})
	if err != nil {
		t.Fatalf("GetActiveEvents: %v", err)
	}
	if len(events) == 0 {
		t.Fatal("expected at least one active event")
	}
	for _, e := range events {
		if !e.Active {
			t.Errorf("event %q has Active=false", e.ID)
		}
	}
}

func TestGetActiveMarkets(t *testing.T) {
	limit := 3
	markets, err := newSDK().GetActiveMarkets(&gamma.UpdatedMarketQuery{Limit: &limit})
	if err != nil {
		t.Fatalf("GetActiveMarkets: %v", err)
	}
	if len(markets) == 0 {
		t.Fatal("expected at least one active market")
	}
}
