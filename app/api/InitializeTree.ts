import { DecisionTreePayload } from "@/app/types/payloads";
import { DecisionTreeNode } from "@/app/types/objects";

/* eslint-disable @typescript-eslint/no-unused-vars -- API param reserved for future backend */
export async function initializeTree(
  user_id: string,
  conversation_id: string,
  _low_memory: boolean = false
): Promise<DecisionTreePayload> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const startTime = performance.now();
  
  // TODO: Backend /init/tree endpoint is not implemented yet
  // For now, return a mock tree to allow conversation creation
  console.log("⚠️ Using mock tree - /init/tree endpoint not implemented in backend");
  
  const mockTree: DecisionTreeNode = {
    id: "root",
    name: "Root",
    description: "Root decision node",
    instruction: "Start your conversation",
    reasoning: "This is a mock tree for development",
    branch: false,
    options: {},
    choosen: true,
    blocked: false,
  };

  const mockData: DecisionTreePayload = {
    conversation_id: conversation_id,
    tree: mockTree,
    error: null,
  };

  if (process.env.NODE_ENV === "development") {
    console.log(
      `init/tree took ${(performance.now() - startTime).toFixed(2)}ms (mock)`
    );
  }

  return mockData;
}
