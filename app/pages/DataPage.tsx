"use client";

import { useContext } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { motion } from "framer-motion";
import DatabaseSchemaVisualization from "../components/explorer/DatabaseSchemaVisualization";
import { ConnectionContext } from "../components/contexts/ConnectionContext";
import { RouterContext } from "../components/contexts/RouterContext";
import { Button } from "@/components/ui/button";
import { HiOutlineDatabase, HiOutlinePlus, HiOutlineRefresh } from "react-icons/hi";

export default function DataPage() {
  const { connections, isLoading } = useContext(ConnectionContext);
  const { changePage } = useContext(RouterContext);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col w-full h-screen overflow-hidden items-center justify-center">
        <HiOutlineRefresh size={48} className="animate-spin text-secondary mb-4" />
        <p className="text-secondary">Loading connections...</p>
      </div>
    );
  }

  // If no connections, prompt user to add one
  if (connections.length === 0) {
    return (
      <div className="flex flex-col w-full h-screen overflow-hidden items-center justify-center">
        <motion.div
          className="flex flex-col items-center text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-secondary/10 p-8 rounded-full mb-6">
            <HiOutlineDatabase size={64} className="text-secondary" />
          </div>
          <h2 className="text-2xl font-semibold text-primary mb-3">
            No Database Connected
          </h2>
          <p className="text-secondary mb-6">
            Connect your database to visualize your schema and start asking questions in natural language.
          </p>
          <Button 
            onClick={() => changePage("connections", {}, true, false)}
            className="flex items-center gap-2"
          >
            <HiOutlinePlus size={18} />
            Connect Your Database
          </Button>
        </motion.div>
      </div>
    );
  }

  // Has connections - show the schema visualization
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <ReactFlowProvider>
        <DatabaseSchemaVisualization className="h-full" />
      </ReactFlowProvider>
    </div>
  );
}
