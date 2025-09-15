# Tasks: Polymarket MCP Server

**Input**: Design documents from `/specs/001-write-a-mcp/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 Create the directory `src/mcp` for the new MCP server.
- [ ] T002 Create the file `src/mcp/polymarket.ts`.
- [ ] T003 Create the test directory `src/__tests__/mcp`.
- [ ] T004 Create the test file `src/__tests__/mcp/polymarket.test.ts`.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Write a failing contract test for the `search_markets` tool in `src/__tests__/mcp/polymarket.test.ts`.
- [ ] T006 [P] Write a failing contract test for the `analyze_markets` tool in `src/__tests__/mcp/polymarket.test.ts`.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T007 Define the MCP server in `src/mcp/polymarket.ts`.
- [ ] T008 Implement the `search_markets` tool in `src/mcp/polymarket.ts`.
- [ ] T009 Implement the `analyze_markets` tool in `src/mcp/polymarket.ts`.

## Phase 3.4: Integration
- [ ] T010 Integrate the Gemini API for natural language query processing in `src/mcp/polymarket.ts`.

## Phase 3.5: Polish
- [ ] T011 [P] Add unit tests for any utility functions in `src/__tests__/mcp/polymarket.test.ts`.
- [ ] T012 [P] Update the `GEMINI.md` file with the new tools.

## Dependencies
- T001, T002, T003, T004 must be completed before T005, T006.
- T005, T006 must be completed before T007, T008, T009.
- T007, T008, T009 must be completed before T010.
- T010 must be completed before T011, T012.

## Parallel Example
```
# Launch T005-T006 together:
Task: "Write a failing contract test for the `search_markets` tool in `src/__tests__/mcp/polymarket.test.ts`."
Task: "Write a failing contract test for the `analyze_markets` tool in `src/__tests__/mcp/polymarket.test.ts`."
```
