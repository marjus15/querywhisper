"use client";

import React, { useContext, useMemo, useCallback, useEffect, useState } from "react";
import { DashboardContext, DashboardChart, DashboardTable, ChartType } from "../components/contexts/DashboardContext";
import { MdOutlineDashboard } from "react-icons/md";
import { GoTrash } from "react-icons/go";
import { IoBarChart } from "react-icons/io5";
import { BsTable } from "react-icons/bs";
import { AiOutlineLineChart, AiOutlineAreaChart, AiOutlinePieChart } from "react-icons/ai";
import { FiLock, FiUnlock } from "react-icons/fi";
import { RiDragMove2Fill } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";

// Color palette for chart bars (same as ChartView)
const COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--highlight))",
  "hsl(var(--alt_color_a))",
  "hsl(var(--alt_color_b))",
  "hsl(var(--error))",
];

// Chart type configuration
const CHART_TYPES: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: "bar", label: "Bar Chart", icon: <IoBarChart size={14} /> },
  { type: "line", label: "Line Chart", icon: <AiOutlineLineChart size={14} /> },
  { type: "area", label: "Area Chart", icon: <AiOutlineAreaChart size={14} /> },
  { type: "pie", label: "Pie Chart", icon: <AiOutlinePieChart size={14} /> },
];

const getChartIcon = (chartType: ChartType) => {
  const config = CHART_TYPES.find((c) => c.type === chartType);
  return config?.icon || <IoBarChart size={14} />;
};

// Grid configuration
const GRID_COLS = 12;
const ROW_HEIGHT = 80;
const ITEM_WIDTH = 6; // Half of grid (2 columns layout)
const CHART_HEIGHT = 4; // 4 rows = 320px
const TABLE_HEIGHT = 4;

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background_alt border border-foreground_alt rounded-lg p-3">
        <p className="text-sm text-primary font-medium">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface DashboardChartCardProps {
  chart: DashboardChart;
  onDelete: () => void;
  onChartTypeChange: (chartType: ChartType) => void;
  isLocked: boolean;
}

interface DashboardTableCardProps {
  table: DashboardTable;
  onDelete: () => void;
  isLocked: boolean;
}

