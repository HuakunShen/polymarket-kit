# Tags API

<cite>
**Referenced Files in This Document**   
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [gamma.ts](file://src/routes/gamma.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [tags.go](file://go-polymarket/client/gamma/tags.go)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Endpoint Overview](#endpoint-overview)
3. [Query Parameters](#query-parameters)
4. [Response Schemas](#response-schemas)
5. [Error Handling](#error-handling)
6. [Proxy Support](#proxy-support)
7. [Usage Examples](#usage-examples)

## Introduction
The Tags API provides access to tag data within the Polymarket ecosystem, enabling categorization and filtering of markets and events. This API offers endpoints to retrieve tags by ID or slug, fetch related tags, and explore tag relationships. The API supports pagination, filtering, and proxy configuration for flexible integration into various applications.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L100-L170)

## Endpoint Overview
The Tags API includes seven endpoints for retrieving tag data:

| Endpoint | Method | Description |
|--------|--------|-------------|
| `/tags` | GET | Retrieve a list of tags with optional filtering |
| `/tags/:id` | GET | Retrieve a specific tag by its ID |
| `/tags/slug/:slug` | GET | Retrieve a specific tag by its slug |
| `/tags/:id/related-tags` | GET | Retrieve relationships for a tag by ID |
| `/tags/slug/:slug/related-tags` | GET | Retrieve relationships for a tag by slug |
| `/tags/:id/related-tags/tags` | GET | Retrieve actual tag objects related to a tag ID |
| `/tags/slug/:slug/related-tags/tags` | GET | Retrieve actual tag objects related to a tag slug |

The distinction between `/related-tags` and `/related-tags/tags` endpoints is crucial:
- `/related-tags` returns **relationships** (RelatedTagRelationshipSchema) containing tagID, relatedTagID, and rank
- `/related-tags/tags` returns **actual tag objects** (UpdatedTagSchema) for the related tags

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L100-L219)

## Query Parameters
### TagQuerySchema
Used in GET /tags endpoint for filtering and pagination:

| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| limit | number | No | Maximum number of tags to return (default: 100) |
| offset | number | No | Pagination offset |
| order | string | No | Field to order by |
| ascending | boolean | No | Sort order (true for ascending) |
| include_template | boolean | No | Include template tags |
| is_carousel | boolean | No | Filter for carousel tags only |

### TagByIdQuerySchema
Used in GET /tags/:id and /tags/slug/:slug endpoints:

| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| include_template | boolean | No | Include template tags |

### RelatedTagsQuerySchema
Used in all related tags endpoints:

| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| omit_empty | boolean | No | Omit empty relationships |
| status | string | No | Filter by status ("active", "closed", "all") |

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L700-L750)

## Response Schemas
### UpdatedTagSchema
The response schema for tag objects includes:

| Field | Type | Description |
|------|------|-------------|
| id | string | Unique identifier |
| label | string | Display name |
| slug | string | URL-friendly identifier |
| forceShow | boolean | Whether to force display |
| publishedAt | string | Publication timestamp |
| createdBy | number | User ID of creator |
| updatedBy | number | User ID of last updater |
| createdAt | string | Creation timestamp |
| updatedAt | string | Last update timestamp |
| forceHide | boolean | Whether to force hide |
| isCarousel | boolean | Whether it's a carousel tag |

### RelatedTagRelationshipSchema
The response schema for tag relationships includes:

| Field | Type | Description |
|------|------|-------------|
| id | string | Relationship identifier |
| tagID | number | Source tag ID |
| relatedTagID | number | Target tag ID |
| rank | number | Relationship strength/rank |

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L650-L700)

## Error Handling
The API returns standard HTTP status codes:

| Status | Meaning | Response Schema |
|-------|--------|-----------------|
| 200 | Success | UpdatedTagSchema or RelatedTagRelationshipSchema |
| 404 | Not Found | GammaErrorResponseSchema |
| 500 | Internal Server Error | ErrorResponseSchema |

Example 404 response:
```json
{
  "type": "not found error",
  "error": "id not found"
}
```

Example 500 response:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L130-L135)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L250-L260)

## Proxy Support
The API supports proxy configuration via the `x-http-proxy` header. The proxy URL should follow standard format:

```
x-http-proxy: http://username:password@proxy.server.com:8080
```

Supported protocols: HTTP and HTTPS
Authentication: Basic authentication supported
The proxy configuration is processed by the `parseProxyString` function which validates the URL format and extracts protocol, host, port, username, and password.

**Section sources**
- [gamma.ts](file://src/routes/gamma.ts#L40-L70)

## Usage Examples
### cURL Examples
Get all tags with pagination:
```bash
curl "https://your-proxy-server/gamma/tags?limit=10&offset=0"
```

Get tag by ID:
```bash
curl "https://your-proxy-server/gamma/tags/123"
```

Get tag by slug:
```bash
curl "https://your-proxy-server/gamma/tags/slug/politics"
```

Get related tag relationships by ID:
```bash
curl "https://your-proxy-server/gamma/tags/123/related-tags?status=active"
```

Get related tags by slug:
```bash
curl "https://your-proxy-server/gamma/tags/slug/politics/related-tags/tags"
```

### TypeScript SDK Examples
```typescript
import { GammaSDK } from "./sdk/gamma-client";

const gammaSDK = new GammaSDK();

// Get all tags
const tags = await gammaSDK.getTags({ 
  limit: 20, 
  is_carousel: true 
});

// Get tag by ID
const tagById = await gammaSDK.getTagById(123, { 
  include_template: true 
});

// Get tag by slug
const tagBySlug = await gammaSDK.getTagBySlug("politics");

// Get related tags relationships by ID
const relationshipsById = await gammaSDK.getRelatedTagsRelationshipsByTagId(123);

// Get related tags relationships by slug
const relationshipsBySlug = await gammaSDK.getRelatedTagsRelationshipsByTagSlug("politics");

// Get actual tags related to a tag ID
const relatedTagsById = await gammaSDK.getTagsRelatedToTagId(123);

// Get actual tags related to a tag slug
const relatedTagsBySlug = await gammaSDK.getTagsRelatedToTagSlug("politics");
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L200-L350)
- [gamma.ts](file://src/routes/gamma.ts#L100-L219)