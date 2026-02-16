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

export interface QueryRequest {
  sql_query: string;
}

export interface QueryResponse {
  success: boolean;
  data?: any[];
  columns?: string[];
  error?: string;
}

export interface Dashboard {
  id: string;
  title: string;
  data: {
    charts: any[];
    tables: any[];
    layouts?: any[];
  };
  is_locked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardCreateRequest {
  title: string;
  data?: {
    charts: any[];
    tables: any[];
    layouts?: any[];
  };
  is_locked?: boolean;
}

export interface DashboardUpdateRequest {
  title?: string;
  data?: {
    charts: any[];
    tables: any[];
    layouts?: any[];
  };
  is_locked?: boolean;
}

export interface DashboardsResponse {
  dashboards: Dashboard[];
  count: number;
}

export const ApiContext = createContext<{
  askQuestion: (question: string, sessionId?: string) => Promise<AskResponse>;
  executeQuery: (sqlQuery: string) => Promise<QueryResponse>;
  testConnection: () => Promise<boolean>;
  getDashboards: () => Promise<DashboardsResponse>;
  getDashboard: (dashboardId: string) => Promise<Dashboard>;
  createDashboard: (request: DashboardCreateRequest) => Promise<Dashboard>;
  updateDashboard: (dashboardId: string, request: DashboardUpdateRequest) => Promise<Dashboard>;
  deleteDashboard: (dashboardId: string) => Promise<void>;
}>({
  askQuestion: async () => ({ success: false, question: "" }),
  executeQuery: async () => ({ success: false }),
  testConnection: async () => false,
  getDashboards: async () => ({ dashboards: [], count: 0 }),
  getDashboard: async () => ({ id: "", title: "", data: { charts: [], tables: [] }, created_at: "", updated_at: "" }),
  createDashboard: async () => ({ id: "", title: "", data: { charts: [], tables: [] }, created_at: "", updated_at: "" }),
  updateDashboard: async () => ({ id: "", title: "", data: { charts: [], tables: [] }, created_at: "", updated_at: "" }),
  deleteDashboard: async () => {},
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

  const executeQuery = async (sqlQuery: string): Promise<QueryResponse> => {
    try {
      const request: QueryRequest = {
        sql_query: sqlQuery,
      };

      console.log("ApiContext - Executing SQL query:", sqlQuery);

      const data: QueryResponse = await apiClient.post<QueryResponse>(
        "/query",
        request
      );

      console.log("ApiContext - Query response received:", data);

      return data;
    } catch (error) {
      console.error("Error executing query:", error);
      return {
        success: false,
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

  const getDashboards = async (): Promise<DashboardsResponse> => {
    try {
      const data = await apiClient.get<DashboardsResponse>("/dashboards");
      return data;
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      return { dashboards: [], count: 0 };
    }
  };

  const getDashboard = async (dashboardId: string): Promise<Dashboard> => {
    try {
      const data = await apiClient.get<Dashboard>(`/dashboards/${dashboardId}`);
      return data;
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      throw error;
    }
  };

  const createDashboard = async (request: DashboardCreateRequest): Promise<Dashboard> => {
    try {
      console.log("ApiContext - Creating dashboard with request:", JSON.stringify(request));
      const response = await apiClient.post<Dashboard>("/dashboards", request);
      console.log("ApiContext - Raw response:", response);
      console.log("ApiContext - Response type:", typeof response);
      console.log("ApiContext - Response keys:", response ? Object.keys(response) : "null");
      
      // Handle case where response might be wrapped
      const data = response as Dashboard;
      console.log("ApiContext - Dashboard created successfully:", data);
      
      if (!data || !data.id) {
        console.error("ApiContext - Invalid response structure:", data);
        throw new Error(`Invalid dashboard response: ${JSON.stringify(data)}`);
      }
      
      return data;
    } catch (error) {
      console.error("ApiContext - Error creating dashboard:", error);
      if (error instanceof Error) {
        console.error("ApiContext - Error message:", error.message);
        console.error("ApiContext - Error stack:", error.stack);
      }
      throw error;
    }
  };

  const updateDashboard = async (dashboardId: string, request: DashboardUpdateRequest): Promise<Dashboard> => {
    try {
      const data = await apiClient.put<Dashboard>(`/dashboards/${dashboardId}`, request);
      return data;
    } catch (error) {
      console.error("Error updating dashboard:", error);
      throw error;
    }
  };

  const deleteDashboard = async (dashboardId: string): Promise<void> => {
    try {
      await apiClient.delete(`/dashboards/${dashboardId}`);
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      throw error;
    }
  };

  return (
    <ApiContext.Provider value={{ 
      askQuestion, 
      executeQuery, 
      testConnection,
      getDashboards,
      getDashboard,
      createDashboard,
      updateDashboard,
      deleteDashboard,
    }}>
      {children}
    </ApiContext.Provider>
  );
};
