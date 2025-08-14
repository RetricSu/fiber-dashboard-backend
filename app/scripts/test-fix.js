// Test the fix for country code mapping
const https = require('https');
const http = require('http');

// Updated getCountryCode function (copy of the fix)
function getCountryCode(country) {
  // If already a 2-letter country code, return as-is
  if (country && country.length === 2) {
    return country.toUpperCase();
  }
  
  // Map full country names to codes
  const countryCodes = {
    'United States': 'US', 'Germany': 'DE', 'Netherlands': 'NL',
    'United Kingdom': 'GB', 'Canada': 'CA', 'France': 'FR',
    'Japan': 'JP', 'Australia': 'AU', 'Switzerland': 'CH',
    'Singapore': 'SG', 'China': 'CN', 'Russia': 'RU',
    'Brazil': 'BR', 'India': 'IN', 'South Korea': 'KR',
    'Hong Kong': 'HK', 'South Africa': 'ZA', 'Indonesia': 'ID',
  };
  return countryCodes[country] || country || 'UNKNOWN';
}

function testCountryCodeMapping() {
  console.log('Testing country code mapping fix...');
  
  const testCases = [
    'US', 'HK', 'SG', 'DE', 'AU', 'ZA', 'BR', 'ID', 'JP',
    'United States', 'Germany', 'Singapore', 'Unknown', null
  ];
  
  testCases.forEach(country => {
    const code = getCountryCode(country);
    console.log(`"${country}" → "${code}"`);
  });
}

async function testGeoDataProcessing() {
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/nodes_hourly?page=0',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        const nodes = jsonData.nodes || [];
        
        const countryMap = new Map();
        nodes.forEach(node => {
          const country = node.country || 'Unknown';
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
            totalCapacity: 0
          }))
          .filter(item => item.country !== 'Unknown' && item.countryCode !== 'UNKNOWN')
          .sort((a, b) => b.nodeCount - a.nodeCount);

        console.log('\n✅ Fixed geo data for world map:');
        console.log(`Countries with valid codes: ${geoNodes.length}`);
        geoNodes.forEach(c => {
          console.log(`  ${c.countryCode} (${c.country}): ${c.nodeCount} nodes`);
        });
        
        console.log('\n🎯 World map should now display data for these countries!');
        
      } catch (error) {
        console.error('Error:', error.message);
      }
    });
  });

  req.end();
}

testCountryCodeMapping();
testGeoDataProcessing();