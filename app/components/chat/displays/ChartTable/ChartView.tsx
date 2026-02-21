"use client";

import React, { useState, useMemo, useContext } from "react";
import { ResultPayload } from "@/app/types/chat";
import { Button } from "@/components/ui/button";
import { IoClose } from "react-icons/io5";
import { IoBarChart } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineDashboard } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DashboardContext } from "@/app/components/contexts/DashboardContext";

interface ChartViewProps {
  payload: ResultPayload[];
  handleViewChange: (
    view: "chat" | "code" | "result" | "chart" | "table",
    payload: ResultPayload[] | null
  ) => void;
}

// Color palette for chart bars
const COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--highlight))",
  "hsl(var(--alt_color_a))",
  "hsl(var(--alt_color_b))",
  "hsl(var(--error))",
];

// Recharts tooltip payload entry
interface TooltipEntry {
  dataKey?: string;
  value?: string | number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background_alt border border-foreground_alt rounded-lg p-3">
        <p className="text-sm text-primary font-medium">{`${label}`}</p>
        {payload.map((entry: TooltipEntry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChartView: React.FC<ChartViewProps> = ({ payload, handleViewChange }) => {
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isAddHovered, setIsAddHovered] = useState(false);
  const [selectedXAxis, setSelectedXAxis] = useState<string>("");
  const [selectedYAxis, setSelectedYAxis] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState("");

  const { dashboards, addChartToDashboard, createDashboard } =
    useContext(DashboardContext);

  // Analyze the data to find suitable columns for visualization
  const { chartData, numericColumns, categoryColumns } = useMemo(() => {
    if (!payload || payload.length === 0) {
      return { chartData: [], columns: [], numericColumns: [], categoryColumns: [] };
    }

    // Get data from the first payload
    const data = payload[0]?.objects;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { chartData: [], columns: [], numericColumns: [], categoryColumns: [] };
    }

    // Get all columns from the first object
    const firstObj = data[0] as Record<string, unknown>;
    if (typeof firstObj !== "object" || firstObj === null) {
      return { chartData: [], columns: [], numericColumns: [], categoryColumns: [] };
    }

    const allColumns = Object.keys(firstObj).filter(
      (key) => !key.startsWith("_") && key !== "uuid"
    );

    // Separate numeric and category columns
    const numeric: string[] = [];
    const category: string[] = [];

    allColumns.forEach((col) => {
      const value = firstObj[col];
      if (typeof value === "number") {
        numeric.push(col);
      } else {
        category.push(col);
      }
    });

    return {
      chartData: data,
      columns: allColumns,
      numericColumns: numeric,
      categoryColumns: category,
    };
  }, [payload]);

  // Auto-select columns on mount
  useMemo(() => {
    if (categoryColumns.length > 0 && !selectedXAxis) {
      // Prefer name-like columns for X axis
      const preferredXAxis = categoryColumns.find((col) =>
        /name|title|date|category|type|status/i.test(col)
      );
      setSelectedXAxis(preferredXAxis || categoryColumns[0]);
    }
    if (numericColumns.length > 0 && selectedYAxis.length === 0) {
      // Select first numeric column by default
      setSelectedYAxis([numericColumns[0]]);
    }
  }, [categoryColumns, numericColumns, selectedXAxis, selectedYAxis.length]);

  // Transform data for the chart
  const transformedData = useMemo(() => {
    if (!chartData || chartData.length === 0 || !selectedXAxis) return [];

    return chartData.map((item) => {
      const row = item as Record<string, unknown>;
      const transformed: Record<string, unknown> = {
        [selectedXAxis]: row[selectedXAxis] || "N/A",
      };
      selectedYAxis.forEach((yCol) => {
        transformed[yCol] = typeof row[yCol] === "number" ? row[yCol] : 0;
      });
      return transformed;
    });
  }, [chartData, selectedXAxis, selectedYAxis]);

  const toggleYAxis = (column: string) => {
    setSelectedYAxis((prev) => {
      if (prev.includes(column)) {
        return prev.filter((c) => c !== column);
      } else if (prev.length < 3) {
        // Limit to 3 series
        return [...prev, column];
      }
      return prev;
    });
  };

  const formatColumnName = (col: string) => {
    return col
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8">
        <p className="text-secondary">No data available for visualization</p>
        <Button
          variant="ghost"
          onClick={() => handleViewChange("chat", null)}
          className="mt-4"
        >
          Back to chat
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 chat-animation">
      {/* Header */}
      <motion.div
        className="w-full flex gap-2 justify-between items-center"
        initial={{ y: 20, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          delay: 0.1,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="bg-accent/10 text-accent border border-accent/20 p-2 rounded-md">
            <IoBarChart size={16} />
          </div>
          <span className="text-primary font-medium">Chart View</span>
          <span className="text-secondary text-sm">
            ({chartData.length} data points)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Add to Dashboard Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                onHoverStart={() => setIsAddHovered(true)}
                onHoverEnd={() => setIsAddHovered(false)}
                initial={{ width: "2.5rem", y: 15, opacity: 0 }}
                animate={{
                  width: isAddHovered ? "auto" : "2.5rem",
                  y: 0,
                  opacity: 1,
                }}
                transition={{
                  width: { duration: 0.3, ease: "easeInOut" },
                  y: { type: "spring", stiffness: 300, damping: 20, delay: 0.15 },
                  opacity: { duration: 0.2, delay: 0.15 },
                }}
                className="overflow-hidden"
              >
                <Button
                  variant="ghost"
                  className={`h-8 rounded-md flex items-center gap-2 px-2 whitespace-nowrap transition-colors duration-200 ${
                    isAddHovered
                      ? "bg-accent/10 hover:bg-accent/20 text-accent border border-accent"
                      : "bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30"
                  }`}
                >
                  <FaPlus
                    size={12}
                    className={`flex-shrink-0 transition-colors duration-200 ${
                      isAddHovered ? "text-accent" : "text-secondary"
                    }`}
                  />
                  <AnimatePresence>
                    {isAddHovered && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="text-accent text-xs"
                      >
                        Add to Dashboard
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {dashboards.length > 0 ? (
                <>
                  {dashboards.map((dashboard) => (
                    <DropdownMenuItem
                      key={dashboard.id}
                      onClick={async () => {
                        if (selectedXAxis && selectedYAxis.length > 0) {
                          await addChartToDashboard(dashboard.id, {
                            payload,
                            xAxis: selectedXAxis,
                            yAxis: selectedYAxis,
                          });
                        }
                      }}
                      disabled={!selectedXAxis || selectedYAxis.length === 0}
                    >
                      <MdOutlineDashboard className="mr-2" />
                      <span className="truncate">{dashboard.title}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem
                onClick={() => {
                  setDashboardTitle("");
                  setTimeout(() => {
                    setCreateDialogOpen(true);
                  }, 100);
                }}
                disabled={!selectedXAxis || selectedYAxis.length === 0}
              >
                <FaPlus className="mr-2" />
                <span>Create new dashboard</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close Button */}
          <motion.div
            onHoverStart={() => setIsCloseHovered(true)}
            onHoverEnd={() => setIsCloseHovered(false)}
            initial={{ width: "2.5rem", y: 15, opacity: 0 }}
            animate={{
              width: isCloseHovered ? "auto" : "2.5rem",
              y: 0,
              opacity: 1,
            }}
            transition={{
              width: { duration: 0.3, ease: "easeInOut" },
              y: { type: "spring", stiffness: 300, damping: 20, delay: 0.2 },
              opacity: { duration: 0.2, delay: 0.2 },
            }}
            className="overflow-hidden"
          >
            <Button
              variant="ghost"
              onClick={() => handleViewChange("chat", null)}
              className={`h-8 rounded-md flex items-center gap-2 px-2 whitespace-nowrap transition-colors duration-200 ${
                isCloseHovered
                  ? "bg-error/10 hover:bg-error/20 text-error border border-error"
                  : "bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30"
              }`}
            >
              <IoClose
                size={12}
                className={`flex-shrink-0 transition-colors duration-200 ${
                  isCloseHovered ? "text-error" : "text-secondary"
                }`}
              />
              <AnimatePresence>
                {isCloseHovered && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="text-error text-xs"
                  >
                    Back to chat
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <Separator />

      {/* Column Selectors */}
      <motion.div
        className="flex flex-wrap gap-4"
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* X-Axis Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-secondary uppercase tracking-wide">
            X-Axis (Category)
          </span>
          <div className="flex flex-wrap gap-1">
            {categoryColumns.map((col) => (
              <Button
                key={col}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedXAxis(col)}
                className={`text-xs h-7 ${
                  selectedXAxis === col
                    ? "bg-accent/20 text-accent border border-accent"
                    : "bg-secondary/10 text-secondary hover:bg-secondary/20"
                }`}
              >
                {formatColumnName(col)}
              </Button>
            ))}
          </div>
        </div>

        {/* Y-Axis Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-secondary uppercase tracking-wide">
            Y-Axis (Values) - Select up to 3
          </span>
          <div className="flex flex-wrap gap-1">
            {numericColumns.map((col) => (
              <Button
                key={col}
                variant="ghost"
                size="sm"
                onClick={() => toggleYAxis(col)}
                className={`text-xs h-7 ${
                  selectedYAxis.includes(col)
                    ? "bg-highlight/20 text-highlight border border-highlight"
                    : "bg-secondary/10 text-secondary hover:bg-secondary/20"
                }`}
              >
                {formatColumnName(col)}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      <Separator />

      {/* Chart */}
      <motion.div
        className="w-full bg-background rounded-lg p-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {transformedData.length > 0 && selectedYAxis.length > 0 ? (
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={transformedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid
                  horizontal={true}
                  vertical={false}
                  stroke="hsl(var(--foreground))"
                  strokeOpacity={0.1}
                />
                <XAxis
                  dataKey={selectedXAxis}
                  stroke="hsl(var(--secondary))"
                  fontSize={11}
                  tick={{ fill: "hsl(var(--secondary))" }}
                  axisLine={{ stroke: "hsl(var(--foreground))", strokeOpacity: 0.2 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  stroke="hsl(var(--secondary))"
                  fontSize={11}
                  tick={{ fill: "hsl(var(--secondary))" }}
                  axisLine={{ stroke: "hsl(var(--foreground))", strokeOpacity: 0.2 }}
                  tickFormatter={(value) =>
                    typeof value === "number" ? value.toLocaleString() : value
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                  }}
                />
                {selectedYAxis.map((yCol, index) => (
                  <Bar
                    key={yCol}
                    dataKey={yCol}
                    name={formatColumnName(yCol)}
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full h-[300px] flex items-center justify-center">
            <p className="text-secondary">
              Select at least one Y-axis column to display the chart
            </p>
          </div>
        )}
      </motion.div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create Dashboard</DialogTitle>
            <DialogDescription>
              Enter a name for your new dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={dashboardTitle}
              onChange={(e) => setDashboardTitle(e.target.value)}
              placeholder="Dashboard name"
              maxLength={200}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && dashboardTitle.trim()) {
                  e.preventDefault();
                  const newDashboard = await createDashboard(dashboardTitle.trim());
                  setCreateDialogOpen(false);
                  setDashboardTitle("");
                  if (selectedXAxis && selectedYAxis.length > 0) {
                    await addChartToDashboard(newDashboard.id, {
                      payload,
                      xAxis: selectedXAxis,
                      yAxis: selectedYAxis,
                    }, newDashboard);
                  }
                } else if (e.key === "Escape") {
                  setCreateDialogOpen(false);
                  setDashboardTitle("");
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false);
              setDashboardTitle("");
            }}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (dashboardTitle.trim()) {
                const newDashboard = await createDashboard(dashboardTitle.trim());
                setCreateDialogOpen(false);
                setDashboardTitle("");
                if (selectedXAxis && selectedYAxis.length > 0) {
                  await addChartToDashboard(newDashboard.id, {
                    payload,
                    xAxis: selectedXAxis,
                    yAxis: selectedYAxis,
                  }, newDashboard);
                }
              }
            }} disabled={!dashboardTitle.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChartView;

