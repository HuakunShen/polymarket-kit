import { ClobClient } from "@polymarket/clob-client";
import { PolymarketSDK } from "../../src/sdk/client";

// Public access (no authentication required)
const sdk = new PolymarketSDK({
	host: "https://clob.polymarket.com",
	chainId: 137,
});

// Fetch price history
const resp = await sdk.getPriceHistory({
	market:
		"60487116984468020978247225474488676749601001829886755968952521846780452448915",
	//   startTs: 1763883150,
	//   endTs: 1763883850,
	startDate: "2025-11-20",
	endDate: "2025-11-23",
});
console.log(resp);
// console.log("Price history data:");
// console.log(`- ${resp.history.length} data points`);
// console.log(`- Time range: ${resp.timeRange?.start} to ${resp.timeRange?.end}`);
// console.log("- Sample data points:");
// resp.history.slice(0, 3).forEach((point, index) => {
//   console.log(
//     `  ${index + 1}. Time: ${new Date(point.t * 1000).toISOString()}, Price: ${point.p}`
//   );
// });

const clobClient = new ClobClient("https://clob.polymarket.com", 137);
const resp2 = await clobClient.getPricesHistory({
	market:
		"60487116984468020978247225474488676749601001829886755968952521846780452448915",
	startTs: 1763883150,
	endTs: 1763883850,
});
console.log(resp2);
