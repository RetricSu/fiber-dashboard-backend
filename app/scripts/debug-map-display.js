const http = require("http");

// Debug the actual map display issue
function debugMapDisplay() {
  console.log("🗺️  Debugging world map display issues...");

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

          const channelsReq = http.request(
            {
              hostname: "localhost",
              port: 8080,
              path: "/channels_hourly?page=0",
              method: "GET",
            },
            res => {
              let data = "";
              res.on("data", chunk => (data += chunk));
              res.on("end", () => {
                try {
                  const channelsResponse = JSON.parse(data);
                  const channels = channelsResponse.channels || [];

                  // Exact frontend processing
                  const countryMap = new Map();

                  // Count nodes
                  nodes.forEach(node => {
                    const country = node.country || "Unknown";
                    if (country !== "Unknown") {
                      if (!countryMap.has(country)) {
                        countryMap.set(country, { count: 0, capacity: 0 });
                      }
                      countryMap.get(country).count++;
                    }
                  });

                  // Add capacity (simplified for testing)
                  const nodeCountryMap = new Map();
                  nodes.forEach(node => {
                    if (node.country && node.country !== "Unknown") {
                      nodeCountryMap.set(node.node_id, node.country);
                    }
                  });

                  channels.forEach(channel => {
                    try {
                      const capacity = channel.capacity;
                      const capacityInShannons =
                        typeof capacity === "string"
                          ? BigInt(capacity)
                          : BigInt(capacity);
                      const capacityInCKB =
                        Number(capacityInShannons) / 100_000_000;

                      const node1Country = nodeCountryMap.get(channel.node1);
                      const node2Country = nodeCountryMap.get(channel.node2);

                      if (node1Country && countryMap.has(node1Country)) {
                        countryMap.get(node1Country).capacity +=
                          capacityInCKB / 2;
                      }
                      if (node2Country && countryMap.has(node2Country)) {
                        countryMap.get(node2Country).capacity +=
                          capacityInCKB / 2;
                      }
                    } catch (e) {
                      console.warn("Channel error:", e.message);
                    }
                  });

                  // Exact format for WorldMapChart
                  const geoNodes = Array.from(countryMap.entries())
                    .map(([country, data]) => ({
                      country,
                      countryCode: country.length === 2 ? country : country,
                      nodeCount: data.count,
                      totalCapacity:
                        Math.round(Math.max(0, data.capacity) * 100) / 100,
                    }))
                    .filter(item => item.countryCode !== "UNKNOWN")
                    .sort((a, b) => b.nodeCount - a.nodeCount);

                  console.log("\n🎯 Exact WorldMapChart input:");
                  console.log("geoNodes array:", geoNodes);

                  // Test the actual ECharts format
                  const mapData = geoNodes.map(item => ({
                    name: item.country, // This might be the issue!
                    value: item.nodeCount,
                    capacity: item.totalCapacity,
                  }));

                  console.log("\n📊 mapData for ECharts:");
                  console.log("mapData:", mapData);
                  console.log(
                    "mapData types:",
                    mapData.map(item => ({
                      name: typeof item.name,
                      value: typeof item.value,
                      capacity: typeof item.capacity,
                    }))
                  );

                  // Check for country name matching issues
                  console.log("\n🔍 Country name matching check:");
                  const countryNames = geoNodes.map(item => item.country);
                  console.log("Country names:", countryNames);

                  // Test with known working countries
                  const testMapData = [
                    { name: "USA", value: 106, capacity: 200100.42 },
                    { name: "England", value: 45, capacity: 150000.0 },
                    { name: "Hong Kong", value: 40, capacity: 2260 },
                    { name: "Singapore", value: 31, capacity: 0 },
                  ];
                  console.log("\n🧪 Alternative test data:", testMapData);

                  // Check for empty data
                  console.log("\n⚠️ Data validation:");
                  console.log("Empty geoNodes:", geoNodes.length === 0);
                  console.log(
                    "All zero capacity:",
                    geoNodes.every(item => item.totalCapacity === 0)
                  );
                  console.log(
                    "Has negative values:",
                    geoNodes.some(item => item.totalCapacity < 0)
                  );
                } catch (e) {
                  console.error("Error:", e.message);
                }
              });
            }
          );
          channelsReq.end();
        } catch (e) {
          console.error("Error:", e.message);
        }
      });
    }
  );
  nodesReq.end();
}

debugMapDisplay();
