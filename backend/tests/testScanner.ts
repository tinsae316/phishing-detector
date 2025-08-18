import { scanUrl } from "../src/services/scanner"; // adjust the path if needed

async function runTests() {
  const testUrls = [
    "http://example.com", // safe URL
    "https://login-google.com", // possible typosquat
    "http://very.long.subdomain.chain.example.com", // suspicious long subdomain
    "http://192.168.0.1/123456789", // numeric sequence in URL
    "http://paypal-login.fake-site.ru", // brand + mixed script
    "https://malware.example.com", // pretend unsafe
    "https://evil-google.com" // direct threat match
  ];

  for (const url of testUrls) {
    console.log(`\nScanning: ${url}`);
    try {
      const result = await scanUrl(url);
      console.log("Verdict:", result.verdict);
      console.log("Score:", result.score);
      console.log("Reasons:", result.reasons.join(", "));
      if (result.matchedThreatIds) console.log("Threat IDs:", result.matchedThreatIds.join(", "));
    } catch (err) {
      console.error("Error scanning URL:", err);
    }
  }
}

runTests();
