import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MAP_CONFIG,
  buildAdminMapRuntimeConfig,
  isGoogleMapsReady,
  mergeMapConfig,
  resolveAvailableMapLayers,
} from '@vargah/business/map-config';

describe('map-config', () => {
  it('defaults google to disabled', () => {
    expect(DEFAULT_MAP_CONFIG.googleEnabled).toBe(false);
    expect(isGoogleMapsReady(DEFAULT_MAP_CONFIG)).toBe(false);
  });

  it('exposes only free layers when google disabled', () => {
    const layers = resolveAvailableMapLayers(DEFAULT_MAP_CONFIG);
    expect(layers.every((layer) => layer.kind === 'free')).toBe(true);
    expect(layers.length).toBe(4);
  });

  it('adds google layers when enabled with key', () => {
    const config = mergeMapConfig({
      googleEnabled: true,
      googleApiKey: 'test-key',
    });
    const layers = resolveAvailableMapLayers(config);
    expect(layers.some((layer) => layer.kind === 'google')).toBe(true);
    expect(buildAdminMapRuntimeConfig(config).googleApiKey).toBe('test-key');
  });
});
