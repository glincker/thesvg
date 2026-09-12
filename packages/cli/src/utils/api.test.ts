import { describe, it, afterEach, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { fetchIconList, ApiError, __resetCachedRegistryForTest } from './api.js';

describe('fetchRegistry', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // We need to reset the cache to force a fetch
    if (typeof __resetCachedRegistryForTest === 'function') {
      __resetCachedRegistryForTest();
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (typeof __resetCachedRegistryForTest === 'function') {
      __resetCachedRegistryForTest();
    }
  });

  it('throws ApiError when fetch response is not ok', async () => {
    global.fetch = async () => {
      return {
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response;
    };

    // fetchRegistry is not exported directly, but fetchIconList calls it
    await assert.rejects(
      async () => {
        await fetchIconList();
      },
      (err: Error) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.message, 'Failed to fetch registry: HTTP 500');
        assert.strictEqual((err as ApiError).statusCode, 500);
        return true;
      }
    );
  });
});
