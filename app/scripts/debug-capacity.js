const http = require('http');

// Debug capacity calculation step by step
function debugCapacityCalculation() {
  console.log('💰 Debugging capacity calculation...');
  
  const nodesReq = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/nodes_hourly?page=0',
    method: 'GET'
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const nodesResponse = JSON.parse(data);
        const nodes = nodesResponse.nodes || [];
        
        const channelsReq = http.request({
          hostname: 'localhost',
          port: 8080,
          path: '/channels_hourly?page=0',
          method: 'GET'
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const channelsResponse = JSON.parse(data);
              const channels = channelsResponse.channels || [];
              
              console.log('\n📊 Raw capacity data:');
              channels.forEach((channel, i) => {
                if (i < 5) { // Show first 5 channels
                  console.log(`   Channel ${i+1}: capacity=${channel.capacity}`);
                }
              });
              
              // Step by step capacity calculation
              const SHANNONS_PER_CKB = 100_000_000;
              
              function hexToDecimal(hex) {
                return BigInt(hex.startsWith('0x') ? hex : '0x' + hex);
              }
              
              // Build node-country map
              const nodeCountryMap = new Map();
              nodes.forEach(node => {
                if (node.country && node.country !== 'Unknown') {
                  nodeCountryMap.set(node.node_id, node.country);
                }
              });
              
              console.log('\n🗺️  Country capacity distribution:');
              const countryCapacity = new Map();
              
              channels.forEach(channel => {
                try {
                  const capacity = channel.capacity;
                  const capacityInShannons = typeof capacity === 'string' ? 
                    hexToDecimal(capacity) : BigInt(capacity);
                  const capacityInCKB = Number(capacityInShannons) / SHANNONS_PER_CKB;
                  
                  const node1Country = nodeCountryMap.get(channel.node1);
                  const node2Country = nodeCountryMap.get(channel.node2);
                  
                  console.log(`   Channel: ${channel.channel_outpoint}`);
                  console.log(`     Raw capacity: ${capacity}`);
                  console.log(`     Capacity in CKB: ${capacityInCKB}`);
                  console.log(`     Node1: ${channel.node1} -> ${node1Country}`);
                  console.log(`     Node2: ${channel.node2} -> ${node2Country}`);
                  
                  if (node1Country) {
                    if (!countryCapacity.has(node1Country)) {
                      countryCapacity.set(node1Country, 0);
                    }
                    countryCapacity.set(node1Country, countryCapacity.get(node1Country) + capacityInCKB / 2);
                  }
                  if (node2Country) {
                    if (!countryCapacity.has(node2Country)) {
                      countryCapacity.set(node2Country, 0);
                    }
                    countryCapacity.set(node2Country, countryCapacity.get(node2Country) + capacityInCKB / 2);
                  }
                } catch (e) {
                  console.warn('   Error processing channel:', e.message);
                }
              });
              
              console.log('\n📈 Final country capacity:');
              const sortedCountries = Array.from(countryCapacity.entries())
                .sort((a, b) => b[1] - a[1]);
              
              sortedCountries.forEach(([country, capacity]) => {
                console.log(`   ${country}: ${capacity.toFixed(2)} CKB`);
              });
              
              // Count nodes per country
              const countryNodes = new Map();
              nodes.forEach(node => {
                const country = node.country;
                if (country && country !== 'Unknown') {
                  if (!countryNodes.has(country)) {
                    countryNodes.set(country, 0);
                  }
                  countryNodes.set(country, countryNodes.get(country) + 1);
                }
              });
              
              console.log('\n👥 Country node counts:');
              const sortedNodeCounts = Array.from(countryNodes.entries())
                .sort((a, b) => b[1] - a[1]);
              
              sortedNodeCounts.forEach(([country, count]) => {
                const capacity = countryCapacity.get(country) || 0;
                console.log(`   ${country}: ${count} nodes, ${capacity.toFixed(2)} CKB`);
              });
              
            } catch (e) {
              console.error('Error:', e.message);
            }
          });
        });
        channelsReq.end();
      } catch (e) {
        console.error('Error:', e.message);
      }
    });
  });
  nodesReq.end();
}

debugCapacityCalculation();