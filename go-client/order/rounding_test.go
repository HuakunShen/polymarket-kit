package order

import "testing"

// Tests mirror rs-clob-client's limit-order semantics:
//   maker = (size*price).trunc_with_scale(tick_decimals + LOT_SIZE_SCALE)
//   taker = size
// for BUY (and the symmetric flip for SELL).

func TestComputeAmounts_LimitBUY_TickSize001(t *testing.T) {
	// 2 shares @ 0.871, tick=0.001 → notional cap = 3+2 = 5 dec.
	// 2 * 0.871 = 1.742 (3 dec) fits without truncation.
	maker, taker := computeAmounts("BUY", 2, 0.871, 3)
	if maker != "1742000" {
		t.Errorf("maker: got %s want 1742000", maker)
	}
	if taker != "2000000" {
		t.Errorf("taker: got %s want 2000000", taker)
	}
}

func TestComputeAmounts_LimitBUY_TruncatesToCap(t *testing.T) {
	// price=0.123 (3 dec, fits tick=0.001), size=1.23 (2 dec ✓), notional=
	// 0.15129 (5 dec — fits cap exactly).
	maker, taker := computeAmounts("BUY", 1.23, 0.123, 3)
	if maker != "151290" {
		t.Errorf("maker: got %s want 151290", maker)
	}
	if taker != "1230000" {
		t.Errorf("taker: got %s want 1230000", taker)
	}
}

func TestComputeAmounts_LimitBUY_TickSize001Default(t *testing.T) {
	// 5 shares @ 0.50, tick=0.01 → notional cap = 4 dec.
	// 5 * 0.50 = 2.50.
	maker, taker := computeAmounts("BUY", 5, 0.50, 2)
	if maker != "2500000" || taker != "5000000" {
		t.Errorf("got (%s, %s) want (2500000, 5000000)", maker, taker)
	}
}

func TestComputeAmounts_LimitSELL(t *testing.T) {
	// SELL 3 shares @ 0.42, tick=0.01.
	maker, taker := computeAmounts("SELL", 3, 0.42, 2)
	if maker != "3000000" || taker != "1260000" {
		t.Errorf("got (%s, %s) want (3000000, 1260000)", maker, taker)
	}
}

// Market BUY ≡ polymarket.com "spend $X" web UI flow.
//   amount = USDC budget (must be ≤ 2 dec — input naturally clean).
//   maker = USDC, taker = USDC/price (capped at amount cap dec).
//
// rs reference: spend $100 @ 0.34, tick=0.01 → 100/0.34 = 294.117647...
//   trunc to 4 dec = 294.1176 → taker_amount = 294117600 (6 dec encoding).
func TestComputeMarketAmounts_BUY_RsExample(t *testing.T) {
	maker, taker := computeMarketAmounts("BUY", 100, 0.34, 2)
	if maker != "100000000" {
		t.Errorf("market BUY maker: got %s want 100000000 (=100.00 USDC)", maker)
	}
	if taker != "294117600" {
		t.Errorf("market BUY taker: got %s want 294117600 (=294.1176 shares)", taker)
	}
}

// User's case: $1 budget @ best_ask 0.83, tick=0.001 → 1/0.83 = 1.20481928...
//   trunc to 5 dec = 1.20481 → 1204810 (6 dec encoding).
//   Web UI showed "1.2 shares for $1" — matches our encoding (1.20481 ≈ 1.2 shares).
func TestComputeMarketAmounts_BUY_OneDollar(t *testing.T) {
	maker, taker := computeMarketAmounts("BUY", 1.00, 0.83, 3)
	if maker != "1000000" {
		t.Errorf("market BUY maker: got %s want 1000000", maker)
	}
	if taker != "1204810" {
		t.Errorf("market BUY taker: got %s want 1204810", taker)
	}
}

// Market SELL ≡ rs reference: sell 100 shares @ 0.34, tick=0.01 → 100*0.34 = 34.00 →
//   maker = 100 → 100000000, taker = 34 → 34000000.
func TestComputeMarketAmounts_SELL_RsExample(t *testing.T) {
	maker, taker := computeMarketAmounts("SELL", 100, 0.34, 2)
	if maker != "100000000" {
		t.Errorf("market SELL maker: got %s want 100000000", maker)
	}
	if taker != "34000000" {
		t.Errorf("market SELL taker: got %s want 34000000", taker)
	}
}

func TestTickDecimalsFor(t *testing.T) {
	cases := map[string]int{
		"":       2, // default
		"0.01":   2,
		"0.1":    1,
		"0.001":  3,
		"0.0001": 4,
	}
	for ts, want := range cases {
		got, err := tickDecimalsFor(ts)
		if err != nil {
			t.Errorf("tickDecimalsFor(%q): unexpected err %v", ts, err)
			continue
		}
		if got != want {
			t.Errorf("tickDecimalsFor(%q) = %d, want %d", ts, got, want)
		}
	}
	if _, err := tickDecimalsFor("0.05"); err == nil {
		t.Errorf("tickDecimalsFor(0.05): expected error, got nil")
	}
}
