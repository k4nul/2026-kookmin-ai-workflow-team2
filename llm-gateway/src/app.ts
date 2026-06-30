import cors from "cors";
import express from "express";
import { requireInternalApiKey } from "./middleware/auth.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { chatRouter } from "./routes/chat.routes.js";
import { classifyRouter } from "./routes/classify.routes.js";
import { feedbackRouter } from "./routes/feedback.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { modelRouter } from "./routes/model.routes.js";

export const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);

app.use("/v1", requireInternalApiKey);
app.use("/v1/chat", chatRouter);
app.use("/v1/classify", classifyRouter);
app.use("/v1/feedback", feedbackRouter);
app.use("/v1/model", modelRouter);

app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: "NOT_FOUND",
    message: "Route not found."
  });
});

app.use(errorMiddleware);
