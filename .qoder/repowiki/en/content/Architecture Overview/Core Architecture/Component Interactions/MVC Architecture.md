# MVC Architecture

<cite>
**Referenced Files in This Document**   
- [index.ts](file://src/index.ts)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts)
- [clob.ts](file://src/routes/clob.ts)
- [gamma.ts](file://src/routes/gamma.ts)
- [client.ts](file://src/sdk/client.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts)
- [index.ts](file://src/sdk/index.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Model Layer: Elysia Schemas](#model-layer-elysia-schemas)
4. [Controller Layer: Route Handlers](#controller-layer-route-handlers)
5. [Service Layer: SDKs](#service-layer-sdks)
6. [Data Flow and Request Processing](#data-flow-and-request-processing)
7. [Component Diagram](#component-diagram)

## Introduction
This document describes the MVC-like architecture implemented in the polymarket-kit application. The system follows a clear separation of concerns using the Elysia framework, where routes act as controllers, SDKs serve as service layers, and elysia-schemas define the model layer. This architectural pattern enables type-safe API endpoints with comprehensive validation, clean separation between HTTP interface and business logic, and reusable service components for interacting with Polymarket APIs.

## Architecture Overview
The polymarket-kit application implements an MVC-like architecture using the Elysia framework for building type-safe API endpoints. The architecture consists of three primary layers: Model (defined by elysia-schemas), View/Controller (implemented as route handlers), and Service (provided by SDKs). The Elysia server in index.ts initializes the application, mounts route handlers, and provides automatic OpenAPI documentation generation. This clean separation allows for robust type validation, maintainable code organization, and reusable service components across different API consumers.

```mermaid
graph TB
subgraph "Client"
Client[HTTP Client]
end
subgraph "Controller Layer"
Routes[Route Handlers]
end
subgraph "Model Layer"
Schemas[Elysia Schemas]
end
subgraph "Service Layer"
SDKs[Polymarket SDKs]
end
subgraph "External APIs"
GammaAPI[Gamma API]
ClobAPI[CLOB API]
end
Client --> Routes
Routes --> Schemas
Routes --> SDKs
SDKs --> GammaAPI
SDKs --> ClobAPI
```

**Diagram sources**
- [index.ts](file://src/index.ts#L1-L165)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L1023)
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [gamma.ts](file://src/routes/gamma.ts#L1-L725)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L1-L891)

**Section sources**
- [index.ts](file://src/index.ts#L1-L165)

## Model Layer: Elysia Schemas
The model layer in polymarket-kit is defined by the type schemas in elysia-schemas.ts, which provide strict validation for all API inputs and outputs. These schemas use Elysia's built-in type system to ensure type safety throughout the application. The model layer includes comprehensive definitions for market data, events, series, tags, price history, order books, and other domain entities from the Polymarket ecosystem. Each schema defines the exact structure, data types, and validation rules for its corresponding entity, enabling automatic request validation and OpenAPI documentation generation.

**Section sources**
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L1023)

## Controller Layer: Route Handlers
The controller layer consists of route handlers defined in clob.ts and gamma.ts, which handle HTTP requests and responses. These routes act as controllers in the MVC pattern, receiving incoming requests, validating them against model schemas, orchestrating service calls, and returning appropriate responses. The routes are mounted on the Elysia server in index.ts and include comprehensive documentation metadata for OpenAPI/Swagger generation. Each route specifies its request validation schema, response types, and detailed documentation including tags, summary, and description.

**Section sources**
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [gamma.ts](file://src/routes/gamma.ts#L1-L725)

## Service Layer: SDKs
The service layer is implemented through SDKs in the sdk directory, which encapsulate the business logic for interacting with Polymarket APIs. The PolymarketSDK handles CLOB API operations requiring authentication credentials, while the GammaSDK provides access to the Gamma API without authentication requirements. These SDKs abstract the HTTP client details, provide type-safe methods for all API operations, and handle data transformation between the API responses and the application's model layer. The service layer enables code reuse across different controllers and simplifies testing by providing a clear interface between the application logic and external APIs.

**Section sources**
- [client.ts](file://src/sdk/client.ts)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L1-L891)
- [index.ts](file://src/sdk/index.ts#L1-L14)

## Data Flow and Request Processing
The data flow in polymarket-kit follows a clear path from incoming HTTP requests through validation, processing, and response generation. When a request arrives, the Elysia framework first validates it against the model schemas defined in elysia-schemas.ts. Validated requests are then processed by route handlers in the controller layer, which delegate business logic to the appropriate SDK in the service layer. The SDKs make requests to external Polymarket APIs, transform the responses, and return data to the controllers. Finally, the controllers format the response according to the model schemas and return it to the client. This flow ensures type safety at every layer and provides comprehensive error handling throughout the request lifecycle.

**Section sources**
- [index.ts](file://src/index.ts#L1-L165)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L1023)
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [gamma.ts](file://src/routes/gamma.ts#L1-L725)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L1-L891)

## Component Diagram
The following component diagram illustrates the relationship between the controller (routes), service (SDKs), and model (schemas) layers in the polymarket-kit application. The diagram shows how the Elysia server initializes the application, mounts route handlers as controllers, and connects them to the model schemas for validation and the SDKs for service operations.

```mermaid
componentDiagram
[Elysia Server] as server
[Route Handlers] as routes
[Elysia Schemas] as schemas
[Polymarket SDKs] as sdks
[External APIs] as apis
server --> routes : mounts
server --> schemas : uses for validation
routes --> schemas : validates requests/responses
routes --> sdks : delegates business logic
sdks --> apis : communicates with
server .> schemas : generates OpenAPI docs
routes .> schemas : type-safe endpoints
```

**Diagram sources**
- [index.ts](file://src/index.ts#L1-L165)
- [elysia-schemas.ts](file://src/types/elysia-schemas.ts#L1-L1023)
- [clob.ts](file://src/routes/clob.ts#L1-L1013)
- [gamma.ts](file://src/routes/gamma.ts#L1-L725)
- [gamma-client.ts](file://src/sdk/gamma-client.ts#L1-L891)