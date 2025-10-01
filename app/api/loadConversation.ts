import { ConversationPayload } from "@/app/types/payloads";
import { apiClient } from "@/lib/api-client";

export async function loadConversation(
  user_id: string,
  conversation_id: string,
) {
  const startTime = performance.now();
  try {
    console.log("🔄 Loading conversation:", conversation_id, "for user:", user_id);
    
    const data: ConversationPayload = await apiClient.get<ConversationPayload>(`/db/${user_id}/load_tree/${conversation_id}`);
    
    console.log("✅ Conversation loaded:", conversation_id);
    
    return data;
  } catch (error) {
    console.error("❌ Failed to load conversation:", conversation_id, error);
    return {
      rebuild: [],
      error: `Error fetching saved conversation ${conversation_id}`,
    };
  } finally {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `loadConversation ${conversation_id} took ${(performance.now() - startTime).toFixed(2)}ms`,
      );
    }
  }
}
