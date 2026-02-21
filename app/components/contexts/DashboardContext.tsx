"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ResultPayload } from "@/app/types/chat";
import { ToastContext } from "./ToastContext";
import { ApiContext, QueryResponse } from "./ApiContext";
import { Layout } from "react-grid-layout";

// Types
export type ChartType = "bar" | "line" | "area" | "pie";

export interface DashboardChart {
  id: string;
  payload: ResultPayload[];
  xAxis: string;
  yAxis: string[];
  addedAt: string; // ISO string for JSON serialization
  title?: string;
  chartType?: ChartType; // Default to "bar" if not specified
  savedQuery?: string; // SQL to re-run when refreshing dashboard
}

export interface DashboardTable {
  id: string;
  payload: ResultPayload[];
  columns: string[];
  addedAt: string; // ISO string for JSON serialization
  title?: string;
  savedQuery?: string; // SQL to re-run when refreshing dashboard
}

export interface Dashboard {
  id: string;
  title: string;
  createdAt: string; // ISO string for JSON serialization
  charts: DashboardChart[];
  tables: DashboardTable[];
  layouts?: Layout[]; // Grid layout positions
  isLocked?: boolean; // Whether the layout is locked
}

/** API response shape for dashboard (from ApiContext) */
interface ApiDashboardShape {
  id: string;
  title: string;
  created_at: string;
  data?: { charts?: unknown[]; tables?: unknown[]; layouts?: unknown[] };
  is_locked?: boolean;
  error?: string;
  detail?: string;
}

interface DashboardContextType {
  dashboards: Dashboard[];
  currentDashboard: string | null;
  createDashboard: (title: string) => Promise<Dashboard>;
  removeDashboard: (id: string) => void;
  renameDashboard: (id: string, newTitle: string) => void;
  selectDashboard: (id: string) => void;
  addChartToDashboard: (
    dashboardId: string,
    chart: Omit<DashboardChart, "id" | "addedAt">,
    dashboard?: Dashboard
  ) => Promise<void>;
  removeChartFromDashboard: (dashboardId: string, chartId: string) => void;
  updateChartType: (dashboardId: string, chartId: string, chartType: ChartType) => void;
  addTableToDashboard: (
    dashboardId: string,
    table: Omit<DashboardTable, "id" | "addedAt">,
    dashboard?: Dashboard
  ) => Promise<void>;
  removeTableFromDashboard: (dashboardId: string, tableId: string) => void;
  getDashboardById: (id: string) => Dashboard | undefined;
  getCurrentDashboardData: () => Dashboard | undefined;
  updateDashboardLayout: (dashboardId: string, layouts: Layout[]) => void;
  toggleDashboardLock: (dashboardId: string) => void;
  refreshDashboardData: (dashboardId: string) => Promise<void>;
}

