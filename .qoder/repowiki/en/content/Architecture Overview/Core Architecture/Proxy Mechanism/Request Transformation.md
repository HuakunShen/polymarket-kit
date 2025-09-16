# Request Transformation

<cite>
**Referenced Files in This Document**   
- [clob.ts](file://src/routes/clob.ts)
- [gamma.ts](file://src/routes/gamma.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Request Transformation Overview](#request-transformation-overview)
3. [Parameter Mapping and Type Conversion](#parameter-mapping-and-type-conversion)
4. [Request Body Transformation](#request-body-transformation)
5. [Side Enum Value Conversion](#side-enum-value-conversion)
6. [Error Handling Strategies](#error-handling-strategies)
7. [Response Formatting Patterns](#response-formatting-patterns)
8. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)

## Introduction
This document details the request transformation mechanisms in the polymarket-kit, focusing on how incoming HTTP requests are transformed before being passed to the underlying SDKs. The transformation process involves parameter mapping, type conversion, and validation using Elysia schemas. The document covers the transformation of query parameters, path parameters, and request bodies in both gamma.ts and clob.ts, with specific examples from the code showing how Side enum values are converted between API representations and SDK requirements.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [gamma.ts](file://src/routes/gamma.ts#L1-L725)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L1023)

## Request Transformation Overview
The request transformation mechanism in polymarket-kit is designed to ensure that incoming HTTP requests are properly validated and transformed before being passed to the underlying SDKs. This process is facilitated by the Elysia framework, which provides robust validation and transformation capabilities. The transformation process involves several key steps, including parameter mapping, type conversion, and validation using Elysia schemas.

The transformation process is implemented in two main files: gamma.ts and clob.ts. These files handle all routes for the Polymarket Gamma API and CLOB API, respectively. Each route is defined with proper typing and validation, ensuring that only valid requests are processed. The transformation process is further enhanced by the use of Elysia schemas, which define the structure and validation rules for request parameters and bodies.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [gamma.ts](file://src/routes/gamma.ts#L1-L725)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L1023)

## Parameter Mapping and Type Conversion
The parameter mapping and type conversion process in polymarket-kit involves transforming incoming request parameters into the format expected by the underlying SDKs. This process is facilitated by Elysia schemas, which define the structure and validation rules for request parameters. The transformation process involves several key steps, including parameter validation, type conversion, and mapping to the SDK's expected format.

In gamma.ts, the transformation process is implemented using Elysia's built-in validation and transformation capabilities. For example, the `/gamma/teams` endpoint uses the `TeamQuerySchema` to validate and transform query parameters. Similarly, the `/gamma/tags` endpoint uses the `TagQuerySchema` to validate and transform query parameters. The transformation process ensures that only valid parameters are passed to the SDK, reducing the risk of errors and improving the overall reliability of the system.

In clob.ts, the transformation process is implemented using Elysia's built-in validation and transformation capabilities. For example, the `/clob/prices-history` endpoint uses the `PriceHistoryQuerySchema` to validate and transform query parameters. Similarly, the `/clob/book/:tokenId` endpoint uses the `BookParamsSchema` to validate and transform path parameters. The transformation process ensures that only valid parameters are passed to the SDK, reducing the risk of errors and improving the overall reliability of the system.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [gamma.ts](file://src/routes/gamma.ts#L1-L725)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L1023)

## Request Body Transformation
The request body transformation process in polymarket-kit involves transforming incoming JSON request bodies into the format expected by the underlying SDKs. This process is facilitated by Elysia schemas, which define the structure and validation rules for request bodies. The transformation process involves several key steps, including body validation, type conversion, and mapping to the SDK's expected format.

In clob.ts, the transformation process is implemented using Elysia's built-in validation and transformation capabilities. For example, the `/clob/orderbooks` endpoint uses the `BookParamsSchema` to validate and transform the request body. The transformation process involves mapping the incoming JSON to the format expected by the SDK, including converting the `side` parameter from a string to the `Side` enum value. Similarly, the `/clob/prices` endpoint uses the `BookParamsSchema` to validate and transform the request body, ensuring that only valid parameters are passed to the SDK.

The transformation process is further enhanced by the use of Elysia schemas, which define the structure and validation rules for request bodies. For example, the `BookParamsSchema` defines the structure of the request body for the `/clob/orderbooks` endpoint, including the `token_id` and `side` parameters. The transformation process ensures that only valid request bodies are processed, reducing the risk of errors and improving the overall reliability of the system.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L1023)

## Side Enum Value Conversion
The Side enum value conversion process in polymarket-kit involves transforming the `side` parameter from a string to the `Side` enum value expected by the underlying SDKs. This process is facilitated by the `Side` enum from the `@polymarket/clob-client` package, which defines the possible values for the `side` parameter. The transformation process involves several key steps, including parameter validation, type conversion, and mapping to the SDK's expected format.

In clob.ts, the transformation process is implemented using a simple conditional statement. For example, the `/clob/orderbooks` endpoint uses the following code to convert the `side` parameter:

```typescript
const transformedBody = body.map((item: any) => ({
    token_id: item.token_id,
    side: item.side === "BUY" ? Side.BUY : Side.SELL,
}));
```

This code maps the incoming JSON to the format expected by the SDK, including converting the `side` parameter from a string to the `Side` enum value. The transformation process ensures that only valid parameters are passed to the SDK, reducing the risk of errors and improving the overall reliability of the system.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L1023)

## Error Handling Strategies
The error handling strategies in polymarket-kit are designed to ensure that invalid request data is properly handled and that meaningful error messages are returned to the client. The error handling process involves several key steps, including parameter validation, type conversion, and error response formatting.

In gamma.ts, the error handling process is implemented using Elysia's built-in error handling capabilities. For example, the `/gamma/tags/:id` endpoint uses the following code to handle invalid request data:

```typescript
const result = await gammaSDK.getTagById(Number(params.id), query);
if (result === null) {
    set.status = 404;
    return { type: "not found error", error: "id not found" };
}
```

This code checks if the requested resource exists and returns a 404 error if it does not. The error response includes a meaningful error message, which helps the client understand the cause of the error.

In clob.ts, the error handling process is implemented using Elysia's built-in error handling capabilities. For example, the `/clob/book/:tokenId` endpoint uses the following code to handle invalid request data:

```typescript
if (result && typeof result === "object" && "error" in result) {
    set.status = 404;
    throw new Error(result.error as string);
}
```

This code checks if the requested resource exists and returns a 404 error if it does not. The error response includes a meaningful error message, which helps the client understand the cause of the error.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [gamma.ts](file://src/routes/gamma.ts#L1-L725)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L1023)

## Response Formatting Patterns
The response formatting patterns in polymarket-kit are designed to ensure that responses are properly formatted and that meaningful data is returned to the client. The response formatting process involves several key steps, including data transformation, type conversion, and response formatting.

In gamma.ts, the response formatting process is implemented using Elysia's built-in response formatting capabilities. For example, the `/gamma/events/:id/markdown` endpoint uses the following code to format the response:

```typescript
if (wantsJson) {
    return { markdown };
} else {
    set.headers["content-type"] = "text/plain; charset=utf-8";
    return markdown;
}
```

This code checks the `Accept` header to determine the response format and returns the appropriate response. If the client requests JSON, the response is returned as a JSON object. Otherwise, the response is returned as plain text.

In clob.ts, the response formatting process is implemented using Elysia's built-in response formatting capabilities. For example, the `/clob/prices` endpoint uses the following code to format the response:

```typescript
return { prices: await polymarketSDK.getPrices(transformedBody) };
```

This code returns the prices as a JSON object, ensuring that the response is properly formatted and that meaningful data is returned to the client.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [gamma.ts](file://src/routes/gamma.ts#L1-L725)

## Common Issues and Troubleshooting
Common issues in the request transformation process include parameter validation errors, type mismatches, and payload structure requirements. These issues can be caused by a variety of factors, including incorrect parameter values, missing parameters, and invalid payload structures.

To troubleshoot parameter validation errors, it is important to ensure that all parameters are properly validated using Elysia schemas. For example, the `BookParamsSchema` defines the structure of the request body for the `/clob/orderbooks` endpoint, including the `token_id` and `side` parameters. If a parameter is missing or has an incorrect value, the validation process will fail, and an error message will be returned to the client.

To troubleshoot type mismatches, it is important to ensure that all parameters are properly converted to the expected type. For example, the `side` parameter in the `/clob/orderbooks` endpoint must be converted from a string to the `Side` enum value. If the conversion process fails, the request will be rejected, and an error message will be returned to the client.

To troubleshoot payload structure requirements, it is important to ensure that the request body is properly structured and that all required parameters are included. For example, the `/clob/orderbooks` endpoint requires the `token_id` and `side` parameters in the request body. If the request body is missing these parameters, the validation process will fail, and an error message will be returned to the client.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [gamma.ts](file://src/routes/gamma.ts#L1-L725)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L1023)