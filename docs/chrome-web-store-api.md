# Publishing to the Chrome Web Store from CI

After `release.yml` publishes a GitHub release, its `chrome-web-store` job calls
`.github/workflows/publish-chrome.yml`. That workflow uploads the release zip with the
[Chrome Web Store API v2](https://developer.chrome.com/docs/webstore/using-api) and submits it for review; the item goes
live when review passes. The API code is `apps/extension/build/chrome-web-store.ts`.

The job is skipped while the repository variable `CWS_PUBLISHER_ID` is unset, so releases keep working before this
setup is done: upload the zip by hand in the dashboard.

## How it signs in

There is no key, password or refresh token in GitHub. The job runs in the `chrome-web-store` environment, gets a
GitHub OIDC token, and trades it through Google Workload Identity Federation for a short-lived access token of a
service account. That service account is the publisher's API account in the Chrome Web Store dashboard. Only this
repository, and only jobs in that environment, can use it.

## One-time setup

Sign in to Google Cloud and the developer dashboard with the publisher account (developersaber@gmail.com); it must
have 2-step verification on. Run the commands in [Cloud Shell](https://shell.cloud.google.com) or with a local
`gcloud`.

1. Create a project and turn on the API:

   ```sh
   PROJECT_ID=layout-fixer-publish   # any free project id
   gcloud projects create "$PROJECT_ID"
   gcloud services enable chromewebstore.googleapis.com iamcredentials.googleapis.com sts.googleapis.com --project "$PROJECT_ID"
   ```

2. Create the service account:

   ```sh
   gcloud iam service-accounts create chrome-web-store --project "$PROJECT_ID" --display-name "Chrome Web Store publisher"
   SERVICE_ACCOUNT="chrome-web-store@$PROJECT_ID.iam.gserviceaccount.com"
   ```

3. In the [developer dashboard](https://chrome.google.com/webstore/devconsole) → **Account**, add `$SERVICE_ACCOUNT`
   as the service account (a publisher can have one). Note the **publisher ID** shown under **Publisher → Settings**.

4. Let GitHub Actions in this repository, in the `chrome-web-store` environment, act as that service account:

   ```sh
   gcloud iam workload-identity-pools create github --project "$PROJECT_ID" --location global \
     --display-name "GitHub Actions"
   gcloud iam workload-identity-pools providers create-oidc layout-fixer --project "$PROJECT_ID" --location global \
     --workload-identity-pool github --display-name "layout-fixer releases" \
     --issuer-uri https://token.actions.githubusercontent.com \
     --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.environment=assertion.environment" \
     --attribute-condition "assertion.repository == 'BugsBountyHunter/layout-fixer' && assertion.environment == 'chrome-web-store'"
   POOL=$(gcloud iam workload-identity-pools describe github --project "$PROJECT_ID" --location global --format 'value(name)')
   gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT" --project "$PROJECT_ID" \
     --role roles/iam.workloadIdentityUser \
     --member "principalSet://iam.googleapis.com/$POOL/attribute.repository/BugsBountyHunter/layout-fixer"
   gcloud iam workload-identity-pools providers describe layout-fixer --project "$PROJECT_ID" --location global \
     --workload-identity-pool github --format 'value(name)'   # → CWS_WORKLOAD_IDENTITY_PROVIDER
   ```

5. In GitHub → **Settings → Environments**, create `chrome-web-store`: add yourself as a **required reviewer** and
   limit deployments to tags `v*` and the `main` branch. Every submission then waits for your approval in the
   Actions run.

6. In GitHub → **Settings → Secrets and variables → Actions → Variables**, add (none of these are secret):

   | Variable | Value |
   |---|---|
   | `CWS_PUBLISHER_ID` | publisher ID from step 3 |
   | `CWS_SERVICE_ACCOUNT` | `$SERVICE_ACCOUNT` |
   | `CWS_WORKLOAD_IDENTITY_PROVIDER` | output of the last command in step 4 |

IAM changes can take up to 5 minutes to apply.

## Trying it

Actions → **Publish to Chrome Web Store** → **Run workflow** on `main` with an existing release tag (for example
`v1.2.1`), then approve the run. The log shows the upload, any warnings and the review state. The API refuses a
version that is not higher than the one already in the store, so test with a release that hasn't been uploaded yet.

If the store rejects the call:

- **HTTP 403** — the service account isn't added in the dashboard, or the publisher ID is wrong.
- **Upload FAILED** — open the item in the dashboard; it shows the package error.
- **Publish refused** — the listing or privacy tab needs attention in the dashboard (for example a new permission
  justification). Fix it there and submit by hand, or rerun the workflow.
