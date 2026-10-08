# PM Accelerator deployment handoff

Run from this directory only after an authorized Google Cloud CLI session is available. The verified accessible target is project `test-account-64391`, Cloud Run service `project-management-accelerator`, region `us-west1`. The previously documented `mifeco-com` project is stale and inaccessible with the verified account; do not deploy there.

```bash
set -euo pipefail
PROJECT_ID="test-account-64391"
SERVICE="project-management-accelerator"
REGION="us-west1"

# Do not paste credentials into chat. Use the already-authorized account only.
gcloud auth list --filter=status:ACTIVE
gcloud run deploy "$SERVICE" \
  --source . \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

The deploy uses this checked-out source. The server binds to `0.0.0.0:$PORT`; `/api/health` is a JSON route with stable service identifier `pm-accelerator`; `/api/auth/me` remains HTTP 401 without a session. No Stripe object, credential, or outbound dispatch is changed by this handoff.

After deployment, read back the exact service and revision independently:

```bash
SERVICE_URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.latestReadyRevisionName)'
curl -fsS "$SERVICE_URL/api/health"
curl -sS -o /tmp/pma-auth-me.body -w 'auth_status=%{http_code}\n' "$SERVICE_URL/api/auth/me"
test "$(curl -sS -o /tmp/pma-health.body -w '%{http_code}' "$SERVICE_URL/api/health")" = 200
test "$(curl -sS -o /tmp/pma-auth-me.body -w '%{http_code}' "$SERVICE_URL/api/auth/me")" = 401
```

The CTA must be verified in a real rendered browser DOM, not only by bundle or app-shell text. Open `$SERVICE_URL/`, inspect `a[data-test="stripe-payment-link-live"]`, and confirm its exact `href` is `https://buy.stripe.com/aFabJ2euL2zA5DYfes7Vm03`. Record the URL, statuses, response bodies, revision, and timestamp. If `gcloud auth list` has no active account, stop before deploy and report pending verification rather than claiming production success. If deployment fails, preserve the exact gcloud error and do not claim the live target was updated. The stale `mifeco-com` target remains inaccessible and is not evidence about this verified `test-account-64391` target.
