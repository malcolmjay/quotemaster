/**
 * Import Products Edge Function
 * Allows importing product/item data from ERP into Supabase
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PriceBreakInput {
  min_quantity: number;
  max_quantity: number;
  unit_cost: number;
  description?: string;
  discount_percent?: number;
  effective_date?: string;
}

interface ProductInput {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  supplier?: string;
  supplier_email?: string;
  unit_cost?: number;
  list_price?: number;
  lead_time_days?: number;
  lead_time_text?: string;
  warehouse?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  cost_effective_from?: string;
  cost_effective_to?: string;
  buyer?: string;
  category_set?: string;
  assignment?: string;
  long_description?: string;
  item_type?: string;
  unit_of_measure?: string;
  moq?: number;
  min_quantity?: number;
  max_quantity?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  fleet?: string;
  country_of_origin?: string;
  tariff_amount?: number;
  cs_notes?: string;
  average_lead_time?: number;
  rep_code?: string;
  rep_by?: string;
  revision?: string;
  inventory_item_id?: string;
  price_breaks?: PriceBreakInput[];
}

interface ImportResult {
  success: boolean;
  message: string;
  imported?: number;
  failed?: number;
  errors?: string[];
  import_log_id?: string;
  price_breaks_imported?: number;
  price_breaks_failed?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if import API authentication is enabled
    const { data: authEnabledConfig } = await supabase
      .from("app_configurations")
      .select("config_value")
      .eq("config_key", "import_api_enabled")
      .maybeSingle();

    const isAuthEnabled = authEnabledConfig?.config_value === "true";

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let isAuthenticated = false;

    if (isAuthEnabled) {
      // Import API auth is enabled - check credentials
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
              "WWW-Authenticate": "Basic realm=\"Import API\""
            },
          }
        );
      }

      // Check for Basic Auth
      if (authHeader.startsWith("Basic ")) {
        const base64Credentials = authHeader.replace("Basic ", "");
        const credentials = atob(base64Credentials);
        const [username, password] = credentials.split(":");

        // Get stored credentials from config
        const { data: storedUsername } = await supabase
          .from("app_configurations")
          .select("config_value")
          .eq("config_key", "import_api_username")
          .maybeSingle();

        const { data: storedPassword } = await supabase
          .from("app_configurations")
          .select("config_value")
          .eq("config_key", "import_api_password")
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
                "WWW-Authenticate": "Basic realm=\"Import API\""
              },
            }
          );
        }
      } else if (authHeader.startsWith("Bearer ")) {
        // Try Supabase user token auth as fallback
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
      // Auth not enabled - allow all requests but try to get user if token provided
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      }
      isAuthenticated = true; // Allow access when auth is disabled
    }

    const url = new URL(req.url);
    const pathname = url.pathname;

    // Route: POST /import-products - Batch import
    if (req.method === "POST" && pathname.endsWith("/import-products")) {
      const body = await req.json();
      const { products, mode = "upsert", import_price_breaks = true } = body; // mode: 'upsert' or 'insert'

      if (!Array.isArray(products) || products.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid input: 'products' must be a non-empty array",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await importProducts(supabase, products, mode, userId, import_price_breaks);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: POST /import-products/single - Single product import
    if (req.method === "POST" && pathname.endsWith("/import-products/single")) {
      const body = await req.json();
      const { import_price_breaks = true, ...product } = body;

      if (!product.sku || !product.name) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid input: 'sku' and 'name' are required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await importProducts(supabase, [product], "upsert", userId, import_price_breaks);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: GET /import-products/logs - Get import history
    if (req.method === "GET" && pathname.endsWith("/import-products/logs")) {
      const limit = parseInt(url.searchParams.get("limit") || "50");

      const { data: logs, error } = await supabase
        .from("product_import_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);

      if (error) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to fetch import logs",
            error: error.message,
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
          logs,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Route: DELETE /import-products/all - Clear all products (use with caution!)
    if (req.method === "DELETE" && pathname.endsWith("/import-products/all")) {
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

      const { error } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to delete products",
            error: error.message,
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
          message: "All products deleted successfully",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Unknown route
    return new Response(
      JSON.stringify({
        success: false,
        message: "Unknown endpoint",
        available_endpoints: [
          "POST /import-products - Batch import products",
          "POST /import-products/single - Import single product",
          "GET /import-products/logs - Get import history",
          "DELETE /import-products/all?confirm=yes-delete-all - Delete all products",
        ],
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in import-products function:", error);

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

/**
 * Import products into database
 */
