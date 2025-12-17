const fs = require('fs');
const https = require('https');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function executeSQLBatch(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: SUPABASE_URL.replace('https://', ''),
      path: '/rest/v1/rpc/execute_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const content = fs.readFileSync('scripts/batched-inserts.sql', 'utf8');
  const lines = content.split('\n');

  let batchCount = 0;

  for (const line of lines) {
    if (line.trim().startsWith('INSERT INTO')) {
      batchCount++;
      console.log(`Executing batch ${batchCount}...`);

      try {
        await executeSQLBatch(line);
        console.log(`✓ Batch ${batchCount} completed`);
      } catch (error) {
        console.error(`✗ Batch ${batchCount} failed:`, error.message);
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\nCompleted ${batchCount} batches`);
}

main().catch(console.error);
