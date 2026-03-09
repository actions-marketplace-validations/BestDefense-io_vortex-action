# BestDefense.io 🛡️

<p align="center">
  <img src="https://cdn.prod.website-files.com/6851d460e044fd271d0e1790/688420a8bf4b436c842282ef_mainlogo-p-500.png" alt="BestDefense.io Logo" width="400">
</p>

<p align="center">
  <strong>Providing Tomorrow's Cyber tools. Today</strong>
</p>

<p align="center">
  <a href="https://bestdefense.io"><img src="https://img.shields.io/badge/Website-bestdefense.io-blue"></a>
  <a href="mailto:contact@bestdefense.io"><img src="https://img.shields.io/badge/Contact-Email-green"></a>
  <a href="#"><img src="https://img.shields.io/badge/Status-TechStars_2025-purple"></a>
  <a href="#"><img src="https://img.shields.io/badge/Platform-AWS-orange"></a>
</p>

---

## 🚀 Welcome to BestDefense.io

**BestDefense.io** is revolutionizing enterprise cybersecurity with our unified AI-driven platform that eliminates the chaos of fragmented security tools. We're on a mission to **Integrate. Automate. Secure.** - empowering organizations to be proactive with their security posture through automated penetration testing, enterprise-grade load testing, real-time threat intelligence, and AI-powered remediation.


# BestDefense Vortex Scan Action

GitHub Action to trigger BestDefense security and performance scans on pull requests.
Results are posted as PR comments and GitHub Check Runs when scans complete.

---

## Quick start (multi-tenant — app.bestdefense.io)

```yaml
name: BestDefense Security Scan
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: BestDefense-io/vortex-action@v1
        with:
          api-key: ${{ secrets.BESTDEFENSE_API_KEY }}
          target-id: ${{ secrets.BESTDEFENSE_TARGET_ID }}
          target-url: 'https://staging.example.com'
```

Add two repository secrets in GitHub (**Settings → Secrets and variables → Actions**):

| Secret | Value |
|--------|-------|
| `BESTDEFENSE_API_KEY` | Your BestDefense Organisation API key |
| `BESTDEFENSE_TARGET_ID` | The UUID of the BestDefense site to scan against |

---

## Single-tenant deployments (e.g. acme.bestdefense.io)

If your organisation runs a dedicated BestDefense stack, point the action at your
instance by setting `bestdefense-url`. The scan API, report links, and scan
registration endpoint all resolve relative to this URL — no other changes needed.

```yaml
- uses: BestDefense-io/vortex-action@v1
  with:
    api-key:          ${{ secrets.BESTDEFENSE_API_KEY }}
    target-id:        ${{ secrets.BESTDEFENSE_TARGET_ID }}
    target-url:       'https://staging.example.com'
    bestdefense-url:  'https://acme.bestdefense.io'
```

---

## All inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | **Yes** | | BestDefense Organisation API key (Bearer token) |
| `target-id` | **Yes** | | BestDefense site/target UUID |
| `target-url` | **Yes** | | URL to scan — typically your staging or preview environment |
| `scan-types` | No | `security` | Comma-separated scan types: `security`, `seo`, `dns`, `whois` |
| `intensity` | No | `standard` | Scan depth: `quick`, `standard`, or `thorough` |
| `vortex-mode` | No | `analog` | Scan engine mode: `analog` or `ai` |
| `fail-check-on` | No | `high` | Minimum severity that fails the GitHub check: `critical`, `high`, `medium`, `low`, `none` |
| `bestdefense-url` | No | `https://app.bestdefense.io` | BestDefense platform base URL. Override for single-tenant stacks. |
| `app-backend-url` | No | *(same as `bestdefense-url`)* | Override only if your scan-registration endpoint is on a different host to the main app. |
| `github-token` | No | `${{ github.token }}` | Token for creating Check Runs and PR comments. The default built-in token is sufficient for most cases. |

---

## Outputs

| Output | Description |
|--------|-------------|
| `report-id` | BestDefense report UUID |
| `report-url` | Full URL to view the report |
| `check-run-id` | GitHub Check Run ID |

