// src/utils/tokenUtils.js

export const isTokenExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};
