import { Sequelize } from "sequelize";
import "dotenv/config";

const { NODE_ENV } = process.env;
console.log("Application Environment:", NODE_ENV);

// Map environment configurations
const envConfig = {
  development: {
    DB_NAME: process.env.DB_NAME,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
  },
  test: {
    DB_NAME: process.env.TEST_DB_NAME,
    DB_HOST: process.env.TEST_DB_HOST,
    DB_PORT: process.env.TEST_DB_PORT,
    DB_USER: process.env.TEST_DB_USER,
    DB_PASSWORD: process.env.TEST_DB_PASSWORD,
  },
  production: {
    DB_NAME: process.env.PROD_DB_NAME,
    DB_HOST: process.env.PROD_DB_HOST,
    DB_PORT: process.env.PROD_DB_PORT,
    DB_USER: process.env.PROD_DB_USER,
    DB_PASSWORD: process.env.PROD_DB_PASSWORD,
  },
};

// Select the correct configuration based on NODE_ENV or default to development
const { DB_NAME, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD } =
  envConfig[NODE_ENV] || envConfig["development"];

// Validate required environment variables
if (!DB_NAME || !DB_HOST || !DB_USER || !DB_PASSWORD) {
  throw new Error("Missing necessary database environment variables.");
}

console.log("Connecting to Database with the following settings:", {
  database: DB_NAME,
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  dialect: "postgres",
});

// Initializing sequelize with database credentials
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "postgres",
  port: DB_PORT,
  logging: false,
});

export default sequelize;
