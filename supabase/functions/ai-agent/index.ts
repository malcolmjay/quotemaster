/**
 * AI Agent Edge Function
 * Provides natural language querying of the database using Claude AI
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface QueryRequest {
  query: string;
  conversation_history?: Array<{ role: string; content: string }>;
}

interface QueryResponse {
  success: boolean;
  message?: string;
  data?: any;
  sql?: string;
  error?: string;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid authentication token",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: claudeApiKeyConfig } = await supabase
      .from("app_configurations")
      .select("config_value")
      .eq("config_key", "claude_api_key")
      .maybeSingle();

    const claudeApiKey = claudeApiKeyConfig?.config_value;

    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Claude API key not configured. Please configure it in Settings.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: claudeModelConfig } = await supabase
      .from("app_configurations")
      .select("config_value")
      .eq("config_key", "claude_model")
      .maybeSingle();

    const claudeModel = claudeModelConfig?.config_value || "claude-3-5-sonnet-20241022";

    const body: QueryRequest = await req.json();
    const { query, conversation_history = [] } = body;

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Query is required and must be a string",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await processQuery(supabase, claudeApiKey, claudeModel, query, conversation_history, user.id);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-agent function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function processQuery(
  supabase: any,
  claudeApiKey: string,
  claudeModel: string,
  query: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userId: string
): Promise<QueryResponse> {
  try {
    const schema = await getDatabaseSchema(supabase);

    const systemPrompt = `You are an AI assistant that helps users query their quote management database using natural language.

Database Schema:
${schema}

Your job is to:
1. Understand the user's natural language query
2. Generate appropriate PostgreSQL SELECT queries (read-only)
3. Return results in a clear, formatted way

Rules:
- ONLY generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, ALTER, etc.)
- Use proper JOIN clauses when querying related tables
- Always limit results to 100 rows maximum unless user specifies otherwise
- Return helpful, formatted responses
- If the query is unclear, ask for clarification
- Format numeric values appropriately (e.g., currency with 2 decimals)
- When querying quotes, always include customer information by joining with customers table
- Use RLS policies - the user can only see data they have access to

Response format:
Provide your response as a JSON object with:
{
  "sql": "the SQL query to execute (or null if just having a conversation)",
  "explanation": "brief explanation of what the query does",
  "needsClarification": false (or true if you need more info from the user)
}`;

    const messages = [
      ...conversationHistory,
      { role: "user", content: query },
    ];

    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: claudeModel,
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API error: ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    const assistantMessage = claudeData.content[0].text;

    let parsedResponse;
    try {
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = {
          sql: null,
          explanation: assistantMessage,
          needsClarification: false,
        };
      }
    } catch (parseError) {
      parsedResponse = {
        sql: null,
        explanation: assistantMessage,
        needsClarification: false,
      };
    }

    if (parsedResponse.needsClarification || !parsedResponse.sql) {
      return {
        success: true,
        message: parsedResponse.explanation,
      };
    }

    const sql = parsedResponse.sql.trim();

    if (!sql.toUpperCase().startsWith("SELECT")) {
      return {
        success: false,
        error: "Only SELECT queries are allowed for safety",
      };
    }

    const { data, error: queryError } = await supabase.rpc("execute_sql", {
      sql_query: sql,
    });

    if (queryError) {
      try {
        const { data: directData, error: directError } = await supabase
          .from("quotes")
          .select("*")
          .limit(1);

        if (directError) {
          return {
            success: false,
            error: `Database query failed: ${queryError.message}`,
            sql: sql,
          };
        }
      } catch {
      }

      const { data: rawData, error: rawError } = await executeRawSQL(supabase, sql);

      if (rawError) {
        return {
          success: false,
          error: `Query execution failed: ${rawError.message}`,
          sql: sql,
        };
      }

      return {
        success: true,
        message: parsedResponse.explanation,
        data: rawData,
        sql: sql,
      };
    }

    return {
      success: true,
      message: parsedResponse.explanation,
      data: data,
      sql: sql,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Query processing failed",
    };
  }
}

async function executeRawSQL(supabase: any, sql: string): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase.rpc("execute_readonly_query", {
      query_text: sql,
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

async function getDatabaseSchema(supabase: any): Promise<string> {
  const tables = [
    "quotes",
    "quote_line_items",
    "customers",
    "customer_addresses",
    "customer_contacts",
    "products",
    "cross_references",
    "item_relationships",
    "price_requests",
    "approval_actions",
    "user_roles",
  ];

  let schema = "Available tables and their main columns:\n\n";

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .limit(0);

      if (!error) {
        schema += `${table}:\n`;

        switch (table) {
          case "quotes":
            schema += "  - id, quote_number, customer_id, quote_date, expiry_date, status, total_value, total_cost, total_margin, created_by\n";
            break;
          case "quote_line_items":
            schema += "  - id, quote_id, product_id, sku, product_name, quantity, unit_price, unit_cost, subtotal, margin_percent\n";
            break;
          case "customers":
            schema += "  - id, customer_number, name, type, segment, industry, account_owner, created_at\n";
            break;
          case "customer_addresses":
            schema += "  - id, customer_id, address_line_1, city, state_province, postal_code, country, is_primary\n";
            break;
          case "customer_contacts":
            schema += "  - id, customer_id, first_name, last_name, email, phone, title, is_primary\n";
            break;
          case "products":
            schema += "  - id, sku, name, description, category, supplier, unit_cost, list_price, status\n";
            break;
          case "cross_references":
            schema += "  - id, customer_part_number, internal_part_number, customer_id, description\n";
            break;
          case "item_relationships":
            schema += "  - id, parent_sku, child_sku, relationship_type, quantity\n";
            break;
          case "price_requests":
            schema += "  - id, sku, requested_by, status, response_date, supplier_quote_cost\n";
            break;
          case "approval_actions":
            schema += "  - id, quote_id, approver_id, action, notes, created_at\n";
            break;
          case "user_roles":
            schema += "  - id, user_id, role, email, full_name\n";
            break;
        }
        schema += "\n";
      }
    } catch (err) {
    }
  }

  return schema;
}
