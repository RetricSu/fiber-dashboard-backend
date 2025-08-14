const http = require("http");

// Simulate frontend data processing to identify type mismatches
function debugFrontendDataFlow() {
  console.log("🔍 Debugging frontend data type mismatches...");

  // Step 1: Get raw backend data
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
          console.log("📊 Raw nodes data:");
          console.log("   Count:", nodes.length);
          if (nodes.length > 0) {
            console.log("   Sample node keys:", Object.keys(nodes[0]));
            console.log(
              "   Sample country:",
              nodes[0].country,
              typeof nodes[0].country
            );
            console.log(
              "   Sample node_id:",
              nodes[0].node_id,
              typeof nodes[0].node_id
            );
          }

          getChannelsData(nodes);
        } catch (e) {
          console.error("Nodes error:", e.message);
        }
      });
    }
  );

  function getChannelsData(nodes) {
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

            console.log("\n🔗 Raw channels data:");
            console.log("   Count:", channels.length);
            if (channels.length > 0) {
              console.log("   Sample channel keys:", Object.keys(channels[0]));
              console.log(
                "   Sample capacity:",
                channels[0].capacity,
                typeof channels[0].capacity
              );
            }

            // Step 2: Simulate frontend processing exactly
            simulateFrontendProcessing(nodes, channels);
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

function simulateFrontendProcessing(nodes, channels) {
  console.log("\n🔄 Simulating frontend processing...");

  // Constants from frontend
  const SHANNONS_PER_CKB = 100_000_000;

  function hexToDecimal(hex) {
    return BigInt(hex.startsWith("0x") ? hex : "0x" + hex);
  }

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

  // Step 3: Build node-country map
  const nodeCountryMap = new Map();
  nodes.forEach(node => {
    if (node.country && node.country !== "Unknown") {
      nodeCountryMap.set(node.node_id, node.country);
    }
  });
  console.log("   Node-country map:", nodeCountryMap.size, "entries");

  // Step 4: Build country data
  const countryMap = new Map();

  // Count nodes per country
  nodes.forEach(node => {
    const country = node.country || "Unknown";
    if (country !== "Unknown") {
      if (!countryMap.has(country)) {
        countryMap.set(country, { count: 0, capacity: 0 });
      }
      countryMap.get(country).count++;
    }
  });

  // Add capacity from channels
  channels.forEach(channel => {
    try {
      const capacity = channel.capacity;
      const capacityInShannons =
        typeof capacity === "string"
          ? hexToDecimal(capacity)
          : BigInt(capacity);
      const capacityInCKB = Number(capacityInShannons) / SHANNONS_PER_CKB;

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

  // Step 5: Convert to frontend format
  const geoNodes = Array.from(countryMap.entries())
    .map(([country, data]) => ({
      country,
      countryCode: getCountryCode(country),
      nodeCount: data.count,
      totalCapacity: Math.round(Math.max(0, data.capacity) * 100) / 100,
    }))
    .filter(item => item.countryCode !== "UNKNOWN")
    .sort((a, b) => b.nodeCount - a.nodeCount);

  console.log("\n📈 Frontend-ready geo data:");
  console.log("   Count:", geoNodes.length);
  geoNodes.forEach(item => {
    console.log(
      `   ${item.countryCode}: ${item.nodeCount} (type: ${typeof item.nodeCount}), ${item.totalCapacity} (type: ${typeof item.totalCapacity})`
    );
  });

  // Step 6: Test WorldMapChart data format
  console.log("\n🗺️  WorldMapChart expected format:");
  if (geoNodes.length > 0) {
    const mapData = geoNodes.map(item => ({
      name: item.country,
      value: item.nodeCount,
      capacity: item.totalCapacity,
    }));

    console.log("   Sample mapData:", mapData.slice(0, 3));
    console.log(
      "   VisualMap max:",
      geoNodes.length > 0
        ? Math.max(...geoNodes.map(item => item.nodeCount))
        : 1
    );
  }

  // Step 7: Check for potential issues
  console.log("\n⚠️  Potential issues check:");

  // Check for undefined values
  const hasUndefined = geoNodes.some(
    item =>
      item.country === undefined ||
      item.nodeCount === undefined ||
      item.totalCapacity === undefined
  );
  console.log("   Has undefined values:", hasUndefined);

  // Check for NaN values
  const hasNaN = geoNodes.some(
    item => isNaN(item.nodeCount) || isNaN(item.totalCapacity)
  );
  console.log("   Has NaN values:", hasNaN);

  // Check data types
  if (geoNodes.length > 0) {
    console.log("   Data types:", {
      country: typeof geoNodes[0].country,
      nodeCount: typeof geoNodes[0].nodeCount,
      totalCapacity: typeof geoNodes[0].totalCapacity,
    });
  }
}

debugFrontendDataFlow();
