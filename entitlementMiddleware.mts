export type EntitlementDb = {
  exec(sql: string): Promise<void>;
  get(sql: string, params?: unknown[]): Promise<any>;
};

type RequestLike = { [key: string]: any };
type ResponseLike = {
  status(code: number): ResponseLike;
  json(body: unknown): ResponseLike;
};
type Next = () => void;
type CurrentUser = (db: EntitlementDb, req: RequestLike) => Promise<any>;

export const PRODUCT_NAMES = {
  hypatia: 'Hypatia Pro',
  pm: 'PM Accelerator',
  vibra: 'Vibe Engineer',
} as const;

export type ProductKey = keyof typeof PRODUCT_NAMES;

const ACTIVE_STATUS = 'active';

function isExpired(value: unknown, now: number): boolean {
  if (value === null || value === undefined || value === '') return false;
  const timestamp = Date.parse(String(value));
  return Number.isNaN(timestamp) || timestamp <= now;
}

export async function migrateEntitlements(db: EntitlementDb): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS saas_licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      product_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'inactive',
      activated_at TEXT,
      expires_at TEXT,
      UNIQUE(email, product_name)
    )
  `);
}

/**
 * Server-side gate: authenticate from the HttpOnly session first, then require
 * an unexpired active license for this exact product. No client state is read.
 */
export function createEntitlementMiddleware(
  db: EntitlementDb,
  product: ProductKey,
  currentUser: CurrentUser,
) {
  const productName = PRODUCT_NAMES[product];
  return async function requireEntitlement(req: RequestLike, res: ResponseLike, next: Next) {
    const user = await currentUser(db, req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    if (!email) return res.status(403).json({ error: 'Active product entitlement required' });

    try {
      const license = await db.get(
        'SELECT status, expires_at FROM saas_licenses WHERE lower(email)=? AND product_name=? LIMIT 1',
        [email, productName],
      );
      const active = license?.status === ACTIVE_STATUS && !isExpired(license.expires_at, Date.now());
      if (!active) return res.status(403).json({ error: 'Active product entitlement required' });
      req.authUser = user;
      req.saasProduct = product;
      return next();
    } catch {
      // An unavailable or malformed authority must never grant access.
      return res.status(503).json({ error: 'Entitlement verification unavailable' });
    }
  };
}

export function installEntitlementMiddleware(
  app: { use(path: string, middleware: Function): unknown },
  db: EntitlementDb,
  product: ProductKey,
  currentUser: CurrentUser,
) {
  return migrateEntitlements(db).then(() => {
    const gate = createEntitlementMiddleware(db, product, currentUser);
    app.use('/api', async (req: RequestLike, res: ResponseLike, next: Next) => {
      // Health and authentication remain public; all other /api routes are gated.
      const publicHealthPaths = new Set(['/health', '/status', '/healthz', '/ping', '/livez', '/readyz']);
      if (publicHealthPaths.has(req.path) || req.path.startsWith('/auth')) return next();
      return gate(req, res, next);
    });
    app.use('/gapi', gate);
  });
}