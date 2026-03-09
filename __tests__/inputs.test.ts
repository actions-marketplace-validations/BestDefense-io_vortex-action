import * as core from '@actions/core';
import { parseInputs } from '../src/inputs';

jest.mock('@actions/core');

const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;

function setInputs(overrides: Record<string, string> = {}): void {
  const defaults: Record<string, string> = {
    'api-key': 'test-api-key',
    'target-id': 'target-uuid-123',
    'target-url': 'https://staging.example.com',
    'scan-types': 'security',
    'intensity': 'standard',
    'vortex-mode': 'analog',
    'fail-check-on': 'high',
    'bestdefense-url': 'https://app.bestdefense.io',
    'app-backend-url': 'https://github-app.bestdefense.io',
    ...overrides,
  };

  mockGetInput.mockImplementation((name: string) => defaults[name] || '');
}

describe('parseInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse valid inputs', () => {
    setInputs();
    const inputs = parseInputs();

    expect(inputs.apiKey).toBe('test-api-key');
    expect(inputs.targetId).toBe('target-uuid-123');
    expect(inputs.targetUrl).toBe('https://staging.example.com');
    expect(inputs.scanTypes).toEqual(['security']);
    expect(inputs.intensity).toBe('standard');
    expect(inputs.vortexMode).toBe('analog');
    expect(inputs.failCheckOn).toBe('high');
  });

  it('should parse multiple scan types', () => {
    setInputs({ 'scan-types': 'security, seo, dns' });
    const inputs = parseInputs();
    expect(inputs.scanTypes).toEqual(['security', 'seo', 'dns']);
  });

  it('should reject invalid target-url', () => {
    setInputs({ 'target-url': 'not-a-url' });
    expect(() => parseInputs()).toThrow('Invalid target-url');
  });

  it('should reject invalid scan type', () => {
    setInputs({ 'scan-types': 'security,invalid' });
    expect(() => parseInputs()).toThrow('Invalid scan type: "invalid"');
  });

  it('should reject invalid intensity', () => {
    setInputs({ 'intensity': 'extreme' });
    expect(() => parseInputs()).toThrow('Invalid intensity');
  });

  it('should reject invalid vortex-mode', () => {
    setInputs({ 'vortex-mode': 'manual' });
    expect(() => parseInputs()).toThrow('Invalid vortex-mode');
  });

  it('should reject invalid fail-check-on', () => {
    setInputs({ 'fail-check-on': 'severe' });
    expect(() => parseInputs()).toThrow('Invalid fail-check-on');
  });

  it('should strip trailing slash from URLs', () => {
    setInputs({
      'bestdefense-url': 'https://app.bestdefense.io/',
      'app-backend-url': 'https://github-app.bestdefense.io/',
    });
    const inputs = parseInputs();
    expect(inputs.bestdefenseUrl).toBe('https://app.bestdefense.io');
    expect(inputs.appBackendUrl).toBe('https://github-app.bestdefense.io');
  });
});
