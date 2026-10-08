const baseUrl = process.env.HEALTH_BASE_URL || "http://127.0.0.1:4317";
const paths = [
  "/health",
  "/api/health",
  "/status",
  "/api/status",
  "/healthz",
  "/api/healthz",
  "/ping",
  "/livez",
  "/readyz",
];

for (const path of paths) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json();
  if (response.status !== 200 || body.status !== "ok" || body.service !== "pm-accelerator" || body.checks?.database !== "ok" || body.checks?.storage !== "ok") {
    throw new Error(`${path}: expected healthy JSON response, got ${response.status} ${JSON.stringify(body)}`);
  }
  if (response.headers.get("access-control-allow-origin") !== "*" || !response.headers.get("cache-control")?.includes("no-store")) {
    throw new Error(`${path}: missing CORS or no-cache headers`);
  }
}

for (const path of paths) {
  const response = await fetch(`${baseUrl}${path}`, { method: "OPTIONS" });
  if (response.status !== 204) throw new Error(`${path}: OPTIONS expected 204, got ${response.status}`);
}

const head = await fetch(`${baseUrl}/status`, { method: "HEAD" });
if (head.status !== 200 || head.headers.get("x-health-status") !== "ok") {
  throw new Error(`HEAD /status: expected 200 and X-Health-Status: ok, got ${head.status}`);
}

console.log(`Health contract passed: ${paths.length} GET, ${paths.length} OPTIONS, HEAD status header`);
