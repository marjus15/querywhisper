"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Conversation, initialConversation } from "../types";

import {
  Query,
  NERPayload,
  TitlePayload,
  SuggestionPayload,
  Message,
  TextPayload,
  UserPromptPayload,
} from "@/app/types/chat";
import { TreeUpdatePayload } from "@/app/components/types";

import {
  DecisionTreePayload,
  SavedConversationPayload,
  ConversationPayload,
  SavedTreeData,
  BasePayload,
} from "@/app/types/payloads";
import { DecisionTreeNode } from "@/app/types/objects";
import { v4 as uuidv4 } from "uuid";
import { CollectionContext } from "./CollectionContext";

import { SessionContext } from "./SessionContext";

import { loadConversations } from "@/app/api/loadConversations";
import { loadConversation } from "@/app/api/loadConversation";
import { initializeTree } from "@/app/api/InitializeTree";
import { getSuggestions } from "@/app/api/getSuggestions";
import { deleteConversation } from "@/app/api/deleteConversation";
import { renameConversation } from "@/app/api/renameConversation";
import { startConversation } from "@/app/api/startConversation";
import { RouterContext } from "./RouterContext";
import { usePathname, useSearchParams } from "next/navigation";

export const ConversationContext = createContext<{
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  currentConversation: string | null;
  setCurrentConversation: (currentConversation: string | null) => void;
  creatingNewConversation: boolean;
  setCreatingNewConversation: (creatingNewConversation: boolean) => void;
  loadingConversations: boolean;
  addConversation: (
    user_id: string,
    title?: string,
    forceNew?: boolean
  ) => Promise<Conversation | null>;
  removeConversation: (conversation_id: string) => Promise<void>;
  renameConversation: (conversation_id: string, newTitle: string) => Promise<void>;
  selectConversation: (id: string) => void;
  setConversationStatus: (status: string, conversationId: string) => void;
  handleConversationError: (conversationId: string) => void;
  addMessageToConversation: (
    messages: Message[],
    conversationId: string,
    queryId: string
  ) => void;
  initializeEnabledCollections: (
    collections: { [key: string]: boolean },
    collection_id: string
  ) => void;
  toggleCollectionEnabled: (
    collection_id: string,
    conversationId: string
  ) => void;
  updateTree: (tree_update_message: Message) => void;
  addTreeToConversation: (conversationId: string) => void;
  changeBaseToQuery: (conversationId: string, query: string) => void;
  addQueryToConversation: (
    conversationId: string,
    query: string,
    query_id: string
  ) => void;
  finishQuery: (conversationId: string, queryId: string) => void;
  updateNERForQuery: (
    conversationId: string,
    queryId: string,
    NER: NERPayload
  ) => void;
  updateFeedbackForQuery: (
    conversationId: string,
    queryId: string,
    feedback: number
  ) => void;
  setAllConversationStatuses: (status: string) => void;
  startNewConversation: () => void;
  getAllEnabledCollections: () => string[];
  triggerAllCollections: (conversationId: string, enable: boolean) => void;
  handleAllConversationsError: () => void;
  conversationPreviews: { [key: string]: SavedTreeData };
  addSuggestionToConversation: (
    conversationId: string,
    queryId: string,
    user_id: string
  ) => void;
  loadConversationsFromDB: () => void;
  handleWebsocketMessage: (message: Message) => void;
  loadingConversation: boolean;
}>({
  conversations: [],
  setConversations: () => {},
  currentConversation: null,
  setCurrentConversation: () => {},
  creatingNewConversation: false,
  setCreatingNewConversation: () => {},
  loadingConversations: false,
  loadingConversation: false,
  startNewConversation: () => {},
  conversationPreviews: {},
  addConversation: () => Promise.resolve(null),
  removeConversation: () => Promise.resolve(),
  renameConversation: () => Promise.resolve(),
  selectConversation: () => {},
  setConversationStatus: () => {},
  setAllConversationStatuses: () => {},
  addMessageToConversation: () => {},
  initializeEnabledCollections: () => {},
  handleConversationError: () => {},
  toggleCollectionEnabled: () => {},
  handleWebsocketMessage: () => {},
  updateTree: () => {},
  addTreeToConversation: () => {},
  changeBaseToQuery: () => {},
  addQueryToConversation: () => {},
  finishQuery: () => {},
  updateNERForQuery: () => {},
  updateFeedbackForQuery: () => {},
  triggerAllCollections: () => {},
  handleAllConversationsError: () => {},
  addSuggestionToConversation: () => {},
  getAllEnabledCollections: () => [],
  loadConversationsFromDB: () => {},
});

