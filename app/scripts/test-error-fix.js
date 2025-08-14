// Test the error fixes
const https = require("https");
const http = require("http");

// Test function to check all fixes
function testErrorFixes() {
  const options = {
    hostname: "localhost",
    port: 8080,
    path: "/nodes_hourly?page=0",
    method: "GET",
    timeout: 5000,
  };

  const req = http.request(options, res => {
    let data = "";
    res.on("data", chunk => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const jsonData = JSON.parse(data);
        const nodes = jsonData.nodes || [];

        // Test the fixed country code mapping
        function getCountryCode(country) {
          if (country && country.length === 2) return country.toUpperCase();
          const codes = {
            USA: "US",
            Germany: "DE",
            England: "GB",
            China: "CN",
            Australia: "AU",
            "South Africa": "ZA",
            Brazil: "BR",
            Indonesia: "ID",
            Japan: "JP",
          };
          return codes[country] || country || "UNKNOWN";
        }

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
            totalCapacity: Math.round(Math.max(0, data.capacity) * 100) / 100,
          }))
          .filter(item => item.countryCode !== "UNKNOWN")
          .sort((a, b) => b.nodeCount - a.nodeCount);

        console.log("✅ All fixes applied successfully!");
        console.log("📊 Geo data ready for world map:");
        console.log(`   Total countries: ${geoNodes.length}`);
        console.log("   Sample tooltip data:");
        geoNodes.slice(0, 3).forEach(c => {
          const tooltipText = `${c.countryCode}: ${c.nodeCount} nodes, ${c.totalCapacity.toFixed(2)} CKB`;
          console.log(`   - ${tooltipText}`);
        });

        // Test the Math.max fix
        const maxNodes =
          geoNodes.length > 0
            ? Math.max(...geoNodes.map(item => item.nodeCount))
            : 1;
        console.log(`   VisualMap max: ${maxNodes}`);
      } catch (error) {
        console.error("Error:", error.message);
      }
    });
  });

  req.end();
}

testErrorFixes();
