import { PolymarketSDK } from "./sdk";

const sdk = new PolymarketSDK({
	privateKey: process.env.POLYMARKET_KEY,
	funderAddress: process.env.POLYMARKET_FUNDER,
});
async function main() {
	// const market = await sdk.getMarket("0x2d3c4fc5cde6dfb43448402b912e41bd4453e3f030448ed026bff8f1a0bc072e");
	// console.log(`market: `);
	// console.log(market);
	const resp = await sdk.getBook(
		"70053586508884407034746548832843494840339625160858317381494925241649091892948",
	);
	console.log(resp);
}
main();
