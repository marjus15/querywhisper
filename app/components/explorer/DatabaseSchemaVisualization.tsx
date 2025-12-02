"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionLineType,
  Position,
  ReactFlowInstance,
  Background,
  Controls,
  MiniMap,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { 
  getSchemaInfo, 
  getSchemaStatus, 
  refreshSchemaFromBackend,
  TableInfo, 
  SchemaStatusResponse 
} from "@/app/api/getSchemaInfo";
import { motion } from "framer-motion";
import { TbDatabase, TbKey, TbLink, TbEye, TbEyeOff, TbRefresh, TbCircleFilled } from "react-icons/tb";
import { HiOutlineSparkles } from "react-icons/hi2";

interface TableNodeData {
  tableInfo: TableInfo;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

interface DatabaseSchemaVisualizationProps {
  className?: string;
}

const TableNode: React.FC<{
  data: TableNodeData;
  selected: boolean;
}> = ({ data, selected }) => {
  const { tableInfo, isExpanded, onToggleExpanded } = data;

  return (
    <motion.div
      className={`bg-background border-2 rounded-lg shadow-lg min-w-[280px] max-w-[320px] transition-all duration-200 relative ${
        selected
          ? "border-accent shadow-accent/20"
          : "border-foreground/20 hover:border-foreground/40"
      }`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ReactFlow Handles for connections */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "#3b82f6",
          width: 10,
          height: 10,
          border: "2px solid white",
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "#10b981",
          width: 10,
          height: 10,
          border: "2px solid white",
        }}
      />
      {/* Table Header */}
      <div className="bg-foreground/5 px-4 py-3 border-b border-foreground/10 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TbDatabase className="text-accent" size={16} />
            <h3 className="font-semibold text-primary text-sm">
              {tableInfo.name}
            </h3>
          </div>
          <button
            onClick={onToggleExpanded}
            className="p-1 hover:bg-foreground/10 rounded transition-colors"
          >
            {isExpanded ? (
              <TbEyeOff size={14} className="text-gray-300" />
            ) : (
              <TbEye size={14} className="text-gray-300" />
            )}
          </button>
        </div>
        {tableInfo.description && (
          <p className="text-xs text-gray-300 mt-1 line-clamp-2">
            {tableInfo.description}
          </p>
        )}
      </div>

      {/* Table Columns */}
      {isExpanded && (
        <motion.div
          className="p-3 space-y-2 max-h-[400px] overflow-y-auto"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tableInfo.columns.map((column, index) => (
            <motion.div
              key={column.name}
              className="flex items-center gap-2 text-xs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center gap-1 min-w-0 flex-1">
                {column.is_primary_key && (
                  <TbKey className="text-yellow-500 flex-shrink-0" size={12} />
                )}
                {column.is_foreign_key && (
                  <TbLink className="text-blue-500 flex-shrink-0" size={12} />
                )}
                <span
                  className={`font-medium truncate ${
                    column.is_primary_key
                      ? "text-yellow-600"
                      : column.is_foreign_key
                        ? "text-blue-600"
                        : "text-primary"
                  }`}
                >
                  {column.name}
                </span>
              </div>
              <span className="text-foreground/50 text-xs flex-shrink-0">
                {column.data_type}
              </span>
              {!column.is_nullable && (
                <span className="text-red-500 text-xs flex-shrink-0">*</span>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Table Footer */}
      <div className="px-4 py-2 border-t border-foreground/10 bg-foreground/5 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span>{tableInfo.columns.length} columns</span>
          <span>{tableInfo.relationships.length} relationships</span>
        </div>
        {tableInfo.row_count !== undefined && tableInfo.row_count > 0 && (
          <div className="text-xs text-accent/70 mt-1">
            ~{tableInfo.row_count.toLocaleString()} rows
          </div>
        )}
      </div>
    </motion.div>
  );
};

const DatabaseSchemaVisualization: React.FC<
  DatabaseSchemaVisualizationProps
> = ({ className = "" }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [schemaData, setSchemaData] = useState<Record<
    string,
    TableInfo
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [schemaStatus, setSchemaStatus] = useState<SchemaStatusResponse | null>(null);

  const nodeTypes = useMemo(
    () => ({
      tableNode: TableNode,
    }),
    []
  );

  // Fetch schema data and status
  const fetchSchema = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both schema and status in parallel
      const [schemaResponse, statusResponse] = await Promise.all([
        getSchemaInfo(),
        getSchemaStatus().catch(() => null) // Status is optional
      ]);
      
      setSchemaData(schemaResponse.schema);
      if (statusResponse) {
        setSchemaStatus(statusResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch schema");
      console.error("Error fetching schema:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh schema from backend (triggers database introspection)
  const handleRefreshSchema = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Try to refresh the backend schema first
      try {
        await refreshSchemaFromBackend();
      } catch (refreshErr) {
        console.warn("Could not trigger backend refresh, fetching current schema:", refreshErr);
      }
      
      // Then fetch the updated schema
      await fetchSchema();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh schema");
      console.error("Error refreshing schema:", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchSchema]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  // Create nodes and edges from schema data
  useEffect(() => {
    if (!schemaData) return;

    const tableNames = Object.keys(schemaData);
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create nodes for each table
    tableNames.forEach((tableName, index) => {
      const tableInfo = schemaData[tableName];

      // Calculate position in a grid layout
      const cols = Math.ceil(Math.sqrt(tableNames.length));
      const row = Math.floor(index / cols);
      const col = index % cols;
      const spacing = 400;
      const startX = -((cols - 1) * spacing) / 2;
      const startY = -((Math.ceil(tableNames.length / cols) - 1) * spacing) / 2;

      nodes.push({
        id: tableName,
        type: "tableNode",
        position: {
          x: startX + col * spacing,
          y: startY + row * spacing,
        },
        data: {
          tableInfo,
          isExpanded: expandedTables.has(tableName),
          onToggleExpanded: () => {
            setExpandedTables((prev) => {
              const newSet = new Set(prev);
              if (newSet.has(tableName)) {
                newSet.delete(tableName);
              } else {
                newSet.add(tableName);
              }
              return newSet;
            });
          },
        },
        draggable: true,
      });
    });

    // Create edges for relationships - only one edge per table pair
    const connectedPairs = new Set<string>();

    // First, try to create connections from relationships
    tableNames.forEach((tableName) => {
      const tableInfo = schemaData[tableName];

      tableInfo.relationships.forEach((relationship) => {
        const targetTable = relationship.target_table;

        if (schemaData[targetTable]) {
          // Create a unique pair identifier to avoid duplicate connections
          const pairId = [tableName, targetTable].sort().join("-");

          if (!connectedPairs.has(pairId)) {
            connectedPairs.add(pairId);

            const edge = {
              id: `${tableName}-${targetTable}`,
              source: tableName,
              target: targetTable,
              type: "smoothstep",
              animated: false,
              style: {
                stroke: "#3b82f6",
                strokeWidth: 2,
                strokeDasharray: "5,5",
              },
              labelStyle: {
                fill: "hsl(var(--foreground))",
                fontSize: "10px",
                fontWeight: "500",
              },
              labelBgStyle: {
                fill: "hsl(var(--background))",
                fillOpacity: 0.8,
              },
            };

            edges.push(edge);
          }
        }
      });
    });

    // If no relationships found, create connections from foreign keys
    // But ensure only one connection per table pair
    if (edges.length === 0) {
      tableNames.forEach((tableName) => {
        const tableInfo = schemaData[tableName];

        tableInfo.columns.forEach((column) => {
          if (
            column.is_foreign_key &&
            column.references_table &&
            column.references_column
          ) {
            const targetTable = column.references_table;

            // Create a unique pair identifier to avoid duplicate connections
            const pairId = [tableName, targetTable].sort().join("-");

            if (schemaData[targetTable] && !connectedPairs.has(pairId)) {
              connectedPairs.add(pairId);

              const edge = {
                id: `${tableName}-${targetTable}`,
                source: tableName,
                target: targetTable,
                type: "smoothstep",
                style: {
                  stroke: "#3b82f6",
                  strokeWidth: 2,
                  strokeDasharray: "5,5",
                },
                labelStyle: {
                  fill: "hsl(var(--foreground))",
                  fontSize: "10px",
                  fontWeight: "500",
                },
                labelBgStyle: {
                  fill: "hsl(var(--background))",
                  fillOpacity: 0.8,
                },
              };
              edges.push(edge);
            }
          }
        });
      });
    }

    setNodes(nodes);
    setEdges(edges);

    // Fit view after a short delay to ensure nodes are rendered
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({
          duration: 1000,
          padding: 0.2,
        });
      }, 100);
    }
  }, [schemaData, expandedTables, reactFlowInstance]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-primary">Detecting database schema...</p>
          <p className="text-foreground/50 text-sm mt-1">Auto-detecting tables and relationships</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading schema</p>
          <p className="text-foreground/60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!schemaData) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-foreground/60">No schema data available</p>
      </div>
    );
  }

  const isDynamic = schemaStatus?.mode === "dynamic";
  const tableCount = Object.keys(schemaData).length;

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Schema Status Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TbDatabase className="text-accent" size={20} />
            <span className="font-semibold text-primary">Database Schema</span>
          </div>
          
          {/* Schema Mode Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isDynamic 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          }`}>
            {isDynamic ? (
              <>
                <HiOutlineSparkles size={12} />
                <span>Auto-Detected</span>
              </>
            ) : (
              <>
                <TbCircleFilled size={8} />
                <span>Static</span>
              </>
            )}
          </div>
          
          {/* Table Count */}
          <div className="text-sm text-foreground/60">
            {tableCount} tables
          </div>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={handleRefreshSchema}
          disabled={refreshing}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            refreshing 
              ? "bg-foreground/10 text-foreground/40 cursor-not-allowed" 
              : "bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30"
          }`}
        >
          <TbRefresh size={16} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Refreshing..." : "Refresh Schema"}</span>
        </button>
      </div>
      
      {/* ReactFlow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          onInit={setReactFlowInstance}
          className="bg-background"
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { strokeWidth: 3 },
          }}
        >
          <Background gap={20} size={1} color="hsl(var(--foreground) / 0.1)" />
          <Controls className="bg-background border border-foreground/20" />
          <MiniMap
            className="bg-background border border-foreground/20"
            nodeColor="hsl(var(--accent))"
            maskColor="hsl(var(--background) / 0.8)"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default DatabaseSchemaVisualization;
