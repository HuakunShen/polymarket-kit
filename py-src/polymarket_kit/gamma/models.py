from __future__ import annotations

import json
from typing import Any
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _parse_json_array(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return []
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
        return []
    return [str(value)]


class GammaModel(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)


class ProxyConfig(GammaModel):
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

    @classmethod
    def from_url(cls, proxy_url: str) -> "ProxyConfig":
        parsed = urlparse(proxy_url)
        if not parsed.hostname:
            raise ValueError("Proxy URL must include a hostname")
        port = parsed.port or 0
        return cls(
            host=parsed.hostname,
            port=port,
            username=parsed.username,
            password=parsed.password,
            protocol=parsed.scheme or None,
        )


class Team(GammaModel):
    id: int
    name: str
    league: str
    record: str | None = None
    logo: str
    abbreviation: str
    alias: str | None = None
    createdAt: str
    updatedAt: str | None = None


class Tag(GammaModel):
    id: str
    label: str
    slug: str
    forceShow: bool | None = None
    createdAt: str | None = None
    isCarousel: bool | None = None


class UpdatedTag(GammaModel):
    id: str
    label: str
    slug: str
    forceShow: bool | None = None
    publishedAt: str | None = None
    createdBy: int | None = None
    updatedBy: int | None = None
    createdAt: str
    updatedAt: str | None = None
    forceHide: bool | None = None
    isCarousel: bool | None = None


class TagRelationship(GammaModel):
    id: int
    createdAt: str
    updatedAt: str


class RelatedTagRelationship(GammaModel):
    sourceTagId: int
    targetTagId: int
    relationshipType: str
    targetTag: UpdatedTag
    relationship: TagRelationship


class EventMarket(GammaModel):
    id: str
    question: str
    conditionId: str
    slug: str
    resolutionSource: str | None = None
    endDate: str | None = None
    liquidity: str | None = None
    startDate: str | None = None
    image: str | None = None
    icon: str | None = None
    description: str
    outcomes: list[str] = Field(default_factory=list)
    outcomePrices: list[str] = Field(default_factory=list)
    volume: str | None = None
    active: bool
    closed: bool
    marketMakerAddress: str | None = None
    createdAt: str
    updatedAt: str | None = None
    new: bool | None = None
    featured: bool | None = None
    archived: bool | None = None
    restricted: bool | None = None
    groupItemTitle: str | None = None
    groupItemThreshold: str | None = None
    questionID: str | None = None
    enableOrderBook: bool | None = None
    orderPriceMinTickSize: float | int | None = None
    orderMinSize: float | int | None = None
    volumeNum: float | int | None = None
    liquidityNum: float | int | None = None
    endDateIso: str | None = None
    startDateIso: str | None = None
    hasReviewedDates: bool | None = None
    volume24hr: float | int | None = None
    volume1wk: float | int | None = None
    volume1mo: float | int | None = None
    volume1yr: float | int | None = None
    clobTokenIds: list[str] = Field(default_factory=list)
    spread: float | int | None = None
    oneDayPriceChange: float | int | None = None
    oneHourPriceChange: float | int | None = None
    lastTradePrice: float | int | None = None
    bestBid: float | int | None = None
    bestAsk: float | int | None = None
    competitive: float | int | None = None

    @field_validator("outcomes", "outcomePrices", "clobTokenIds", mode="before")
    @classmethod
    def _parse_list_fields(cls, value: Any) -> list[str]:
        return _parse_json_array(value)


class SeriesEvent(GammaModel):
    id: str
    slug: str
    title: str
    resolutionSource: str | None = None
    endDate: str | None = None
    startDate: str | None = None
    image: str | None = None
    icon: str | None = None
    description: str
    volume: float | int | None = None
    liquidity: float | int | None = None
    active: bool
    closed: bool
    createdAt: str
    updatedAt: str | None = None
    new: bool | None = None
    featured: bool | None = None
    archived: bool | None = None
    restricted: bool | None = None
    enableOrderBook: bool | None = None
    volume24hr: float | int | None = None
    volume1wk: float | int | None = None
    volume1mo: float | int | None = None
    volume1yr: float | int | None = None
    competitive: float | int | None = None


class Series(GammaModel):
    id: str
    ticker: str | None = None
    slug: str
    title: str
    subtitle: str | None = None
    seriesType: str | None = None
    recurrence: str | None = None
    image: str | None = None
    icon: str | None = None
    active: bool
    closed: bool
    archived: bool | None = None
    events: list[SeriesEvent] | None = None
    volume: float | int | None = None
    liquidity: float | int | None = None
    startDate: str | None = None
    createdAt: str
    updatedAt: str | None = None
    competitive: float | int | str | None = None
    volume24hr: float | int | None = None
    pythTokenID: str | None = None
    cgAssetName: str | None = None
    commentCount: int | None = None
    featured: bool | None = None
    restricted: bool | None = None


class Event(GammaModel):
    id: str
    ticker: str | None = None
    slug: str
    title: str
    description: str | None = None
    resolutionSource: str | None = None
    startDate: str | None = None
    creationDate: str | None = None
    endDate: str | None = None
    image: str
    icon: str
    active: bool
    closed: bool
    archived: bool | None = None
    new: bool | None = None
    featured: bool | None = None
    restricted: bool | None = None
    liquidity: float | int | None = None
    volume: float | int | None = None
    openInterest: float | int | None = None
    createdAt: str
    updatedAt: str | None = None
    competitive: float | int | None = None
    volume24hr: float | int | None = None
    volume1wk: float | int | None = None
    volume1mo: float | int | None = None
    volume1yr: float | int | None = None
    enableOrderBook: bool | None = None
    liquidityClob: float | int | None = None
    negRisk: bool | None = None
    commentCount: int | None = None
    markets: list[EventMarket] = Field(default_factory=list)
    series: list[Series] | None = None
    tags: list[Tag] | None = None
    cyom: bool | None = None
    showAllOutcomes: bool | None = None
    showMarketImages: bool | None = None
    enableNegRisk: bool | None = None
    automaticallyActive: bool | None = None
    seriesSlug: str | None = None
    gmpChartMode: str | None = None
    negRiskAugmented: bool | None = None
    pendingDeployment: bool | None = None
    deploying: bool | None = None
    sortBy: str | None = None
    closedTime: str | None = None
    liquidityAmm: float | int | None = None
    automaticallyResolved: bool | None = None
    negRiskMarketID: str | None = None
    deployingTimestamp: str | None = None


class Market(GammaModel):
    id: str
    question: str
    conditionId: str
    slug: str
    endDate: str | None = None
    liquidity: str | None = None
    startDate: str | None = None
    image: str
    icon: str
    description: str
    active: bool
    volume: str
    outcomes: list[str] = Field(default_factory=list)
    outcomePrices: list[str] = Field(default_factory=list)
    closed: bool
    marketMakerAddress: str | None = None
    createdAt: str | None = None
    updatedAt: str | None = None
    closedTime: str | None = None
    new: bool | None = None
    featured: bool | None = None
    submitted_by: str | None = None
    archived: bool | None = None
    resolvedBy: str | None = None
    restricted: bool | None = None
    groupItemTitle: str | None = None
    groupItemThreshold: str | None = None
    questionID: str | None = None
    umaEndDate: str | None = None
    enableOrderBook: bool | None = None
    orderPriceMinTickSize: float | int | None = None
    orderMinSize: float | int | None = None
    umaResolutionStatus: str | None = None
    volumeNum: float | int | None = None
    liquidityNum: float | int | None = None
    endDateIso: str | None = None
    startDateIso: str | None = None
    hasReviewedDates: bool | None = None
    volume24hr: float | int | None = None
    volume1wk: float | int | None = None
    volume1mo: float | int | None = None
    volume1yr: float | int | None = None
    volume1wkClob: float | int | None = None
    volume1moClob: float | int | None = None
    volume1yrClob: float | int | None = None
    volumeClob: float | int | None = None
    customLiveness: float | int | None = None
    acceptingOrders: bool | None = None
    negRisk: bool | None = None
    negRiskMarketID: str | None = None
    negRiskRequestID: str | None = None
    clobTokenIds: list[str] = Field(default_factory=list)
    umaBond: str | None = None
    umaReward: str | None = None
    ready: bool | None = None
    funded: bool | None = None
    acceptingOrdersTimestamp: str | None = None
    cyom: bool | None = None
    pagerDutyNotificationEnabled: bool | None = None
    approved: bool | None = None
    rewardsMinSize: float | int | None = None
    rewardsMaxSpread: float | int | None = None
    spread: float | int | None = None
    automaticallyResolved: bool | None = None
    oneWeekPriceChange: float | int | None = None
    oneMonthPriceChange: float | int | None = None
    lastTradePrice: float | int | None = None
    bestAsk: float | int | None = None
    automaticallyActive: bool | None = None
    clearBookOnStart: bool | None = None
    showGmpSeries: bool | None = None
    showGmpOutcome: bool | None = None
    manualActivation: bool | None = None
    negRiskOther: bool | None = None
    umaResolutionStatuses: str | None = None
    pendingDeployment: bool | None = None
    deploying: bool | None = None
    deployingTimestamp: str | None = None
    rfqEnabled: bool | None = None
    holdingRewardsEnabled: bool | None = None
    feesEnabled: bool | None = None
    events: list[dict[str, Any]] | None = None

    @field_validator("outcomes", "outcomePrices", "clobTokenIds", mode="before")
    @classmethod
    def _parse_list_fields(cls, value: Any) -> list[str]:
        return _parse_json_array(value)


class Comment(GammaModel):
    id: str
    body: str
    parentEntityType: str
    parentEntityID: int
    userAddress: str
    createdAt: str
    profile: Any | None = None
    reactions: list[Any] | None = None
    reportCount: int
    reactionCount: int


class Pagination(GammaModel):
    hasMore: bool | None = None
    totalResults: int | None = None


class SearchResponse(GammaModel):
    events: list[Any] | None = None
    tags: list[Any] | None = None
    profiles: list[Any] | None = None
    pagination: Pagination | None = None


class PaginatedEventsResponse(GammaModel):
    data: list[Event] = Field(default_factory=list)
    pagination: Pagination


class GammaError(GammaModel):
    message: str
    code: int
    timestamp: str
    path: str


class IPResponse(GammaModel):
    ip: str
    country: str | None = None
    region: str | None = None
    city: str | None = None
    isp: str | None = None
    org: str | None = None
    as_: str | None = Field(default=None, alias="as")
    hostname: str | None = None


class TeamQuery(GammaModel):
    limit: int | None = None
    offset: int | None = None
    order: str | None = None
    ascending: bool | None = None
    league: list[str] | str | None = None
    name: list[str] | str | None = None
    abbreviation: list[str] | str | None = None


class TagQuery(GammaModel):
    limit: int | None = None
    offset: int | None = None
    order: str | None = None
    ascending: bool | None = None
    include_template: bool | None = None
    is_carousel: bool | None = None
    search: str | None = None


class TagByIdQuery(GammaModel):
    include_template: bool | None = None


class RelatedTagsQuery(GammaModel):
    limit: int | None = None
    offset: int | None = None
    order: str | None = None
    ascending: bool | None = None


class UpdatedEventQuery(GammaModel):
    limit: int | None = None
    offset: int | None = None
    order: str | None = None
    ascending: bool | None = None
    id: list[int] | int | None = None
    slug: list[str] | str | None = None
    tag_id: int | None = None
    exclude_tag_id: list[int] | int | None = None
    featured: bool | None = None
    cyom: bool | None = None
    archived: bool | None = None
    active: bool | None = None
    closed: bool | None = None
    include_chat: bool | None = None
    include_template: bool | None = None
    recurrence: str | None = None
    start_date_min: str | None = None
    start_date_max: str | None = None
    end_date_min: str | None = None
    end_date_max: str | None = None


class PaginatedEventQuery(GammaModel):
    limit: int
    offset: int
    order: str | None = None
    ascending: bool | None = None
    include_chat: bool | None = None
    include_template: bool | None = None
    recurrence: str | None = None


class EventByIdQuery(GammaModel):
    include_chat: bool | None = None
    include_template: bool | None = None


class UpdatedMarketQuery(GammaModel):
    limit: int | None = None
    offset: int | None = None
    order: str | None = None
    ascending: bool | None = None
    id: list[int] | int | None = None
    slug: list[str] | str | None = None
    tag_id: int | None = None
    closed: bool | None = None
    active: bool | None = None
    archived: bool | None = None
    sports_market_types: list[str] | str | None = None
    start_date_min: str | None = None
    start_date_max: str | None = None
    end_date_min: str | None = None
    end_date_max: str | None = None


class MarketByIdQuery(GammaModel):
    include_tag: bool | None = None


class SeriesQuery(GammaModel):
    limit: int
    offset: int
    order: str | None = None
    ascending: bool | None = None
    slug: list[str] | str | None = None
    categories_ids: list[int] | int | None = None
    categories_labels: list[str] | str | None = None
    closed: bool | None = None
    include_chat: bool | None = None
    recurrence: str | None = None


class SeriesByIdQuery(GammaModel):
    include_chat: bool | None = None


class CommentQuery(GammaModel):
    limit: int | None = None
    offset: int | None = None
    order: str | None = None
    ascending: bool | None = None
    parent_entity_type: str | None = None
    parent_entity_id: int | None = None
    get_positions: bool | None = None
    holders_only: bool | None = None


class CommentByIdQuery(GammaModel):
    get_positions: bool | None = None


class CommentsByUserQuery(GammaModel):
    limit: int | None = None
    offset: int | None = None
    order: str | None = None
    ascending: bool | None = None


class SearchQuery(GammaModel):
    q: str
    cache: bool | None = None
    events_status: str | None = None
    limit_per_type: int | None = None
    page: int | None = None
    events_tag: list[str] | str | None = None
    sort: str | None = None
    ascending: bool | None = None
