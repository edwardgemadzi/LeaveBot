import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { LeaveStore } from "./store/leaveStore.js";
import { createApiRouter } from "./routes/api.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Create Express app
const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Initialize store and routes
let store: LeaveStore;
let isInitialized = false;

async function initializeApp() {
  if (!isInitialized) {
    store = await LeaveStore.open();
    const apiRouter = createApiRouter(store);
    app.use("/api", apiRouter);
    app.use(errorHandler);
    isInitialized = true;
  }
}

// For Vercel serverless
export default async function handler(req: any, res: any) {
  await initializeApp();
  return app(req, res);
}

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;
  
  initializeApp().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  });
}
