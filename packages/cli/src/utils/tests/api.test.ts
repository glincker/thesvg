import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { fetchIconList, ApiError, fetchSvgContent } from '../api.js';

describe('API Utils Error Handling', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws an ApiError with network error details when fetchRegistry fetch fails', async () => {
    global.fetch = mock.fn(() => Promise.reject(new Error('ECONNREFUSED')));

    try {
      await fetchIconList();
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.match((err as Error).message, /Network error fetching.*ECONNREFUSED/);
    }
  });

  it('throws an ApiError with network error details when fetchSvgContent fetch fails', async () => {
    global.fetch = mock.fn(() => Promise.reject(new Error('DNS resolution failed')));

    try {
      await fetchSvgContent('react', 'default');
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.match((err as Error).message, /Network error fetching SVG from.*DNS resolution failed/);
    }
  });

  it('throws an ApiError with fallback message when fetch fails without an Error object', async () => {
    global.fetch = mock.fn(() => Promise.reject('String error instead of Error object'));

    try {
      await fetchIconList();
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.match((err as Error).message, /Network error fetching.*Unknown network error/);
    }
  });

  it('throws an ApiError when HTTP response is not ok', async () => {
    global.fetch = mock.fn(() => Promise.resolve(new Response(null, { status: 500, statusText: 'Internal Server Error' })));

    try {
      await fetchIconList();
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.match((err as Error).message, /Failed to fetch registry: HTTP 500/);
    }
  });

  it('throws an ApiError when invalid JSON is returned', async () => {
    global.fetch = mock.fn(() => Promise.resolve(new Response('not-json', { status: 200 })));

    try {
      await fetchIconList();
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.match((err as Error).message, /Invalid JSON response from/);
    }
  });

  it('throws an ApiError when JSON shape is unexpected', async () => {
    global.fetch = mock.fn(() => Promise.resolve(new Response(JSON.stringify({ not: 'what we want' }), { status: 200 })));

    try {
      await fetchIconList();
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.match((err as Error).message, /Unexpected registry shape/);
    }
  });
});
