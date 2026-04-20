package data_test

import (
	"testing"

	"github.com/HuakunShen/polymarket-kit/go-client/data"
)

func newSDK() *data.DataSDK {
	return data.NewDataSDK(nil)
}

// ── Health ────────────────────────────────────────────────────────────────────

func TestGetHealth(t *testing.T) {
	result, err := newSDK().GetHealth()
	if err != nil {
		t.Fatalf("GetHealth: %v", err)
	}
	if result == nil {
		t.Fatal("expected non-nil health response")
	}
}

// ── Trader leaderboard ────────────────────────────────────────────────────────

func TestGetTraderLeaderboard(t *testing.T) {
	limit := 5
	entries, err := newSDK().GetTraderLeaderboard(&data.TraderLeaderboardQuery{Limit: &limit})
	if err != nil {
		t.Fatalf("GetTraderLeaderboard: %v", err)
	}
	if entries == nil {
		t.Fatal("expected non-nil response")
	}
}

func TestGetTraderLeaderboardWithOptions(t *testing.T) {
	limit := 10
	timePeriod := "WEEK"
	orderBy := "PNL"
	category := "OVERALL"
	entries, err := newSDK().GetTraderLeaderboard(&data.TraderLeaderboardQuery{
		Limit:      &limit,
		TimePeriod: &timePeriod,
		OrderBy:    &orderBy,
		Category:   &category,
	})
	if err != nil {
		t.Fatalf("GetTraderLeaderboard (WEEK/PNL): %v", err)
	}
	if len(entries) > limit {
		t.Errorf("got %d entries, expected at most %d", len(entries), limit)
	}
}

func TestGetTraderLeaderboardByVolume(t *testing.T) {
	limit := 5
	orderBy := "VOL"
	entries, err := newSDK().GetTraderLeaderboard(&data.TraderLeaderboardQuery{
		Limit:   &limit,
		OrderBy: &orderBy,
	})
	if err != nil {
		t.Fatalf("GetTraderLeaderboard (VOL): %v", err)
	}
	_ = entries
}

// ── Builder leaderboard ───────────────────────────────────────────────────────

func TestGetAggregatedBuilderLeaderboard(t *testing.T) {
	entries, err := newSDK().GetAggregatedBuilderLeaderboard(nil)
	if err != nil {
		t.Fatalf("GetAggregatedBuilderLeaderboard: %v", err)
	}
	if entries == nil {
		t.Fatal("expected non-nil response")
	}
}

func TestGetAggregatedBuilderLeaderboardWithPeriod(t *testing.T) {
	limit := 10
	timePeriod := "MONTH"
	entries, err := newSDK().GetAggregatedBuilderLeaderboard(&data.BuilderLeaderboardQuery{
		Limit:      &limit,
		TimePeriod: &timePeriod,
	})
	if err != nil {
		t.Fatalf("GetAggregatedBuilderLeaderboard (MONTH): %v", err)
	}
	if len(entries) > limit {
		t.Errorf("got %d entries, expected at most %d", len(entries), limit)
	}
}

// ── Builder volume timeseries ─────────────────────────────────────────────────

func TestGetDailyBuilderVolumeTimeSeries(t *testing.T) {
	entries, err := newSDK().GetDailyBuilderVolumeTimeSeries(nil)
	if err != nil {
		t.Fatalf("GetDailyBuilderVolumeTimeSeries: %v", err)
	}
	if entries == nil {
		t.Fatal("expected non-nil response")
	}
}

func TestGetDailyBuilderVolumeTimeSeriesWithPeriod(t *testing.T) {
	timePeriod := "WEEK"
	entries, err := newSDK().GetDailyBuilderVolumeTimeSeries(&data.BuilderVolumeQuery{
		TimePeriod: &timePeriod,
	})
	if err != nil {
		t.Fatalf("GetDailyBuilderVolumeTimeSeries (WEEK): %v", err)
	}
	_ = entries
}
