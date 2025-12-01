import { SuggestionPayload } from "@/app/types/chat";

export async function getSuggestions(
  user_id: string,
  conversation_id: string,
  auth_key: string,
): Promise<SuggestionPayload> {
  // TODO: Endpoint not implemented in backend - return empty suggestions
  // When backend implements /util/follow_up_suggestions, remove this early return
  return {
    suggestions: [],
  };
}
