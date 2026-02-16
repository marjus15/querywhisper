"use client";

import { ResultPayload, Message } from "@/app/types/chat";
import { Button } from "@/components/ui/button";
import CopyToClipboardButton from "@/app/components/navigation/CopyButton";
import { IoClose } from "react-icons/io5";
import { FaTable } from "react-icons/fa";
import { useContext, useState } from "react";
import { RouterContext } from "@/app/components/contexts/RouterContext";
import { FaCode } from "react-icons/fa6";
import { FaPlay } from "react-icons/fa";
import { ApiContext } from "@/app/components/contexts/ApiContext";
import { ConversationContext } from "@/app/components/contexts/ConversationContext";
import { SessionContext } from "@/app/components/contexts/SessionContext";
import { v4 as uuidv4 } from "uuid";

interface CodeDisplayProps {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  payload: ResultPayload[];
  handleViewChange: (
    view: "chat" | "code" | "result" | "chart" | "table",
    payload: ResultPayload[] | null
  ) => void;
  conversationID?: string;
  queryID?: string;
}

const CodeView: React.FC<CodeDisplayProps> = ({
  payload,
  handleViewChange,
  conversationID,
  queryID,
}) => {
  const { changePage } = useContext(RouterContext);
  const { executeQuery } = useContext(ApiContext);
  const { handleWebsocketMessage, currentConversation } = useContext(ConversationContext);
  const { id: userId } = useContext(SessionContext);
  const [editedQueries, setEditedQueries] = useState<{ [key: number]: string }>({});
  const [isExecuting, setIsExecuting] = useState<{ [key: number]: boolean }>({});

  if (!payload) return null;

  const routerChangeCollection = (collectionName: string) => {
    changePage("collection", { source: collectionName }, true);
  };

  const handleQueryEdit = (index: number, newQuery: string) => {
    setEditedQueries((prev) => ({ ...prev, [index]: newQuery }));
  };

  const handleExecuteQuery = async (index: number, sqlQuery: string) => {
    const convId = conversationID || currentConversation || "";
    const qId = queryID || uuidv4();
    
    if (!convId) {
      console.error("No conversation ID available");
      return;
    }

    setIsExecuting((prev) => ({ ...prev, [index]: true }));

    try {
      const response = await executeQuery(sqlQuery);

      if (response.success && response.data) {
        // Create result message similar to how SocketContext does it
        const resultMessage: Message = {
          id: qId + "_result_edited",
          type: "result",
          conversation_id: convId,
          user_id: userId || "",
          query_id: qId,
          payload: {
            type: "table",
            metadata: {
              sql_query: sqlQuery,
              row_count: response.data.length,
              execution_time_ms: 0, // Backend doesn't return this for /query endpoint
            },
            code: {
              language: "sql",
              title: "Edited SQL Query",
              text: sqlQuery,
            },
            objects: response.data,
          } as ResultPayload,
        };

        handleWebsocketMessage(resultMessage);
        
        // Switch back to chat view to see the results
        handleViewChange("chat", null);
      } else {
        // Handle error
        const errorMessage: Message = {
          id: qId + "_error_edited",
          type: "error",
          conversation_id: convId,
          user_id: userId || "",
          query_id: qId,
          payload: {
            error: response.error || "Failed to execute query",
          },
        };

        handleWebsocketMessage(errorMessage);
        handleViewChange("chat", null);
      }
    } catch (error) {
      console.error("Error executing query:", error);
      const errorMessage: Message = {
        id: qId + "_error_edited",
        type: "error",
        conversation_id: convId,
        user_id: userId || "",
        query_id: qId,
        payload: {
          error: error instanceof Error ? error.message : "Unknown error occurred",
        },
      };

      handleWebsocketMessage(errorMessage);
      handleViewChange("chat", null);
    } finally {
      setIsExecuting((prev) => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-6 overflow-hidden chat-animation">
      <div className="w-full flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <p>Query</p>
        </div>
        <Button
          variant={"ghost"}
          className="text-secondary h-9 w-9"
          onClick={() => handleViewChange("chat", null)}
        >
          <IoClose size={12} />
        </Button>
      </div>
      {payload.map((item, index) => {
        // Safety check: ensure item has the required structure
        if (!item || !item.code || !item.code.text) {
          console.warn("CodeView: Invalid item structure", item);
          return null;
        }

        return (
          <div key={index} className="w-full">
            <div className="flex justify-start items-center w-full">
              <div className="flex gap-2 items-center w-full">
                {item.metadata?.collection_name && (
                  <div className="flex flex-row justify-between items-center w-full">
                    <div className="flex gap-2 justify-start items-center">
                      <div className="text-highlight bg-highlight/10 h-9 w-9 rounded-md flex items-center justify-center">
                        <FaCode size={14} className="text-highlight" />
                      </div>
                      {item.metadata.collection_name}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="overflow-y-scroll">
                {item.metadata?.collection_name && (
                  <div className="absolute top-2 right-0 p-3 flex gap-1 z-10">
                    <Button
                      className="bg-accent/10 hover:bg-accent/20 h-9 w-9"
                      onClick={() =>
                        routerChangeCollection(item.metadata.collection_name)
                      }
                    >
                      <FaTable size={14} className="text-accent" />
                    </Button>
                  </div>
                )}
                <textarea
                  value={editedQueries[index] !== undefined ? editedQueries[index] : item.code.text}
                  onChange={(e) => handleQueryEdit(index, e.target.value)}
                  className="w-full min-h-[200px] p-4 rounded-lg font-mono text-sm bg-[#202020] text-[#f2f2f2] border border-foreground/20 focus:border-highlight/50 focus:outline-none resize-y"
                  style={{
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    lineHeight: "1.5",
                    tabSize: 2,
                  }}
                  spellCheck={false}
                  placeholder="Enter your SQL query here..."
                />
                <div className="absolute bottom-2 left-2 flex gap-2 z-10">
                  <CopyToClipboardButton copyText={editedQueries[index] || item.code.text} />
                  <Button
                    className="bg-highlight/10 hover:bg-highlight/20 h-9 px-4 flex items-center gap-2"
                    onClick={() => {
                      const queryToExecute = editedQueries[index] || item.code.text;
                      handleExecuteQuery(index, queryToExecute);
                    }}
                    disabled={isExecuting[index]}
                  >
                    <FaPlay size={12} className="text-highlight" />
                    {isExecuting[index] ? "Executing..." : "Execute"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CodeView;
