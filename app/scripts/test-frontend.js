// Test frontend API endpoints
const https = require("https");
const http = require("http");

// Test function to check frontend connectivity and geo data
function testFrontendGeoData() {
  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/geo-nodes",
    method: "GET",
    timeout: 10000,
  };

  console.log("Testing frontend geo data endpoint...");

  // Since frontend might not have a dedicated /api/geo-nodes endpoint,
  // let's test the actual data flow by simulating the frontend API calls

  // Test 1: Direct backend call (what frontend should do)
  const backendOptions = {
    hostname: "localhost",
    port: 8080,
    path: "/nodes_hourly?page=0",
    method: "GET",
    timeout: 5000,
  };

  const req = http.request(backendOptions, res => {
    console.log(`Backend Status: ${res.statusCode}`);

    let data = "";
    res.on("data", chunk => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const jsonData = JSON.parse(data);
        console.log(
          `✅ Backend responding with ${jsonData.nodes?.length || 0} nodes`
        );

        // Simulate frontend geo data processing
        const nodes = jsonData.nodes || [];
        const countryMap = new Map();

        nodes.forEach(node => {
          const country = node.country || "Unknown";
          if (!countryMap.has(country)) {
            countryMap.set(country, { count: 0, capacity: 0 });
          }
          countryMap.get(country).count++;
        });

        const geoNodes = Array.from(countryMap.entries())
          .map(([country, data]) => ({
            country,
            countryCode: getCountryCode(country),
            nodeCount: data.count,
            totalCapacity: 0, // Simplified for test
          }))
          .filter(item => item.country !== "Unknown")
          .sort((a, b) => b.nodeCount - a.nodeCount);

        console.log(`🌍 Geo data for world map: ${geoNodes.length} countries`);
        console.log("Top countries:", geoNodes.slice(0, 5));

        if (geoNodes.length === 0) {
          console.log("⚠️  No geo data for world map!");
        } else {
          console.log("✅ World map should display data!");
        }
      } catch (error) {
        console.error("Error processing data:", error.message);
      }
    });
  });

  req.on("error", error => {
    console.error("Backend connection error:", error.message);
  });

  req.end();
}

// Helper function to get country code from country name
function getCountryCode(country) {
  const countryCodes = {
    "Hong Kong": "HK",
    Australia: "AU",
    England: "GB",
    China: "CN",
    "South Africa": "ZA",
    Singapore: "SG",
    Germany: "DE",
    Brazil: "BR",
    Indonesia: "ID",
    Japan: "JP",
    China: "CN",
    Russia: "RU",
    "United Kingdom": "GB",
    Canada: "CA",
    France: "FR",
    Netherlands: "NL",
  };
  return countryCodes[country] || country;
}

// Run the test
testFrontendGeoData();
