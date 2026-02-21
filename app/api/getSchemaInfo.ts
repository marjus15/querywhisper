import { host } from "@/app/components/host";

export interface ColumnInfo {
  name: string;
  data_type: string;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  references_table?: string;
  references_column?: string;
  is_nullable: boolean;
  default_value?: string;
  description?: string;
  sample_values?: unknown[];
}

export interface TableInfo {
  name: string;
  description: string;
  columns: ColumnInfo[];
  relationships: Array<{
    type: string;
    target_table: string;
    foreign_key: string;
  }>;
  common_queries: string[];
  business_rules: string[];
  row_count?: number;
}

export interface SchemaResponse {
  schema: Record<string, TableInfo>;
  full_context: string;
}

export interface SchemaStatusResponse {
  mode: "dynamic" | "static";
  summary: {
    mode: string;
    table_count: number;
    tables: Record<string, {
      columns: number;
      relationships: number;
      row_count: number;
    }>;
  };
  tables: string[];
  dynamic_available: boolean;
}

export async function getSchemaInfo(): Promise<SchemaResponse> {
  const startTime = performance.now();
  try {
    const response = await fetch(`${host}/schema/enhanced`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error(
        `Get Schema Info error! status: ${response.status} ${response.statusText}`,
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SchemaResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Get Schema Info error:", error);
    throw error;
  } finally {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `schema/enhanced took ${(performance.now() - startTime).toFixed(2)}ms`,
      );
    }
  }
}

export async function getSchemaStatus(): Promise<SchemaStatusResponse> {
  const startTime = performance.now();
  try {
    const response = await fetch(`${host}/schema/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SchemaStatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Get Schema Status error:", error);
    throw error;
  } finally {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `schema/status took ${(performance.now() - startTime).toFixed(2)}ms`,
      );
    }
  }
}

export async function refreshSchemaFromBackend(token?: string): Promise<{ success: boolean; message: string; summary?: unknown }> {
  const startTime = performance.now();
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${host}/schema/refresh`, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      // If unauthorized, try without auth (for testing)
      if (response.status === 401) {
        console.warn("Schema refresh requires authentication");
        return { success: false, message: "Authentication required for schema refresh" };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Refresh Schema error:", error);
    throw error;
  } finally {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `schema/refresh took ${(performance.now() - startTime).toFixed(2)}ms`,
      );
    }
  }
}