const DashboardTableCard: React.FC<DashboardTableCardProps> = ({
  table,
  onDelete,
  isLocked,
}) => {
  const tableData = useMemo(() => {
    if (!table.payload || table.payload.length === 0) return [];

    const data = table.payload[0]?.objects;
    if (!data || !Array.isArray(data)) return [];

    // Filter data to only include selected columns
    return data.map((item: any) => {
      const filtered: any = {};
      table.columns.forEach((col) => {
        filtered[col] = item[col];
      });
      return filtered;
    });
  }, [table]);

  const formatColumnName = (col: string) => {
    return col
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="bg-background_alt border border-foreground_alt rounded-lg p-4 flex flex-col gap-3 h-full">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isLocked && (
            <div className="drag-handle cursor-move bg-secondary/10 text-secondary p-1.5 rounded-md hover:bg-secondary/20">
              <RiDragMove2Fill size={14} />
            </div>
          )}
          <div className="bg-alt_color_a/10 text-alt_color_a p-1.5 rounded-md">
            <BsTable size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-primary font-medium">
              {table.columns.map(formatColumnName).slice(0, 3).join(", ")}
              {table.columns.length > 3 && ` +${table.columns.length - 3} more`}
            </span>
            <span className="text-xs text-secondary">
              {tableData.length} rows, {table.columns.length} columns
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-secondary hover:text-error hover:bg-error/10"
        >
          <GoTrash size={14} />
        </Button>
      </div>

      {/* Table Preview */}
      <div className="w-full flex-1 overflow-auto">
        {tableData.length > 0 ? (
          <table className="table-auto w-full whitespace-nowrap text-sm">
            <thead className="sticky top-0 bg-background_alt">
              <tr className="text-left text-secondary border-b border-foreground_alt">
                <th className="p-2 text-xs">#</th>
                {table.columns.map((col) => (
                  <th key={col} className="p-2 text-xs font-medium">
                    {formatColumnName(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(0, 10).map((row: any, rowIndex: number) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-foreground_alt ${
                    rowIndex % 2 === 1 ? "bg-background" : ""
                  }`}
                >
                  <td className="px-2 py-1.5 text-xs text-secondary">
                    {rowIndex + 1}
                  </td>
                  {table.columns.map((col) => (
                    <td
                      key={col}
                      className="truncate px-2 py-1.5 text-xs text-primary max-w-[150px]"
                    >
                      {row[col] !== undefined
                        ? typeof row[col] === "object"
                          ? JSON.stringify(row[col], null, 0)
                          : String(row[col])
                        : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="w-full h-full flex items-center justify-center py-8">
            <p className="text-secondary text-sm">No data available</p>
          </div>
        )}
        {tableData.length > 10 && (
          <div className="text-center py-2 text-xs text-secondary border-t border-foreground_alt">
            Showing 10 of {tableData.length} rows
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardChartCard: React.FC<DashboardChartCardProps> = ({
  chart,
  onDelete,
  onChartTypeChange,
  isLocked,
}) => {
  const currentChartType = chart.chartType || "bar";

  const transformedData = useMemo(() => {
    if (!chart.payload || chart.payload.length === 0) return [];

    const data = chart.payload[0]?.objects;
    if (!data || !Array.isArray(data)) return [];

    return data.map((item: any) => {
      const transformed: any = {
        [chart.xAxis]: item[chart.xAxis] || "N/A",
      };
      chart.yAxis.forEach((yCol) => {
        transformed[yCol] = typeof item[yCol] === "number" ? item[yCol] : 0;
      });
      return transformed;
    });
  }, [chart]);

  // Prepare pie chart data (aggregate all Y values)
  const pieData = useMemo(() => {
    if (currentChartType !== "pie" || transformedData.length === 0) return [];
    
    return transformedData.map((item: any) => ({
      name: item[chart.xAxis],
      value: chart.yAxis.reduce((sum, yCol) => sum + (item[yCol] || 0), 0),
    }));
  }, [transformedData, chart.xAxis, chart.yAxis, currentChartType]);

  const formatColumnName = (col: string) => {
    return col
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderChart = () => {
    if (transformedData.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-secondary text-sm">No data available</p>
        </div>
      );
    }

    const commonAxisProps = {
      stroke: "hsl(var(--secondary))",
      fontSize: 10,
      tick: { fill: "hsl(var(--secondary))" },
      axisLine: { stroke: "hsl(var(--foreground))", strokeOpacity: 0.2 },
    };

    switch (currentChartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={transformedData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid horizontal={true} vertical={false} stroke="hsl(var(--foreground))" strokeOpacity={0.1} />
              <XAxis dataKey={chart.xAxis} {...commonAxisProps} angle={-45} textAnchor="end" height={60} interval={0} />
              <YAxis {...commonAxisProps} tickFormatter={(value) => (typeof value === "number" ? value.toLocaleString() : value)} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "10px" }} />
              {chart.yAxis.map((yCol, idx) => (
                <Line
                  key={yCol}
                  type="monotone"
                  dataKey={yCol}
                  name={formatColumnName(yCol)}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[idx % COLORS.length], r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={transformedData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid horizontal={true} vertical={false} stroke="hsl(var(--foreground))" strokeOpacity={0.1} />
              <XAxis dataKey={chart.xAxis} {...commonAxisProps} angle={-45} textAnchor="end" height={60} interval={0} />
              <YAxis {...commonAxisProps} tickFormatter={(value) => (typeof value === "number" ? value.toLocaleString() : value)} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "10px" }} />
              {chart.yAxis.map((yCol, idx) => (
                <Area
                  key={yCol}
                  type="monotone"
                  dataKey={yCol}
                  name={formatColumnName(yCol)}
                  stroke={COLORS[idx % COLORS.length]}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={{ stroke: "hsl(var(--secondary))", strokeWidth: 1 }}
              >
                {pieData.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      case "bar":
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={transformedData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid horizontal={true} vertical={false} stroke="hsl(var(--foreground))" strokeOpacity={0.1} />
              <XAxis dataKey={chart.xAxis} {...commonAxisProps} angle={-45} textAnchor="end" height={60} interval={0} />
              <YAxis {...commonAxisProps} tickFormatter={(value) => (typeof value === "number" ? value.toLocaleString() : value)} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "10px" }} />
              {chart.yAxis.map((yCol, idx) => (
                <Bar
                  key={yCol}
                  dataKey={yCol}
                  name={formatColumnName(yCol)}
                  fill={COLORS[idx % COLORS.length]}
                  radius={[3, 3, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="bg-background_alt border border-foreground_alt rounded-lg p-4 flex flex-col gap-3 h-full">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isLocked && (
            <div className="drag-handle cursor-move bg-secondary/10 text-secondary p-1.5 rounded-md hover:bg-secondary/20">
              <RiDragMove2Fill size={14} />
            </div>
          )}
          {/* Chart Type Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="bg-accent/10 text-accent p-1.5 rounded-md h-auto hover:bg-accent/20"
              >
                {getChartIcon(currentChartType)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {CHART_TYPES.map((chartTypeOption) => (
                <DropdownMenuItem
                  key={chartTypeOption.type}
                  onClick={() => onChartTypeChange(chartTypeOption.type)}
                  className={currentChartType === chartTypeOption.type ? "bg-accent/10" : ""}
                >
                  <span className="mr-2">{chartTypeOption.icon}</span>
                  <span>{chartTypeOption.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex flex-col">
            <span className="text-sm text-primary font-medium">
              {formatColumnName(chart.xAxis)} vs{" "}
              {chart.yAxis.map(formatColumnName).join(", ")}
            </span>
            <span className="text-xs text-secondary">
              {transformedData.length} data points
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-secondary hover:text-error hover:bg-error/10"
        >
          <GoTrash size={14} />
        </Button>
      </div>

      {/* Chart */}
      <div className="w-full flex-1 min-h-0">
        {renderChart()}
      </div>
    </div>
  );
};

const DashboardsPage: React.FC = () => {
  const {
    dashboards,
    currentDashboard,
    getCurrentDashboardData,
    removeChartFromDashboard,
    removeTableFromDashboard,
    updateChartType,
    updateDashboardLayout,
    toggleDashboardLock,
    createDashboard,
  } = useContext(DashboardContext);

  const currentDashboardData = getCurrentDashboardData();
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Get container width for responsive grid
  useEffect(() => {
    const updateWidth = () => {
      // Measure from scroll container to get width excluding scrollbar
      if (scrollContainerRef.current) {
        const width = scrollContainerRef.current.clientWidth;
        if (width > 0 && width !== containerWidth) {
          setContainerWidth(width);
        }
      }
    };

    // Initial update with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateWidth, 50);
    
    // Use ResizeObserver for more reliable width updates
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateWidth);
    });
    
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    window.addEventListener("resize", updateWidth);
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [currentDashboard, containerWidth]);

  // Calculate total items (charts + tables)
  const totalItems = (currentDashboardData?.charts?.length || 0) + (currentDashboardData?.tables?.length || 0);

  // Generate default layout for items
  const generateDefaultLayout = useCallback((): Layout[] => {
    if (!currentDashboardData) return [];
    
    const layouts: Layout[] = [];
    let currentRow = 0;
    let currentCol = 0;
    
    // Add charts
    currentDashboardData.charts?.forEach((chart) => {
      layouts.push({
        i: chart.id,
        x: currentCol,
        y: currentRow,
        w: ITEM_WIDTH,
        h: CHART_HEIGHT,
        minW: 4,
        minH: 3,
      });
      currentCol += ITEM_WIDTH;
      if (currentCol >= GRID_COLS) {
        currentCol = 0;
        currentRow += CHART_HEIGHT;
      }
    });
    
    // Add tables
    currentDashboardData.tables?.forEach((table) => {
      layouts.push({
        i: table.id,
        x: currentCol,
        y: currentRow,
        w: ITEM_WIDTH,
        h: TABLE_HEIGHT,
        minW: 4,
        minH: 3,
      });
      currentCol += ITEM_WIDTH;
      if (currentCol >= GRID_COLS) {
        currentCol = 0;
        currentRow += TABLE_HEIGHT;
      }
    });
    
    return layouts;
  }, [currentDashboardData]);

  // Get current layout (from saved or generate default)
  const currentLayout = useMemo(() => {
    if (!currentDashboardData) return [];
    
    // If we have saved layouts, use them but ensure all items have a layout
    if (currentDashboardData.layouts && currentDashboardData.layouts.length > 0) {
      const savedLayouts = currentDashboardData.layouts;
      const allItemIds = [
        ...(currentDashboardData.charts?.map((c) => c.id) || []),
        ...(currentDashboardData.tables?.map((t) => t.id) || []),
      ];
      
      // Check if all items have a layout
      const layoutIds = savedLayouts.map((l) => l.i);
      const missingItems = allItemIds.filter((id) => !layoutIds.includes(id));
      
      if (missingItems.length === 0) {
        // Filter out layouts for items that no longer exist
        return savedLayouts.filter((l) => allItemIds.includes(l.i));
      }
    }
    
    return generateDefaultLayout();
  }, [currentDashboardData, generateDefaultLayout]);

  const isLocked = currentDashboardData?.isLocked || false;

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (currentDashboard && !isLocked) {
        updateDashboardLayout(currentDashboard, newLayout);
      }
    },
    [currentDashboard, isLocked, updateDashboardLayout]
  );

  const handleToggleLock = useCallback(() => {
    if (currentDashboard) {
      toggleDashboardLock(currentDashboard);
    }
  }, [currentDashboard, toggleDashboardLock]);

  // No dashboard selected
  if (!currentDashboard || !currentDashboardData) {
    return (
      <div className="flex flex-col w-full h-[calc(100vh-120px)] items-center justify-center gap-4">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-secondary/10 p-4 rounded-full">
            <MdOutlineDashboard size={48} className="text-secondary" />
          </div>
          <h1 className="text-xl font-medium text-primary">No Dashboard Selected</h1>
          <p className="text-secondary text-center max-w-md">
            {dashboards.length === 0
              ? "Create a dashboard to start adding charts from your conversations."
              : "Select a dashboard from the sidebar to view its charts."}
          </p>
          {dashboards.length === 0 && (
            <Button
              onClick={createDashboard}
              className="bg-accent/10 hover:bg-accent/20 text-accent border border-accent"
            >
              Create Dashboard
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  // Dashboard has no items (charts or tables)
  if (totalItems === 0) {
    return (
      <div className="flex flex-col w-full h-[calc(100vh-120px)] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-6 flex-shrink-0"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-accent/10 text-accent p-2 rounded-md">
            <MdOutlineDashboard size={20} />
          </div>
          <h1 className="text-xl font-medium text-primary">
            {currentDashboardData.title}
          </h1>
        </motion.div>

        {/* Empty state */}
        <div className="flex flex-col flex-1 items-center justify-center gap-4">
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-secondary/10 p-4 rounded-full">
              <IoBarChart size={40} className="text-secondary" />
            </div>
            <h2 className="text-lg font-medium text-primary">No Items Yet</h2>
            <p className="text-secondary text-center max-w-md">
              Add charts or tables to this dashboard by clicking the + button in the Chart View
              or Table View of any conversation.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Dashboard with items
  const chartsCount = currentDashboardData.charts?.length || 0;
  const tablesCount = currentDashboardData.tables?.length || 0;

  // Build count string
  const getItemCountString = () => {
    const parts = [];
    if (chartsCount > 0) {
      parts.push(`${chartsCount} chart${chartsCount !== 1 ? "s" : ""}`);
    }
    if (tablesCount > 0) {
      parts.push(`${tablesCount} table${tablesCount !== 1 ? "s" : ""}`);
    }
    return parts.join(", ");
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-120px)] overflow-hidden">
      {/* Header - Fixed */}
      <motion.div
        className="flex items-center justify-between mb-4 flex-shrink-0"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-accent/10 text-accent p-2 rounded-md">
            <MdOutlineDashboard size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-medium text-primary">
              {currentDashboardData.title}
            </h1>
            <span className="text-sm text-secondary">
              {getItemCountString()}
            </span>
          </div>
        </div>
        
        {/* Lock/Unlock Button */}
        <Button
          variant="ghost"
          onClick={handleToggleLock}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            isLocked
              ? "bg-accent/10 text-accent border border-accent hover:bg-accent/20"
              : "bg-secondary/10 text-secondary border border-secondary/30 hover:bg-secondary/20"
          }`}
        >
          {isLocked ? (
            <>
              <FiLock size={16} />
              <span className="text-sm">Locked</span>
            </>
          ) : (
            <>
              <FiUnlock size={16} />
              <span className="text-sm">Unlocked</span>
            </>
          )}
        </Button>
      </motion.div>

      {/* Grid hint when unlocked - Fixed */}
      {!isLocked && (
        <motion.div
          className="mb-4 px-3 py-2 bg-highlight/10 border border-highlight/20 rounded-md flex items-center gap-2 flex-shrink-0"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <RiDragMove2Fill size={16} className="text-highlight" />
          <span className="text-sm text-highlight">
            Drag items to rearrange. Resize by dragging corners. Click "Locked" to save positions.
          </span>
        </motion.div>
      )}

      {/* Scrollable Grid Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div 
          className={`relative w-full pb-8 ${!isLocked ? "dashboard-grid-unlocked" : ""}`}
          style={{
            backgroundImage: !isLocked
              ? `
                linear-gradient(to right, hsl(var(--foreground) / 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--foreground) / 0.05) 1px, transparent 1px)
              `
              : "none",
            backgroundSize: !isLocked && containerWidth > 0 ? `${containerWidth / GRID_COLS}px ${ROW_HEIGHT}px` : "auto",
          }}
        >
          {containerWidth > 0 && (
            <GridLayout
              className="layout"
              layout={currentLayout}
              cols={GRID_COLS}
              rowHeight={ROW_HEIGHT}
              width={containerWidth}
              onLayoutChange={handleLayoutChange}
              isDraggable={!isLocked}
              isResizable={!isLocked}
              draggableHandle=".drag-handle"
              margin={[16, 16]}
              containerPadding={[0, 0]}
              useCSSTransforms={true}
              autoSize={true}
            >
              {/* Render Charts */}
              {currentDashboardData.charts?.map((chart) => (
                <div key={chart.id}>
                  <DashboardChartCard
                    chart={chart}
                    onDelete={() => removeChartFromDashboard(currentDashboard, chart.id)}
                    onChartTypeChange={(chartType) => updateChartType(currentDashboard, chart.id, chartType)}
                    isLocked={isLocked}
                  />
                </div>
              ))}
              {/* Render Tables */}
              {currentDashboardData.tables?.map((table) => (
                <div key={table.id}>
                  <DashboardTableCard
                    table={table}
                    onDelete={() => removeTableFromDashboard(currentDashboard, table.id)}
                    isLocked={isLocked}
                  />
                </div>
              ))}
            </GridLayout>
          )}
        </div>
      </div>

      <style jsx global>{`
        .react-grid-layout {
          position: relative;
          width: 100% !important;
        }
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        .react-grid-item.react-grid-placeholder {
          background: hsl(var(--accent) / 0.2) !important;
          border: 2px dashed hsl(var(--accent)) !important;
          border-radius: 8px;
        }
        .react-grid-item > .react-resizable-handle {
          background-image: none !important;
        }
        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 5px;
          bottom: 5px;
          width: 10px;
          height: 10px;
          border-right: 2px solid hsl(var(--secondary) / 0.5);
          border-bottom: 2px solid hsl(var(--secondary) / 0.5);
        }
        .dashboard-grid-unlocked .react-grid-item:hover > .react-resizable-handle::after {
          border-color: hsl(var(--accent));
        }
      `}</style>
    </div>
  );
};

export default DashboardsPage;
