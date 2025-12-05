// Comprehensive Automotive Parts Test Data
// Generated for inventory system testing with supersessions and replacements

export interface AutomotivePart {
  partNumber: string;
  description: string;
  manufacturer: string;
  status: 'Active' | 'Superseded' | 'Replacement';
  supersessionInfo?: {
    oldPartNumber?: string;
    newPartNumber?: string;
    reason?: string;
  };
  application: string;
  category: string;
  unitCost: number;
  listPrice: number;
  stock: number;
  leadTimeDays: number;
}

export const automotiveTestParts: AutomotivePart[] = [
  // SUPERSEDED PARTS (60% - 12 items)
  {
    partNumber: 'FOR-6C3Z-6584-AA',
    description: 'Engine Oil Filter - Standard Duty',
    manufacturer: 'Ford Motor Company',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'FOR-7C3Z-6584-AB',
      reason: 'Improved filtration media and seal design'
    },
    application: '2015-2018 Ford F-150, Mustang GT',
    category: 'Filters',
    unitCost: 12.50,
    listPrice: 24.99,
    stock: 0,
    leadTimeDays: 0
  },
  {
    partNumber: 'GM-12611801',
    description: 'Fuel Injector Assembly - Port Injection',
    manufacturer: 'General Motors',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'GM-12635273',
      reason: 'Enhanced spray pattern and durability improvements'
    },
    application: '2014-2017 Chevrolet Silverado 1500 5.3L',
    category: 'Engine',
    unitCost: 89.75,
    listPrice: 179.99,
    stock: 2,
    leadTimeDays: 14
  },
  {
    partNumber: 'TOY-04465-02180',
    description: 'Front Brake Pad Set - Ceramic',
    manufacturer: 'Toyota Motor Corporation',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'TOY-04465-02190',
      reason: 'Reduced brake dust and improved stopping performance'
    },
    application: '2012-2016 Toyota Camry, Avalon',
    category: 'Brakes',
    unitCost: 45.25,
    listPrice: 89.99,
    stock: 8,
    leadTimeDays: 7
  },
  {
    partNumber: 'HON-31200-RCA-A02',
    description: 'Alternator Assembly - 130 Amp',
    manufacturer: 'Honda Motor Company',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'HON-31200-RCA-A03',
      reason: 'Improved voltage regulation and bearing upgrade'
    },
    application: '2013-2017 Honda Accord 2.4L',
    category: 'Electrical',
    unitCost: 156.80,
    listPrice: 289.99,
    stock: 3,
    leadTimeDays: 10
  },
  {
    partNumber: 'BMW-31316786425',
    description: 'Front Strut Assembly - Standard Suspension',
    manufacturer: 'BMW Group',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'BMW-31316786430',
      reason: 'Enhanced damping characteristics and seal improvements'
    },
    application: '2011-2016 BMW 3 Series (F30)',
    category: 'Suspension',
    unitCost: 234.50,
    listPrice: 449.99,
    stock: 1,
    leadTimeDays: 21
  },
  {
    partNumber: 'NIS-16546-ED000',
    description: 'Air Filter Element - Paper Type',
    manufacturer: 'Nissan Motor Company',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'NIS-16546-ED025',
      reason: 'Multi-layer filtration and improved airflow design'
    },
    application: '2013-2018 Nissan Altima 2.5L',
    category: 'Filters',
    unitCost: 18.90,
    listPrice: 34.99,
    stock: 15,
    leadTimeDays: 5
  },
  {
    partNumber: 'HYU-35100-2E100',
    description: 'Ignition Coil Pack - Single Cylinder',
    manufacturer: 'Hyundai Motor Company',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'HYU-35100-2E150',
      reason: 'Improved heat dissipation and extended service life'
    },
    application: '2011-2016 Hyundai Elantra 1.8L',
    category: 'Engine',
    unitCost: 67.25,
    listPrice: 124.99,
    stock: 6,
    leadTimeDays: 12
  },
  {
    partNumber: 'VW-1K0615301AA',
    description: 'Brake Rotor - Front Vented',
    manufacturer: 'Volkswagen AG',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'VW-1K0615301AB',
      reason: 'Improved metallurgy and heat treatment process'
    },
    application: '2009-2014 Volkswagen Golf, Jetta',
    category: 'Brakes',
    unitCost: 78.40,
    listPrice: 149.99,
    stock: 4,
    leadTimeDays: 18
  },
  {
    partNumber: 'SUB-22401AA540',
    description: 'Radiator Assembly - Aluminum Core',
    manufacturer: 'Subaru Corporation',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'SUB-22401AA560',
      reason: 'Enhanced cooling efficiency and corrosion resistance'
    },
    application: '2008-2014 Subaru Impreza, Forester',
    category: 'Engine',
    unitCost: 189.60,
    listPrice: 349.99,
    stock: 2,
    leadTimeDays: 25
  },
  {
    partNumber: 'MAZ-BP4K-18-741',
    description: 'Oxygen Sensor - Upstream',
    manufacturer: 'Mazda Motor Corporation',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'MAZ-BP4K-18-741A',
      reason: 'Faster response time and improved accuracy'
    },
    application: '2012-2017 Mazda CX-5 2.0L',
    category: 'Electrical',
    unitCost: 95.30,
    listPrice: 179.99,
    stock: 7,
    leadTimeDays: 8
  },
  {
    partNumber: 'MIT-4605A536',
    description: 'Shock Absorber - Rear',
    manufacturer: 'Mitsubishi Motors',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'MIT-4605A540',
      reason: 'Improved damping control and extended service life'
    },
    application: '2010-2015 Mitsubishi Outlander',
    category: 'Suspension',
    unitCost: 112.75,
    listPrice: 199.99,
    stock: 5,
    leadTimeDays: 16
  },
  {
    partNumber: 'LEX-90915-YZZD1',
    description: 'Oil Filter - Premium Synthetic',
    manufacturer: 'Lexus (Toyota)',
    status: 'Superseded',
    supersessionInfo: {
      newPartNumber: 'LEX-90915-YZZD2',
      reason: 'Enhanced synthetic media and anti-drainback valve'
    },
    application: '2013-2019 Lexus ES350, RX350',
    category: 'Filters',
    unitCost: 16.85,
    listPrice: 32.99,
    stock: 12,
    leadTimeDays: 3
  },

  // ACTIVE/CURRENT PARTS (40% - 8 items)
  {
    partNumber: 'FOR-7C3Z-6584-AB',
    description: 'Engine Oil Filter - Heavy Duty (Replacement)',
    manufacturer: 'Ford Motor Company',
    status: 'Replacement',
    supersessionInfo: {
      oldPartNumber: 'FOR-6C3Z-6584-AA',
      reason: 'Improved filtration media and seal design'
    },
    application: '2015-2023 Ford F-150, Mustang GT',
    category: 'Filters',
    unitCost: 14.75,
    listPrice: 28.99,
    stock: 45,
    leadTimeDays: 2
  },
  {
    partNumber: 'GM-12635273',
    description: 'Fuel Injector Assembly - Direct Injection (Replacement)',
    manufacturer: 'General Motors',
    status: 'Replacement',
    supersessionInfo: {
      oldPartNumber: 'GM-12611801',
      reason: 'Enhanced spray pattern and durability improvements'
    },
    application: '2014-2023 Chevrolet Silverado 1500 5.3L',
    category: 'Engine',
    unitCost: 98.50,
    listPrice: 199.99,
    stock: 28,
    leadTimeDays: 7
  },
  {
    partNumber: 'TOY-04465-02190',
    description: 'Front Brake Pad Set - Low Dust Ceramic (Replacement)',
    manufacturer: 'Toyota Motor Corporation',
    status: 'Replacement',
    supersessionInfo: {
      oldPartNumber: 'TOY-04465-02180',
      reason: 'Reduced brake dust and improved stopping performance'
    },
    application: '2012-2023 Toyota Camry, Avalon',
    category: 'Brakes',
    unitCost: 52.80,
    listPrice: 99.99,
    stock: 32,
    leadTimeDays: 4
  },
  {
    partNumber: 'ACE-AC4815C',
    description: 'Cabin Air Filter - Carbon Activated',
    manufacturer: 'ACDelco',
    status: 'Active',
    application: '2016-2023 Chevrolet Malibu, Cruze',
    category: 'Filters',
    unitCost: 22.40,
    listPrice: 42.99,
    stock: 38,
    leadTimeDays: 3
  },
  {
    partNumber: 'DEN-234-4536',
    description: 'Spark Plug - Iridium Tip',
    manufacturer: 'Denso Corporation',
    status: 'Active',
    application: '2018-2023 Honda Civic 1.5L Turbo',
    category: 'Engine',
    unitCost: 8.95,
    listPrice: 16.99,
    stock: 120,
    leadTimeDays: 1
  },
  {
    partNumber: 'BOS-0986494623',
    description: 'ABS Wheel Speed Sensor - Front',
    manufacturer: 'Robert Bosch GmbH',
    status: 'Active',
    application: '2014-2022 BMW X3, X4',
    category: 'Electrical',
    unitCost: 145.60,
    listPrice: 279.99,
    stock: 18,
    leadTimeDays: 14
  },
  {
    partNumber: 'MOO-MS851449',
    description: 'Tie Rod End - Outer',
    manufacturer: 'Moog Parts',
    status: 'Active',
    application: '2011-2019 Ford Explorer',
    category: 'Suspension',
    unitCost: 34.75,
    listPrice: 67.99,
    stock: 24,
    leadTimeDays: 6
  },
  {
    partNumber: 'VAL-882752',
    description: 'Engine Valve Cover Gasket Set',
    manufacturer: 'Valvoline Instant Oil Change',
    status: 'Active',
    application: '2009-2016 Audi A4 2.0L TFSI',
    category: 'Engine',
    unitCost: 67.20,
    listPrice: 124.99,
    stock: 16,
    leadTimeDays: 9
  }
];

