import { describe, expect, it } from 'vitest';

import {
  provinceNameForGeoJson,
  provinceNameFromGeoJson,
} from '@vargah/business/iran-geo';

describe('iran-geo province aliases', () => {
  it('maps app province names to geojson names', () => {
    expect(provinceNameForGeoJson('چهارمحال وبختیاری')).toBe('چهارمحال و بختیاری');
    expect(provinceNameForGeoJson('تهران')).toBe('تهران');
  });

  it('maps geojson names back to app province names', () => {
    expect(provinceNameFromGeoJson('چهارمحال و بختیاری')).toBe('چهارمحال وبختیاری');
    expect(provinceNameFromGeoJson('تهران')).toBe('تهران');
  });
});
