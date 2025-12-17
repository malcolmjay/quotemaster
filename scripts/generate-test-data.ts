import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const customerTypes = ['federal', 'state', 'local', 'commercial'];
const segments = ['government', 'defense', 'education', 'healthcare', 'commercial'];
const tiers = ['bronze', 'silver', 'gold', 'platinum'];
const paymentTerms = ['NET 30', 'NET 60', 'NET 90', 'Prepaid', 'COD'];

const suppliers = [
  'Acme Industries', 'Global Supply Co', 'Premier Parts', 'Midwest Manufacturing',
  'Pacific Components', 'Atlantic Wholesale', 'Central Distribution', 'Northern Supplies',
  'Southern Industrial', 'Eastern Equipment', 'Western Logistics', 'Continental Parts',
  'National Components', 'Regional Supply', 'Metro Wholesale', 'United Distributors',
  'Allied Manufacturing', 'Standard Products', 'Superior Components', 'Quality Parts Co'
];

const categories = [
  'Electronics', 'Hardware', 'Tools', 'Safety Equipment', 'Office Supplies',
  'Automotive Parts', 'Industrial Components', 'Building Materials', 'Plumbing',
  'Electrical', 'HVAC', 'Fasteners', 'Adhesives', 'Cables', 'Connectors',
  'Valves', 'Pumps', 'Motors', 'Bearings', 'Seals'
];

const warehouses = ['Main', 'East', 'West', 'North', 'South', 'Central'];

function generateCustomers(count: number, startingNumber: number) {
  const customers = [];
  const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA'];
  const cities = ['Springfield', 'Riverside', 'Franklin', 'Clinton', 'Georgetown', 'Madison', 'Salem', 'Manchester', 'Arlington', 'Fairview'];

  for (let i = 0; i < count; i++) {
    const customerNumber = `CUST${String(startingNumber + i).padStart(6, '0')}`;
    const type = customerTypes[Math.floor(Math.random() * customerTypes.length)];
    const segment = segments[Math.floor(Math.random() * segments.length)];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];

    customers.push({
      customer_number: customerNumber,
      name: `${city} ${type === 'commercial' ? 'Corporation' : segment === 'defense' ? 'Defense Systems' : 'Department'}`,
      type,
      segment,
      tier,
      payment_terms: paymentTerms[Math.floor(Math.random() * paymentTerms.length)],
      currency: 'USD',
      contract_number: type !== 'commercial' ? `CTR-${Math.floor(Math.random() * 900000) + 100000}` : null,
      sales_manager: `Manager ${Math.floor(Math.random() * 20) + 1}`,
      sales_rep: `Rep ${Math.floor(Math.random() * 50) + 1}`
    });
  }

  return customers;
}

function generateProducts(count: number, startingNumber: number) {
  const products = [];
  const itemTypes = ['Standard', 'Custom', 'Special Order', 'Stock', 'Non-Stock'];
  const countries = ['USA', 'China', 'Germany', 'Japan', 'Mexico', 'Canada', 'Taiwan', 'South Korea'];

  for (let i = 0; i < count; i++) {
    const sku = `PROD${String(startingNumber + i).padStart(6, '0')}`;
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
    const unitCost = Math.round((Math.random() * 9900 + 100) * 100) / 100;
    const listPrice = Math.round(unitCost * (1 + Math.random() * 0.8 + 0.2) * 100) / 100;

    products.push({
      sku,
      name: `${category} ${supplier.split(' ')[0]} ${Math.floor(Math.random() * 9000) + 1000}`,
      description: `High-quality ${category.toLowerCase()} component from ${supplier}`,
      category,
      supplier,
      unit_cost: unitCost,
      list_price: listPrice,
      lead_time_days: Math.floor(Math.random() * 90) + 1,
      lead_time_text: `${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 12) + 13} weeks`,
      warehouse,
      status: 'active',
      buyer: `Buyer ${Math.floor(Math.random() * 15) + 1}`,
      item_type: itemTypes[Math.floor(Math.random() * itemTypes.length)],
      unit_of_measure: 'EA',
      moq: Math.floor(Math.random() * 10) + 1,
      min_quantity: 0,
      max_quantity: Math.floor(Math.random() * 10000) + 100,
      weight: Math.round((Math.random() * 50 + 0.5) * 100) / 100,
      length: Math.round((Math.random() * 24 + 1) * 100) / 100,
      width: Math.round((Math.random() * 18 + 1) * 100) / 100,
      height: Math.round((Math.random() * 12 + 1) * 100) / 100,
      country_of_origin: countries[Math.floor(Math.random() * countries.length)],
      tariff_amount: Math.random() > 0.7 ? Math.round((Math.random() * 500 + 50) * 100) / 100 : null,
      average_lead_time: Math.floor(Math.random() * 60) + 7,
      cost_effective_from: new Date().toISOString().split('T')[0],
      cost_effective_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supplier_email: `contact@${supplier.toLowerCase().replace(/\s+/g, '')}.com`
    });
  }

  return products;
}

async function insertInBatches(table: string, data: any[], batchSize: number = 100) {
  console.log(`Inserting ${data.length} records into ${table} in batches of ${batchSize}...`);

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);

    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      throw error;
    }

    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)}`);
  }

  console.log(`Successfully inserted ${data.length} records into ${table}`);
}

async function main() {
  try {
    console.log('Starting data generation...\n');

    // Get current max customer number
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('customer_number')
      .order('customer_number', { ascending: false })
      .limit(1);

    let startCustomerNumber = 1000;
    if (existingCustomers && existingCustomers.length > 0) {
      const lastNumber = parseInt(existingCustomers[0].customer_number.replace('CUST', ''));
      startCustomerNumber = lastNumber + 1;
    }

    // Get current max product SKU
    const { data: existingProducts } = await supabase
      .from('products')
      .select('sku')
      .like('sku', 'PROD%')
      .order('sku', { ascending: false })
      .limit(1);

    let startProductNumber = 1000;
    if (existingProducts && existingProducts.length > 0) {
      const lastNumber = parseInt(existingProducts[0].sku.replace('PROD', ''));
      startProductNumber = lastNumber + 1;
    }

    console.log(`Generating 1000 customers starting from ${startCustomerNumber}...`);
    const customers = generateCustomers(1000, startCustomerNumber);
    await insertInBatches('customers', customers);

    console.log(`\nGenerating 1000 products starting from ${startProductNumber}...`);
    const products = generateProducts(1000, startProductNumber);
    await insertInBatches('products', products);

    console.log('\n✅ Data generation completed successfully!');
    console.log(`Generated ${customers.length} customers`);
    console.log(`Generated ${products.length} products with ${suppliers.length} different suppliers`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
