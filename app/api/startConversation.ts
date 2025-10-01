import { apiClient } from "@/lib/api-client";

export interface StartConversationResponse {
  session_id: string;
  message: string;
}

export async function startConversation(): Promise<StartConversationResponse> {
  const startTime = performance.now();
  
  try {
    console.log("🚀 Starting new conversation...");
    
    const response = await apiClient.post<StartConversationResponse>("/conversation/start");
    
    console.log(
      `✅ Conversation started successfully: ${response.session_id}`
    );
    console.log(
      `⏱️ startConversation took ${(performance.now() - startTime).toFixed(2)}ms`
    );
    
    return response;
  } catch (error) {
    console.error("❌ Failed to start conversation:", error);
    console.log(
      `⏱️ startConversation failed after ${(performance.now() - startTime).toFixed(2)}ms`
    );
    throw error;
  }
}
