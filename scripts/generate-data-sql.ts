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
const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA'];
const cities = ['Springfield', 'Riverside', 'Franklin', 'Clinton', 'Georgetown', 'Madison', 'Salem', 'Manchester', 'Arlington', 'Fairview'];
const itemTypes = ['Standard', 'Custom', 'Special Order', 'Stock', 'Non-Stock'];
const countries = ['USA', 'China', 'Germany', 'Japan', 'Mexico', 'Canada', 'Taiwan', 'South Korea'];

function generateCustomersSQL(count: number, startingNumber: number): string {
  const values = [];

  for (let i = 0; i < count; i++) {
    const customerNumber = `CUST${String(startingNumber + i).padStart(6, '0')}`;
    const type = customerTypes[Math.floor(Math.random() * customerTypes.length)];
    const segment = segments[Math.floor(Math.random() * segments.length)];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const name = `${city} ${type === 'commercial' ? 'Corporation' : segment === 'defense' ? 'Defense Systems' : 'Department'}`;
    const contractNumber = type !== 'commercial' ? `CTR-${Math.floor(Math.random() * 900000) + 100000}` : null;
    const salesManager = `Manager ${Math.floor(Math.random() * 20) + 1}`;
    const salesRep = `Rep ${Math.floor(Math.random() * 50) + 1}`;
    const paymentTerm = paymentTerms[Math.floor(Math.random() * paymentTerms.length)];

    values.push(`(
      gen_random_uuid(),
      '${customerNumber}',
      '${name.replace(/'/g, "''")}',
      '${type}',
      '${segment}',
      ${contractNumber ? `'${contractNumber}'` : 'NULL'},
      '${paymentTerm}',
      'USD',
      '${tier}',
      '${salesManager}',
      '${salesRep}',
      now(),
      now()
    )`);
  }

  return `INSERT INTO customers (
    id, customer_number, name, type, segment, contract_number,
    payment_terms, currency, tier, sales_manager, sales_rep,
    created_at, updated_at
  ) VALUES ${values.join(',\n')};`;
}

function generateProductsSQL(count: number, startingNumber: number): string {
  const values = [];

  for (let i = 0; i < count; i++) {
    const sku = `PROD${String(startingNumber + i).padStart(6, '0')}`;
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
    const unitCost = Math.round((Math.random() * 9900 + 100) * 100) / 100;
    const listPrice = Math.round(unitCost * (1 + Math.random() * 0.8 + 0.2) * 100) / 100;
    const name = `${category} ${supplier.split(' ')[0]} ${Math.floor(Math.random() * 9000) + 1000}`;
    const description = `High-quality ${category.toLowerCase()} component from ${supplier}`;
    const leadTimeDays = Math.floor(Math.random() * 90) + 1;
    const leadTimeText = `${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 12) + 13} weeks`;
    const buyer = `Buyer ${Math.floor(Math.random() * 15) + 1}`;
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    const moq = Math.floor(Math.random() * 10) + 1;
    const maxQuantity = Math.floor(Math.random() * 10000) + 100;
    const weight = Math.round((Math.random() * 50 + 0.5) * 100) / 100;
    const length = Math.round((Math.random() * 24 + 1) * 100) / 100;
    const width = Math.round((Math.random() * 18 + 1) * 100) / 100;
    const height = Math.round((Math.random() * 12 + 1) * 100) / 100;
    const country = countries[Math.floor(Math.random() * countries.length)];
    const tariff = Math.random() > 0.7 ? Math.round((Math.random() * 500 + 50) * 100) / 100 : null;
    const avgLeadTime = Math.floor(Math.random() * 60) + 7;
    const supplierEmail = `contact@${supplier.toLowerCase().replace(/\s+/g, '')}.com`;

    values.push(`(
      gen_random_uuid(),
      '${sku}',
      '${name.replace(/'/g, "''")}',
      '${description.replace(/'/g, "''")}',
      '${category}',
      '${supplier.replace(/'/g, "''")}',
      ${unitCost},
      ${listPrice},
      ${leadTimeDays},
      '${leadTimeText}',
      '${warehouse}',
      'active',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 year',
      '${buyer}',
      '${itemType}',
      'EA',
      ${moq},
      0,
      ${maxQuantity},
      ${weight},
      ${length},
      ${width},
      ${height},
      '${country}',
      ${tariff || 'NULL'},
      ${avgLeadTime},
      '${supplierEmail}',
      now(),
      now()
    )`);
  }

  return `INSERT INTO products (
    id, sku, name, description, category, supplier,
    unit_cost, list_price, lead_time_days, lead_time_text,
    warehouse, status, cost_effective_from, cost_effective_to,
    buyer, item_type, unit_of_measure, moq, min_quantity,
    max_quantity, weight, length, width, height,
    country_of_origin, tariff_amount, average_lead_time,
    supplier_email, created_at, updated_at
  ) VALUES ${values.join(',\n')};`;
}

console.log('-- Customer Data Generation');
console.log(generateCustomersSQL(1000, 1000));
console.log('\n-- Product Data Generation');
console.log(generateProductsSQL(1000, 1000));
