import { existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import type { AccudocConfig } from './types.js';

const CONFIG_FILES = ['accudoc.config.js', 'accudoc.config.mjs', 'accudoc.config.ts'];

/**
 * Load configuration from file
 */
export async function loadConfig(projectRoot: string): Promise<AccudocConfig> {
  for (const configFile of CONFIG_FILES) {
    const configPath = join(projectRoot, configFile);

    if (existsSync(configPath)) {
      try {
        const configUrl = pathToFileURL(configPath).href;
        const module = await import(configUrl);
        return module.default ?? module;
      } catch (error) {
        console.warn(`Warning: Failed to load ${configFile}: ${(error as Error).message}`);
      }
    }
  }

  // Return default config if no config file found
  return {};
}

/**
 * Define configuration (for type inference in config files)
 */
export function defineConfig(config: AccudocConfig): AccudocConfig {
  return config;
}
