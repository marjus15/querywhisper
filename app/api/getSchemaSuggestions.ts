import { host } from "@/app/components/host";

export interface SchemaSuggestionsResponse {
  suggestions: string[];
}

export async function getSchemaSuggestions(
  count: number = 6
): Promise<SchemaSuggestionsResponse> {
  try {
    const response = await fetch(
      `${host}/schema/suggestions?count=${count}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      console.error(
        `Get Schema Suggestions error! status: ${response.status} ${response.statusText}`
      );
      return { suggestions: [] };
    }

    const data: SchemaSuggestionsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Get Schema Suggestions error:", error);
    return { suggestions: [] };
  }
}
