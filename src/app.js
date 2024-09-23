import express from "express";
import healthzRoutes from "./routes/healthz.js";

const app = express();
app.use(express.json());

app.use(healthzRoutes);

export default app;
