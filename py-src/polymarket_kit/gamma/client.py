from __future__ import annotations

from typing import Any, Mapping

import httpx
from pydantic import BaseModel, TypeAdapter

from .models import (
    Comment,
    CommentByIdQuery,
    CommentQuery,
    CommentsByUserQuery,
    Event,
    EventByIdQuery,
    Market,
    MarketByIdQuery,
    PaginatedEventQuery,
    PaginatedEventsResponse,
    ProxyConfig,
    RelatedTagRelationship,
    RelatedTagsQuery,
    SearchQuery,
    SearchResponse,
    Series,
    SeriesByIdQuery,
    SeriesQuery,
    TagByIdQuery,
    TagQuery,
    Team,
    TeamQuery,
    UpdatedEventQuery,
    UpdatedMarketQuery,
    UpdatedTag,
)

DEFAULT_BASE_URL = "https://gamma-api.polymarket.com"
DEFAULT_TIMEOUT = 30.0


class GammaRequestError(RuntimeError):
    def __init__(self, message: str, *, status_code: int, error_data: Any | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error_data = error_data


def _stringify_param(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def _normalize_params(query: BaseModel | Mapping[str, Any] | None) -> dict[str, Any]:
    if query is None:
        return {}

    if isinstance(query, BaseModel):
        data = query.model_dump(exclude_none=True)
    else:
        data = dict(query)

    params: dict[str, Any] = {}
    for key, value in data.items():
        if value is None:
            continue
        if isinstance(value, (list, tuple, set)):
            # For lists, httpx will handle multiple values with the same key
            # Convert items to strings but keep as list
            params[key] = [_stringify_param(item) for item in value if item is not None]
        else:
            params[key] = _stringify_param(value)

    return params


class GammaClient:
    def __init__(
        self,
        *,
        proxy: ProxyConfig | str | None = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float | httpx.Timeout = DEFAULT_TIMEOUT,
        headers: Mapping[str, str] | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        if client is not None:
            self._client = client
            self._owns_client = False
            return

        proxy_url: str | None = None
        if isinstance(proxy, ProxyConfig):
            proxy_url = proxy.to_url()
        elif isinstance(proxy, str):
            proxy_url = proxy

        default_headers = {"User-Agent": "polymarket-kit/0.1.0", "Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)

        self._client = httpx.Client(
            base_url=base_url,
            timeout=timeout,
            headers=default_headers,
            proxy=proxy_url,
        )
        self._owns_client = True

    def __enter__(self) -> "GammaClient":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    @property
    def http_client(self) -> httpx.Client:
        return self._client

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def _request(self, endpoint: str, query: BaseModel | Mapping[str, Any] | None) -> tuple[httpx.Response, Any | None]:
        response = self._client.get(endpoint, params=_normalize_params(query))
        if response.status_code == 204:
            return response, None

        data: Any | None = None
        if response.content:
            try:
                data = response.json()
            except ValueError:
                data = response.text

        return response, data

    def _get_data(self, endpoint: str, query: BaseModel | Mapping[str, Any] | None, operation: str) -> Any:
        response, data = self._request(endpoint, query)
        if not response.is_success:
            raise GammaRequestError(
                f"[GammaClient] {operation} failed: status {response.status_code}",
                status_code=response.status_code,
                error_data=data,
            )
        if data is None:
            raise GammaRequestError(
                f"[GammaClient] {operation} returned no data", status_code=response.status_code
            )
        return data

    def _get_optional_data(
        self, endpoint: str, query: BaseModel | Mapping[str, Any] | None, operation: str
    ) -> Any | None:
        response, data = self._request(endpoint, query)
        if response.status_code == 404:
            return None
        if not response.is_success:
            raise GammaRequestError(
                f"[GammaClient] {operation} failed: status {response.status_code}",
                status_code=response.status_code,
                error_data=data,
            )
        return data

    def get_health(self) -> dict[str, Any]:
        data = self._get_data("/health", None, "Get health")
        return dict(data)

    def get_teams(self, query: TeamQuery | Mapping[str, Any] | None = None) -> list[Team]:
        data = self._get_data("/teams", query, "Get teams")
        return TypeAdapter(list[Team]).validate_python(data)

    def get_tags(self, query: TagQuery | Mapping[str, Any] | None = None) -> list[UpdatedTag]:
        data = self._get_data("/tags", query, "Get tags")
        return TypeAdapter(list[UpdatedTag]).validate_python(data)

    def get_tag_by_id(
        self, tag_id: int, query: TagByIdQuery | Mapping[str, Any] | None = None
    ) -> UpdatedTag | None:
        data = self._get_optional_data(f"/tags/{tag_id}", query, "Get tag by ID")
        if data is None:
            return None
        return UpdatedTag.model_validate(data)

    def get_tag_by_slug(
        self, slug: str, query: TagByIdQuery | Mapping[str, Any] | None = None
    ) -> UpdatedTag | None:
        data = self._get_optional_data(f"/tags/slug/{slug}", query, "Get tag by slug")
        if data is None:
            return None
        return UpdatedTag.model_validate(data)

    def get_related_tags_relationships_by_tag_id(
        self, tag_id: int, query: RelatedTagsQuery | Mapping[str, Any] | None = None
    ) -> list[RelatedTagRelationship]:
        data = self._get_data(
            f"/tags/{tag_id}/related-tags", query, "Get related tags relationships"
        )
        return TypeAdapter(list[RelatedTagRelationship]).validate_python(data)

    def get_related_tags_relationships_by_tag_slug(
        self, slug: str, query: RelatedTagsQuery | Mapping[str, Any] | None = None
    ) -> list[RelatedTagRelationship]:
        data = self._get_data(
            f"/tags/slug/{slug}/related-tags", query, "Get related tags relationships"
        )
        return TypeAdapter(list[RelatedTagRelationship]).validate_python(data)

    def get_tags_related_to_tag_id(
        self, tag_id: int, query: RelatedTagsQuery | Mapping[str, Any] | None = None
    ) -> list[UpdatedTag]:
        data = self._get_data(
            f"/tags/{tag_id}/related-tags/tags", query, "Get related tags"
        )
        return TypeAdapter(list[UpdatedTag]).validate_python(data)

    def get_tags_related_to_tag_slug(
        self, slug: str, query: RelatedTagsQuery | Mapping[str, Any] | None = None
    ) -> list[UpdatedTag]:
        data = self._get_data(
            f"/tags/slug/{slug}/related-tags/tags", query, "Get related tags"
        )
        return TypeAdapter(list[UpdatedTag]).validate_python(data)

    def get_events(self, query: UpdatedEventQuery | Mapping[str, Any] | None = None) -> list[Event]:
        data = self._get_data("/events", query, "Get events")
        return TypeAdapter(list[Event]).validate_python(data)

    def get_events_paginated(
        self, query: PaginatedEventQuery | Mapping[str, Any]
    ) -> PaginatedEventsResponse:
        data = self._get_data("/events/pagination", query, "Get paginated events")
        return PaginatedEventsResponse.model_validate(data)

    def get_event_by_id(
        self, event_id: int, query: EventByIdQuery | Mapping[str, Any] | None = None
    ) -> Event | None:
        data = self._get_optional_data(f"/events/{event_id}", query, "Get event by ID")
        if data is None:
            return None
        return Event.model_validate(data)

    def get_event_tags(self, event_id: int) -> list[UpdatedTag]:
        data = self._get_data(f"/events/{event_id}/tags", None, "Get event tags")
        return TypeAdapter(list[UpdatedTag]).validate_python(data)

    def get_event_by_slug(
        self, slug: str, query: EventByIdQuery | Mapping[str, Any] | None = None
    ) -> Event | None:
        data = self._get_optional_data(f"/events/slug/{slug}", query, "Get event by slug")
        if data is None:
            return None
        return Event.model_validate(data)

    def get_markets(self, query: UpdatedMarketQuery | Mapping[str, Any] | None = None) -> list[Market]:
        data = self._get_data("/markets", query, "Get markets")
        return TypeAdapter(list[Market]).validate_python(data)

    def get_market_by_id(
        self, market_id: int, query: MarketByIdQuery | Mapping[str, Any] | None = None
    ) -> Market | None:
        data = self._get_optional_data(f"/markets/{market_id}", query, "Get market by ID")
        if data is None:
            return None
        return Market.model_validate(data)

    def get_market_tags(self, market_id: int) -> list[UpdatedTag]:
        data = self._get_data(f"/markets/{market_id}/tags", None, "Get market tags")
        return TypeAdapter(list[UpdatedTag]).validate_python(data)

    def get_market_by_slug(
        self, slug: str, query: MarketByIdQuery | Mapping[str, Any] | None = None
    ) -> Market | None:
        data = self._get_optional_data(f"/markets/slug/{slug}", query, "Get market by slug")
        if data is None:
            return None
        return Market.model_validate(data)

    def get_series(self, query: SeriesQuery | Mapping[str, Any]) -> list[Series]:
        data = self._get_data("/series", query, "Get series")
        return TypeAdapter(list[Series]).validate_python(data)

    def get_series_by_id(
        self, series_id: int, query: SeriesByIdQuery | Mapping[str, Any] | None = None
    ) -> Series | None:
        data = self._get_optional_data(f"/series/{series_id}", query, "Get series by ID")
        if data is None:
            return None
        return Series.model_validate(data)

    def get_comments(self, query: CommentQuery | Mapping[str, Any] | None = None) -> list[Comment]:
        data = self._get_data("/comments", query, "Get comments")
        return TypeAdapter(list[Comment]).validate_python(data)

    def get_comments_by_comment_id(
        self, comment_id: int, query: CommentByIdQuery | Mapping[str, Any] | None = None
    ) -> list[Comment]:
        data = self._get_data(f"/comments/{comment_id}", query, "Get comments by comment ID")
        return TypeAdapter(list[Comment]).validate_python(data)

    def get_comments_by_user_address(
        self, user_address: str, query: CommentsByUserQuery | Mapping[str, Any] | None = None
    ) -> list[Comment]:
        data = self._get_data(
            f"/comments/user_address/{user_address}",
            query,
            "Get comments by user address",
        )
        return TypeAdapter(list[Comment]).validate_python(data)

    def search(self, query: SearchQuery | Mapping[str, Any]) -> SearchResponse:
        data = self._get_data("/public-search", query, "Search")
        return SearchResponse.model_validate(data)

    def get_active_events(
        self, query: UpdatedEventQuery | Mapping[str, Any] | None = None
    ) -> list[Event]:
        if query is None:
            query = UpdatedEventQuery(active=True)
        elif isinstance(query, UpdatedEventQuery):
            query.active = True
        else:
            query = {**dict(query), "active": True}
        return self.get_events(query)

    def get_closed_events(
        self, query: UpdatedEventQuery | Mapping[str, Any] | None = None
    ) -> list[Event]:
        if query is None:
            query = UpdatedEventQuery(closed=True)
        elif isinstance(query, UpdatedEventQuery):
            query.closed = True
        else:
            query = {**dict(query), "closed": True}
        return self.get_events(query)

    def get_featured_events(
        self, query: UpdatedEventQuery | Mapping[str, Any] | None = None
    ) -> list[Event]:
        if query is None:
            query = UpdatedEventQuery(featured=True)
        elif isinstance(query, UpdatedEventQuery):
            query.featured = True
        else:
            query = {**dict(query), "featured": True}
        return self.get_events(query)

    def get_active_markets(
        self, query: UpdatedMarketQuery | Mapping[str, Any] | None = None
    ) -> list[Market]:
        if query is None:
            query = UpdatedMarketQuery(active=True)
        elif isinstance(query, UpdatedMarketQuery):
            query.active = True
        else:
            query = {**dict(query), "active": True}
        return self.get_markets(query)

    def get_closed_markets(
        self, query: UpdatedMarketQuery | Mapping[str, Any] | None = None
    ) -> list[Market]:
        if query is None:
            query = UpdatedMarketQuery(closed=True)
        elif isinstance(query, UpdatedMarketQuery):
            query.closed = True
        else:
            query = {**dict(query), "closed": True}
        return self.get_markets(query)


GammaSDK = GammaClient
