import "dotenv/config";
import { app } from "./app.js";
import sequelize from "./config/database.js";

//default port is 3000
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export { app, sequelize, server };
