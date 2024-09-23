import sequelize from "../config/database.js";

async function handleHealthCheck(req, res) {
  if (Object.keys(req.query).length > 0 || Object.keys(req.body).length > 0) {
    return res.status(400).end();
  }
  try {
    await sequelize.authenticate();
    res.status(200).end();
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(503).end();
  }
}

export { handleHealthCheck };
