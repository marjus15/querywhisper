import { BasePayload } from "@/app/types/payloads";
import { apiClient } from "@/lib/api-client";

export async function deleteConversation(
  user_id: string,
  conversation_id: string,
): Promise<BasePayload> {
  const startTime = performance.now();
  try {
    console.log("🗑️ Deleting conversation:", conversation_id, "for user:", user_id);
    
    const data: BasePayload = await apiClient.delete<BasePayload>(`/db/${user_id}/delete_tree/${conversation_id}`);
    
    console.log("✅ Conversation deleted:", conversation_id);
    
    return data;
  } catch (error) {
    console.error("❌ Failed to delete conversation:", conversation_id, error);
    return {
      error: `Error deleting conversation ${conversation_id}`,
    };
  } finally {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `deleteConversation ${conversation_id} took ${(performance.now() - startTime).toFixed(2)}ms`,
      );
    }
  }
}
