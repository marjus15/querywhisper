import { host } from "@/app/components/host";

export interface DatabaseTable {
  name: string;
  type: string;
}

export interface DatabaseTablesResponse {
  status: string;
  tables: DatabaseTable[];
  total_tables: number;
  connection_type: string;
}

export async function getDatabaseTables(): Promise<DatabaseTablesResponse> {
  const startTime = performance.now();
  try {
    const response = await fetch(`${host}/tables`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error(
        `Get Database Tables error! status: ${response.status} ${response.statusText}`,
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DatabaseTablesResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Get Database Tables error:", error);
    throw error;
  } finally {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `database/tables took ${(performance.now() - startTime).toFixed(2)}ms`,
      );
    }
  }
}
