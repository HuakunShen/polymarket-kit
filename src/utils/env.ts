export function getEnv() {
  return process.env.NODE_ENV || "development";
}

export function getHostname() {
  return getEnv() === "development" ? "localhost" : "polymarket.huakun.tech";
}

export function getBaseUrl(port: number) {
  const hostname = getHostname();
  const isLocalhost = hostname === "localhost";
  return isLocalhost
    ? `http://${hostname}:${port}`
    : `https://${hostname}`;
}