async function importProducts(
  supabase: any,
  products: ProductInput[],
  mode: "upsert" | "insert",
  userId: string | null,
  importPriceBreaks: boolean = true
): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;
  let priceBreaksImported = 0;
  let priceBreaksFailed = 0;

  // Create import log
  const { data: logData, error: logError } = await supabase
    .from("product_import_logs")
    .insert({
      import_type: products.length === 1 ? "single" : "full",
      total_records: products.length,
      import_source: "api",
      imported_by: userId,
      status: "in_progress",
    })
    .select()
    .single();

  const importLogId = logData?.id;

  // Validate and prepare products
  const validatedProducts = [];
  const productPriceBreaks: { [sku: string]: PriceBreakInput[] } = {};

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    // Validate required fields
    if (!product.sku || !product.name) {
      errors.push(`Product at index ${i}: Missing required field 'sku' or 'name'`);
      failed++;
      continue;
    }

    // Prepare product data
    const productData: any = {
      sku: product.sku.trim(),
      name: product.name.trim(),
      description: product.description?.trim() || null,
      category: product.category?.trim() || 'Uncategorized',
      supplier: product.supplier?.trim() || 'Unknown',
      unit_cost: product.unit_cost ?? 0,
      list_price: product.list_price ?? 0,
      lead_time_days: product.lead_time_days ?? 0,
      lead_time_text: product.lead_time_text?.trim() || null,
      warehouse: product.warehouse?.trim() || 'main',
      status: product.status || 'active',
    };

    // Add optional fields if provided
    if (product.supplier_email !== undefined) {
      productData.supplier_email = product.supplier_email?.trim() || null;
    }
    if (product.cost_effective_from !== undefined) {
      productData.cost_effective_from = product.cost_effective_from;
    }
    if (product.cost_effective_to !== undefined) {
      productData.cost_effective_to = product.cost_effective_to;
    }
    if (product.buyer !== undefined) {
      productData.buyer = product.buyer?.trim() || null;
    }
    if (product.category_set !== undefined) {
      productData.category_set = product.category_set?.trim() || null;
    }
    if (product.assignment !== undefined) {
      productData.assignment = product.assignment?.trim() || null;
    }
    if (product.long_description !== undefined) {
      productData.long_description = product.long_description?.trim() || null;
    }
    if (product.item_type !== undefined) {
      productData.item_type = product.item_type?.trim() || null;
    }
    if (product.unit_of_measure !== undefined) {
      productData.unit_of_measure = product.unit_of_measure?.trim() || null;
    }
    if (product.moq !== undefined) {
      productData.moq = product.moq;
    }
    if (product.min_quantity !== undefined) {
      productData.min_quantity = product.min_quantity;
    }
    if (product.max_quantity !== undefined) {
      productData.max_quantity = product.max_quantity;
    }
    if (product.weight !== undefined) {
      productData.weight = product.weight;
    }
    if (product.length !== undefined) {
      productData.length = product.length;
    }
    if (product.width !== undefined) {
      productData.width = product.width;
    }
    if (product.height !== undefined) {
      productData.height = product.height;
    }
    if (product.fleet !== undefined) {
      productData.fleet = product.fleet?.trim() || null;
    }
    if (product.country_of_origin !== undefined) {
      productData.country_of_origin = product.country_of_origin?.trim() || null;
    }
    if (product.tariff_amount !== undefined) {
      productData.tariff_amount = product.tariff_amount;
    }
    if (product.cs_notes !== undefined) {
      productData.cs_notes = product.cs_notes?.trim() || null;
    }
    if (product.average_lead_time !== undefined) {
      productData.average_lead_time = product.average_lead_time;
    }
    if (product.rep_code !== undefined) {
      productData.rep_code = product.rep_code?.trim() || null;
    }
    if (product.rep_by !== undefined) {
      productData.rep_by = product.rep_by?.trim() || null;
    }
    if (product.revision !== undefined) {
      productData.revision = product.revision?.trim() || null;
    }
    if (product.inventory_item_id !== undefined) {
      productData.inventory_item_id = product.inventory_item_id?.trim() || null;
    }

    validatedProducts.push(productData);

    // Store price breaks for later processing
    if (importPriceBreaks && product.price_breaks && Array.isArray(product.price_breaks)) {
      productPriceBreaks[product.sku] = product.price_breaks;
    }
  }

  // Import products
  if (validatedProducts.length > 0) {
    let result;

    if (mode === "upsert") {
      // Upsert: update if exists, insert if not
      result = await supabase
        .from("products")
        .upsert(validatedProducts, {
          onConflict: "sku",
          ignoreDuplicates: false,
        })
        .select();
    } else {
      // Insert only
      result = await supabase.from("products").insert(validatedProducts).select();
    }

    if (result.error) {
      errors.push(`Database error: ${result.error.message}`);
      failed += validatedProducts.length;
    } else {
      imported = validatedProducts.length;

      // Import price breaks if enabled and available
      if (importPriceBreaks && Object.keys(productPriceBreaks).length > 0) {
        const insertedProducts = result.data || [];

        for (const insertedProduct of insertedProducts) {
          const priceBreaks = productPriceBreaks[insertedProduct.sku];
          if (!priceBreaks || priceBreaks.length === 0) continue;

          // Delete existing price breaks for this product
          await supabase
            .from("price_breaks")
            .delete()
            .eq("product_id", insertedProduct.id);

          // Prepare price break data
          const priceBreakData = priceBreaks.map((pb) => ({
            product_id: insertedProduct.id,
            min_quantity: pb.min_quantity,
            max_quantity: pb.max_quantity,
            unit_cost: pb.unit_cost,
            description: pb.description || null,
            discount_percent: pb.discount_percent || null,
            effective_date: pb.effective_date || null,
          }));

          // Insert price breaks
          const { error: priceBreakError } = await supabase
            .from("price_breaks")
            .insert(priceBreakData);

          if (priceBreakError) {
            errors.push(`Failed to import price breaks for SKU ${insertedProduct.sku}: ${priceBreakError.message}`);
            priceBreaksFailed += priceBreaks.length;
          } else {
            priceBreaksImported += priceBreaks.length;
          }
        }
      }
    }
  }

  // Update import log
  await supabase
    .from("product_import_logs")
    .update({
      successful_records: imported,
      failed_records: failed,
      errors: errors.length > 0 ? errors : null,
      completed_at: new Date().toISOString(),
      status: failed > 0 ? "completed_with_errors" : "completed",
    })
    .eq("id", importLogId);

  const priceBreakSummary = priceBreaksImported > 0 || priceBreaksFailed > 0
    ? ` and ${priceBreaksImported} price break(s)`
    : '';

  return {
    success: failed === 0,
    message:
      failed === 0
        ? `Successfully imported ${imported} product(s)${priceBreakSummary}`
        : `Imported ${imported} product(s)${priceBreakSummary}, ${failed} failed`,
    imported,
    failed,
    errors: errors.length > 0 ? errors : undefined,
    import_log_id: importLogId,
    price_breaks_imported: priceBreaksImported,
    price_breaks_failed: priceBreaksFailed,
  };
}
