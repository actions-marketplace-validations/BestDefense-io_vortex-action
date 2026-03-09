import * as core from '@actions/core';
import * as github from '@actions/github';

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('../src/inputs');
jest.mock('../src/bestdefense-client');
jest.mock('../src/github-client');
jest.mock('../src/app-client');

import { parseInputs } from '../src/inputs';
import { triggerScan } from '../src/bestdefense-client';
import { createCheckRun, postScanStartedComment } from '../src/github-client';
import { registerScan } from '../src/app-client';

const mockParseInputs = parseInputs as jest.MockedFunction<typeof parseInputs>;
const mockTriggerScan = triggerScan as jest.MockedFunction<typeof triggerScan>;
const mockCreateCheckRun = createCheckRun as jest.MockedFunction<typeof createCheckRun>;
const mockPostComment = postScanStartedComment as jest.MockedFunction<typeof postScanStartedComment>;
const mockRegisterScan = registerScan as jest.MockedFunction<typeof registerScan>;
const mockSetOutput = core.setOutput as jest.MockedFunction<typeof core.setOutput>;
const mockSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>;

describe('main', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockParseInputs.mockReturnValue({
      apiKey: 'test-key',
      targetId: 'target-1',
      targetUrl: 'https://staging.example.com',
      scanTypes: ['security'],
      intensity: 'standard',
      vortexMode: 'analog',
      failCheckOn: 'high',
      bestdefenseUrl: 'https://app.bestdefense.io',
      appBackendUrl: 'https://github-app.bestdefense.io',
    });

    mockTriggerScan.mockResolvedValue({
      reportId: 'report-123',
      reportUrl: 'https://app.bestdefense.io/report/report-123',
    });

    mockCreateCheckRun.mockResolvedValue(42);
    mockPostComment.mockResolvedValue(1);
    mockRegisterScan.mockResolvedValue(undefined);

    // Mock github context
    (github as any).context = {
      repo: { owner: 'acme', repo: 'webapp' },
      sha: 'abc1234',
      payload: {
        pull_request: { number: 10, head: { sha: 'abc1234' } },
        installation: { id: 'inst-1' },
      },
    };

    (github as any).getOctokit = jest.fn().mockReturnValue({});
    (core.getInput as jest.Mock).mockReturnValue('');
  });

  it('should trigger scan and set outputs', async () => {
    // Re-require to execute the run() call
    jest.isolateModules(() => {
      require('../src/main');
    });

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockTriggerScan).toHaveBeenCalled();
    expect(mockSetOutput).toHaveBeenCalledWith('report-id', 'report-123');
    expect(mockSetOutput).toHaveBeenCalledWith(
      'report-url',
      'https://app.bestdefense.io/report/report-123'
    );
  });

  it('should call setFailed on error', async () => {
    mockParseInputs.mockImplementation(() => {
      throw new Error('Invalid input');
    });

    jest.isolateModules(() => {
      require('../src/main');
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSetFailed).toHaveBeenCalledWith('Invalid input');
  });
});
