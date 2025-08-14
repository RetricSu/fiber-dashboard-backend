const https = require('https');
const http = require('http');

// Test function to check backend connectivity
function testBackend() {
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/nodes_hourly?page=0',
    method: 'GET',
    timeout: 5000
  };

  console.log('Testing backend connectivity...');
  
  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log(`Received ${jsonData.nodes?.length || 0} nodes`);
        
        if (jsonData.nodes && jsonData.nodes.length > 0) {
          console.log('Sample node data:');
          jsonData.nodes.slice(0, 3).forEach((node, index) => {
            console.log(`  ${index + 1}. Node ID: ${node.node_id?.substring(0, 16)}...`);
            console.log(`     Country: ${node.country || 'Not set'}`);
            console.log(`     City: ${node.city || 'Not set'}`);
          });
          
          // Count countries
          const countries = jsonData.nodes
            .map(node => node.country)
            .filter(country => country && country !== 'Unknown' && country !== null);
          
          const uniqueCountries = [...new Set(countries)];
          console.log(`\nCountries with data: ${uniqueCountries.length}`);
          console.log('Countries:', uniqueCountries.slice(0, 10));
          
          if (uniqueCountries.length === 0) {
            console.log('⚠️  No geo data found in nodes!');
          } else {
            console.log('✅ Geo data available!');
          }
        } else {
          console.log('⚠️  No nodes data received');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error.message);
        console.log('Raw response:', data.substring(0, 200));
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  req.on('timeout', () => {
    console.error('Request timeout');
    req.destroy();
  });

  req.end();
}

// Test channels endpoint
testBackend();