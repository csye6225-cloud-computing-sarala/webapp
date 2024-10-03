import express from "express";
import sequelize from "./config/database.js";
import healthzRoutes from "./routes/healthz.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
app.use(express.json());

app.use(healthzRoutes);

app.use("/v1", userRoutes);

sequelize
  .sync()
  .then(() => {
    console.log("Database synced");
  })
  .catch((error) => {
    console.error("Failed to sync database:", error);
  });

export default app;
