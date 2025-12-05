/**
 * Import Cross References Edge Function
 * Allows importing cross reference data from ERP into Supabase
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CrossReferenceInput {
  internal_part_number: string;
  customer_part_number?: string;
  supplier_part_number?: string;
  supplier?: string;
  description?: string;
  type?: string;
  customer_id?: string;
  product_id?: string;
  ordered_item_id?: string;
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
      .eq("config_key", "cross_ref_import_api_enabled")
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
              "WWW-Authenticate": "Basic realm=\"Cross Reference Import API\""
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
          .eq("config_key", "cross_ref_import_api_username")
          .maybeSingle();

        const { data: storedPassword } = await supabase
          .from("app_configurations")
          .select("config_value")
          .eq("config_key", "cross_ref_import_api_password")
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
                "WWW-Authenticate": "Basic realm=\"Cross Reference Import API\""
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
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      }
      isAuthenticated = true;
    }

    const url = new URL(req.url);
    const pathname = url.pathname;

    if (req.method === "POST" && pathname.endsWith("/import-cross-references")) {
      const body = await req.json();
      const { cross_references, mode = "upsert" } = body;

      if (!Array.isArray(cross_references) || cross_references.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid input: 'cross_references' must be a non-empty array",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await importCrossReferences(supabase, cross_references, mode, userId);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && pathname.endsWith("/import-cross-references/single")) {
      const crossRef = await req.json();

      if (!crossRef.internal_part_number) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid input: 'internal_part_number' is required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await importCrossReferences(supabase, [crossRef], "upsert", userId);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE" && pathname.endsWith("/import-cross-references/all")) {
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

      const { error } = await supabase.from("cross_references").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to delete cross references",
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
          message: "All cross references deleted successfully",
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
          "POST /import-cross-references - Batch import cross references",
          "POST /import-cross-references/single - Import single cross reference",
          "DELETE /import-cross-references/all?confirm=yes-delete-all - Delete all cross references",
        ],
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in import-cross-references function:", error);

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

async function importCrossReferences(
  supabase: any,
  crossReferences: CrossReferenceInput[],
  mode: "upsert" | "insert",
  userId: string | null
): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  const validatedReferences = [];

  for (let i = 0; i < crossReferences.length; i++) {
    const ref = crossReferences[i];

    if (!ref.internal_part_number) {
      errors.push(`Cross reference at index ${i}: Missing required field 'internal_part_number'`);
      failed++;
      continue;
    }

    let productId = ref.product_id || null;

    if (!productId && ref.internal_part_number) {
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("sku", ref.internal_part_number)
        .maybeSingle();

      if (product) {
        productId = product.id;
      }
    }

    let customerId = ref.customer_id || null;

    const referenceData: any = {
      internal_part_number: ref.internal_part_number.trim(),
      customer_part_number: ref.customer_part_number?.trim() || null,
      supplier_part_number: ref.supplier_part_number?.trim() || null,
      supplier: ref.supplier?.trim() || null,
      description: ref.description?.trim() || null,
      type: ref.type?.trim() || null,
      customer_id: customerId,
      product_id: productId,
      usage_frequency: 0,
    };

    if (ref.ordered_item_id !== undefined) {
      referenceData.ordered_item_id = ref.ordered_item_id?.trim() || null;
    }

    validatedReferences.push(referenceData);
  }

  if (validatedReferences.length > 0) {
    let result;

    if (mode === "upsert") {
      for (const refData of validatedReferences) {
        const { data: existing } = await supabase
          .from("cross_references")
          .select("id")
          .eq("internal_part_number", refData.internal_part_number)
          .eq("customer_part_number", refData.customer_part_number || "")
          .eq("supplier_part_number", refData.supplier_part_number || "")
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("cross_references")
            .update(refData)
            .eq("id", existing.id);

          if (error) {
            errors.push(`Database error updating cross reference: ${error.message}`);
            failed++;
          } else {
            imported++;
          }
        } else {
          const { error } = await supabase
            .from("cross_references")
            .insert(refData);

          if (error) {
            errors.push(`Database error inserting cross reference: ${error.message}`);
            failed++;
          } else {
            imported++;
          }
        }
      }
    } else {
      result = await supabase.from("cross_references").insert(validatedReferences);

      if (result.error) {
        errors.push(`Database error: ${result.error.message}`);
        failed += validatedReferences.length;
      } else {
        imported = validatedReferences.length;
      }
    }
  }

  return {
    success: failed === 0,
    message:
      failed === 0
        ? `Successfully imported ${imported} cross reference(s)`
        : `Imported ${imported} cross reference(s), ${failed} failed`,
    imported,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}
