# Customer Import API Guide

## Overview

The Customer Import API allows you to import customer records along with their addresses and contacts from external ERP systems into the application database.

## Quick Start

### 1. Configure Authentication (Optional)

Navigate to **Settings > Customer Import API Authentication**:
- Enable authentication toggle
- Set username and password
- Configure rate limit (default: 100 requests/hour)
- Save configuration

### 2. API Endpoint

```
POST {YOUR_SUPABASE_URL}/functions/v1/import-customers
```

### 3. Simple Example

```bash
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/import-customers' \
  -u 'your_username:your_password' \
  -H 'Content-Type: application/json' \
  -d '{
    "customers": [
      {
        "customer_number": "CUST001",
        "name": "Acme Corporation",
        "type": "Commercial",
        "segment": "General"
      }
    ]
  }'
```

## Data Structure

### Customer Object (Required Fields)

```json
{
  "customer_number": "CUST001",    // Unique identifier
  "name": "Customer Name",          // Company name
  "type": "Commercial",             // Customer type
  "segment": "General"              // Business segment
}
```

### Customer Object (All Fields)

```json
{
  "customer_number": "CUST001",
  "name": "Customer Name",
  "type": "Commercial",
  "segment": "Government",
  "contract_number": "CONTRACT-123",
  "payment_terms": "Net 30",
  "currency": "USD",
  "tier": "Gold",
  "sales_manager": "Jane Smith",
  "sales_rep": "John Doe",
  "addresses": [...],              // Array of address objects
  "contacts": [...]                // Array of contact objects
}
```

### Address Object

```json
{
  "site_use_id": "SITE001",        // Optional ERP reference
  "address_line_1": "123 Main St", // Required
  "address_line_2": "Suite 100",   // Optional
  "address_line_3": "Building A",  // Optional
  "city": "Washington",            // Required
  "state": "DC",                   // Optional
  "postal_code": "20001",          // Required
  "country": "USA",                // Required
  "is_shipping": true,             // Default: false
  "is_billing": false,             // Default: false
  "is_primary": true,              // Default: false
  "is_credit_hold": false,         // Default: false
  "primary_warehouse": "WH-01",    // Optional
  "second_warehouse": "WH-02",     // Optional
  "third_warehouse": "WH-03",      // Optional
  "fourth_warehouse": "WH-04",     // Optional
  "fifth_warehouse": "WH-05"       // Optional
}
```

### Contact Object

```json
{
  "first_name": "John",            // Required
  "last_name": "Doe",              // Required
  "email": "john.doe@example.com", // Required
  "phone": "+1-555-1234",          // Optional
  "title": "Purchasing Manager",   // Optional
  "department": "Procurement",     // Optional
  "is_primary": true,              // Default: false
  "notes": "Primary contact"       // Optional
}
```

## Complete Example

### Customer with Addresses and Contacts

```json
{
  "customers": [
    {
      "customer_number": "CUST006",
      "name": "Raytheon Technologies",
      "type": "Commercial",
      "segment": "Defense Electronics",
      "contract_number": "FA8621-18-C-0001",
      "payment_terms": "Net 60",
      "currency": "USD",
      "tier": "Platinum",
      "sales_manager": "David Wilson",
      "sales_rep": "Lisa Martinez",
      "addresses": [
        {
          "site_use_id": "RTN-HQ",
          "address_line_1": "870 Winter Street",
          "city": "Waltham",
          "state": "MA",
          "postal_code": "02451",
          "country": "USA",
          "is_shipping": false,
          "is_billing": true,
          "is_primary": true,
          "is_credit_hold": false
        },
        {
          "site_use_id": "RTN-FAC1",
          "address_line_1": "1151 East Hermans Road",
          "city": "Tucson",
          "state": "AZ",
          "postal_code": "85756",
          "country": "USA",
          "is_shipping": true,
          "is_billing": false,
          "is_primary": false,
          "is_credit_hold": false,
          "primary_warehouse": "WH-AZ-03",
          "second_warehouse": "WH-AZ-04"
        }
      ],
      "contacts": [
        {
          "first_name": "Robert",
          "last_name": "Anderson",
          "email": "robert.anderson@rtx.com",
          "phone": "+1-781-522-3000",
          "title": "Director of Procurement",
          "department": "Supply Chain",
          "is_primary": true,
          "notes": "Main decision maker for all purchases"
        },
        {
          "first_name": "Jennifer",
          "last_name": "Lee",
          "email": "jennifer.lee@rtx.com",
          "phone": "+1-520-794-1000",
          "title": "Facility Manager",
          "department": "Operations",
          "is_primary": false,
          "notes": "Contact for Tucson facility deliveries"
        }
      ]
    }
  ]
}
```

## API Endpoints

### 1. Batch Import (Recommended)

Import multiple customers in a single request.

```bash
POST /import-customers

# Request Body
{
  "mode": "upsert",  # Optional: "upsert" (default) or "insert"
  "customers": [...]
}
```

