/**
 * Import Customers Edge Function
 * Allows importing customer data with addresses and contacts from ERP into Supabase
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CustomerAddressInput {
  site_use_id?: string;
  address_line_1: string;
  address_line_2?: string;
  address_line_3?: string;
  city: string;
  postal_code: string;
  state?: string;
  country: string;
  is_shipping?: boolean;
  is_billing?: boolean;
  is_primary?: boolean;
  is_credit_hold?: boolean;
  primary_warehouse?: string;
  second_warehouse?: string;
  third_warehouse?: string;
  fourth_warehouse?: string;
  fifth_warehouse?: string;
}

interface CustomerContactInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  is_primary?: boolean;
  notes?: string;
}

interface CustomerInput {
  customer_number: string;
  name: string;
  type: string;
  segment: string;
  contract_number?: string;
  payment_terms?: string;
  currency?: string;
  tier?: string;
  sales_manager?: string;
  sales_rep?: string;
  addresses?: CustomerAddressInput[];
  contacts?: CustomerContactInput[];
}

interface ImportResult {
  success: boolean;
  message: string;
  imported?: number;
  failed?: number;
  errors?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: authEnabledConfig } = await supabase
      .from("app_configurations")
      .select("config_value")
      .eq("config_key", "customer_import_api_enabled")
      .maybeSingle();

    const isAuthEnabled = authEnabledConfig?.config_value === "true";

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let isAuthenticated = false;

    if (isAuthEnabled) {
      if (!authHeader) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Authentication required. Please provide credentials.",
          }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "WWW-Authenticate": "Basic realm=\"Customer Import API\""
            },
          }
        );
      }

      if (authHeader.startsWith("Basic ")) {
        const base64Credentials = authHeader.replace("Basic ", "");
        const credentials = atob(base64Credentials);
        const [username, password] = credentials.split(":");

        const { data: storedUsername } = await supabase
          .from("app_configurations")
          .select("config_value")
          .eq("config_key", "customer_import_api_username")
          .maybeSingle();

        const { data: storedPassword } = await supabase
          .from("app_configurations")
          .select("config_value")
          .eq("config_key", "customer_import_api_password")
          .maybeSingle();

        const validUsername = storedUsername?.config_value || "";
        const validPassword = storedPassword?.config_value || "";

        if (username === validUsername && password === validPassword && validUsername && validPassword) {
          isAuthenticated = true;
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Invalid credentials",
            }),
            {
              status: 401,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "WWW-Authenticate": "Basic realm=\"Customer Import API\""
              },
            }
          );
        }
      } else if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
          isAuthenticated = true;
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Invalid token",
            }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid authentication format. Use Basic or Bearer token.",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      if (authHeader) {
        if (authHeader.startsWith("Bearer ")) {
          const token = authHeader.replace("Bearer ", "");
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            userId = user.id;
          }
        } else if (authHeader.startsWith("Basic ")) {
          const base64Credentials = authHeader.replace("Basic ", "");
          const credentials = atob(base64Credentials);
          const [username, password] = credentials.split(":");

          const { data: storedUsername } = await supabase
            .from("app_configurations")
            .select("config_value")
            .eq("config_key", "customer_import_api_username")
            .maybeSingle();

          const { data: storedPassword } = await supabase
            .from("app_configurations")
            .select("config_value")
            .eq("config_key", "customer_import_api_password")
            .maybeSingle();

          const validUsername = storedUsername?.config_value || "";
          const validPassword = storedPassword?.config_value || "";

          if (username === validUsername && password === validPassword && validUsername && validPassword) {
            isAuthenticated = true;
          } else {
            return new Response(
              JSON.stringify({
                success: false,
                message: "Invalid credentials",
              }),
              {
                status: 401,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                  "WWW-Authenticate": "Basic realm=\"Customer Import API\""
                },
              }
            );
          }
        }
      }
      if (!isAuthenticated) {
        isAuthenticated = true;
      }
    }

    const url = new URL(req.url);
    const pathname = url.pathname;

    if (req.method === "POST" && pathname.endsWith("/import-customers")) {
      const body = await req.json();
      const { customers, mode = "upsert" } = body;

      if (!Array.isArray(customers) || customers.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid input: 'customers' must be a non-empty array",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await importCustomers(supabase, customers, mode, userId);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && pathname.endsWith("/import-customers/single")) {
      const customer = await req.json();

      if (!customer.customer_number || !customer.name) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid input: 'customer_number' and 'name' are required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await importCustomers(supabase, [customer], "upsert", userId);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE" && pathname.endsWith("/import-customers/all")) {
      const confirmParam = url.searchParams.get("confirm");

      if (confirmParam !== "yes-delete-all") {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Missing confirmation parameter. Add ?confirm=yes-delete-all to proceed",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error: contactsError } = await supabase
        .from("customer_contacts")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      const { error: addressesError } = await supabase
        .from("customer_addresses")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      const { error: customersError } = await supabase
        .from("customers")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (contactsError || addressesError || customersError) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to delete customers",
            error: contactsError?.message || addressesError?.message || customersError?.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "All customers, addresses, and contacts deleted successfully",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "Unknown endpoint",
        available_endpoints: [
          "POST /import-customers - Batch import customers",
          "POST /import-customers/single - Import single customer",
          "DELETE /import-customers/all?confirm=yes-delete-all - Delete all customers",
        ],
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in import-customers function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function importCustomers(
  supabase: any,
  customers: CustomerInput[],
  mode: "upsert" | "insert",
  userId: string | null
): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];

    if (!customer.customer_number) {
      errors.push(`Customer at index ${i}: Missing required field 'customer_number'`);
      failed++;
      continue;
    }

    if (!customer.name) {
      errors.push(`Customer at index ${i}: Missing required field 'name'`);
      failed++;
      continue;
    }

    try {
      const customerData: any = {
        customer_number: customer.customer_number.trim(),
        name: customer.name.trim(),
        type: customer.type?.trim() || "Commercial",
        segment: customer.segment?.trim() || "General",
        contract_number: customer.contract_number?.trim() || null,
        payment_terms: customer.payment_terms?.trim() || null,
        currency: customer.currency?.trim() || "USD",
        tier: customer.tier?.trim() || null,
        sales_manager: customer.sales_manager?.trim() || null,
        sales_rep: customer.sales_rep?.trim() || null,
      };

      if (mode === "upsert") {
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("customer_number", customer.customer_number)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("customers")
            .update(customerData)
            .eq("id", existing.id);

          if (error) {
            errors.push(`Failed to update customer ${customer.customer_number}: ${error.message}`);
            failed++;
            continue;
          }

          if (customer.addresses && customer.addresses.length > 0) {
            await supabase
              .from("customer_addresses")
              .delete()
              .eq("customer_number", customer.customer_number);

            for (const address of customer.addresses) {
              const addressData = {
                customer_number: customer.customer_number,
                site_use_id: address.site_use_id?.trim() || null,
                address_line_1: address.address_line_1.trim(),
                address_line_2: address.address_line_2?.trim() || null,
                address_line_3: address.address_line_3?.trim() || null,
                city: address.city.trim(),
                postal_code: address.postal_code.trim(),
                state: address.state?.trim() || null,
                country: address.country.trim(),
                is_shipping: address.is_shipping ?? false,
                is_billing: address.is_billing ?? false,
                is_primary: address.is_primary ?? false,
                is_credit_hold: address.is_credit_hold ?? false,
                primary_warehouse: address.primary_warehouse?.trim() || null,
                second_warehouse: address.second_warehouse?.trim() || null,
                third_warehouse: address.third_warehouse?.trim() || null,
                fourth_warehouse: address.fourth_warehouse?.trim() || null,
                fifth_warehouse: address.fifth_warehouse?.trim() || null,
              };

              await supabase.from("customer_addresses").insert(addressData);
            }
          }

          if (customer.contacts && customer.contacts.length > 0) {
            await supabase
              .from("customer_contacts")
              .delete()
              .eq("customer_number", customer.customer_number);

            for (const contact of customer.contacts) {
              const contactData = {
                customer_number: customer.customer_number,
                first_name: contact.first_name.trim(),
                last_name: contact.last_name.trim(),
                email: contact.email.trim(),
                phone: contact.phone?.trim() || null,
                title: contact.title?.trim() || null,
                department: contact.department?.trim() || null,
                is_primary: contact.is_primary ?? false,
                notes: contact.notes?.trim() || null,
              };

              await supabase.from("customer_contacts").insert(contactData);
            }
          }

          imported++;
        } else {
          const { error, data: insertedCustomer } = await supabase
            .from("customers")
            .insert(customerData)
            .select()
            .single();

          if (error) {
            errors.push(`Failed to insert customer ${customer.customer_number}: ${error.message}`);
            failed++;
            continue;
          }

          if (customer.addresses && customer.addresses.length > 0) {
            for (const address of customer.addresses) {
              const addressData = {
                customer_number: customer.customer_number,
                site_use_id: address.site_use_id?.trim() || null,
                address_line_1: address.address_line_1.trim(),
                address_line_2: address.address_line_2?.trim() || null,
                address_line_3: address.address_line_3?.trim() || null,
                city: address.city.trim(),
                postal_code: address.postal_code.trim(),
                state: address.state?.trim() || null,
                country: address.country.trim(),
                is_shipping: address.is_shipping ?? false,
                is_billing: address.is_billing ?? false,
                is_primary: address.is_primary ?? false,
                is_credit_hold: address.is_credit_hold ?? false,
                primary_warehouse: address.primary_warehouse?.trim() || null,
                second_warehouse: address.second_warehouse?.trim() || null,
                third_warehouse: address.third_warehouse?.trim() || null,
                fourth_warehouse: address.fourth_warehouse?.trim() || null,
                fifth_warehouse: address.fifth_warehouse?.trim() || null,
              };

              await supabase.from("customer_addresses").insert(addressData);
            }
          }

          if (customer.contacts && customer.contacts.length > 0) {
            for (const contact of customer.contacts) {
              const contactData = {
                customer_number: customer.customer_number,
                first_name: contact.first_name.trim(),
                last_name: contact.last_name.trim(),
                email: contact.email.trim(),
                phone: contact.phone?.trim() || null,
                title: contact.title?.trim() || null,
                department: contact.department?.trim() || null,
                is_primary: contact.is_primary ?? false,
                notes: contact.notes?.trim() || null,
              };

              await supabase.from("customer_contacts").insert(contactData);
            }
          }

          imported++;
        }
      } else {
        const { error } = await supabase.from("customers").insert(customerData);

        if (error) {
          errors.push(`Failed to insert customer ${customer.customer_number}: ${error.message}`);
          failed++;
          continue;
        }

        if (customer.addresses && customer.addresses.length > 0) {
          for (const address of customer.addresses) {
            const addressData = {
              customer_number: customer.customer_number,
              site_use_id: address.site_use_id?.trim() || null,
              address_line_1: address.address_line_1.trim(),
              address_line_2: address.address_line_2?.trim() || null,
              address_line_3: address.address_line_3?.trim() || null,
              city: address.city.trim(),
              postal_code: address.postal_code.trim(),
              state: address.state?.trim() || null,
              country: address.country.trim(),
              is_shipping: address.is_shipping ?? false,
              is_billing: address.is_billing ?? false,
              is_primary: address.is_primary ?? false,
              is_credit_hold: address.is_credit_hold ?? false,
              primary_warehouse: address.primary_warehouse?.trim() || null,
              second_warehouse: address.second_warehouse?.trim() || null,
              third_warehouse: address.third_warehouse?.trim() || null,
              fourth_warehouse: address.fourth_warehouse?.trim() || null,
              fifth_warehouse: address.fifth_warehouse?.trim() || null,
            };

            await supabase.from("customer_addresses").insert(addressData);
          }
        }

        if (customer.contacts && customer.contacts.length > 0) {
          for (const contact of customer.contacts) {
            const contactData = {
              customer_number: customer.customer_number,
              first_name: contact.first_name.trim(),
              last_name: contact.last_name.trim(),
              email: contact.email.trim(),
              phone: contact.phone?.trim() || null,
              title: contact.title?.trim() || null,
              department: contact.department?.trim() || null,
              is_primary: contact.is_primary ?? false,
              notes: contact.notes?.trim() || null,
            };

            await supabase.from("customer_contacts").insert(contactData);
          }
        }

        imported++;
      }
    } catch (error) {
      errors.push(`Error processing customer ${customer.customer_number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failed++;
    }
  }

  return {
    success: failed === 0,
    message:
      failed === 0
        ? `Successfully imported ${imported} customer(s)`
        : `Imported ${imported} customer(s), ${failed} failed`,
    imported,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}
