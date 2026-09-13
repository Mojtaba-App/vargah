import path from 'node:path';
import { loadEnvConfig } from '@next/env';

export function loadEnvFromMonorepoRoot() {
  loadEnvConfig(path.resolve(process.cwd(), '../..'));
}
