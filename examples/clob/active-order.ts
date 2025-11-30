import { PolymarketSDK } from "../../src/sdk/client";
if (!process.env.POLYMARKET_KEY) {
  throw new Error("POLYMARKET_KEY is not set");
}
if (!process.env.POLYMARKET_FUNDER) {
  throw new Error("POLYMARKET_FUNDER is not set");
}
// Public access (no authentication required)
const sdk = new PolymarketSDK({
  host: "https://clob.polymarket.com",
  chainId: 137,
//   privateKey: process.env.POLYMARKET_KEY,
//   funderAddress: process.env.POLYMARKET_FUNDER,
});
const clobClient = await sdk.getClient();
console.log(clobClient);
