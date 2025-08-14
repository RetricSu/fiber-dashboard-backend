const http = require("http");

// Debug function to check actual data
function debugDataFlow() {
  console.log("🔍 Debugging data flow...");

  // Test both endpoints
  const endpoints = ["/nodes_hourly?page=0", "/channels_hourly?page=0"];

  let nodesData = [];
  let channelsData = [];

  // Get nodes
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
          const json = JSON.parse(data);
          nodesData = json.nodes || [];
          console.log("📊 Nodes:", nodesData.length);

          // Show sample with countries
          const countries = nodesData.filter(
            n => n.country && n.country !== "Unknown"
          );
          console.log("   Countries with data:", countries.length);
          countries.slice(0, 5).forEach(n => {
            console.log(
              `   - ${n.country}: ${n.node_name || n.node_id.substring(0, 16)}...`
            );
          });

          // Get channels
          getChannels();
        } catch (e) {
          console.error("Nodes error:", e.message);
        }
      });
    }
  );

  function getChannels() {
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
            const json = JSON.parse(data);
            channelsData = json.channels || [];
            console.log("🔗 Channels:", channelsData.length);

            // Debug the actual data
            console.log("\n🔍 Full data flow:");
            console.log(
              "1. Nodes with countries:",
              nodesData.filter(n => n.country).length
            );
            console.log("2. Channels with capacity:", channelsData.length);

            // Check node-country mapping
            const nodeCountryMap = new Map();
            nodesData.forEach(n => {
              if (n.country && n.country !== "Unknown") {
                nodeCountryMap.set(n.node_id, n.country);
              }
            });

            console.log("3. Node-country map size:", nodeCountryMap.size);

            // Check channel connections
            let channelsWithNodes = 0;
            let totalCapacity = 0;

            channelsData.forEach(channel => {
              const node1Country = nodeCountryMap.get(channel.node1);
              const node2Country = nodeCountryMap.get(channel.node2);

              if (node1Country || node2Country) {
                channelsWithNodes++;

                // Calculate capacity
                const capacity = channel.capacity;
                const capacityInShannons =
                  typeof capacity === "string"
                    ? BigInt(capacity)
                    : BigInt(capacity);
                const capacityInCKB = Number(capacityInShannons) / 100_000_000;
                totalCapacity += capacityInCKB;
              }
            });

            console.log("4. Channels with known nodes:", channelsWithNodes);
            console.log(
              "5. Total capacity from channels:",
              totalCapacity.toFixed(2),
              "CKB"
            );

            // Build actual geo data
            const countryMap = new Map();

            // Add nodes count
            nodesData.forEach(node => {
              const country = node.country || "Unknown";
              if (country !== "Unknown") {
                if (!countryMap.has(country)) {
                  countryMap.set(country, { count: 0, capacity: 0 });
                }
                countryMap.get(country).count++;
              }
            });

            // Add capacity from channels
            channelsData.forEach(channel => {
              try {
                const capacity = channel.capacity;
                const capacityInShannons =
                  typeof capacity === "string"
                    ? BigInt(capacity)
                    : BigInt(capacity);
                const capacityInCKB = Number(capacityInShannons) / 100_000_000;

                const node1Country = nodeCountryMap.get(channel.node1);
                const node2Country = nodeCountryMap.get(channel.node2);

                if (node1Country && countryMap.has(node1Country)) {
                  countryMap.get(node1Country).capacity += capacityInCKB / 2;
                }
                if (node2Country && countryMap.has(node2Country)) {
                  countryMap.get(node2Country).capacity += capacityInCKB / 2;
                }
              } catch (e) {
                console.warn("Channel processing error:", e.message);
              }
            });

            console.log("\n🌍 Final geo data:");
            const geoNodes = Array.from(countryMap.entries())
              .map(([country, data]) => ({
                country,
                countryCode: country.length === 2 ? country : country,
                nodeCount: data.count,
                totalCapacity: data.capacity,
              }))
              .filter(item => item.country !== "Unknown")
              .sort((a, b) => b.nodeCount - a.nodeCount);

            geoNodes.forEach(c => {
              console.log(
                `   ${c.countryCode}: ${c.nodeCount} nodes, ${c.totalCapacity.toFixed(2)} CKB`
              );
            });
          } catch (e) {
            console.error("Channels error:", e.message);
          }
        });
      }
    );

    channelsReq.end();
  }

  nodesReq.end();
}

debugDataFlow();
