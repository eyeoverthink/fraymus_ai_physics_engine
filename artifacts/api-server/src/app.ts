import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware, getAuth } from "@clerk/express";
import router from "./routes";
import healthRouter from "./routes/health";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// No cross-origin API access is permitted. Same-origin browser requests do not
// require CORS response headers.
app.use(cors({ origin: false }));
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(express.json({ limit: "1mb", strict: true }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  }),
);

app.use("/api", healthRouter);

const requestWindowMs = 60_000;
const requestLimit = 120;
const requestCounts = new Map<string, { count: number; startedAt: number }>();
app.use("/api", (req, res, next) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const now = Date.now();
  const entry = requestCounts.get(userId);
  if (!entry || now - entry.startedAt >= requestWindowMs) {
    requestCounts.set(userId, { count: 1, startedAt: now });
    next();
    return;
  }
  entry.count += 1;
  if (entry.count > requestLimit) {
    res.status(429).json({ error: "Rate limit exceeded" });
    return;
  }
  next();
});
app.use("/api", router);

export default app;
