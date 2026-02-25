"""CLOB API models for Polymarket."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ClobModel(BaseModel):
    """Base model for CLOB API responses."""

    model_config = ConfigDict(extra="allow", populate_by_name=True)


class TimeRange(ClobModel):
    """Time range for price history."""

    start: str | None = None
    end: str | None = None


class PricePoint(ClobModel):
    """A single price point in history."""

    t: int = Field(description="Unix timestamp (seconds)")
    p: float = Field(description="Price (0.0 to 1.0)")


class PriceHistoryResponse(ClobModel):
    """Response from CLOB /prices-history endpoint."""

    history: list[PricePoint] = Field(default_factory=list)
    time_range: TimeRange | None = Field(default=None, alias="timeRange")


class Order(ClobModel):
    """Order from CLOB API."""

    id: str | None = None
    market: str | None = None
    side: str | None = None
    price: float | None = None
    size: float | None = None
    status: str | None = None
    created_at: str | None = Field(default=None, alias="createdAt")
    owner: str | None = None


class Trade(ClobModel):
    """Trade from CLOB API."""

    id: str | None = None
    market: str | None = None
    side: str | None = None
    price: float | None = None
    size: float | None = None
    status: str | None = None
    created_at: str | None = Field(default=None, alias="createdAt")
    owner: str | None = None


class Midpoint(ClobModel):
    """Midpoint price response."""

    market: str | None = None
    midpoint: float | None = None


class PriceHistoryQuery(ClobModel):
    """Query parameters for price history."""

    market: str = Field(description="CLOB token ID")
    interval: str | None = Field(
        default=None, description="Time interval: max, 1m, 1h, 6h, 1d, 1w"
    )
    start_ts: int | None = Field(
        default=None, alias="startTs", description="Start timestamp (Unix seconds)"
    )
    end_ts: int | None = Field(
        default=None, alias="endTs", description="End timestamp (Unix seconds)"
    )
    fidelity: int | None = Field(default=None, description="Resolution in minutes")


class ClobRequestError(RuntimeError):
    """Error from CLOB API request."""

    def __init__(
        self, message: str, *, status_code: int, error_data: Any | None = None
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error_data = error_data
