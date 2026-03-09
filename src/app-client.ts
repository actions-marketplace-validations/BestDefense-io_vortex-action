import type { ScanRegistrationPayload } from './types';

export async function registerScan(
  backendUrl: string,
  apiKey: string,
  payload: ScanRegistrationPayload
): Promise<void> {
  const res = await fetch(`${backendUrl}/vortex-action/scans/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Pass the BestDefense API key so the endpoint can verify the caller
      // is a legitimate organisation member.
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`App backend registration failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { success: boolean };
  if (!data.success) {
    throw new Error('App backend returned failure for scan registration');
  }
}
