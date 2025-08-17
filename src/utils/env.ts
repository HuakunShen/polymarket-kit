export function getEnv() {
  return process.env.NODE_ENV || "development";
}

export function getPort() {
  return Number(process.env.PORT || Bun?.env?.PORT || 3000);
}

export function getBaseUrl() {
  return process.env.BASE_URL || `http://localhost:${getPort()}`;
}
