import * as core from '@actions/core';
import * as github from '@actions/github';
import { randomBytes } from 'crypto';
import { parseInputs } from './inputs';
import { triggerScan } from './bestdefense-client';
import { createCheckRun, postScanStartedComment } from './github-client';
import { registerScan } from './app-client';

async function run(): Promise<void> {
  try {
    // 1. Parse and validate inputs
    const inputs = parseInputs();
    core.info(`Scan target:   ${inputs.targetUrl}`);
    core.info(`Scan types:    ${inputs.scanTypes.join(', ')}`);
    core.info(`Platform URL:  ${inputs.bestdefenseUrl}`);
    core.info(`Backend URL:   ${inputs.appBackendUrl}`);

    // 2. Generate a per-scan secret used to verify the scan registration was
    //    created by this run and not tampered with externally.
    const callbackSecret = randomBytes(32).toString('hex');

    // 3. Trigger scan via BestDefense API
    core.info('Triggering BestDefense scan...');
    const { reportId, reportUrl } = await triggerScan(inputs, callbackSecret);
    core.info(`Scan triggered: reportId=${reportId}`);

    // 4. Create GitHub Check Run
    const octokit = github.getOctokit(inputs.githubToken);
    const context = github.context;

    let checkRunId: number | null = null;
    try {
      checkRunId = await createCheckRun(octokit, context, 'BestDefense Vortex Scan');
      core.info(`Check Run created: ${checkRunId}`);
    } catch (err) {
      core.warning(`Failed to create Check Run (may lack checks:write permission): ${err}`);
    }

    // 5. Register the scan with the BestDefense app backend so that GitHub PR
    //    results (check run update + comment) are posted when the scan completes.
    //    The GitHub App installation ID is available in the webhook context when
    //    the Action is triggered via pull_request events on a repo where the
    //    BestDefense GitHub App is installed.
    const installationId = String(context.payload.installation?.id || '');
    if (installationId) {
      try {
        await registerScan(inputs.appBackendUrl, inputs.apiKey, {
          installationId,
          reportId,
          repositoryFullName: `${context.repo.owner}/${context.repo.repo}`,
          pullRequestNumber: context.payload.pull_request?.number || 0,
          commitSha: context.payload.pull_request?.head?.sha || context.sha,
          checkRunId,
          targetUrl: inputs.targetUrl,
          scanTypes: inputs.scanTypes,
          failCheckOn: inputs.failCheckOn,
          callbackSecret,
        });
        core.info('Scan registered with BestDefense backend');
      } catch (err) {
        core.warning(`Failed to register scan (PR results may not be posted automatically): ${err}`);
      }
    } else {
      core.warning(
        'No GitHub App installation ID found in event context. ' +
        'Ensure the BestDefense GitHub App is installed on this repository. ' +
        'Scan will still run — results are available at the report URL.'
      );
    }

    // 6. Post "scan started" PR comment
    try {
      await postScanStartedComment(octokit, context, reportUrl, inputs.targetUrl, inputs.scanTypes);
    } catch (err) {
      core.warning(`Failed to post PR comment: ${err}`);
    }

    // 7. Set outputs
    core.setOutput('report-id', reportId);
    core.setOutput('report-url', reportUrl);
    if (checkRunId) {
      core.setOutput('check-run-id', String(checkRunId));
    }

    core.info('BestDefense Vortex scan initiated. Results will be posted to the PR when the scan completes.');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
