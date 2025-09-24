"use client";

import React, { useContext, useState } from "react";
import { useDatabase } from "../contexts/DatabaseContext";
import DatabaseTableCard from "./DatabaseTableCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IoIosRefresh } from "react-icons/io";
import { IoWarningOutline } from "react-icons/io5";
import { LuDatabase } from "react-icons/lu";
import { RiFilePaperLine } from "react-icons/ri";
import { motion } from "framer-motion";

const DatabaseDashboard: React.FC = () => {
  const { tables, loadingTables, error, refreshDatabase } = useDatabase();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const handleViewTable = (tableName: string) => {
    setSelectedTable(tableName);
    // TODO: Navigate to table view or open modal
    console.log("View table:", tableName);
  };

  const isLoading = loadingTables;

  return (
    <div className="flex w-full flex-col gap-2 min-h-0 items-center justify-start h-full fade-in">
      {/* Title */}
      <div className="flex mb-2 w-full justify-start">
        <p className="text-lg text-primary">Database Dashboard</p>
      </div>

      <div className="flex flex-col w-full md:w-[60vw] lg:w-[40vw] gap-6 h-full">
        {/* KPI Cards */}
        <div className="flex flex-col gap-2 w-full rounded-md">
          <div className="flex flex-row gap-2 w-full">
            <div className="flex-1 p-4 rounded-lg border border-border bg-background">
              <div className="flex items-center gap-3">
                <LuDatabase size={20} className="text-accent" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {isLoading ? "..." : tables.length}
                  </p>
                  <p className="text-sm text-white/70">Database Tables</p>
                </div>
              </div>
            </div>
            {/* <div className="flex-1 p-4 rounded-lg border border-border bg-background">
              <div className="flex items-center gap-3">
                <RiFilePaperLine size={20} className="text-highlight" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {isLoading ? "..." : tables.length}
                  </p>
                  <p className="text-sm text-white/70">Database Tables</p>
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <IoWarningOutline className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Control Bar */}
        <div className="flex w-full items-center justify-between">
          <p className="text-primary text-sm">Database Schema</p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.2,
              duration: 0.3,
              type: "tween",
              stiffness: 250,
            }}
            className="flex flex-row gap-2 items-center px-1"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={refreshDatabase}
                    disabled={isLoading}
                    className="border border-accent text-accent bg-accent/10 w-10 h-10"
                  >
                    <IoIosRefresh
                      size={16}
                      className={isLoading ? "animate-spin" : ""}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh database schema</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        </div>

        {/* Database Tables */}
        <div className="flex flex-col gap-3 w-full flex-1 min-h-0 mb-16 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2 w-full fade-in">
              <Skeleton className="w-full h-[200px] rounded-md" />
              <Skeleton className="w-full h-[200px] rounded-md" />
              <Skeleton className="w-full h-[200px] rounded-md" />
            </div>
          ) : tables.length > 0 ? (
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              {tables.map((table) => (
                <DatabaseTableCard
                  key={table.name}
                  table={table}
                  onViewTable={handleViewTable}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-secondary text-sm">
              No database tables found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseDashboard;
