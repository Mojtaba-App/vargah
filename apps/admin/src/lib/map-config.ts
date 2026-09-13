import { prisma } from '@vargah/database';
import {
  DEFAULT_MAP_CONFIG,
  MAP_CONFIG_KEY,
  mergeMapConfig,
  type MapConfig,
} from '@vargah/business/map-config';
import { decryptSecret, encryptSecret } from '@vargah/security/secrets';

function decryptMapConfig(config: MapConfig): MapConfig {
  return {
    ...config,
    googleApiKey: decryptSecret(config.googleApiKey),
  };
}

function encryptMapConfig(config: MapConfig): MapConfig {
  return {
    ...config,
    googleApiKey: encryptSecret(config.googleApiKey),
  };
}

export async function getMapConfig(): Promise<MapConfig> {
  const row = await prisma.siteSetting.findUnique({ where: { key: MAP_CONFIG_KEY } });
  if (!row?.value) return DEFAULT_MAP_CONFIG;
  return decryptMapConfig(mergeMapConfig(row.value));
}

export async function saveMapConfig(config: MapConfig) {
  const encrypted = encryptMapConfig(config);
  await prisma.siteSetting.upsert({
    where: { key: MAP_CONFIG_KEY },
    create: { key: MAP_CONFIG_KEY, value: encrypted },
    update: { value: encrypted },
  });
}
