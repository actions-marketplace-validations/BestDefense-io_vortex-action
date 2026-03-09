import type { GitHub } from '@actions/github/lib/utils';
import type { Context } from '@actions/github/lib/context';

type Octokit = InstanceType<typeof GitHub>;

export async function createCheckRun(
  octokit: Octokit,
  context: Context,
  name: string
): Promise<number> {
  const { data } = await octokit.rest.checks.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    name,
    head_sha: context.payload.pull_request?.head?.sha || context.sha,
    status: 'in_progress',
  });
  return data.id;
}

export async function postScanStartedComment(
  octokit: Octokit,
  context: Context,
  reportUrl: string,
  targetUrl: string,
  scanTypes: string[]
): Promise<number> {
  const body = [
    '## 🛡️ BestDefense Vortex Scan Started',
    '',
    `**Target:** ${targetUrl}`,
    `**Scan types:** ${scanTypes.join(', ')}`,
    '',
    `[View report progress](${reportUrl})`,
    '',
    '---',
    '_Results will be posted here when the scan completes._',
  ].join('\n');

  const prNumber = context.payload.pull_request?.number;
  if (!prNumber) {
    throw new Error('This action must run on a pull_request event');
  }

  const { data } = await octokit.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    body,
  });

  return data.id;
}
