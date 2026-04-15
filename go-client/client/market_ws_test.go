package client

import (
	"slices"
	"testing"
)

func TestMarketWSClientSubscribeRefcount(t *testing.T) {
	c := NewMarketWSClient(MarketWSConfig{
		InitialAssets: []string{"a1"},
	})

	added := c.trackSubscribe([]string{"a1", "a2", "a2", "a3"})
	slices.Sort(added)
	wantAdded := []string{"a2", "a3"}
	if !slices.Equal(added, wantAdded) {
		t.Fatalf("expected added %v, got %v", wantAdded, added)
	}

	gotAssets := c.AssetIDs()
	wantAssets := []string{"a1", "a2", "a3"}
	if !slices.Equal(gotAssets, wantAssets) {
		t.Fatalf("expected assets %v, got %v", wantAssets, gotAssets)
	}
}

func TestMarketWSClientUnsubscribeRefcount(t *testing.T) {
	c := NewMarketWSClient(MarketWSConfig{
		InitialAssets: []string{"a1", "a2"},
	})
	c.trackSubscribe([]string{"a2", "a3"})

	removed := c.trackUnsubscribe([]string{"a2", "a2", "a3", "missing"})
	slices.Sort(removed)
	wantRemoved := []string{"a2", "a3"}
	if !slices.Equal(removed, wantRemoved) {
		t.Fatalf("expected removed %v, got %v", wantRemoved, removed)
	}

	gotAssets := c.AssetIDs()
	wantAssets := []string{"a1"}
	if !slices.Equal(gotAssets, wantAssets) {
		t.Fatalf("expected assets %v, got %v", wantAssets, gotAssets)
	}
}
