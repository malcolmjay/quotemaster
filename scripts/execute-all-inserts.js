import fs from 'fs';
import https from 'https';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

async function executeSQLBatch(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    const url = new URL(SUPABASE_URL);

    const options = {
      hostname: url.hostname,
      path: '/rest/v1/rpc/execute_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: responseData });
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
  console.log('Reading SQL file...');
  const content = fs.readFileSync('scripts/all-batches.sql', 'utf8');
  const lines = content.split('\n');

  let customerBatches = [];
  let productBatches = [];
  let inProducts = false;

  for (const line of lines) {
    if (line.includes('-- PRODUCTS')) {
      inProducts = true;
      continue;
    }
    if (line.trim().startsWith('INSERT INTO customers')) {
      customerBatches.push(line);
    } else if (line.trim().startsWith('INSERT INTO products')) {
      productBatches.push(line);
    }
  }

  console.log(`Found ${customerBatches.length} customer batches`);
  console.log(`Found ${productBatches.length} product batches`);

  // Execute customers (skip first batch as it's already done)
  console.log('\n=== Inserting Customers ===');
  for (let i = 1; i < customerBatches.length; i++) {
    process.stdout.write(`Customer batch ${i + 1}/${customerBatches.length}... `);
    try {
      await executeSQLBatch(customerBatches[i]);
      console.log('✓');
    } catch (error) {
      console.log(`✗ ${error.message.substring(0, 100)}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Execute products
  console.log('\n=== Inserting Products ===');
  for (let i = 0; i < productBatches.length; i++) {
    process.stdout.write(`Product batch ${i + 1}/${productBatches.length}... `);
    try {
      await executeSQLBatch(productBatches[i]);
      console.log('✓');
    } catch (error) {
      console.log(`✗ ${error.message.substring(0, 100)}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\n=== Complete ===');

  // Verify counts
  console.log('\nVerifying counts...');
  try {
    const custResult = await executeSQLBatch('SELECT COUNT(*) as count FROM customers WHERE customer_number LIKE \'CUST001%\'');
    const custCount = JSON.parse(custResult.data)[0].count;
    console.log(`Customers with CUST001xxx: ${custCount}`);

    const prodResult = await executeSQLBatch('SELECT COUNT(*) as count FROM products WHERE sku LIKE \'PROD001%\'');
    const prodCount = JSON.parse(prodResult.data)[0].count;
    console.log(`Products with PROD001xxx: ${prodCount}`);
  } catch (error) {
    console.error('Error verifying counts:', error.message);
  }
}

main().catch(console.error);