---

## Advanced examples

### Multiple scan types

```yaml
- uses: BestDefense-io/vortex-action@v1
  with:
    api-key:       ${{ secrets.BESTDEFENSE_API_KEY }}
    target-id:     ${{ secrets.BESTDEFENSE_TARGET_ID }}
    target-url:    'https://staging.example.com'
    scan-types:    'security,seo,dns'
    intensity:     'thorough'
    fail-check-on: 'critical'
```

### Never fail the check (scan-only mode)

```yaml
- uses: BestDefense-io/vortex-action@v1
  with:
    api-key:       ${{ secrets.BESTDEFENSE_API_KEY }}
    target-id:     ${{ secrets.BESTDEFENSE_TARGET_ID }}
    target-url:    'https://staging.example.com'
    fail-check-on: 'none'
```

### Dynamic preview environments

Use `target-url` with a URL built from PR metadata to scan ephemeral preview deployments:

```yaml
- uses: BestDefense-io/vortex-action@v1
  with:
    api-key:    ${{ secrets.BESTDEFENSE_API_KEY }}
    target-id:  ${{ secrets.BESTDEFENSE_TARGET_ID }}
    target-url: 'https://pr-${{ github.event.pull_request.number }}.preview.example.com'
```

### Single-tenant with AI engine

```yaml
- uses: BestDefense-io/vortex-action@v1
  with:
    api-key:          ${{ secrets.BESTDEFENSE_API_KEY }}
    target-id:        ${{ secrets.BESTDEFENSE_TARGET_ID }}
    target-url:       'https://staging.example.com'
    bestdefense-url:  'https://acme.bestdefense.io'
    vortex-mode:      'ai'
    scan-types:       'security,seo'
    intensity:        'thorough'
```

### Use outputs in a subsequent step

```yaml
- id: scan
  uses: BestDefense-io/vortex-action@v1
  with:
    api-key:   ${{ secrets.BESTDEFENSE_API_KEY }}
    target-id: ${{ secrets.BESTDEFENSE_TARGET_ID }}
    target-url: 'https://staging.example.com'

- name: Print report URL
  run: echo "Report available at ${{ steps.scan.outputs.report-url }}"
```

---

## How it works

```
pull_request event
       │
       ▼
vortex-action runs
  ├─ POST {bestdefense-url}/api/report/create/for-target/{target-id}
  │    └─ Returns report ID
  ├─ Creates GitHub Check Run (status: in_progress)
  ├─ POST {app-backend-url}/vortex-action/scans/register
  │    └─ Links report ID to PR / commit / check run
  └─ Posts "scan started" PR comment
       │
       ▼ (Action exits — scan runs asynchronously)
       │
BestDefense platform processes scan
       │
       ▼
SecurityReport completed in database
       │
       ▼
bd-web SecurityReportCompletedListener fires
  ├─ Looks up GitHubScanCallback by report ID
  ├─ Updates GitHub Check Run (conclusion: success/failure)
  └─ Posts results as PR comment
```

The action is **fire-and-forget** — it exits immediately after triggering the scan.
Results appear in the PR when the scan completes (typically within a few minutes
depending on intensity).

---

## Permissions

The default `GITHUB_TOKEN` requires these permissions. Add them explicitly if your
repository uses a restrictive default:

```yaml
permissions:
  checks: write        # create / update check runs
  pull-requests: write # post PR comments
  contents: read       # checkout (if needed by your workflow)
```

Full example with explicit permissions:

```yaml
jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      checks: write
      pull-requests: write
    steps:
      - uses: BestDefense-io/vortex-action@v1
        with:
          api-key:   ${{ secrets.BESTDEFENSE_API_KEY }}
          target-id: ${{ secrets.BESTDEFENSE_TARGET_ID }}
          target-url: 'https://staging.example.com'
```

---

## Development

```bash
npm install
npm test          # run tests
npm run build     # compile TypeScript → dist/main.js (required before publishing)
npm run lint      # ESLint
```

The compiled `dist/main.js` must be committed alongside source changes before
creating a release tag.
