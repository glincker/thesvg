// The UI icon client is the same code as the npm MCP server's (index loading, caching, search, look checks), so the worker
// re-exports it instead of keeping a copy. Only the name of the test reset differs.
export * from "../../mcp/src/ui";
export { resetUiCacheForTests as resetUiCachesForTests } from "../../mcp/src/ui";
