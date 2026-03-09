import type { ActionInputs, TriggerScanResponse } from './types';

export async function triggerScan(
  inputs: ActionInputs,
  callbackSecret: string
): Promise<{ reportId: string; reportUrl: string }> {
  const options: Record<string, unknown> = {
    // The callbackSecret is stored server-side when the scan is registered
    // (POST /vortex-action/scans/register). The BestDefense platform uses the
    // secret to verify result delivery; the bd-web backend also detects scan
    // completion internally via Doctrine entity listeners on the SecurityReport.
    callback: {
      secret: callbackSecret,
    },
  };

  // Enable requested scan types
  for (const st of inputs.scanTypes) {
    options[st] = { enabled: true };
  }

  const url = `${inputs.bestdefenseUrl}/api/report/create/for-target/${inputs.targetId}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${inputs.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ options }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`BestDefense API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as TriggerScanResponse;

  if (!data.success) {
    throw new Error(`BestDefense API returned failure: ${data.message}`);
  }

  const reportId = String(data.id);
  const reportUrl = `${inputs.bestdefenseUrl}/report/${reportId}`;

  return { reportId, reportUrl };
}
