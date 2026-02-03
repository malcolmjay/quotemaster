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
  context?: {
    quoteId?: string;
    quoteNumber?: string;
    customerId?: string;
    customerName?: string;
    lineItems?: any[];
  };
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

    const claudeModel = claudeModelConfig?.config_value || "claude-sonnet-4-5";

    const body: QueryRequest = await req.json();
    const { query, conversation_history = [], context } = body;

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

    const { data: userPermissions, error: permError } = await supabase
      .from("user_permissions")
      .select("role, table_name, can_read, can_create, can_update, can_delete")
      .eq("user_id", user.id);

    if (permError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch user permissions",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const roles = userRoles?.map(r => r.role) || [];
    const isAdmin = roles.includes("Admin");

    const result = await processQuery(
      supabase,
      claudeApiKey,
      claudeModel,
      query,
      conversation_history,
      user.id,
      context,
      userPermissions || [],
      roles,
      isAdmin
    );

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
  userId: string,
  context?: {
    quoteId?: string;
    quoteNumber?: string;
    customerId?: string;
    customerName?: string;
    lineItems?: any[];
  },
  userPermissions: Array<{ role: string; table_name: string; can_read: boolean; can_create: boolean; can_update: boolean; can_delete: boolean }> = [],
  roles: string[] = [],
  isAdmin: boolean = false
): Promise<QueryResponse> {
  try {
    const readableTables = isAdmin
      ? null
      : userPermissions.filter(p => p.can_read).map(p => p.table_name);

    const schema = await getDatabaseSchema(supabase, readableTables);

    let contextInfo = "";
    if (context) {
      contextInfo = "\n\nCurrent Context:";
      if (context.quoteNumber) {
        contextInfo += `\n- Working on Quote: ${context.quoteNumber} (ID: ${context.quoteId})`;
      }
      if (context.customerName) {
        contextInfo += `\n- Customer: ${context.customerName} (ID: ${context.customerId})`;
      }
      if (context.lineItems && context.lineItems.length > 0) {
        contextInfo += `\n- Number of line items in quote: ${context.lineItems.length}`;
        contextInfo += `\n- Line items summary: ${context.lineItems.map(item => `${item.sku} (qty: ${item.qty})`).join(", ")}`;
      }
      contextInfo += "\n\nWhen the user asks about 'this quote' or 'this customer', they are referring to the context above.";
    }

    const roleInfo = `\n\nUser Role and Permissions:
- Roles: ${roles.join(", ")}${isAdmin ? " (Administrator with full access)" : ""}
- Can access tables: ${readableTables ? readableTables.join(", ") : "all tables"}
${isAdmin ? "- Write Operations: ENABLED (you can INSERT, UPDATE, DELETE as an Administrator)" : "- Write Operations: DISABLED (read-only access)"}

IMPORTANT: You can only query tables the user has read access to. ${isAdmin ? "As an Administrator, you can also perform INSERT, UPDATE, and DELETE operations." : "Do not attempt to query tables not listed above."}`;

    const writeOperationsRules = isAdmin ? `

ADMINISTRATOR WRITE OPERATIONS:
As an Administrator, you can perform database modifications:
- INSERT: Add new records to tables
- UPDATE: Modify existing records
- DELETE: Remove records (use with caution)
- Always use WHERE clauses in UPDATE/DELETE to prevent accidental mass operations
- When performing write operations, clearly explain what will be changed
- For destructive operations (DELETE, UPDATE), ask for confirmation first unless the user is explicit
- Return affected row counts for write operations

Write Operation Safety Rules:
- NEVER perform DELETE or UPDATE without a WHERE clause unless explicitly requested
- NEVER drop tables, alter schema, or truncate tables
- Be extra careful with customer data, quotes, and financial records
- Always validate IDs exist before updating/deleting
- Use transactions implicitly (single statement per operation)` : "";

    const systemPrompt = `You are an AI assistant that helps users ${isAdmin ? "manage and query" : "query"} their quote management database using natural language.

Database Schema:
${schema}
${contextInfo}
${roleInfo}
${writeOperationsRules}

Your job is to:
1. Understand the user's natural language query
2. Generate appropriate PostgreSQL queries ${isAdmin ? "(SELECT, INSERT, UPDATE, DELETE)" : "(read-only SELECT)"}
3. Return results in a clear, formatted way
4. Respect the user's role-based permissions

Rules:
${isAdmin ? "- You can generate SELECT, INSERT, UPDATE, and DELETE queries" : "- ONLY generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, ALTER, etc.)"}
- ONLY query tables the user has read access to (see permissions above)
- If the user asks about data from tables they don't have access to, politely explain they don't have permission
- Use proper JOIN clauses when querying related tables
- For SELECT queries, always limit results to 100 rows maximum unless user specifies otherwise
- Return helpful, formatted responses
- If the query is unclear, ask for clarification
- Format numeric values appropriately (e.g., currency with 2 decimals)
- When querying quotes, always include customer information by joining with customers table
- Use RLS policies - the user can only see data they have access to based on their role
- When context is provided and the user asks about "this quote", "this customer", or "these items", use the context IDs in your queries
- For questions like "what's the total value" or "show me the items", use the context quote_id or customer_id

Response format:
Provide your response as a JSON object with:
{
  "sql": "the SQL query to execute (or null if just having a conversation)",
  "explanation": "brief explanation of what the query does",
  "needsClarification": false (or true if you need more info from the user),
  "requiresConfirmation": false (or true if this is a destructive operation that needs user confirmation)
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
    const sqlUpper = sql.toUpperCase();

    const allowedWriteOperations = ["INSERT", "UPDATE", "DELETE"];
    const isWriteOperation = allowedWriteOperations.some(op => sqlUpper.startsWith(op));
    const isSelectOperation = sqlUpper.startsWith("SELECT");

    if (!isSelectOperation && !isWriteOperation) {
      return {
        success: false,
        error: "Only SELECT, INSERT, UPDATE, and DELETE queries are allowed. Schema modifications (DROP, ALTER, TRUNCATE, etc.) are not permitted.",
      };
    }

    if (isWriteOperation && !isAdmin) {
      return {
        success: false,
        error: "Write operations (INSERT, UPDATE, DELETE) are only allowed for Administrator users.",
      };
    }

    const dangerousPatterns = [
      /\bDROP\s+/i,
      /\bALTER\s+/i,
      /\bTRUNCATE\s+/i,
      /\bCREATE\s+/i,
      /;\s*DELETE\s+/i,
      /;\s*UPDATE\s+/i,
      /;\s*DROP\s+/i,
    ];

    if (dangerousPatterns.some(pattern => pattern.test(sql))) {
      return {
        success: false,
        error: "Query contains potentially dangerous operations or multiple statements. Only single INSERT, UPDATE, DELETE, or SELECT statements are allowed.",
      };
    }

    if (isWriteOperation) {
      const { data: writeData, error: writeError } = await executeWriteOperation(supabase, sql, userId);

      if (writeError) {
        return {
          success: false,
          error: `Write operation failed: ${writeError.message}`,
          sql: sql,
        };
      }

      return {
        success: true,
        message: `${parsedResponse.explanation}\n\nOperation completed successfully. ${writeData?.affectedRows ? `Affected rows: ${writeData.affectedRows}` : ""}`,
        data: writeData?.result,
        sql: sql,
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

async function executeWriteOperation(
  supabase: any,
  sql: string,
  userId: string
): Promise<{ data: any; error: any }> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_readonly_query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        query_text: sql,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: new Error(`Write operation failed: ${errorText}`),
      };
    }

    const result = await response.json();

    const affectedRows = Array.isArray(result) ? result.length : 1;

    return {
      data: {
        result: result,
        affectedRows: affectedRows,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

async function getDatabaseSchema(supabase: any, readableTables: string[] | null = null): Promise<string> {
  const allTables = [
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
    "tasks",
    "messages",
    "notifications",
  ];

  const tables = readableTables ? allTables.filter(t => readableTables.includes(t)) : allTables;

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
            schema += "  - id, quote_number, customer_id, customer_user_id, quote_type, status, valid_until, ship_until, customer_bid_number, purchase_order_number, total_value, total_cost, total_margin, line_item_count, created_by, created_at, updated_at\n";
            break;
          case "quote_line_items":
            schema += "  - id, quote_id, product_id, sku, product_name, supplier, category, quantity, unit_price, unit_cost, subtotal, total_cost, margin_percent, lead_time, quoted_lead_time, status, customer_part_number, warehouse\n";
            break;
          case "customers":
            schema += "  - id, customer_number, name, type, segment, contract_number, payment_terms, currency, tier, sales_manager, sales_rep, primary_warehouse, customer_notes, created_at, updated_at\n";
            break;
          case "customer_addresses":
            schema += "  - id, customer_number, site_use_id, address_line_1, address_line_2, city, postal_code, state, country, is_shipping, is_billing, is_primary, is_credit_hold, primary_warehouse\n";
            break;
          case "customer_contacts":
            schema += "  - id, customer_number, first_name, last_name, email, phone, title, department, is_primary, notes\n";
            break;
          case "products":
            schema += "  - id, sku, name, description, category, supplier, unit_cost, list_price, lead_time_days, lead_time_text, warehouse, status, buyer, unit_of_measure, moq, supplier_email\n";
            break;
          case "cross_references":
            schema += "  - id, customer_id, product_id, customer_part_number, supplier_part_number, internal_part_number, description, supplier, type, ordered_item_id\n";
            break;
          case "item_relationships":
            schema += "  - id, from_item_id, to_item_id, type, reciprocal, effective_from, effective_to\n";
            break;
          case "price_requests":
            schema += "  - id, quote_id, quote_line_item_id, product_number, description, supplier_name, buyer_name, customer_name, quote_number, quote_type, item_quantity, supplier_pricing, status, requested_at, completed_at\n";
            break;
          case "approval_actions":
            schema += "  - id, quote_approval_id, quote_id, approver_id, approver_role, action, comments, approved_at, created_at\n";
            break;
          case "user_roles":
            schema += "  - id, user_id, role, email, assigned_by, assigned_at, is_active\n";
            break;
          case "tasks":
            schema += "  - id, quote_id, line_item_id, title, description, assigned_to, status, priority, due_date, created_by, created_at, completed_at\n";
            break;
          case "messages":
            schema += "  - id, quote_id, line_item_id, user_id, message, created_at\n";
            break;
          case "notifications":
            schema += "  - id, user_id, type, title, message, link, is_read, created_at\n";
            break;
        }
        schema += "\n";
      }
    } catch (err) {
    }
  }

  return schema;
}
