"use client";

import { createContext, useContext, useState } from "react";
import { host } from "../host";
import { apiClient } from "@/lib/api-client";

export interface AskRequest {
  question: string;
  session_id?: string;
}

export interface AskResponse {
  success: boolean;
  question: string;
  session_id?: string;
  generated_sql?: string;
  data?: any[];
  columns?: string[];
  row_count?: number;
  execution_time_ms?: number;
  examples_used?: number;
  warnings?: string[];
  suggestions?: string[];
  error?: string;
}

export const ApiContext = createContext<{
  askQuestion: (question: string, sessionId?: string) => Promise<AskResponse>;
  testConnection: () => Promise<boolean>;
}>({
  askQuestion: async () => ({ success: false, question: "" }),
  testConnection: async () => false,
});

export const ApiProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessionId, setSessionId] = useState<string | undefined>();

  const askQuestion = async (
    question: string,
    providedSessionId?: string
  ): Promise<AskResponse> => {
    try {
      const request: AskRequest = {
        question,
        session_id: providedSessionId || sessionId,
      };

      console.log("ApiContext - Making authenticated request to:", `/ask`);
      console.log("ApiContext - Request body:", JSON.stringify(request));

      const data: AskResponse = await apiClient.post<AskResponse>(
        "/ask",
        request
      );

      console.log("ApiContext - Response received:", data);

      // Store session ID for future requests
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      return data;
    } catch (error) {
      console.error("Error asking question:", error);
      return {
        success: false,
        question,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      const data = await apiClient.get("/test");
      return data.status === "success";
    } catch (error) {
      console.error("Error testing connection:", error);
      return false;
    }
  };

  return (
    <ApiContext.Provider value={{ askQuestion, testConnection }}>
      {children}
    </ApiContext.Provider>
  );
};
