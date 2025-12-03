"use client";

import React, { useContext, useMemo } from "react";
import { DashboardContext, DashboardChart } from "../components/contexts/DashboardContext";
import { MdOutlineDashboard } from "react-icons/md";
import { GoTrash } from "react-icons/go";
import { IoBarChart } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
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

// Color palette for chart bars (same as ChartView)
const COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--highlight))",
  "hsl(var(--alt_color_a))",
  "hsl(var(--alt_color_b))",
  "hsl(var(--error))",
];

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
  index: number;
}

const DashboardChartCard: React.FC<DashboardChartCardProps> = ({
  chart,
  onDelete,
  index,
}) => {
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

  const formatColumnName = (col: string) => {
    return col
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <motion.div
      className="bg-background_alt border border-foreground_alt rounded-lg p-4 flex flex-col gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-accent/10 text-accent p-1.5 rounded-md">
            <IoBarChart size={14} />
          </div>
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
      <div className="w-full h-[250px]">
        {transformedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={transformedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
            >
              <CartesianGrid
                horizontal={true}
                vertical={false}
                stroke="hsl(var(--foreground))"
                strokeOpacity={0.1}
              />
              <XAxis
                dataKey={chart.xAxis}
                stroke="hsl(var(--secondary))"
                fontSize={10}
                tick={{ fill: "hsl(var(--secondary))" }}
                axisLine={{ stroke: "hsl(var(--foreground))", strokeOpacity: 0.2 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis
                stroke="hsl(var(--secondary))"
                fontSize={10}
                tick={{ fill: "hsl(var(--secondary))" }}
                axisLine={{ stroke: "hsl(var(--foreground))", strokeOpacity: 0.2 }}
                tickFormatter={(value) =>
                  typeof value === "number" ? value.toLocaleString() : value
                }
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  paddingTop: "10px",
                  fontSize: "10px",
                }}
              />
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
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-secondary text-sm">No data available</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const DashboardsPage: React.FC = () => {
  const {
    dashboards,
    currentDashboard,
    getCurrentDashboardData,
    removeChartFromDashboard,
    createDashboard,
  } = useContext(DashboardContext);

  const currentDashboardData = getCurrentDashboardData();

  // No dashboard selected
  if (!currentDashboard || !currentDashboardData) {
    return (
      <div className="flex flex-col w-full h-full items-center justify-center gap-4">
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

  // Dashboard has no charts
  if (currentDashboardData.charts.length === 0) {
    return (
      <div className="flex flex-col w-full h-full overflow-auto">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-6"
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
            <h2 className="text-lg font-medium text-primary">No Charts Yet</h2>
            <p className="text-secondary text-center max-w-md">
              Add charts to this dashboard by clicking the + button in the Chart View
              of any conversation.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Dashboard with charts
  return (
    <div className="flex flex-col w-full h-full overflow-auto">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-accent/10 text-accent p-2 rounded-md">
          <MdOutlineDashboard size={20} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-medium text-primary">
            {currentDashboardData.title}
          </h1>
          <span className="text-sm text-secondary">
            {currentDashboardData.charts.length} chart
            {currentDashboardData.charts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
        {currentDashboardData.charts.map((chart, index) => (
          <DashboardChartCard
            key={chart.id}
            chart={chart}
            index={index}
            onDelete={() =>
              removeChartFromDashboard(currentDashboard, chart.id)
            }
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardsPage;
