"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ToastContext } from "./ToastContext";
import { apiClient } from "@/lib/api-client";

// =====================================================
// TYPES
// =====================================================

export type ConnectionType =
  | "postgresql"
  | "mysql"
  | "supabase"
  | "snowflake"
  | "bigquery";

export type SSLMode =
  | "disable"
  | "allow"
  | "prefer"
  | "require"
  | "verify-ca"
  | "verify-full";

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  description?: string;
  is_primary_key: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableSchema {
  name: string;
  type: string;
  description?: string;
  columns: ColumnSchema[];
  row_count_estimate?: number;
}

export interface DataConnection {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  connection_type: ConnectionType;
  host: string;
  port: number;
  database_name: string;
  username: string;
  ssl_mode: SSLMode;
  read_only: boolean;
  max_rows_per_query: number;
  query_timeout_seconds: number;
  blocked_tables: string[];
  allowed_tables?: string[];
  is_active: boolean;
  last_connected_at?: string;
  connection_error?: string;
  schema_cached_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConnectionData {
  name: string;
  description?: string;
  connection_type: ConnectionType;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  ssl_mode?: SSLMode;
  read_only?: boolean;
  max_rows_per_query?: number;
  query_timeout_seconds?: number;
  blocked_tables?: string[];
  allowed_tables?: string[];
}

export interface ConnectionTestResult {
  success: boolean;
  message?: string;
  error?: string;
  error_type?: string;
  latency_ms?: number;
  tables_count?: number;
}

export interface ConnectionSchema {
  connection_id: string;
  connection_name: string;
  tables: Record<string, TableSchema>;
  cached_at?: string;
  table_count: number;
}

// =====================================================
// CONTEXT
// =====================================================

interface ConnectionContextType {
  // State
  connections: DataConnection[];
  currentConnection: DataConnection | null;
  currentSchema: ConnectionSchema | null;
  isLoading: boolean;
  isLoadingSchema: boolean;

  // Actions
  loadConnections: () => Promise<void>;
  selectConnection: (connectionId: string | null) => void;
  createConnection: (data: CreateConnectionData) => Promise<DataConnection>;
  updateConnection: (
    id: string,
    data: Partial<CreateConnectionData>
  ) => Promise<DataConnection>;
  deleteConnection: (id: string) => Promise<void>;
  testConnection: (data: CreateConnectionData) => Promise<ConnectionTestResult>;
  refreshSchema: (connectionId: string) => Promise<ConnectionSchema>;
  getConnectionById: (id: string) => DataConnection | undefined;
}

export const ConnectionContext = createContext<ConnectionContextType>({
  connections: [],
  currentConnection: null,
  currentSchema: null,
  isLoading: false,
  isLoadingSchema: false,
  loadConnections: async () => {},
  selectConnection: () => {},
  createConnection: async () => ({} as DataConnection),
  updateConnection: async () => ({} as DataConnection),
  deleteConnection: async () => {},
  testConnection: async () => ({ success: false }),
  refreshSchema: async () => ({} as ConnectionSchema),
  getConnectionById: () => undefined,
});

// =====================================================
// PROVIDER
// =====================================================

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [currentConnection, setCurrentConnection] =
    useState<DataConnection | null>(null);
  const [currentSchema, setCurrentSchema] = useState<ConnectionSchema | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const { showSuccessToast, showErrorToast } = useContext(ToastContext);

