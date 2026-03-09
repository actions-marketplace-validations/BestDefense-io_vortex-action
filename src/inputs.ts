import * as core from '@actions/core';
import type { ActionInputs } from './types';

const VALID_SCAN_TYPES = new Set(['security', 'seo', 'dns', 'whois']);
const VALID_INTENSITIES = new Set(['quick', 'standard', 'thorough']);
const VALID_MODES = new Set(['analog', 'ai']);
const VALID_FAIL_LEVELS = new Set(['critical', 'high', 'medium', 'low', 'none']);

export function parseInputs(): ActionInputs {
  const apiKey = core.getInput('api-key', { required: true });
  const githubToken = core.getInput('github-token') || process.env.GITHUB_TOKEN || '';
  const targetId = core.getInput('target-id', { required: true });
  const targetUrl = core.getInput('target-url', { required: true });
  const scanTypesRaw = core.getInput('scan-types') || 'security';
  const intensity = core.getInput('intensity') || 'standard';
  const vortexMode = core.getInput('vortex-mode') || 'analog';
  const failCheckOn = core.getInput('fail-check-on') || 'high';
  const bestdefenseUrl = (core.getInput('bestdefense-url') || 'https://app.bestdefense.io').replace(/\/$/, '');

  // app-backend-url defaults to bestdefense-url when not set.
  // This is correct for both multi-tenant (app.bestdefense.io) and
  // single-tenant (acme.bestdefense.io) deployments where the scan
  // registration endpoint lives on the same host as the main app.
  const appBackendUrlRaw = core.getInput('app-backend-url');
  const appBackendUrl = (appBackendUrlRaw ? appBackendUrlRaw : bestdefenseUrl).replace(/\/$/, '');

  // Validate target-url
  try {
    new URL(targetUrl);
  } catch {
    throw new Error(`Invalid target-url: ${targetUrl}`);
  }

  // Validate scan-types
  const scanTypes = scanTypesRaw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  for (const st of scanTypes) {
    if (!VALID_SCAN_TYPES.has(st)) {
      throw new Error(`Invalid scan type: "${st}". Valid types: ${[...VALID_SCAN_TYPES].join(', ')}`);
    }
  }

  if (scanTypes.length === 0) {
    throw new Error('At least one scan type is required');
  }

  // Validate enums
  if (!VALID_INTENSITIES.has(intensity)) {
    throw new Error(`Invalid intensity: "${intensity}". Valid values: ${[...VALID_INTENSITIES].join(', ')}`);
  }

  if (!VALID_MODES.has(vortexMode)) {
    throw new Error(`Invalid vortex-mode: "${vortexMode}". Valid values: ${[...VALID_MODES].join(', ')}`);
  }

  if (!VALID_FAIL_LEVELS.has(failCheckOn)) {
    throw new Error(`Invalid fail-check-on: "${failCheckOn}". Valid values: ${[...VALID_FAIL_LEVELS].join(', ')}`);
  }

  return {
    apiKey,
    githubToken,
    targetId,
    targetUrl,
    scanTypes,
    intensity: intensity as ActionInputs['intensity'],
    vortexMode: vortexMode as ActionInputs['vortexMode'],
    failCheckOn: failCheckOn as ActionInputs['failCheckOn'],
    bestdefenseUrl,
    appBackendUrl,
  };
}
