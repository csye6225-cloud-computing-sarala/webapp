import sequelize from "../config/database.js";

async function handleHealthCheck(req, res) {
  // Define allowed headers
  const allowedHeaders = [
    "user-agent",
    "accept",
    "postman-token",
    "host",
    "accept-encoding",
    "connection",
  ];
  console.log("Received headers:", req.headers);

  // Check for any disallowed headers
  const hasDisallowedHeaders = Object.keys(req.headers).some(
    (header) => !allowedHeaders.includes(header.toLowerCase())
  );

  if (
    Object.keys(req.query).length > 0 ||
    Object.keys(req.body).length > 0 ||
    hasDisallowedHeaders
  ) {
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
