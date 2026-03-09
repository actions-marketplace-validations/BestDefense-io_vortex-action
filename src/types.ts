export interface ActionInputs {
  apiKey: string;
  githubToken: string;
  targetId: string;
  targetUrl: string;
  scanTypes: string[];
  intensity: 'quick' | 'standard' | 'thorough';
  vortexMode: 'analog' | 'ai';
  failCheckOn: 'critical' | 'high' | 'medium' | 'low' | 'none';
  bestdefenseUrl: string;
  /** Resolved app backend URL: defaults to bestdefenseUrl when not explicitly set. */
  appBackendUrl: string;
}

export interface TriggerScanResponse {
  success: boolean;
  message: string;
  status: number;
  id: number;
}

export interface ScanRegistrationPayload {
  /** GitHub App integer installation ID (from context.payload.installation.id) */
  installationId: string;
  reportId: string;
  repositoryFullName: string;
  pullRequestNumber: number;
  commitSha: string;
  checkRunId: number | null;
  targetUrl: string;
  scanTypes: string[];
  failCheckOn: string;
  callbackSecret: string;
}
