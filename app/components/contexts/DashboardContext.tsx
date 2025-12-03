"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ResultPayload } from "@/app/types/chat";
import { ToastContext } from "./ToastContext";

// Types
export interface DashboardChart {
  id: string;
  payload: ResultPayload[];
  xAxis: string;
  yAxis: string[];
  addedAt: string; // ISO string for JSON serialization
  title?: string;
}

export interface Dashboard {
  id: string;
  title: string;
  createdAt: string; // ISO string for JSON serialization
  charts: DashboardChart[];
}

interface DashboardContextType {
  dashboards: Dashboard[];
  currentDashboard: string | null;
  createDashboard: () => Dashboard;
  removeDashboard: (id: string) => void;
  renameDashboard: (id: string, newTitle: string) => void;
  selectDashboard: (id: string) => void;
  addChartToDashboard: (
    dashboardId: string,
    chart: Omit<DashboardChart, "id" | "addedAt">
  ) => void;
  removeChartFromDashboard: (dashboardId: string, chartId: string) => void;
  getDashboardById: (id: string) => Dashboard | undefined;
  getCurrentDashboardData: () => Dashboard | undefined;
}

const STORAGE_KEY = "querywhisper_dashboards";
const COUNTER_KEY = "querywhisper_dashboard_counter";

export const DashboardContext = createContext<DashboardContextType>({
  dashboards: [],
  currentDashboard: null,
  createDashboard: () => ({ id: "", title: "", createdAt: "", charts: [] }),
  removeDashboard: () => {},
  renameDashboard: () => {},
  selectDashboard: () => {},
  addChartToDashboard: () => {},
  removeChartFromDashboard: () => {},
  getDashboardById: () => undefined,
  getCurrentDashboardData: () => undefined,
});

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<string | null>(null);
  const [dashboardCounter, setDashboardCounter] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  const { showSuccessToast } = useContext(ToastContext);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedCounter = localStorage.getItem(COUNTER_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as Dashboard[];
        setDashboards(parsed);
      }

      if (storedCounter) {
        setDashboardCounter(parseInt(storedCounter, 10));
      }
    } catch (error) {
      console.error("Failed to load dashboards from localStorage:", error);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage when dashboards change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
      } catch (error) {
        console.error("Failed to save dashboards to localStorage:", error);
      }
    }
  }, [dashboards, isInitialized]);

  // Save counter to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(COUNTER_KEY, dashboardCounter.toString());
      } catch (error) {
        console.error("Failed to save dashboard counter to localStorage:", error);
      }
    }
  }, [dashboardCounter, isInitialized]);

  const createDashboard = useCallback((): Dashboard => {
    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      title: `Dashboard ${dashboardCounter}`,
      createdAt: new Date().toISOString(),
      charts: [],
    };

    setDashboards((prev) => [newDashboard, ...prev]);
    setCurrentDashboard(newDashboard.id);
    setDashboardCounter((prev) => prev + 1);

    return newDashboard;
  }, [dashboardCounter]);

  const removeDashboard = useCallback((id: string) => {
    setDashboards((prev) => prev.filter((d) => d.id !== id));
    setCurrentDashboard((prev) => (prev === id ? null : prev));
  }, []);

  const renameDashboard = useCallback((id: string, newTitle: string) => {
    setDashboards((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title: newTitle } : d))
    );
  }, []);

  const selectDashboard = useCallback((id: string) => {
    setCurrentDashboard(id);
  }, []);

  const addChartToDashboard = useCallback(
    (dashboardId: string, chart: Omit<DashboardChart, "id" | "addedAt">) => {
      const newChart: DashboardChart = {
        ...chart,
        id: `chart-${Date.now()}`,
        addedAt: new Date().toISOString(),
      };

      setDashboards((prev) =>
        prev.map((d) =>
          d.id === dashboardId
            ? { ...d, charts: [...d.charts, newChart] }
            : d
        )
      );

      const dashboard = dashboards.find((d) => d.id === dashboardId);
      if (dashboard) {
        showSuccessToast("Chart added", `Chart added to "${dashboard.title}"`);
      }
    },
    [dashboards, showSuccessToast]
  );

  const removeChartFromDashboard = useCallback(
    (dashboardId: string, chartId: string) => {
      setDashboards((prev) =>
        prev.map((d) =>
          d.id === dashboardId
            ? { ...d, charts: d.charts.filter((c) => c.id !== chartId) }
            : d
        )
      );
    },
    []
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
        getDashboardById,
        getCurrentDashboardData,
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

