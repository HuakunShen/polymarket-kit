from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class DataModel(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)


class ProxyConfig(DataModel):
    host: str
    port: int
    username: str | None = None
    password: str | None = None
    protocol: str | None = None

    def to_url(self) -> str:
        protocol = self.protocol or "http"
        if self.username and self.password:
            return f"{protocol}://{self.username}:{self.password}@{self.host}:{self.port}"
        return f"{protocol}://{self.host}:{self.port}"


class DataHealthResponse(DataModel):
    data: str


class Position(DataModel):
    proxyWallet: str
    asset: str
    conditionId: str
    size: float
    avgPrice: float
    initialValue: float
    currentValue: float
    cashPnl: float
    percentPnl: float
    totalBought: float
    realizedPnl: float
    percentRealizedPnl: float
    curPrice: float
    redeemable: bool
    mergeable: bool
    title: str
    slug: str
    icon: str
    eventId: str
    eventSlug: str
    outcome: str
    outcomeIndex: int
    oppositeOutcome: str
    oppositeAsset: str
    endDate: str | None = None
    negativeRisk: bool | None = None


class ClosedPosition(DataModel):
    proxyWallet: str
    conditionId: str
    outcome: str
    realizedPnl: str | float
    avgPrice: str | float  # API can return as string or float
    timestamp: str | int  # API can return as string or int
    # Optional fields that may be present in some responses
    size: str | float | None = None
    assetId: str | None = None
    asset: str | None = None
    market: str | None = None
    side: Literal["BUY", "SELL"] | None = None
    cost: str | None = None
    value: str | None = None
    fees: str | None = None
    price: str | None = None
    closedAt: str | None = None
    closedPrice: str | float | None = None
    lastUpdate: str | None = None
    # Additional fields that may be present (similar to Position)
    title: str | None = None
    slug: str | None = None
    icon: str | None = None
    eventId: str | None = None
    eventSlug: str | None = None
    outcomeIndex: int | None = None
    oppositeOutcome: str | None = None
    oppositeAsset: str | None = None
    negativeRisk: bool | None = None


class DataTrade(DataModel):
    proxyWallet: str
    side: Literal["BUY", "SELL"]
    asset: str
    conditionId: str
    size: float
    price: float
    timestamp: int
    title: str
    slug: str
    icon: str
    eventSlug: str
    outcome: str
    outcomeIndex: int
    name: str
    pseudonym: str
    bio: str
    profileImage: str
    profileImageOptimized: str
    transactionHash: str


class Activity(DataModel):
    proxyWallet: str
    timestamp: int
    conditionId: str
    type: Literal["TRADE", "SPLIT", "MERGE", "REDEEM", "REWARD", "CONVERSION"]
    size: float
    usdcSize: float | None = None
    transactionHash: str
    price: float | None = None
    asset: str | None = None
    side: Literal["BUY", "SELL", ""] | None = None
    outcomeIndex: int
    title: str
    slug: str
    icon: str
    eventSlug: str
    outcome: str
    name: str
    pseudonym: str
    bio: str
    profileImage: str
    profileImageOptimized: str


class Holder(DataModel):
    proxyWallet: str
    bio: str | None = None
    asset: str | None = None
    pseudonym: str | None = None
    amount: float | None = None
    displayUsernamePublic: bool | None = None
    outcomeIndex: int | None = None
    name: str | None = None
    profileImage: str | None = None
    profileImageOptimized: str | None = None
    verified: bool | None = None


class MetaHolder(DataModel):
    token: str
    holders: list[Holder]


class TotalValue(DataModel):
    user: str
    value: float


class TotalMarketsTraded(DataModel):
    user: str
    traded: int


class OpenInterest(DataModel):
    market: str
    value: str | float


class LiveVolumeMarket(DataModel):
    market: str
    value: float


class LiveVolumeResponse(DataModel):
    total: float
    markets: list[LiveVolumeMarket]


# Query parameter models
class PositionsQuery(DataModel):
    user: str
    market: list[str] | None = None
    eventId: list[str] | None = None
    sizeThreshold: str | float | None = None
    redeemable: bool | None = None
    mergeable: bool | None = None
    limit: int | None = None
    offset: int | None = None
    sortBy: str | None = None
    sortDirection: Literal["ASC", "DESC"] | None = None
    title: str | None = None


class ClosedPositionsQuery(DataModel):
    user: str
    market: list[str] | None = None
    eventId: list[str] | None = None
    title: str | None = None
    limit: int | None = None
    offset: int | None = None
    sortBy: str | None = None
    sortDirection: Literal["ASC", "DESC"] | None = None


class TradesQuery(DataModel):
    limit: int | None = None
    offset: int | None = None
    takerOnly: bool | None = None
    filterType: str | None = None
    filterAmount: str | float | None = None
    market: list[str] | None = None
    eventId: list[str] | None = None
    user: str | None = None
    side: Literal["BUY", "SELL"] | None = None


class UserActivityQuery(DataModel):
    user: str
    limit: int | None = None
    offset: int | None = None
    market: list[str] | None = None
    eventId: list[str] | None = None
    type: Literal["TRADE", "SPLIT", "MERGE", "REDEEM", "REWARD", "CONVERSION"] | None = None
    start: str | None = None
    end: str | None = None
    sortBy: str | None = None
    sortDirection: Literal["ASC", "DESC"] | None = None
    side: Literal["BUY", "SELL"] | None = None


class TopHoldersQuery(DataModel):
    limit: int | None = None
    market: list[str]
    minBalance: float | None = None


class TotalValueQuery(DataModel):
    user: str
    market: list[str] | None = None


class TotalMarketsTradedQuery(DataModel):
    user: str


class OpenInterestQuery(DataModel):
    market: list[str]


class LiveVolumeQuery(DataModel):
    id: int

