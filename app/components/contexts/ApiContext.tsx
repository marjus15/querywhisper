"use client";

import { createContext, useContext, useState } from "react";
import { host } from "../host";

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

      console.log("ApiContext - Making fetch request to:", `${host}/ask`);
      console.log("ApiContext - Request body:", JSON.stringify(request));

      const response = await fetch(`${host}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer demo-token", // Using demo token as per backend auth
        },
        body: JSON.stringify(request),
      });

      console.log("ApiContext - Fetch response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AskResponse = await response.json();

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
      const response = await fetch(`${host}/test`);
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
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
