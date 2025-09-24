"use client";

import { ReactFlowProvider } from "@xyflow/react";
import DatabaseSchemaVisualization from "../components/explorer/DatabaseSchemaVisualization";

export default function DataPage() {
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <ReactFlowProvider>
        <DatabaseSchemaVisualization className="h-full" />
      </ReactFlowProvider>
    </div>
  );
}