export const ConversationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { collections } = useContext(CollectionContext);
  const { id, enableRateLimitDialog, initialized, fetchConversationFlag } =
    useContext(SessionContext);

  const { changePage, currentPage } = useContext(RouterContext);

  const searchParams = useSearchParams();
  const pathname = usePathname();

  const initial_ref = useRef<boolean>(false);
  const conversation_creation_attempted = useRef<boolean>(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationPreviews, setConversationPreviews] = useState<{
    [key: string]: SavedTreeData;
  }>({});
  const [currentConversation, setCurrentConversation] = useState<string | null>(
    null
  );
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [creatingNewConversation, setCreatingNewConversation] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const getDecisionTree = async (user_id: string, conversation_id: string) => {
    if (user_id === "") return null;
    const data: DecisionTreePayload = await initializeTree(
      user_id,
      conversation_id
    );
    return data;
  };

  const loadConversationsFromDB = async () => {
    if (!id) return;
    setLoadingConversations(true);

    try {
      console.log("🔄 Loading conversations from database for user:", id);
      const data: SavedConversationPayload = await loadConversations(id || "");

      // Build new previews from database
      const dbPreviews: { [key: string]: SavedTreeData } = {};
      
      if (data.trees && Object.keys(data.trees).length > 0) {
        for (const [key, value] of Object.entries(data.trees)) {
          if (value && value.title && value.last_update_time) {
            dbPreviews[key] = value;
          }
        }
        console.log(
          `✅ Loaded ${Object.keys(dbPreviews).length} conversations from database`
        );
      } else {
        console.log("ℹ️ No conversations found in database");
      }

      // Always merge with existing local conversations to preserve any that aren't in DB yet
      setConversationPreviews((prev) => {
        // Start with database conversations
        const merged = { ...dbPreviews };
        // Add any local conversations that aren't in the database
        // This preserves newly created conversations that haven't been synced yet
        for (const [key, value] of Object.entries(prev)) {
          if (!merged[key] && value) {
            console.log(`📋 Preserving local conversation: ${key}`);
            merged[key] = value;
          }
        }
        console.log(`📊 Total conversations after merge: ${Object.keys(merged).length}`);
        return merged;
      });
      setLoadingConversations(false);

      // No automatic conversation creation - conversations are created only when user explicitly starts them
      console.log("✅ Conversation loading completed - no auto-creation");
    } catch (error) {
      console.error("❌ Failed to load conversations from database:", error);
      setLoadingConversations(false);

      // If it's a 403 error, it might be a user ID mismatch - log it but don't crash
      if (error instanceof Error && error.message.includes("403")) {
        console.warn(
          "⚠️ 403 error - possible user ID mismatch in saved_trees endpoint"
        );
      }
    }
  };

  const retrieveConversation = async (
    conversationId: string,
    conversationName: string,
    timestamp: Date
  ) => {
    setLoadingConversation(true);
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversationId);
    } else {
      const data: ConversationPayload = await loadConversation(
        id || "",
        conversationId
      );
      setCreatingNewConversation(true);
      const tree = await getDecisionTree(id || "", conversationId);

      if (tree != null && collections != null && tree.tree != null) {
        const queries = data.rebuild.filter(
          (m) => m && m.type === "user_prompt"
        );
        const prebuiltQueries: { [key: string]: Query } = {};

        for (const query of queries) {
          const newQuery: Query = createNewQuery(
            conversationId,
            (query.payload as UserPromptPayload).prompt,
            query.query_id,
            conversations
          );
          prebuiltQueries[query.query_id] = newQuery;
        }

        const newConversation: Conversation = {
          enabled_collections: collections.reduce(
            (acc, c) => ({ ...acc, [c.name]: true }),
            {}
          ),
          id: conversationId,
          name: conversationName,
          tree_updates: [],
          // Create a new tree for each query with the query name, plus one base tree
          tree: tree.tree
            ? [
                ...queries.map((query) => ({
                  ...tree.tree!,
                  name: (query.payload as UserPromptPayload).prompt,
                })),
                tree.tree,
              ]
            : [],
          base_tree: tree.tree || null,
          queries: prebuiltQueries,
          current: "",
          initialized: true,
          error: false,
          timestamp: timestamp,
        };
        // Set tree names to match the user prompts for each query
        queries.forEach((query) => {
          const prompt = (query.payload as UserPromptPayload).prompt;
          changeBaseToQuery(conversationId, prompt);
        });

        setConversations((prevConversations) => [
          ...prevConversations,
          newConversation,
        ]);

        for (const message of data.rebuild) {
          handleWebsocketMessage(message);
        }
      }

      setCreatingNewConversation(false);
    }
    setLoadingConversation(false);
  };

  const addConversation = async (
    user_id: string,
    title?: string,
    forceNew: boolean = false
  ): Promise<Conversation | null> => {
    if (!user_id?.trim()) {
      return null;
    }

    if (creatingNewConversation) return null;

    setCreatingNewConversation(true);

    try {
      // First, create the conversation session in the backend
      // Pass force_new: true when explicitly creating a new conversation (plus button)
      const backendResponse = await startConversation({ force_new: forceNew });
      const conversation_id = backendResponse.session_id;

      console.log("✅ Backend conversation created:", conversation_id);

      const [tree] = await Promise.all([
        getDecisionTree(user_id, conversation_id),
      ]);

      if (tree === null || collections === null || tree.tree === null) {
        setCreatingNewConversation(false);
        return null;
      }

      const newConversation: Conversation = {
        ...initialConversation,
        id: conversation_id,
        name: title || initialConversation.name,
        timestamp: new Date(),
        tree: [tree.tree],
        base_tree: tree.tree,
        enabled_collections: collections.reduce(
          (acc, c) => ({ ...acc, [c.name]: true }),
          {}
        ),
        queries: {}, // Ensure queries start empty for new conversation
        initialized: true,
        current: "", // Ensure status is empty
      };
      // Preserve existing conversations - use functional update to ensure we have latest state
      setConversations((prevConversations) => {
        // Remove any existing conversation with the same ID (shouldn't happen, but safety check)
        const filtered = (prevConversations || []).filter(c => c.id !== conversation_id);
        return [...filtered, newConversation];
      });
      // Set current conversation after adding to array to ensure useEffect finds it
      setCurrentConversation(conversation_id);
      setCreatingNewConversation(false);
      conversation_creation_attempted.current = false; // Reset flag since we successfully created a conversation

      // Add to previews immediately so user can see the new conversation
      // Title will be updated when first query is submitted
      const previewData = {
        title: newConversation.name,
        last_update_time: new Date().toISOString(),
      };

      setConversationPreviews((prev) => ({
        ...prev,
        [conversation_id]: previewData,
      }));

      console.log("✅ Conversation created and added to sidebar:", {
        conversationId: conversation_id,
        title: newConversation.name,
        previewData,
        totalConversations: conversations.length + 1,
      });
      if (currentPage === "chat") {
        changePage("chat", { conversation: conversation_id }, true);
      }
      return newConversation;
    } catch (error) {
      console.error("❌ Failed to create conversation in backend:", error);
      setCreatingNewConversation(false);
      return null;
    }
  };

  const removeConversation = async (conversation_id: string) => {
    try {
      // Optimistically remove from UI immediately
      if (currentConversation === conversation_id) {
        setCurrentConversation(null);
      }
      
      // Remove from local state immediately for better UX
      setConversationPreviews((prev) => {
        const updated = { ...prev };
        delete updated[conversation_id];
        return updated;
      });
      
      // Remove from conversations array if it exists
      setConversations((prev) => prev.filter((c) => c.id !== conversation_id));
      
      // Delete from backend
      const result = await deleteConversation(id || "", conversation_id);
      
      // Check if there was an error
      if (result.error) {
        console.error("❌ Failed to delete conversation:", result.error);
        // Reload conversations to restore the deleted one if delete failed
        await loadConversationsFromDB();
        return;
      }
      
      console.log("✅ Conversation deleted successfully:", conversation_id);
      
      // Reload conversations from DB to ensure consistency
      await loadConversationsFromDB();
    } catch (error) {
      console.error("❌ Error deleting conversation:", error);
      // Reload conversations to restore state if something went wrong
      await loadConversationsFromDB();
    }
  };

  const renameConversationHandler = async (conversation_id: string, newTitle: string) => {
    try {
      if (!newTitle || !newTitle.trim()) {
        console.error("❌ Cannot rename conversation: title cannot be empty");
        return;
      }

      const trimmedTitle = newTitle.trim();
      const originalTitle = conversationPreviews[conversation_id]?.title || "";
      
      // Optimistically update UI immediately
      setConversationPreviews((prev) => {
        if (prev[conversation_id]) {
          return {
            ...prev,
            [conversation_id]: {
              ...prev[conversation_id],
              title: trimmedTitle,
            },
          };
        }
        return prev;
      });

      // Update in conversations array if it exists
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation_id ? { ...c, name: trimmedTitle } : c
        )
      );

      // Update in backend
      const result = await renameConversation(id || "", conversation_id, trimmedTitle);

      // Check if there was an error
      if (result.error) {
        console.error("❌ Failed to rename conversation:", result.error);
        // Restore original title in UI
        setConversationPreviews((prev) => {
          if (prev[conversation_id]) {
            return {
              ...prev,
              [conversation_id]: {
                ...prev[conversation_id],
                title: originalTitle,
              },
            };
          }
          return prev;
        });
        // Reload conversations to ensure consistency
        await loadConversationsFromDB();
        return;
      }

      console.log("✅ Conversation renamed successfully:", conversation_id, "to:", trimmedTitle);
      // Don't reload on success - we already updated optimistically and it causes unnecessary re-renders
    } catch (error) {
      console.error("❌ Error renaming conversation:", error);
      // Restore original title in UI
      const originalTitle = conversationPreviews[conversation_id]?.title || "";
      setConversationPreviews((prev) => {
        if (prev[conversation_id]) {
          return {
            ...prev,
            [conversation_id]: {
              ...prev[conversation_id],
              title: originalTitle,
            },
          };
        }
        return prev;
      });
      // Reload conversations to restore state if something went wrong
      await loadConversationsFromDB();
    }
  };

  const selectConversation = (id: string) => {
    changePage("chat", { conversation: id }, true);
  };

  const setConversationStatus = (status: string, conversationId: string) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === conversationId) {
          return { ...c, current: status };
        }
        return c;
      })
    );
  };

  const setConversationTitle = async (
    title: string,
    conversationId: string
  ) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === conversationId) {
          return { ...c, name: title };
        }
        return c;
      })
    );
    setConversationPreviews((prev) => ({
      ...prev,
      [conversationId]: {
        title: title,
        last_update_time: new Date().toISOString(),
      },
    }));
  };

  const setAllConversationStatuses = (status: string) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => ({ ...c, current: status }))
    );
  };

  const addSuggestionToConversation = async (
    conversationId: string,
    queryId: string,
    user_id: string
  ) => {
    if (!user_id) return;
    const auth_key = "";
    const data: SuggestionPayload = await getSuggestions(
      user_id,
      conversationId,
      auth_key
    );
    const newMessage: Message = {
      type: "suggestion",
      id: uuidv4(),
      conversation_id: conversationId,
      query_id: queryId,
      user_id: user_id,
      payload: {
        error: "",
        suggestions: data.suggestions,
      },
    };
    addMessageToConversation([newMessage], conversationId, queryId);
  };

  const addMessageToConversation = (
    messages: Message[],
    conversationId: string,
    queryId: string
  ) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === conversationId) {
          if (!c.queries[queryId]) {
            console.warn(
              `Query ${queryId} not found in conversation ${conversationId} ${JSON.stringify(
                Object.keys(c.queries)
              )}`
            );
            return c;
          }

          // Update conversation with new messages
          const updatedConversation = {
            ...c,
            initialized: true,
            queries: {
              ...c.queries,
              [queryId]: {
                ...c.queries[queryId],
                messages: [...c.queries[queryId].messages, ...messages],
              },
            },
          };

          return updatedConversation;
        }
        return c;
      })
    );
  };

  const getAllEnabledCollections = () => {
    return conversations.reduce((acc, c) => {
      const enabledCollectionNames = Object.entries(c.enabled_collections || {})
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([key, value]) => value === true)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(([key, value]) => key);
      return [...acc, ...enabledCollectionNames];
    }, [] as string[]);
  };

  const initializeEnabledCollections = (
    collections: { [key: string]: boolean },
    collection_id: string
  ) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === collection_id) {
          return { ...c, enabled_collections: collections };
        }
        return c;
      })
    );
  };

  const toggleCollectionEnabled = (
    collection_id: string,
    conversationId: string
  ) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === conversationId) {
          const new_enabled_collections = {
            ...c.enabled_collections,
            [collection_id]: !c.enabled_collections[collection_id],
          };
          return {
            ...c,
            enabled_collections: new_enabled_collections,
          };
        }
        return c;
      })
    );
  };

  const triggerAllCollections = (conversationId: string, enable: boolean) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === conversationId) {
          const new_enabled_collections = Object.keys(
            c.enabled_collections
          ).reduce(
            (acc, key) => {
              acc[key] = enable;
              return acc;
            },
            {} as { [key: string]: boolean }
          );
          return { ...c, enabled_collections: new_enabled_collections };
        }
        return c;
      })
    );
  };

  const updateTree = (tree_update_message: Message) => {
    const _payload = tree_update_message.payload as TreeUpdatePayload;

    const findAndUpdateNode = (
      tree: DecisionTreeNode | null,
      base_tree: DecisionTreeNode | null,
      payload: TreeUpdatePayload
    ): DecisionTreeNode | null => {
      if (!tree) {
        return null;
      }

      // If this is the node we're looking for
      if (tree.id === payload.node && !tree.blocked) {
        // Update the specific option within tree.options where option.name === payload.decision
        const updatedOptions = Object.entries(tree.options).reduce(
          (acc, [key, option]) => {
            if (key === payload.decision) {
              acc[key] = {
                ...option,
                choosen: true,
                reasoning: payload.reasoning,
                options: payload.reset
                  ? base_tree
                    ? { base: base_tree }
                    : {}
                  : option.options || {},
              };
            } else {
              acc[key] = option;
            }
            return acc;
          },
          {} as { [key: string]: DecisionTreeNode }
        );
        return { ...tree, options: updatedOptions, blocked: true };
      } else if (tree.options && Object.keys(tree.options).length > 0) {
        // Recurse into options
        const updatedOptions = Object.entries(tree.options).reduce(
          (acc, [key, option]) => {
            const updatedNode = findAndUpdateNode(option, base_tree, _payload);
            if (updatedNode) {
              acc[key] = updatedNode;
            }
            return acc;
          },
          {} as { [key: string]: DecisionTreeNode }
        );
        return { ...tree, options: updatedOptions, blocked: true };
      } else {
        return tree;
      }
    };

    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === tree_update_message.conversation_id) {
          const trees = c.tree;
          const tree = trees[_payload.tree_index];
          const updatedTree = findAndUpdateNode(tree, c.base_tree, _payload);

          const newTrees = [...(c.tree || [])];
          if (updatedTree) {
            newTrees[_payload.tree_index] = updatedTree;
          }
          return {
            ...c,
            tree: newTrees,
            tree_updates: [...c.tree_updates, _payload],
          };
        }
        return c;
      })
    );
  };

  const addTreeToConversation = (conversationId: string) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === conversationId && c.base_tree) {
          return {
            ...c,
            tree: [...c.tree, { ...c.base_tree }],
          };
        }
        return c;
      })
    );
  };

  const changeBaseToQuery = (conversationId: string, query: string) => {
    const treeIndex =
      conversations.find((c) => c.id === conversationId)?.tree?.length || 1;

    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === conversationId) {
          const newTrees = [...c.tree];
          if (newTrees[treeIndex - 1]) {
            newTrees[treeIndex - 1] = {
              ...newTrees[treeIndex - 1],
              name: query,
            };
          }
          return {
            ...c,
            tree: newTrees,
          };
        }
        return c;
      })
    );
  };

  const createNewQuery = (
    conversationId: string,
    query: string,
    query_id: string,
    prevConversations: Conversation[],
    messages: Message[] = []
  ) => {
    const newMessage: Message = {
      type: "User",
      id: uuidv4(),
      query_id: query_id,
      conversation_id: conversationId,
      user_id: id || "",
      payload: {
        type: "text",
        metadata: {},
        code: {
          language: "",
          title: "",
          text: "",
        },
        objects: [query],
      },
    };
    const newQuery: Query = {
      id: query_id,
      query: query,
      finished: false,
      query_start: new Date(),
      query_end: null,
      feedback: null,
      NER: null,
      index:
        prevConversations.find((c) => c.id === conversationId)?.queries[
          query_id
        ]?.index || 0,
      messages: [newMessage, ...messages],
    };

    return newQuery;
  };

  const addQueryToConversation = (
    conversationId: string,
    query: string,
    query_id: string
  ) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        const newQuery = createNewQuery(
          conversationId,
          query,
          query_id,
          prevConversations
        );
        if (c.id === conversationId) {
          const updatedConversation = { ...c, queries: { ...c.queries, [query_id]: newQuery } };
          
          // If this is the first query and conversation still has default title, update it
          const isFirstQuery = Object.keys(c.queries).length === 0;
          const hasDefaultTitle = c.name === "New Conversation" || c.name === initialConversation.name;
          
          if (isFirstQuery && hasDefaultTitle) {
            // Use the query text as the title (truncated to 50 chars)
            const newTitle = query.length > 50 ? query.substring(0, 50) + "..." : query;
            updatedConversation.name = newTitle;
            
            // Update conversation previews to show it in the sidebar
            setConversationPreviews((prev) => ({
              ...prev,
              [conversationId]: {
                title: newTitle,
                last_update_time: new Date().toISOString(),
              },
            }));
            
            console.log("✅ Updated conversation title from first query:", {
              conversationId,
              newTitle,
            });
          }
          
          return updatedConversation;
        }
        return c;
      })
    );
  };

  const finishQuery = (conversationId: string, queryId: string) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === conversationId && c.queries[queryId]) {
          return {
            ...c,
            queries: {
              ...c.queries,
              [queryId]: {
                ...c.queries[queryId],
                finished: true,
                query_end: new Date(),
              },
            },
          };
        }
        return c;
      })
    );
  };

  const updateNERForQuery = (
    conversationId: string,
    queryId: string,
    NER: NERPayload
  ) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === conversationId && c.queries[queryId]) {
          return {
            ...c,
            queries: {
              ...c.queries,
              [queryId]: { ...c.queries[queryId], NER: NER },
            },
          };
        }
        return c;
      })
    );
  };

  const updateFeedbackForQuery = async (
    conversationId: string,
    queryId: string,
    feedback: number
  ) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation || conversation.error) return;

    if (conversation.queries[queryId].feedback === feedback) {
      // Feedback endpoint not available on current backend
      setConversations((prevConversations) => {
        const newConversations = prevConversations.map((c) => {
          if (c.id === conversationId && c.queries[queryId]) {
            return {
              ...c,
              queries: {
                ...c.queries,
                [queryId]: { ...c.queries[queryId], feedback: null },
              },
            };
          }
          return c;
        });
        return newConversations;
      });
    } else {
      handleAddFeedback(id || "", conversationId, queryId, feedback);
      setConversations((prevConversations) => {
        const newConversations = prevConversations.map((c) => {
          if (c.id === conversationId && c.queries[queryId]) {
            return {
              ...c,
              queries: {
                ...c.queries,
                [queryId]: { ...c.queries[queryId], feedback },
              },
            };
          }
          return c;
        });
        return newConversations;
      });
    }
  };

  const handleAddFeedback = async (
    _user_id: string,
    _conversation_id: string,
    _query_id: string,
    _feedback: number
  ) => {
    // Feedback endpoint not available on current backend
    return { error: null } as BasePayload;
  };

  const handleAllConversationsError = () => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => ({ ...c, error: true }))
    );
  };

  const handleConversationError = (conversationId: string) => {
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (c.id === conversationId) {
          return { ...c, error: true };
        }
        return c;
      })
    );
  };

  const handleWebsocketMessage = (message: Message | null | undefined) => {
    if (!message) return;
    if (process.env.NODE_ENV === "development") {
      console.log("Handling message type:", message.type);
    }
    if (message.type === "status") {
      const payload = message.payload as TextPayload;
      setConversationStatus(payload.text, message.conversation_id);
    } else if (message.type === "title") {
      const payload = message.payload as TitlePayload;
      setConversationTitle(payload.title, message.conversation_id);
    } else if (message.type === "ner") {
      const payload = message.payload as NERPayload;
      updateNERForQuery(message.conversation_id, message.query_id, payload);
    } else if (message.type === "completed") {
      setConversationStatus("", message.conversation_id);
      finishQuery(message.conversation_id, message.query_id);
      addSuggestionToConversation(
        message.conversation_id,
        message.query_id,
        message.user_id
      );
    } else if (message.type === "tree_update") {
      updateTree(message);
    } else {
      if (
        [
          "error",
          "tree_timeout_error",
          "rate_limit_error",
          "authentication_error",
        ].includes(message.type)
      ) {
        handleConversationError(message.conversation_id);
        finishQuery(message.conversation_id, message.query_id);
        setConversationStatus("", message.conversation_id);
      }

      if (message.type === "rate_limit_error") {
        enableRateLimitDialog();
      }
      addMessageToConversation(
        [message],
        message.conversation_id,
        message.query_id
      );
    }
  };

  const startNewConversation = async () => {
    if (id && !creatingNewConversation) {
      console.log("🚀 Starting new conversation...");
      // Clear current conversation first to ensure clean state
      // This will trigger ChatPage to clear old messages immediately
      setCurrentConversation(null);
      
      // Small delay to ensure state clears before creating new conversation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Force new = true to always create a new conversation when clicking + button
      const newConversation = await addConversation(id, undefined, true);
      if (newConversation) {
        console.log(
          "✅ New conversation created and set as current:",
          newConversation.id,
          "queries count:",
          Object.keys(newConversation.queries || {}).length
        );
        // Set the new conversation as current - this will trigger useEffect in ChatPage
        setCurrentConversation(newConversation.id);
        // Reload conversations - will automatically merge with local state
        await loadConversationsFromDB();
      }
    } else if (creatingNewConversation) {
      console.log("⏳ Already creating a conversation, skipping...");
    }
  };

  useEffect(() => {
    if (!collections) return;
    setConversations((prevConversations) =>
      prevConversations.map((c) => {
        if (
          !c.enabled_collections ||
          Object.keys(c.enabled_collections).length === 0
        ) {
          return {
            ...c,
            enabled_collections: collections.reduce(
              (acc, c) => ({ ...acc, [c.name]: true }),
              {}
            ),
          };
        }
        return c;
      })
    );
  }, [collections]);

  useEffect(() => {
    if (id && !initial_ref.current && initialized) {
      initial_ref.current = true;
      loadConversationsFromDB();
    }
  }, [id, initialized]);

  useEffect(() => {
    loadConversationsFromDB();
  }, [fetchConversationFlag]);

  // Track conversation IDs only (not titles) to avoid re-running on rename
  const conversationIds = Object.keys(conversationPreviews).sort().join(",");
  // Keep a ref to avoid stale closures while still using conversationIds as dependency
  const conversationPreviewsRef = useRef(conversationPreviews);
  conversationPreviewsRef.current = conversationPreviews;
  
  useEffect(() => {
    const previews = conversationPreviewsRef.current;
    const pageParam = searchParams.get("page");
    const isChatPageOrRoot =
      pathname === "/" && (pageParam === "chat" || pageParam === null);

    if (process.env.NODE_ENV === "development") {
      console.log("Conversation selection logic:", {
        isChatPageOrRoot,
        initial_ref: initial_ref.current,
        conversationPreviews: Object.keys(previews).length,
        id: !!id,
        currentConversation,
      });
    }

    if (
      isChatPageOrRoot &&
      initial_ref.current &&
      id &&
      Object.keys(previews).length > 0
    ) {
      const conversationId = searchParams.get("conversation");

      if (conversationId) {
        // Handle specific conversation ID in URL
        if (conversationId === currentConversation) {
          return;
        }
        if (!previews[conversationId]) {
          // Conversation not found - select latest existing one
          const latestConversationId = Object.entries(
            previews
          ).sort(
            ([, a], [, b]) =>
              new Date(b.last_update_time).getTime() -
              new Date(a.last_update_time).getTime()
          )[0][0];
          changePage("chat", { conversation: latestConversationId }, true);
          return;
        }
        const conversation = conversations.find((c) => c.id === conversationId);
        const conversationName = previews[conversationId].title;

        if (!conversation) {
          retrieveConversation(
            conversationId,
            conversationName,
            new Date(previews[conversationId].last_update_time)
          );
        }
        setCurrentConversation(conversationId);
      } else {
        // No conversation ID in URL - auto-select latest
        const latestConversationId = Object.entries(previews).sort(
          ([, a], [, b]) =>
            new Date(b.last_update_time).getTime() -
            new Date(a.last_update_time).getTime()
        )[0][0];

        if (latestConversationId !== currentConversation) {
          changePage("chat", { conversation: latestConversationId }, true);
        }
      }
    }
  // Use conversationIds instead of conversationPreviews to avoid re-running on title changes
  }, [searchParams, pathname, conversationIds, id, currentConversation]);

  return (
    <ConversationContext.Provider
      value={{
        setConversations,
        setCurrentConversation,
        conversations,
        currentConversation,
        addConversation,
        removeConversation,
        renameConversation: renameConversationHandler,
        selectConversation,
        setConversationStatus,
        setAllConversationStatuses,
        addMessageToConversation,
        initializeEnabledCollections,
        toggleCollectionEnabled,
        updateTree,
        addTreeToConversation,
        startNewConversation,
        changeBaseToQuery,
        addQueryToConversation,
        creatingNewConversation,
        conversationPreviews,
        loadingConversations,
        setCreatingNewConversation,
        finishQuery,
        updateNERForQuery,
        updateFeedbackForQuery,
        triggerAllCollections,
        handleConversationError,
        handleAllConversationsError,
        addSuggestionToConversation,
        getAllEnabledCollections,
        loadConversationsFromDB,
        handleWebsocketMessage,
        loadingConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};
