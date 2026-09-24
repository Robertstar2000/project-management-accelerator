# PM Accelerator deployment handoff

Run from this directory with an authorized Google Cloud CLI session and the intended active project:

```bash
gcloud auth login
gcloud config set project "$(gcloud config get-value project)"
gcloud run deploy project-management-accelerator \
  --source . \
  --region us-west1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

The deploy must use this checked-out source and build output. The server listens on `0.0.0.0:$PORT` and exposes both `/health` and `/api/health` for probes. No Stripe object or credential is changed by this handoff.

After deployment, capture the service URL and run the independent readback:

```bash
SERVICE_URL="$(gcloud run services describe project-management-accelerator --region us-west1 --format='value(status.url)')"
curl -fsS "$SERVICE_URL/api/health"
curl -sS -o /tmp/pma-auth-me.body -w '%{http_code}\n' "$SERVICE_URL/api/auth/me"
curl -fsS "$SERVICE_URL/" -o /tmp/pma-live.html
grep -F 'https://buy.stripe.com/aFabJ2euL2zA5DYfes7Vm03' /tmp/pma-live.html || true
```

The final CTA and unauthenticated auth check must be verified in a real rendered browser DOM, not only by bundle or app-shell text. Open `$SERVICE_URL/`, inspect `a[data-test="stripe-payment-link-live"]`, and confirm its exact `href` is `https://buy.stripe.com/aFabJ2euL2zA5DYfes7Vm03`. With no session, `/api/auth/me` must return HTTP 401; `/api/health` must return HTTP 200 and `{"status":"ok","service":"pm-accelerator"}`.
