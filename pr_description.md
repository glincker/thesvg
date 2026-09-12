🎯 **What:** The testing gap addressed
This PR addresses missing unit tests for the error handling inside the `packages/cli/src/utils/api.ts` file, particularly focusing on the `try/catch` block within `fetchRegistry` when a network request via `fetch` fails. It also covers `fetchSvgContent`'s exact duplicate logic.

📊 **Coverage:** What scenarios are now tested
1. Proper throwing of `ApiError` with the underlying `Error.message` when a network error occurs.
2. Graceful fallback string formatting ("Unknown network error") if the thrown error lacks an `Error` object.
3. Tests for HTTP errors (e.g. 500 status codes).
4. Tests for invalid JSON responses.
5. Tests for malformed registry shapes.

✨ **Result:** The improvement in test coverage
The API utility inside the CLI is now resiliently and deterministically tested, capturing true simulated network failures without executing actual requests. It uses Node's native `node:test` framework properly mocked with built-in functions, thus allowing confident refactoring of the registry API wrapper.