// Supersession relationships for easy lookup
export const supersessionMap = {
  'FOR-6C3Z-6584-AA': 'FOR-7C3Z-6584-AB',
  'GM-12611801': 'GM-12635273',
  'TOY-04465-02180': 'TOY-04465-02190',
  'HON-31200-RCA-A02': 'HON-31200-RCA-A03',
  'BMW-31316786425': 'BMW-31316786430',
  'NIS-16546-ED000': 'NIS-16546-ED025',
  'HYU-35100-2E100': 'HYU-35100-2E150',
  'VW-1K0615301AA': 'VW-1K0615301AB',
  'SUB-22401AA540': 'SUB-22401AA560',
  'MAZ-BP4K-18-741': 'MAZ-BP4K-18-741A',
  'MIT-4605A536': 'MIT-4605A540',
  'LEX-90915-YZZD1': 'LEX-90915-YZZD2'
};

// Category breakdown for filtering
export const partCategories = [
  'Engine',
  'Electrical', 
  'Brakes',
  'Suspension',
  'Filters'
];

// Manufacturer list for filtering
export const manufacturers = [
  'Ford Motor Company',
  'General Motors',
  'Toyota Motor Corporation',
  'Honda Motor Company',
  'BMW Group',
  'Nissan Motor Company',
  'Hyundai Motor Company',
  'Volkswagen AG',
  'Subaru Corporation',
  'Mazda Motor Corporation',
  'Mitsubishi Motors',
  'Lexus (Toyota)',
  'ACDelco',
  'Denso Corporation',
  'Robert Bosch GmbH',
  'Moog Parts',
  'Valvoline Instant Oil Change'
];