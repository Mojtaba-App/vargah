import { describe, expect, it } from 'vitest';

import { buildIranCityCatalog, buildIranCityId, resolveIranCityId } from '../src/iran-geo';

describe('iran-geo', () => {
  it('builds stable city ids', () => {
    expect(buildIranCityId('تهران', 'تهران')).toBe('ir-08-0013');
    expect(buildIranCityId('فارس', 'شیراز')).toMatch(/^ir-17-/);
  });

  it('resolves valid province/city pairs', () => {
    expect(resolveIranCityId('تهران', 'تهران')).toBe('ir-08-0013');
    expect(resolveIranCityId('تهران', 'نامعتبر')).toBeNull();
  });

  it('builds full catalog with coordinates', () => {
    const catalog = buildIranCityCatalog();
    expect(catalog.length).toBeGreaterThan(1000);
    const tehran = catalog.find((city) => city.id === 'ir-08-0013');
    expect(tehran?.lat).toBeGreaterThan(35);
    expect(tehran?.lng).toBeGreaterThan(51);
  });
});
