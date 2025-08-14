const http = require("http");

// Debug country data availability
function debugCountryData() {
  console.log("🌍 Debugging country data...");

  const nodesReq = http.request(
    {
      hostname: "localhost",
      port: 8080,
      path: "/nodes_hourly?page=0",
      method: "GET",
    },
    res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try {
          const nodesResponse = JSON.parse(data);
          const nodes = nodesResponse.nodes || [];

          console.log(`📊 Total nodes: ${nodes.length}`);

          // Count country distribution
          const countryStats = new Map();
          let undefinedCountries = 0;

          nodes.forEach(node => {
            const country = node.country;
            if (country && country !== "Unknown") {
              if (!countryStats.has(country)) {
                countryStats.set(country, 0);
              }
              countryStats.set(country, countryStats.get(country) + 1);
            } else {
              undefinedCountries++;
            }
          });

          console.log("\n🗺️  Country distribution:");
          const sortedCountries = Array.from(countryStats.entries()).sort(
            (a, b) => b[1] - a[1]
          );

          sortedCountries.forEach(([country, count]) => {
            console.log(`   ${country}: ${count} nodes`);
          });

          console.log(`\n⚠️  Nodes without country: ${undefinedCountries}`);

          // Check specific country mappings
          console.log("\n🔍 Country name mapping check:");
          const countryMappings = {
            US: "USA",
            GB: "England",
            CN: "China",
            HK: "Hong Kong",
            SG: "Singapore",
            DE: "Germany",
            AU: "Australia",
            ZA: "South Africa",
            BR: "Brazil",
            ID: "Indonesia",
            JP: "Japan",
          };

          sortedCountries.forEach(([country, count]) => {
            const mappedName = countryMappings[country] || country;
            console.log(`   ${country} -> ${mappedName}: ${count} nodes`);
          });
        } catch (e) {
          console.error("Error:", e.message);
        }
      });
    }
  );
  nodesReq.end();
}

debugCountryData();
