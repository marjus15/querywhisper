"use client";

import React, { useState, useMemo, useContext } from "react";
import { ResultPayload } from "@/app/types/chat";
import { Button } from "@/components/ui/button";
import { IoClose } from "react-icons/io5";
import { BsTable } from "react-icons/bs";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineDashboard } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DashboardContext } from "@/app/components/contexts/DashboardContext";
import DataTable from "@/app/components/explorer/DataTable";

interface TableViewProps {
  payload: ResultPayload[];
  handleViewChange: (
    view: "chat" | "code" | "result" | "chart" | "table",
    payload: ResultPayload[] | null
  ) => void;
}

const TableView: React.FC<TableViewProps> = ({ payload, handleViewChange }) => {
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isAddHovered, setIsAddHovered] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const { dashboards, addTableToDashboard, createDashboard } =
    useContext(DashboardContext);

  // Analyze the data to find all columns
  const { tableData, columns } = useMemo(() => {
    if (!payload || payload.length === 0) {
      return { tableData: [], columns: [] };
    }

    // Get data from the first payload
    const data = payload[0]?.objects;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { tableData: [], columns: [] };
    }

    // Get all columns from the first object
    const firstObj = data[0];
    if (typeof firstObj !== "object" || firstObj === null) {
      return { tableData: [], columns: [] };
    }

    const allColumns = Object.keys(firstObj).filter(
      (key) => !key.startsWith("_") && key !== "uuid"
    );

    return {
      tableData: data,
      columns: allColumns,
    };
  }, [payload]);

  // Auto-select all columns on mount
  useMemo(() => {
    if (columns.length > 0 && selectedColumns.length === 0) {
      setSelectedColumns(columns);
    }
  }, [columns, selectedColumns.length]);

  // Transform data based on selected columns
  const filteredData = useMemo(() => {
    if (!tableData || tableData.length === 0 || selectedColumns.length === 0) return [];

    return tableData.map((item: any) => {
      const filtered: any = {};
      selectedColumns.forEach((col) => {
        filtered[col] = item[col];
      });
      return filtered;
    });
  }, [tableData, selectedColumns]);

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(column)) {
        // Don't allow removing the last column
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== column);
      } else {
        return [...prev, column];
      }
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

  if (!tableData || tableData.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8">
        <p className="text-secondary">No data available for table</p>
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
          <div className="bg-alt_color_a/10 text-alt_color_a border border-alt_color_a/20 p-2 rounded-md">
            <BsTable size={16} />
          </div>
          <span className="text-primary font-medium">Table View</span>
          <span className="text-secondary text-sm">
            ({tableData.length} rows, {selectedColumns.length} columns)
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
                      ? "bg-alt_color_a/10 hover:bg-alt_color_a/20 text-alt_color_a border border-alt_color_a"
                      : "bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30"
                  }`}
                >
                  <FaPlus
                    size={12}
                    className={`flex-shrink-0 transition-colors duration-200 ${
                      isAddHovered ? "text-alt_color_a" : "text-secondary"
                    }`}
                  />
                  <AnimatePresence>
                    {isAddHovered && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="text-alt_color_a text-xs"
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
                      onClick={() => {
                        if (selectedColumns.length > 0) {
                          addTableToDashboard(dashboard.id, {
                            payload,
                            columns: selectedColumns,
                          });
                        }
                      }}
                      disabled={selectedColumns.length === 0}
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
                  const newDashboard = createDashboard();
                  if (selectedColumns.length > 0) {
                    addTableToDashboard(newDashboard.id, {
                      payload,
                      columns: selectedColumns,
                    });
                  }
                }}
                disabled={selectedColumns.length === 0}
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
        <div className="flex flex-col gap-2">
          <span className="text-xs text-secondary uppercase tracking-wide">
            Columns to Include
          </span>
          <div className="flex flex-wrap gap-1">
            {columns.map((col) => (
              <Button
                key={col}
                variant="ghost"
                size="sm"
                onClick={() => toggleColumn(col)}
                className={`text-xs h-7 ${
                  selectedColumns.includes(col)
                    ? "bg-alt_color_a/20 text-alt_color_a border border-alt_color_a"
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

      {/* Table Preview */}
      <motion.div
        className="w-full bg-background rounded-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {filteredData.length > 0 && selectedColumns.length > 0 ? (
          <DataTable
            data={filteredData}
            header={filteredData[0] || {}}
            stickyHeaders={true}
            maxHeight="50vh"
          />
        ) : (
          <div className="w-full h-[200px] flex items-center justify-center">
            <p className="text-secondary">
              Select at least one column to display the table
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TableView;

