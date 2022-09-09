import { mergeConfig, InlineConfig } from "vite";

/**
 * Merge a list of configs, the first has the lowest priority (field will be overwritten by latter
 * configs), while the last has the highest priority (it's fields will not be overwritten);
 */
export function mergeConfigs([
  baseConfig,
  ...overrides
]: InlineConfig[]): InlineConfig {
  return overrides.reduceRight(
    (res, config) => mergeConfig(config, res),
    baseConfig
  );
}
