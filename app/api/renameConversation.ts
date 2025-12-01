import { BasePayload } from "@/app/types/payloads";
import { apiClient } from "@/lib/api-client";

export async function renameConversation(
  user_id: string,
  conversation_id: string,
  title: string,
): Promise<BasePayload & { title?: string }> {
  const startTime = performance.now();
  try {
    console.log("✏️ Renaming conversation:", conversation_id, "to:", title, "for user:", user_id);
    
    const data: BasePayload & { title?: string } = await apiClient.put<BasePayload & { title?: string }>(
      `/db/${user_id}/rename_tree/${conversation_id}`,
      { title }
    );
    
    console.log("✅ Conversation renamed:", conversation_id, "to:", title);
    
    return data;
  } catch (error) {
    console.error("❌ Failed to rename conversation:", conversation_id, error);
    return {
      error: `Error renaming conversation ${conversation_id}`,
    };
  } finally {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `renameConversation ${conversation_id} took ${(performance.now() - startTime).toFixed(2)}ms`,
      );
    }
  }
}

