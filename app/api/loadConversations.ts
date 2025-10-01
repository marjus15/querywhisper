import { SavedConversationPayload } from "@/app/types/payloads";
import { apiClient } from "@/lib/api-client";

export async function loadConversations(user_id: string) {
  const startTime = performance.now();
  try {
    console.log("🔄 Loading conversations for user:", user_id);
    console.log("🔄 User ID type:", typeof user_id, "length:", user_id.length);
    
    // First try the new endpoint (uses JWT user ID, no URL user ID needed)
    try {
      console.log("🔄 Trying new endpoint: /conversations/saved");
      const data: SavedConversationPayload = await apiClient.get<SavedConversationPayload>(`/conversations/saved`);
      
      console.log("✅ Conversations loaded from new endpoint:", Object.keys(data.trees || {}).length, "conversations");
      console.log("📋 Conversation data:", data);
      
      return data;
    } catch (newEndpointError) {
      console.log("⚠️ New endpoint failed, trying original endpoint:", newEndpointError);
      
      // Fallback to original endpoint with user ID in URL
      const data: SavedConversationPayload = await apiClient.get<SavedConversationPayload>(`/db/${user_id}/saved_trees`);
      
      console.log("✅ Conversations loaded from original endpoint:", Object.keys(data.trees || {}).length, "conversations");
      console.log("📋 Conversation data:", data);
      
      return data;
    }
  } catch (error) {
    console.error("❌ Failed to load conversations:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : String(error),
      user_id: user_id,
      user_id_type: typeof user_id
    });
    return {
      trees: {},
      error: "Error fetching saved conversations",
    };
  } finally {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `loadConversations took ${(performance.now() - startTime).toFixed(2)}ms`,
      );
    }
  }
}
