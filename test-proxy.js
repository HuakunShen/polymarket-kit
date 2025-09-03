// Simple test to verify proxy header functionality
const testProxyUrls = [
	"http://proxy.example.com:8080",
	"https://proxy.example.com:3128",
	"http://user:pass@proxy.example.com:8080",
	"invalid-proxy-url",
];

console.log("Testing proxy header functionality...\n");

async function testProxyEndpoint(proxyUrl, shouldWork = true) {
	try {
		const response = await fetch("http://localhost:3000/gamma/teams?limit=1", {
			headers: {
				"x-http-proxy": proxyUrl,
			},
		});

		const status = response.status;
		if (shouldWork) {
			console.log(`✅ ${proxyUrl} - Status: ${status}`);
		} else {
			console.log(`⚠️  ${proxyUrl} - Unexpected success: ${status}`);
		}
	} catch (error) {
		if (shouldWork) {
			console.log(`❌ ${proxyUrl} - Error: ${error.message}`);
		} else {
			console.log(`✅ ${proxyUrl} - Expected error: ${error.message}`);
		}
	}
}

async function testAll() {
	// Test without proxy header
	console.log("Testing without proxy header:");
	await testProxyEndpoint("", true);

	console.log("\nTesting with valid proxy URLs:");
	for (const url of testProxyUrls.slice(0, 3)) {
		await testProxyEndpoint(url, true);
	}

	console.log("\nTesting with invalid proxy URL:");
	await testProxyEndpoint(testProxyUrls[3], true); // Server should handle gracefully
}

if (process.argv.includes("--run")) {
	testAll().then(() => console.log("\nProxy header tests completed!"));
} else {
	console.log(
		"Test script created. Run with 'bun test-proxy.js --run' when server is running.",
	);
}
