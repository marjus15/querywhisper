"use client";

import { createContext, useEffect, useState } from "react";
import {
  Message,
  TextPayload,
  ErrorPayload,
  ResultPayload,
} from "@/app/types/chat";
import { useContext } from "react";
import { ConversationContext } from "./ConversationContext";
import { ToastContext } from "./ToastContext";
import { ApiContext } from "./ApiContext";

interface QueryResponseShape {
  data?: unknown[];
  row_count?: number;
  columns?: string[];
  execution_time_ms?: number;
}

export const SocketContext = createContext<{
  socketOnline: boolean;
  sendQuery: (
    user_id: string,
    query: string,
    conversation_id: string,
    query_id: string,
    route?: string,
    mimick?: boolean
  ) => Promise<boolean>;
}>({
  socketOnline: false,
  sendQuery: async () => false,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { setConversationStatus, handleWebsocketMessage } =
    useContext(ConversationContext);

  const { showErrorToast, showSuccessToast } = useContext(ToastContext);
  const { askQuestion, testConnection } = useContext(ApiContext);

  const [socketOnline, setSocketOnline] = useState(false);
  const [hasShownInitialConnection, setHasShownInitialConnection] =
    useState(false);

  // Test connection to backend on component mount
  useEffect(() => {
    const checkConnection = async (showToasts: boolean = true) => {
      try {
        const isOnline = await testConnection();
        const wasOffline = !socketOnline;
        setSocketOnline(isOnline);

        if (showToasts) {
          if (isOnline && (wasOffline || !hasShownInitialConnection)) {
            showSuccessToast("Connected to Backend");
            setHasShownInitialConnection(true);
          } else if (!isOnline && wasOffline) {
            showErrorToast("Failed to connect to Backend");
          }
        }
      } catch (error) {
        console.error("Connection test failed:", error);
        const wasOnline = socketOnline;
        setSocketOnline(false);
        if (showToasts && wasOnline) {
          showErrorToast("Connection to Backend failed");
        }
      }
    };

    // Initial connection check with toast
    checkConnection(true);

    // TODO: Commented out to avoid repeated /test calls - not needed for development
    // Check connection every 30 seconds without showing success toasts
    // const interval = setInterval(() => checkConnection(false), 30000);
    // return () => clearInterval(interval);
  }, [
    testConnection,
    showErrorToast,
    showSuccessToast,
    socketOnline,
    hasShownInitialConnection,
  ]);

  /* eslint-disable @typescript-eslint/no-unused-vars -- route/mimick reserved for future backend */
  const sendQuery = async (
    user_id: string,
    query: string,
    conversation_id: string,
    query_id: string,
    route: string = "",
    mimick: boolean = false
  ) => {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    try {
      setConversationStatus("Thinking...", conversation_id);

      if (process.env.NODE_ENV === "development") {
        console.log(
          `Sending query: "${query}" to conversation ${conversation_id}`
        );
      }

      // Use the backend /ask endpoint with the current conversation's session ID
      console.log("SocketContext - About to call askQuestion with:", query, "session:", conversation_id);
      const response = await askQuestion(query, conversation_id);
      console.log("SocketContext - Received response:", response);

      if (response.success) {
        // Create messages that match the existing frontend expectations
        const textMessage: Message = {
          id: query_id + "_text",
          type: "text",
          conversation_id: conversation_id,
          user_id: user_id,
          query_id: query_id,
          payload: {
            text: formatResponseContent(response),
          } as TextPayload,
        };

        // If we have SQL query and data, also create a result message
        if (response.generated_sql && response.data) {
          const resultMessage: Message = {
            id: query_id + "_result",
            type: "result",
            conversation_id: conversation_id,
            user_id: user_id,
            query_id: query_id,
            payload: {
              type: "table",
              metadata: {
                sql_query: response.generated_sql,
                execution_time_ms: response.execution_time_ms,
                row_count: response.row_count,
                warnings: response.warnings,
                suggestions: response.suggestions,
              },
              code: {
                language: "sql",
                title: "Generated SQL Query",
                text: response.generated_sql,
              },
              objects: response.data,
            } as ResultPayload,
          };

          // Send both messages
          handleWebsocketMessage(textMessage);
          handleWebsocketMessage(resultMessage);
        } else {
          // Just send the text message
          handleWebsocketMessage(textMessage);
        }

        setConversationStatus("", conversation_id);
        return true;
      } else {
        // Handle error response
        const errorMessage: Message = {
          id: query_id + "_error",
          type: "error",
          conversation_id: conversation_id,
          user_id: user_id,
          query_id: query_id,
          payload: {
            error: response.error || "Failed to process query",
          } as ErrorPayload,
        };

        handleWebsocketMessage(errorMessage);
        setConversationStatus("", conversation_id);
        showErrorToast("Query failed", response.error || "Unknown error");
        return false;
      }
    } catch (error) {
      console.error("Error sending query:", error);
      setConversationStatus("", conversation_id);
      showErrorToast("Connection error", "Failed to send query to backend");
      return false;
    }
  };

  const formatResponseContent = (response: QueryResponseShape): string => {
    if (!response.data || response.data.length === 0) {
      return "No results found for your query.";
    }

    // Format the data as a simple text response
    const rowCount = response.row_count || response.data.length;
    let content = `Found ${rowCount} result${rowCount !== 1 ? "s" : ""}:\n\n`;

    // Add a simple table format
    const columns = response.columns;
    if (columns && response.data.length > 0) {
      content += `**${columns.join(" | ")}**\n`;
      content += `${columns.map(() => "---").join(" | ")}\n`;

      // Show first few rows
      const displayRows = response.data.slice(0, 10);
      displayRows.forEach((item) => {
        const row = item as Record<string, unknown>;
        const values = columns.map((col: string) => {
          const value = row[col];
          return value !== null && value !== undefined ? String(value) : "";
        });
        content += `${values.join(" | ")}\n`;
      });

      if (response.data.length > 10) {
        content += `\n... and ${response.data.length - 10} more rows`;
      }
    }

    if (response.execution_time_ms) {
      content += `\n\n*Query executed in ${response.execution_time_ms}ms*`;
    }

    return content;
  };

  return (
    <SocketContext.Provider value={{ socketOnline, sendQuery }}>
      {children}
    </SocketContext.Provider>
  );
};
