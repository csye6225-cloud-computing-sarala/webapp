import { Sequelize } from "sequelize";
import "dotenv/config";

const env = process.env.NODE_ENV;
console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);
console.log("env: ", env);

if (env === "test") {
  process.env.DB_NAME = process.env.TEST_DB_NAME;
  process.env.DB_HOST = process.env.TEST_DB_HOST;
  process.env.DB_PORT = process.env.TEST_DB_PORT;
  process.env.DB_USER = process.env.TEST_DB_USER;
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;
} else if (env === "production") {
  process.env.DB_NAME = process.env.PROD_DB_NAME;
  process.env.DB_HOST = process.env.PROD_DB_HOST;
  process.env.DB_PORT = process.env.PROD_DB_PORT;
  process.env.DB_USER = process.env.PROD_DB_USER;
  process.env.DB_PASSWORD = process.env.PROD_DB_PASSWORD;
} else {
  // Default to development if not test or production
  process.env.DB_NAME = process.env.DB_NAME;
  process.env.DB_HOST = process.env.DB_HOST;
  process.env.DB_PORT = process.env.DB_PORT;
  process.env.DB_USER = process.env.DB_USER;
  process.env.DB_PASSWORD = process.env.DB_PASSWORD;
}

console.log("Environment Variables:", {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
});

//initializing sequelize object with db credentials
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT,
    logging: false,
  }
);

export default sequelize;