  // Load connections
  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ connections: DataConnection[] }>("/api/v2/connections");
      setConnections(response.connections || []);

      // Restore current connection if it still exists
      if (currentConnection) {
        const stillExists = response.connections?.find(
          (c: DataConnection) => c.id === currentConnection.id
        );
        if (!stillExists) {
          setCurrentConnection(null);
          setCurrentSchema(null);
        }
      }
    } catch (error) {
      console.error("Failed to load connections:", error);
      // Don't show error toast on initial load - user might not have any connections yet
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, [currentConnection]);

  // Load connections on mount
  useEffect(() => {
    loadConnections();
  }, []); // Load once on mount

  // Select a connection
  const selectConnection = useCallback(
    async (connectionId: string | null) => {
      if (!connectionId) {
        setCurrentConnection(null);
        setCurrentSchema(null);
        return;
      }

      const connection = connections.find((c) => c.id === connectionId);
      if (connection) {
        setCurrentConnection(connection);

        // Load schema
        setIsLoadingSchema(true);
        try {
          const schema = await apiClient.get<ConnectionSchema>(
            `/api/v2/connections/${connectionId}/schema`
          );
          setCurrentSchema(schema);
        } catch (error) {
          console.error("Failed to load schema:", error);
          setCurrentSchema(null);
        } finally {
          setIsLoadingSchema(false);
        }
      }
    },
    [connections]
  );

  // Create a connection
  const createConnection = useCallback(
    async (data: CreateConnectionData): Promise<DataConnection> => {
      try {
        const response = await apiClient.post<DataConnection>("/api/v2/connections", data);

        // Reload connections to get the new one
        await loadConnections();

        showSuccessToast("Success", `Connection "${data.name}" created`);
        return response;
      } catch (error) {
        showErrorToast(
          "Error",
          `Failed to create connection: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        throw error;
      }
    },
    [loadConnections, showSuccessToast, showErrorToast]
  );

  // Update a connection
  const updateConnection = useCallback(
    async (
      id: string,
      data: Partial<CreateConnectionData>
    ): Promise<DataConnection> => {
      try {
        const response = await apiClient.put<DataConnection>(`/api/v2/connections/${id}`, data);

        // Update local state
        setConnections((prev) =>
          prev.map((c) => (c.id === id ? response : c))
        );

        if (currentConnection?.id === id) {
          setCurrentConnection(response);
        }

        showSuccessToast("Success", "Connection updated");
        return response;
      } catch (error) {
        showErrorToast(
          "Error",
          `Failed to update connection: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        throw error;
      }
    },
    [currentConnection, showSuccessToast, showErrorToast]
  );

  // Delete a connection
  const deleteConnection = useCallback(
    async (id: string): Promise<void> => {
      try {
        const connection = connections.find((c) => c.id === id);
        await apiClient.delete(`/api/v2/connections/${id}`);

        // Update local state
        setConnections((prev) => prev.filter((c) => c.id !== id));

        if (currentConnection?.id === id) {
          setCurrentConnection(null);
          setCurrentSchema(null);
        }

        showSuccessToast(
          "Success",
          `Connection "${connection?.name}" deleted`
        );
      } catch (error) {
        showErrorToast(
          "Error",
          `Failed to delete connection: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        throw error;
      }
    },
    [connections, currentConnection, showSuccessToast, showErrorToast]
  );

  // Test a connection
  const testConnection = useCallback(
    async (data: CreateConnectionData): Promise<ConnectionTestResult> => {
      try {
        const response = await apiClient.post<ConnectionTestResult>("/api/v2/connections/test", {
          connection_type: data.connection_type,
          host: data.host,
          port: data.port,
          database_name: data.database_name,
          username: data.username,
          password: data.password,
          ssl_mode: data.ssl_mode || "require",
        });

        if (response.success) {
          showSuccessToast(
            "Success",
            `Connected successfully (${response.latency_ms}ms, ${response.tables_count} tables)`
          );
        }

        return response;
      } catch (error) {
        const result: ConnectionTestResult = {
          success: false,
          error: error instanceof Error ? error.message : "Connection failed",
          error_type: "test_error",
        };
        return result;
      }
    },
    [showSuccessToast]
  );

  // Refresh schema
  const refreshSchema = useCallback(
    async (connectionId: string): Promise<ConnectionSchema> => {
      setIsLoadingSchema(true);
      try {
        const schema = await apiClient.get<ConnectionSchema>(
          `/api/v2/connections/${connectionId}/schema?refresh=true`
        );

        if (currentConnection?.id === connectionId) {
          setCurrentSchema(schema);
        }

        showSuccessToast("Success", "Schema refreshed");
        return schema;
      } catch (error) {
        showErrorToast(
          "Error",
          `Failed to refresh schema: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        throw error;
      } finally {
        setIsLoadingSchema(false);
      }
    },
    [currentConnection, showSuccessToast, showErrorToast]
  );

  // Get connection by ID
  const getConnectionById = useCallback(
    (id: string): DataConnection | undefined => {
      return connections.find((c) => c.id === id);
    },
    [connections]
  );

  return (
    <ConnectionContext.Provider
      value={{
        connections,
        currentConnection,
        currentSchema,
        isLoading,
        isLoadingSchema,
        loadConnections,
        selectConnection,
        createConnection,
        updateConnection,
        deleteConnection,
        testConnection,
        refreshSchema,
        getConnectionById,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

// =====================================================
// HOOK
// =====================================================

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
};