export const DashboardContext = createContext<DashboardContextType>({
  dashboards: [],
  currentDashboard: null,
  createDashboard: async () => ({ id: "", title: "", createdAt: "", charts: [], tables: [] }),
  removeDashboard: () => {},
  renameDashboard: () => {},
  selectDashboard: () => {},
  addChartToDashboard: async () => {},
  removeChartFromDashboard: () => {},
  updateChartType: () => {},
  addTableToDashboard: async () => {},
  removeTableFromDashboard: () => {},
  getDashboardById: () => undefined,
  getCurrentDashboardData: () => undefined,
  updateDashboardLayout: () => {},
  toggleDashboardLock: () => {},
  refreshDashboardData: async () => {},
});

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<string | null>(null);
  const [, setDashboardCounter] = useState(1);
  const [, setIsInitialized] = useState(false);
  const [, setIsLoading] = useState(false);

  const { showSuccessToast, showErrorToast } = useContext(ToastContext);
  const { getDashboards, createDashboard: createDashboardApi, updateDashboard: updateDashboardApi, deleteDashboard: deleteDashboardApi, executeQuery } = useContext(ApiContext);

  /** Build ResultPayload from /query response for dashboard widget payload */
  const queryResponseToResultPayload = useCallback((response: QueryResponse, savedQuery: string): ResultPayload => {
    const data = response.success && response.data ? response.data : [];
    return {
      type: "table",
      metadata: {},
      code: { language: "sql", title: "", text: savedQuery },
      objects: data as ResultPayload["objects"],
    };
  }, []);

  // Function to reload dashboards from API
  const reloadDashboards = useCallback(async () => {
    try {
      const response = await getDashboards();
      const convertedDashboards = response.dashboards.map(convertApiDashboardToFrontend);
      setDashboards(convertedDashboards);
      console.log("DashboardContext - Reloaded dashboards:", convertedDashboards.length);
    } catch (error) {
      console.error("Failed to reload dashboards:", error);
    }
  }, [getDashboards]);

  // Helper function to convert API dashboard format to frontend format
  const convertApiDashboardToFrontend = (apiDashboard: ApiDashboardShape): Dashboard => {
    const charts = ((apiDashboard.data?.charts || []) as DashboardChart[]).map((c) => {
      if (!c.savedQuery && c.payload?.[0]?.code?.text) {
        return { ...c, savedQuery: c.payload[0].code.text };
      }
      return c;
    });
    const tables = ((apiDashboard.data?.tables || []) as DashboardTable[]).map((t) => {
      if (!t.savedQuery && t.payload?.[0]?.code?.text) {
        return { ...t, savedQuery: t.payload[0].code.text };
      }
      return t;
    });
    return {
      id: apiDashboard.id,
      title: apiDashboard.title,
      createdAt: apiDashboard.created_at,
      charts,
      tables,
      layouts: (apiDashboard.data?.layouts || []) as Layout[],
      isLocked: apiDashboard.is_locked || false,
    };
  };

  // Helper function to convert frontend dashboard format to API format
  const convertFrontendDashboardToApi = (dashboard: Dashboard) => {
    return {
      title: dashboard.title,
      data: {
        charts: dashboard.charts || [],
        tables: dashboard.tables || [],
        layouts: dashboard.layouts || [],
      },
      is_locked: dashboard.isLocked || false,
    };
  };

  // Load dashboards from API on mount
  useEffect(() => {
    const loadDashboards = async () => {
      setIsLoading(true);
      try {
        const response = await getDashboards();
        const convertedDashboards = response.dashboards.map(convertApiDashboardToFrontend);
        setDashboards(convertedDashboards);
        
        // Calculate counter from existing dashboards
        if (convertedDashboards.length > 0) {
          const numbers = convertedDashboards
            .map(d => {
              const match = d.title.match(/Dashboard (\d+)/);
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => n > 0);
          if (numbers.length > 0) {
            setDashboardCounter(Math.max(...numbers) + 1);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboards from API:", error);
        showErrorToast("Error", "Failed to load dashboards");
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadDashboards();
  }, [getDashboards, showErrorToast]);

  const createDashboard = useCallback(async (title: string): Promise<Dashboard> => {
    try {
      if (!title || !title.trim()) {
        throw new Error("Dashboard title is required");
      }

      console.log("DashboardContext - Creating dashboard with title:", title.trim());
      let apiDashboard: ApiDashboardShape;
      try {
        apiDashboard = await createDashboardApi({
          title: title.trim(),
          data: { charts: [], tables: [], layouts: [] },
          is_locked: false,
        });
      } catch (apiError) {
        console.error("DashboardContext - Error from createDashboardApi:", apiError);
        throw apiError;
      }

      console.log("DashboardContext - API response:", apiDashboard);
      console.log("DashboardContext - API response type:", typeof apiDashboard);
      console.log("DashboardContext - API response is array:", Array.isArray(apiDashboard));
      if (apiDashboard) {
        console.log("DashboardContext - API response keys:", Object.keys(apiDashboard));
        console.log("DashboardContext - API response.id:", apiDashboard.id);
        console.log("DashboardContext - API response.title:", apiDashboard.title);
      }

      if (!apiDashboard) {
        console.error("DashboardContext - apiDashboard is null or undefined");
        throw new Error("Invalid dashboard response from API: response is null or undefined");
      }

      // Check if response is an error object
      if (apiDashboard.error || apiDashboard.detail) {
        const errorMsg = apiDashboard.error || apiDashboard.detail || "Unknown error";
        console.error("DashboardContext - API returned error:", errorMsg);
        throw new Error(`Failed to create dashboard: ${errorMsg}`);
      }

      if (!apiDashboard.id) {
        console.error("DashboardContext - apiDashboard missing id field:", apiDashboard);
        throw new Error(`Invalid dashboard response from API: missing id field. Response: ${JSON.stringify(apiDashboard)}`);
      }

      const newDashboard = convertApiDashboardToFrontend(apiDashboard);
      console.log("DashboardContext - Converted dashboard:", newDashboard);

      // Reload dashboards from API to ensure we have the latest data
      await reloadDashboards();
      
      // Set the newly created dashboard as current
      setCurrentDashboard(newDashboard.id);

      console.log("DashboardContext - Dashboard created successfully:", newDashboard.id);
      showSuccessToast("Success", `Dashboard "${newDashboard.title}" created successfully`);
      return newDashboard;
    } catch (error) {
      console.error("Failed to create dashboard:", error);
      showErrorToast("Error", `Failed to create dashboard: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  }, [createDashboardApi, showErrorToast, reloadDashboards, showSuccessToast]);

  const removeDashboard = useCallback(async (id: string) => {
    try {
      await deleteDashboardApi(id);
      setDashboards((prev) => prev.filter((d) => d.id !== id));
      setCurrentDashboard((prev) => (prev === id ? null : prev));
    } catch (error) {
      console.error("Failed to delete dashboard:", error);
      showErrorToast("Error", "Failed to delete dashboard");
      throw error;
    }
  }, [deleteDashboardApi, showErrorToast]);

  const renameDashboard = useCallback(async (id: string, newTitle: string) => {
    try {
      const dashboard = dashboards.find((d) => d.id === id);
      if (!dashboard) {
        throw new Error("Dashboard not found");
      }

      const apiResponse = await updateDashboardApi(id, { title: newTitle });
      
      const converted = convertApiDashboardToFrontend(apiResponse);
      setDashboards((prev) =>
        prev.map((d) => (d.id === id ? converted : d))
      );
    } catch (error) {
      console.error("Failed to rename dashboard:", error);
      showErrorToast("Error", "Failed to rename dashboard");
      throw error;
    }
  }, [dashboards, updateDashboardApi, showErrorToast]);

  const selectDashboard = useCallback((id: string) => {
    setCurrentDashboard(id);
  }, []);

  const addChartToDashboard = useCallback(
    async (dashboardId: string, chart: Omit<DashboardChart, "id" | "addedAt">, providedDashboard?: Dashboard) => {
      try {
        // Use provided dashboard if available, otherwise find it in state
        const dashboard = providedDashboard || dashboards.find((d) => d.id === dashboardId);
        if (!dashboard) {
          throw new Error("Dashboard not found");
        }

        const newChart: DashboardChart = {
          ...chart,
          id: `chart-${Date.now()}`,
          addedAt: new Date().toISOString(),
        };

        const updatedDashboard = {
          ...dashboard,
          charts: [...dashboard.charts, newChart],
        };

        const apiData = convertFrontendDashboardToApi(updatedDashboard);
        const apiResponse = await updateDashboardApi(dashboardId, { data: apiData.data });
        
        const converted = convertApiDashboardToFrontend(apiResponse);
        setDashboards((prev) =>
          prev.map((d) => (d.id === dashboardId ? converted : d))
        );

        showSuccessToast("Chart added", `Chart added to "${dashboard.title}"`);
      } catch (error) {
        console.error("Failed to add chart to dashboard:", error);
        showErrorToast("Error", "Failed to add chart");
        throw error;
      }
    },
    [dashboards, updateDashboardApi, showSuccessToast, showErrorToast]
  );

  const removeChartFromDashboard = useCallback(
    async (dashboardId: string, chartId: string) => {
      try {
        const dashboard = dashboards.find((d) => d.id === dashboardId);
        if (!dashboard) {
          throw new Error("Dashboard not found");
        }

        const updatedDashboard = {
          ...dashboard,
          charts: dashboard.charts.filter((c) => c.id !== chartId),
        };

        const apiData = convertFrontendDashboardToApi(updatedDashboard);
        const apiResponse = await updateDashboardApi(dashboardId, { data: apiData.data });
        
        const converted = convertApiDashboardToFrontend(apiResponse);
        setDashboards((prev) =>
          prev.map((d) => (d.id === dashboardId ? converted : d))
        );
      } catch (error) {
        console.error("Failed to remove chart from dashboard:", error);
        showErrorToast("Error", "Failed to remove chart");
        throw error;
      }
    },
    [dashboards, updateDashboardApi, showErrorToast]
  );

  const updateChartType = useCallback(
    async (dashboardId: string, chartId: string, chartType: ChartType) => {
      try {
        const dashboard = dashboards.find((d) => d.id === dashboardId);
        if (!dashboard) {
          throw new Error("Dashboard not found");
        }

        const updatedDashboard = {
          ...dashboard,
          charts: dashboard.charts.map((c) =>
            c.id === chartId ? { ...c, chartType } : c
          ),
        };

        const apiData = convertFrontendDashboardToApi(updatedDashboard);
        const apiResponse = await updateDashboardApi(dashboardId, { data: apiData.data });
        
        const converted = convertApiDashboardToFrontend(apiResponse);
        setDashboards((prev) =>
          prev.map((d) => (d.id === dashboardId ? converted : d))
        );
      } catch (error) {
        console.error("Failed to update chart type:", error);
        showErrorToast("Error", "Failed to update chart type");
        throw error;
      }
    },
    [dashboards, updateDashboardApi, showErrorToast]
  );

  const addTableToDashboard = useCallback(
    async (dashboardId: string, table: Omit<DashboardTable, "id" | "addedAt">, providedDashboard?: Dashboard) => {
      try {
        // Use provided dashboard if available, otherwise find it in state
        const dashboard = providedDashboard || dashboards.find((d) => d.id === dashboardId);
        if (!dashboard) {
          throw new Error("Dashboard not found");
        }

        const newTable: DashboardTable = {
          ...table,
          id: `table-${Date.now()}`,
          addedAt: new Date().toISOString(),
        };

        const updatedDashboard = {
          ...dashboard,
          tables: [...(dashboard.tables || []), newTable],
        };

        const apiData = convertFrontendDashboardToApi(updatedDashboard);
        const apiResponse = await updateDashboardApi(dashboardId, { data: apiData.data });
        
        const converted = convertApiDashboardToFrontend(apiResponse);
        setDashboards((prev) =>
          prev.map((d) => (d.id === dashboardId ? converted : d))
        );

        showSuccessToast("Table added", `Table added to "${dashboard.title}"`);
      } catch (error) {
        console.error("Failed to add table to dashboard:", error);
        showErrorToast("Error", "Failed to add table");
        throw error;
      }
    },
    [dashboards, updateDashboardApi, showSuccessToast, showErrorToast]
  );

  const removeTableFromDashboard = useCallback(
    async (dashboardId: string, tableId: string) => {
      try {
        const dashboard = dashboards.find((d) => d.id === dashboardId);
        if (!dashboard) {
          throw new Error("Dashboard not found");
        }

        const updatedDashboard = {
          ...dashboard,
          tables: (dashboard.tables || []).filter((t) => t.id !== tableId),
        };

        const apiData = convertFrontendDashboardToApi(updatedDashboard);
        const apiResponse = await updateDashboardApi(dashboardId, { data: apiData.data });
        
        const converted = convertApiDashboardToFrontend(apiResponse);
        setDashboards((prev) =>
          prev.map((d) => (d.id === dashboardId ? converted : d))
        );
      } catch (error) {
        console.error("Failed to remove table from dashboard:", error);
        showErrorToast("Error", "Failed to remove table");
        throw error;
      }
    },
    [dashboards, updateDashboardApi, showErrorToast]
  );

  const updateDashboardLayout = useCallback(
    async (dashboardId: string, layouts: Layout[]) => {
      try {
        const dashboard = dashboards.find((d) => d.id === dashboardId);
        if (!dashboard) {
          throw new Error("Dashboard not found");
        }

        const updatedDashboard = {
          ...dashboard,
          layouts,
        };

        const apiData = convertFrontendDashboardToApi(updatedDashboard);
        const apiResponse = await updateDashboardApi(dashboardId, { data: apiData.data });
        
        const converted = convertApiDashboardToFrontend(apiResponse);
        setDashboards((prev) =>
          prev.map((d) => (d.id === dashboardId ? converted : d))
        );
      } catch (error) {
        console.error("Failed to update dashboard layout:", error);
        showErrorToast("Error", "Failed to update layout");
        throw error;
      }
    },
    [dashboards, updateDashboardApi, showErrorToast]
  );

  const toggleDashboardLock = useCallback(
    async (dashboardId: string) => {
      try {
        const dashboard = dashboards.find((d) => d.id === dashboardId);
        if (!dashboard) {
          throw new Error("Dashboard not found");
        }

        const updatedDashboard = {
          ...dashboard,
          isLocked: !dashboard.isLocked,
        };

        const apiData = convertFrontendDashboardToApi(updatedDashboard);
        const apiResponse = await updateDashboardApi(dashboardId, { 
          data: apiData.data,
          is_locked: updatedDashboard.isLocked,
        });
        
        const converted = convertApiDashboardToFrontend(apiResponse);
        setDashboards((prev) =>
          prev.map((d) => (d.id === dashboardId ? converted : d))
        );
      } catch (error) {
        console.error("Failed to toggle dashboard lock:", error);
        showErrorToast("Error", "Failed to toggle lock");
        throw error;
      }
    },
    [dashboards, updateDashboardApi, showErrorToast]
  );

  const refreshDashboardData = useCallback(
    async (dashboardId: string) => {
      const dashboard = dashboards.find((d) => d.id === dashboardId);
      if (!dashboard) return;

      const updatedCharts: DashboardChart[] = await Promise.all(
        (dashboard.charts || []).map(async (chart) => {
          const sql = chart.savedQuery?.trim();
          if (!sql) return chart;
          try {
            const res = await executeQuery(sql);
            if (res.success) {
              return { ...chart, payload: [queryResponseToResultPayload(res, sql)] };
            }
            showErrorToast("Refresh failed", res.error ?? "Query failed");
            return chart;
          } catch {
            showErrorToast("Refresh failed", "Could not refresh chart data");
            return chart;
          }
        })
      );

      const updatedTables: DashboardTable[] = await Promise.all(
        (dashboard.tables || []).map(async (table) => {
          const sql = table.savedQuery?.trim();
          if (!sql) return table;
          try {
            const res = await executeQuery(sql);
            if (res.success) {
              return { ...table, payload: [queryResponseToResultPayload(res, sql)] };
            }
            showErrorToast("Refresh failed", res.error ?? "Query failed");
            return table;
          } catch {
            showErrorToast("Refresh failed", "Could not refresh table data");
            return table;
          }
        })
      );

      const hasUpdates =
        updatedCharts.some((c, i) => c !== dashboard.charts?.[i]) ||
        updatedTables.some((t, i) => t !== dashboard.tables?.[i]);
      if (!hasUpdates) return;

      try {
        const updatedDashboard: Dashboard = {
          ...dashboard,
          charts: updatedCharts,
          tables: updatedTables,
        };
        const apiData = convertFrontendDashboardToApi(updatedDashboard);
        const apiResponse = await updateDashboardApi(dashboardId, { data: apiData.data });
        const converted = convertApiDashboardToFrontend(apiResponse);
        setDashboards((prev) =>
          prev.map((d) => (d.id === dashboardId ? converted : d))
        );
      } catch (error) {
        console.error("Failed to save refreshed dashboard data:", error);
        showErrorToast("Error", "Failed to save refreshed data");
      }
    },
    [dashboards, executeQuery, queryResponseToResultPayload, updateDashboardApi, showErrorToast]
  );

  const getDashboardById = useCallback(
    (id: string): Dashboard | undefined => {
      return dashboards.find((d) => d.id === id);
    },
    [dashboards]
  );

  const getCurrentDashboardData = useCallback((): Dashboard | undefined => {
    if (!currentDashboard) return undefined;
    return dashboards.find((d) => d.id === currentDashboard);
  }, [currentDashboard, dashboards]);

  return (
    <DashboardContext.Provider
      value={{
        dashboards,
        currentDashboard,
        createDashboard,
        removeDashboard,
        renameDashboard,
        selectDashboard,
        addChartToDashboard,
        removeChartFromDashboard,
        updateChartType,
        addTableToDashboard,
        removeTableFromDashboard,
        getDashboardById,
        getCurrentDashboardData,
        updateDashboardLayout,
        toggleDashboardLock,
        refreshDashboardData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

// Custom hook for using the dashboard context
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};

