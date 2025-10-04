import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { LeaveStore } from "./store/leaveStore.js";
import { createApiRouter } from "./routes/api.js";
import { errorHandler } from "./middleware/errorHandler.js";


const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const store = await LeaveStore.open();
const apiRouter = createApiRouter(store);
app.use("/api", apiRouter);

app.use(errorHandler);

const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
