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
  sample_values?: any[];
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
}

export interface SchemaResponse {
  schema: Record<string, TableInfo>;
  full_context: string;
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
