# Comments API

<cite>
**Referenced Files in This Document**   
- [comments.go](file://go-polymarket/client/gamma/comments.go)
- [comments_comments_item_request_builder.go](file://go-polymarket/client/gamma/comments_comments_item_request_builder.go)
- [comments_user_escaped_address_with_user_address_item_request_builder.go](file://go-polymarket/client/gamma/comments_user_escaped_address_with_user_address_item_request_builder.go)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [API Endpoints](#api-endpoints)
3. [Query Parameters](#query-parameters)
4. [Response Schema](#response-schema)
5. [Response Codes](#response-codes)
6. [Usage Examples](#usage-examples)
7. [Proxy Support](#proxy-support)
8. [Error Handling](#error-handling)

## Introduction
The Comments API provides access to user-generated comments within the Polymarket ecosystem. This API enables retrieval of comments by various criteria including general listing, comment threads, and user-specific comments. The endpoints are designed to support flexible querying with pagination, sorting, and filtering capabilities.

## API Endpoints

### GET /comments
Retrieves a list of comments with optional filtering and pagination. This endpoint is used for general comment retrieval across the platform.

**Section sources**
- [comments.go](file://go-polymarket/client/gamma/comments.go#L1-L345)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L690-L698)

### GET /comments/:id
Retrieves comments related to a specific comment ID, enabling access to comment threads and replies. This endpoint returns an array of comments that are children of the specified comment.

**Section sources**
- [comments_comments_item_request_builder.go](file://go-polymarket/client/gamma/comments_comments_item_request_builder.go#L1-L83)

### GET /comments/user_address/:userAddress
Retrieves all comments made by a specific user address. This endpoint allows filtering and pagination of user-specific comments, providing a way to view an individual user's contribution history.

**Section sources**
- [comments_user_escaped_address_with_user_address_item_request_builder.go](file://go-polymarket/client/gamma/comments_user_escaped_address_with_user_address_item_request_builder.go#L1-L86)

## Query Parameters

### CommentQuerySchema
Parameters for the GET /comments endpoint:

- **limit**: Optional number - Maximum number of results to return
- **offset**: Optional number - Number of results to skip for pagination
- **order**: Optional string - Field to order results by
- **ascending**: Optional boolean - Sort order (true for ascending, false for descending)
- **parent_entity_type**: Optional union - Type of parent entity ("Event", "Series", or "market")
- **parent_entity_id**: Optional number - ID of the parent entity
- **get_positions**: Optional boolean - Include position information
- **holders_only**: Optional boolean - Filter to holders only

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L823-L834)

### CommentByIdQuerySchema
Parameters for the GET /comments/:id endpoint:

- **get_positions**: Optional boolean - Include position information in the response

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L840-L842)

### CommentsByUserQuerySchema
Parameters for the GET /comments/user_address/:userAddress endpoint:

- **limit**: Optional number - Maximum number of results to return
- **offset**: Optional number - Number of results to skip for pagination
- **order**: Optional string - Field to order results by
- **ascending**: Optional boolean - Sort order (true for ascending, false for descending)

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L848-L853)

## Response Schema

### CommentSchema
The structure of a comment object returned by all Comments API endpoints:

- **id**: string - Unique identifier of the comment
- **body**: string - Content of the comment
- **parentEntityType**: string - Type of the parent entity ("Event", "Series", or "market")
- **parentEntityID**: number - ID of the parent entity
- **userAddress**: string - Blockchain address of the comment author
- **createdAt**: string - Timestamp of comment creation (ISO format)
- **profile**: optional any - Author's profile information
- **reactions**: optional array of any - User reactions to the comment
- **reportCount**: number - Number of times the comment has been reported
- **reactionCount**: number - Total number of reactions on the comment

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L806-L817)

## Response Codes

### 200 OK
Successful response containing an array of CommentSchema objects. The response body will include all requested comments matching the query parameters.

Example response:
```json
[
  {
    "id": "123",
    "body": "This market looks promising!",
    "parentEntityType": "Event",
    "parentEntityID": 456,
    "userAddress": "0x1234567890abcdef",
    "createdAt": "2025-01-15T10:30:00Z",
    "profile": {
      "displayName": "CryptoTrader",
      "avatar": "https://example.com/avatar.png"
    },
    "reactions": [
      {
        "type": "like",
        "userAddress": "0xabcdef1234567890"
      }
    ],
    "reportCount": 0,
    "reactionCount": 1
  }
]
```

### 500 Internal Server Error
Error response indicating a server-side issue. The response body will contain error details in the format defined by GammaErrorResponseSchema.

Example response:
```json
{
  "type": "server_error",
  "error": "Internal server error occurred while processing the request"
}
```

**Section sources**
- [comments.go](file://go-polymarket/client/gamma/comments.go#L1-L345)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L806-L817)

## Usage Examples

### cURL Examples

Retrieve recent comments on a specific event:
```bash
curl "https://gamma-api.polymarket.com/comments?parent_entity_type=Event&parent_entity_id=123&limit=10&order=createdAt&ascending=false"
```

Get comment thread for a specific comment:
```bash
curl "https://gamma-api.polymarket.com/comments/456?get_positions=true"
```

Fetch comments by a specific user:
```bash
curl "https://gamma-api.polymarket.com/comments/user_address/0x1234567890abcdef?limit=20&order=createdAt"
```

### TypeScript SDK Examples

Using the GammaSDK to access comments:

```typescript
// Initialize the SDK
const gamma = new GammaSDK();

// Get comments with filtering
const comments = await gamma.getComments({
  limit: 20,
  parent_entity_type: "Event",
  parent_entity_id: 123,
  order: "createdAt",
  ascending: false
});

// Get comments by comment ID (thread)
const threadComments = await gamma.getCommentsByCommentId(456, {
  get_positions: true
});

// Get comments by user address
const userComments = await gamma.getCommentsByUserAddress(
  "0x1234567890abcdef",
  { limit: 10, order: "createdAt" }
);
```

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L690-L728)

## Proxy Support
The API supports proxy requests through the x-http-proxy header. When using the GammaSDK, proxy configuration can be provided in the constructor:

```typescript
const gamma = new GammaSDK({
  proxy: {
    host: "proxy.example.com",
    port: 8080,
    username: "user",
    password: "pass",
    protocol: "http"
  }
});
```

The SDK will route all requests through the specified proxy server, which is useful for environments with restricted network access or when needing to anonymize requests.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L25-L65)

## Error Handling
The Comments API follows standard error handling patterns. Client applications should handle both network-level errors and API-specific error responses:

- Network errors: Handle timeouts, connection failures, and other transport issues
- 4xx errors: Validate input parameters and ensure proper authentication
- 5xx errors: Implement retry logic with exponential backoff for server-side issues

When using the GammaSDK, errors are thrown as JavaScript Error objects with descriptive messages. Applications should implement appropriate error boundaries and user feedback mechanisms.

The API may return 500 Internal Server Error when there are issues with the backend services. In such cases, clients should retry the request after a delay, as these errors are typically transient.

**Section sources**
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L140-L185)
- [comments.go](file://go-polymarket/client/gamma/comments.go#L1-L345)