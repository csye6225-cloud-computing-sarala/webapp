// In your Lambda function, e.g., src/lambdaFunctions/emailVerification.js

import { VerificationToken } from "../models/VerificationToken.js";
import { v4 as uuidv4 } from "uuid";

export const createVerificationToken = async (email) => {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

  await VerificationToken.create({
    email,
    token,
    expiresAt,
  });

  return token;
};