**Mode Options:**
- `upsert` (default): Updates existing customers or creates new ones
- `insert`: Only creates new customers, fails if they already exist

### 2. Single Customer Import

Import one customer using a dedicated endpoint.

```bash
POST /import-customers/single

# Request Body
{
  "customer_number": "CUST001",
  "name": "Customer Name",
  ...
}
```

### 3. Delete All Customers (Dangerous!)

Remove all customer data from the database.

```bash
DELETE /import-customers/all?confirm=yes-delete-all
```

**⚠️ Warning:** This permanently deletes ALL customers, addresses, and contacts!

## Authentication

### Basic Authentication (Recommended for ERP Integration)

```bash
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/import-customers' \
  -u 'username:password' \
  -H 'Content-Type: application/json' \
  -d @customers.json
```

### Bearer Token (For Internal Use)

```bash
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/import-customers' \
  -H 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  -H 'Content-Type: application/json' \
  -d @customers.json
```

### No Authentication (If Disabled)

```bash
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/import-customers' \
  -H 'Content-Type: application/json' \
  -d @customers.json
```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Successfully imported 5 customer(s)",
  "imported": 5,
  "failed": 0
}
```

### Partial Success Response

```json
{
  "success": false,
  "message": "Imported 4 customer(s), 1 failed",
  "imported": 4,
  "failed": 1,
  "errors": [
    "Customer at index 3: Missing required field 'name'"
  ]
}
```

### Error Response

```json
{
  "success": false,
  "message": "Invalid input: 'customers' must be a non-empty array"
}
```

## Best Practices

### 1. Use Batch Import for Efficiency
Import multiple customers in a single request (up to your rate limit).

### 2. Use Upsert Mode for Syncing
The default `upsert` mode ensures your data stays synchronized:
- Creates new customers that don't exist
- Updates existing customers based on `customer_number`
- Replaces addresses and contacts with the provided data

### 3. Handle Errors Gracefully
The API processes each customer independently. If one fails, others will still be imported. Check the response for error details.

### 4. Validate Data Before Import
Ensure required fields are present:
- **Customer**: customer_number, name, type, segment
- **Address**: address_line_1, city, postal_code, country
- **Contact**: first_name, last_name, email

### 5. Use Descriptive Customer Numbers
Use meaningful identifiers that match your ERP system (e.g., "CUST-0001", "DOD-PENTAGON").

### 6. Set Primary Flags
Always designate at least one primary address and contact per customer.

## Testing

### Test Single Customer (Minimal)

```bash
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/import-customers/single' \
  -u 'test_user:test_pass' \
  -H 'Content-Type: application/json' \
  -d '{
    "customer_number": "TEST001",
    "name": "Test Corporation",
    "type": "Commercial",
    "segment": "General"
  }'
```

### Test Customer with Address

```bash
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/import-customers/single' \
  -u 'test_user:test_pass' \
  -H 'Content-Type: application/json' \
  -d '{
    "customer_number": "TEST002",
    "name": "Test Corp with Address",
    "type": "Commercial",
    "segment": "General",
    "addresses": [{
      "address_line_1": "123 Test Street",
      "city": "Test City",
      "postal_code": "12345",
      "country": "USA",
      "is_primary": true
    }]
  }'
```

### Test Complete Customer

```bash
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/import-customers/single' \
  -u 'test_user:test_pass' \
  -H 'Content-Type: application/json' \
  -d '{
    "customer_number": "TEST003",
    "name": "Complete Test Customer",
    "type": "Government",
    "segment": "Federal",
    "payment_terms": "Net 30",
    "addresses": [{
      "address_line_1": "123 Main St",
      "city": "Washington",
      "postal_code": "20001",
      "country": "USA",
      "is_shipping": true,
      "is_primary": true
    }],
    "contacts": [{
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@test.com",
      "phone": "+1-555-0100",
      "is_primary": true
    }]
  }'
```

## Common Issues

### Issue: "Authentication required"
**Solution**: Enable authentication in Settings or provide valid credentials.

### Issue: "Invalid credentials"
**Solution**: Check your username and password in Settings > Customer Import API.

### Issue: "Missing required field"
**Solution**: Ensure all required fields are present in your payload.

### Issue: Some customers imported, others failed
**Solution**: Check the `errors` array in the response for specific failure reasons.

## Security Notes

- Authentication credentials are stored securely in the database
- Passwords are not exposed in API responses
- Basic Authentication uses standard Base64 encoding
- Enable authentication for production environments
- Use rate limiting to prevent abuse
- Monitor the audit log for suspicious activity

## Rate Limiting

When authentication is enabled:
- Default: 100 requests per hour
- Configurable in Settings UI
- Applies per API key/username
- Exceeded limits return 429 status code

## Support

For detailed examples, see `customer-import-samples.json` in the project root.

For API configuration, navigate to Settings > Customer Import API Authentication.
