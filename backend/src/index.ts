import "dotenv/config";
import express from "express";
import cors from "cors";
import { emailRoutes } from "./routes/email.routes.js";
import { senderRoutes } from "./routes/sender.routes.js";
import { authRoutes } from "./routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/senders", senderRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
});

const port = Number(process.env["PORT"] ?? 5000);

app.listen(port, () => {
  console.log(`Email job scheduler API listening on port ${port}`);
});

// On the free-tier production deployment we only run a single service, so the
// worker is started in-process here (guarded by an env var) instead of as a
// separate paid background worker service. Locally, keep running `npm run
// worker` in its own process as usual — don't set this env var locally, or
// you'll end up with two workers competing for the same queue.
if (process.env["RUN_WORKER_IN_PROCESS"] === "true") {
  import("./workers/email.worker.js").then(() => {
    console.log("Worker started in-process (RUN_WORKER_IN_PROCESS=true)");
  });
}
