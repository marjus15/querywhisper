"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getDatabaseTables,
  DatabaseTable,
  DatabaseTablesResponse,
} from "@/app/api/getDatabaseTables";
import { getSchemaSuggestions } from "@/app/api/getSchemaSuggestions";

interface DatabaseContextType {
  tables: DatabaseTable[];
  loadingTables: boolean;
  error: string | null;
  fetchTables: () => Promise<void>;
  refreshDatabase: () => Promise<void>;
  schemaSuggestions: string[];
  loadingSuggestions: boolean;
  refreshSuggestions: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({
  tables: [],
  loadingTables: false,
  error: null,
  fetchTables: async () => {},
  refreshDatabase: async () => {},
  schemaSuggestions: [],
  loadingSuggestions: false,
  refreshSuggestions: async () => {},
});

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaSuggestions, setSchemaSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const refreshSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await getSchemaSuggestions(6);
      setSchemaSuggestions(data.suggestions);
    } catch (err) {
      console.error("Error fetching schema suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchTables = async () => {
    setLoadingTables(true);
    setError(null);
    try {
      const response: DatabaseTablesResponse = await getDatabaseTables();
      if (response.status === "success") {
        setTables(response.tables);
      } else {
        setError("Failed to fetch database tables");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching database tables:", err);
    } finally {
      setLoadingTables(false);
    }
  };

  const refreshDatabase = async () => {
    await fetchTables();
    await refreshSuggestions();
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchTables();
    refreshSuggestions();
  }, []);

  const value: DatabaseContextType = {
    tables,
    loadingTables,
    error,
    fetchTables,
    refreshDatabase,
    schemaSuggestions,
    loadingSuggestions,
    refreshSuggestions,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
