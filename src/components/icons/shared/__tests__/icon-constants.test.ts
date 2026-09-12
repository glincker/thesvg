import { describe, it, expect } from 'vitest';
import { getJsDelivrUrl, variantToFilename, CDN_BASE } from '../icon-constants';

describe('icon-constants', () => {
  describe('variantToFilename', () => {
    it('keeps single lowercase words unchanged', () => {
      expect(variantToFilename('default')).toBe('default');
      expect(variantToFilename('mono')).toBe('mono');
      expect(variantToFilename('light')).toBe('light');
    });

    it('converts camelCase to kebab-case', () => {
      expect(variantToFilename('wordmarkLight')).toBe('wordmark-light');
      expect(variantToFilename('wordmarkDark')).toBe('wordmark-dark');
      expect(variantToFilename('someOtherVariant')).toBe('some-other-variant');
    });

    it('handles empty strings', () => {
      expect(variantToFilename('')).toBe('');
    });
  });

  describe('getJsDelivrUrl', () => {
    it('generates correct URL for simple slug and default variant', () => {
      const url = getJsDelivrUrl('github', 'default');
      expect(url).toBe(`${CDN_BASE}/github/default.svg`);
    });

    it('generates correct URL for camelCase variant', () => {
      const url = getJsDelivrUrl('nextjs', 'wordmarkLight');
      expect(url).toBe(`${CDN_BASE}/nextjs/wordmark-light.svg`);
    });

    it('generates correct URL for hyphenated slug', () => {
      const url = getJsDelivrUrl('microsoft-azure', 'dark');
      expect(url).toBe(`${CDN_BASE}/microsoft-azure/dark.svg`);
    });

    it('generates correct URL when base constant is used properly', () => {
      // Verifies that the internal logic isn't hardcoding a string but rather dynamically building
      const url = getJsDelivrUrl('test-slug', 'testVariant');
      expect(url).toBe(`${CDN_BASE}/test-slug/test-variant.svg`);
    });
  });
});
