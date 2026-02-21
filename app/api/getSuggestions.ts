import { SuggestionPayload } from "@/app/types/chat";

/* eslint-disable @typescript-eslint/no-unused-vars -- API params reserved for future backend */
export async function getSuggestions(
  _user_id: string,
  _conversation_id: string,
  _auth_key: string,
): Promise<SuggestionPayload> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  // TODO: Endpoint not implemented in backend - return empty suggestions
  // When backend implements /util/follow_up_suggestions, remove this early return
  return {
    error: "",
    suggestions: [],
  };
}
