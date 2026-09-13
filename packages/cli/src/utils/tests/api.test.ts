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

  it('throws a 404 ApiError when fetchSvgContent gets a 404 response', async () => {
    global.fetch = mock.fn(() => Promise.resolve(new Response(null, { status: 404, statusText: 'Not Found' })));

    try {
      await fetchSvgContent('not-a-real-icon', 'default');
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.strictEqual((err as ApiError).statusCode, 404);
      assert.match((err as Error).message, /SVG not found for "not-a-real-icon" \(variant: default\)/);
    }
  });

  it('throws an ApiError when fetchSvgContent gets a non-404 HTTP error', async () => {
    global.fetch = mock.fn(() => Promise.resolve(new Response(null, { status: 500, statusText: 'Internal Server Error' })));

    try {
      await fetchSvgContent('react', 'default');
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.strictEqual((err as ApiError).statusCode, 500);
      assert.match((err as Error).message, /Failed to fetch SVG: HTTP 500/);
    }
  });
});
