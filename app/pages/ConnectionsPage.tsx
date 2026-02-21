"use client";

import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ConnectionContext,
  DataConnection,
  CreateConnectionData,
  ConnectionType,
  SSLMode,
} from "../components/contexts/ConnectionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HiOutlineDatabase,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineTable,
} from "react-icons/hi";
import { SiPostgresql, SiMysql, SiSupabase } from "react-icons/si";
import { BsShieldCheck, BsShieldExclamation } from "react-icons/bs";

// =====================================================
// CONSTANTS
// =====================================================

const CONNECTION_TYPES: { value: ConnectionType; label: string; icon: React.ReactNode }[] = [
  { value: "postgresql", label: "PostgreSQL", icon: <SiPostgresql size={18} /> },
  { value: "mysql", label: "MySQL", icon: <SiMysql size={18} /> },
  { value: "supabase", label: "Supabase", icon: <SiSupabase size={18} /> },
];

const SSL_MODES: { value: SSLMode; label: string }[] = [
  { value: "disable", label: "Disabled" },
  { value: "prefer", label: "Prefer" },
  { value: "require", label: "Required" },
  { value: "verify-ca", label: "Verify CA" },
  { value: "verify-full", label: "Verify Full" },
];

const DEFAULT_PORTS: Record<ConnectionType, number> = {
  postgresql: 5432,
  mysql: 3306,
  supabase: 5432,
  snowflake: 443,
  bigquery: 443,
};

// =====================================================
// CONNECTION CARD
// =====================================================

interface ConnectionCardProps {
  connection: DataConnection;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const getConnectionIcon = (type: ConnectionType) => {
    switch (type) {
      case "postgresql":
        return <SiPostgresql size={24} className="text-[#336791]" />;
      case "mysql":
        return <SiMysql size={24} className="text-[#4479A1]" />;
      case "supabase":
        return <SiSupabase size={24} className="text-[#3ECF8E]" />;
      default:
        return <HiOutlineDatabase size={24} className="text-accent" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected
            ? "border-accent bg-accent/5"
            : "border-foreground_alt hover:border-secondary"
        }`}
        onClick={onSelect}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getConnectionIcon(connection.connection_type)}
              <div>
                <CardTitle className="text-lg">{connection.name}</CardTitle>
                <CardDescription className="text-sm">
                  {connection.host}:{connection.port}/{connection.database_name}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connection.is_active ? (
                <Badge variant="outline" className="border-accent text-accent">
                  <HiOutlineCheck size={12} className="mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="border-error text-error">
                  <HiOutlineX size={12} className="mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-secondary">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                {connection.read_only ? (
                  <BsShieldCheck size={14} className="text-accent" />
                ) : (
                  <BsShieldExclamation size={14} className="text-warning" />
                )}
                {connection.read_only ? "Read-only" : "Read-write"}
              </span>
              <span className="flex items-center gap-1">
                <HiOutlineClock size={14} />
                {formatDate(connection.last_connected_at)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="h-8 w-8 p-0"
              >
                <HiOutlinePencil size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-8 w-8 p-0 text-error hover:bg-error/10"
              >
                <HiOutlineTrash size={16} />
              </Button>
            </div>
          </div>
          {connection.connection_error && (
            <div className="mt-2 p-2 bg-error/10 border border-error/20 rounded text-xs text-error">
              {connection.connection_error}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// =====================================================
// CONNECTION FORM DIALOG
// =====================================================

interface ConnectionFormDialogProps {
  open: boolean;
  onClose: () => void;
  connection?: DataConnection | null;
}

const ConnectionFormDialog: React.FC<ConnectionFormDialogProps> = ({
  open,
  onClose,
  connection,
}) => {
  const { createConnection, updateConnection, testConnection } =
    useContext(ConnectionContext);

  const [formData, setFormData] = useState<CreateConnectionData>({
    name: connection?.name || "",
    description: connection?.description || "",
    connection_type: connection?.connection_type || "postgresql",
    host: connection?.host || "",
    port: connection?.port || 5432,
    database_name: connection?.database_name || "",
    username: connection?.username || "",
    password: "",
    ssl_mode: connection?.ssl_mode || "require",
    read_only: connection?.read_only ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const isEditing = !!connection;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (isEditing && connection) {
        await updateConnection(connection.id, formData);
      } else {
        await createConnection(formData);
      }
      onClose();
    } catch {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(formData);
      setTestResult({
        success: result.success,
        message: result.success
          ? `Connected! ${result.tables_count} tables found (${result.latency_ms}ms)`
          : result.error || "Connection failed",
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTypeChange = (type: ConnectionType) => {
    setFormData((prev) => ({
      ...prev,
      connection_type: type,
      port: DEFAULT_PORTS[type] || prev.port,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Connection" : "New Connection"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your database connection settings"
              : "Connect to your database to start querying with natural language"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Connection Name */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Connection Name</label>
            <Input
              placeholder="My Production Database"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          {/* Connection Type */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Database Type</label>
            <Select
              value={formData.connection_type}
              onValueChange={(v) => handleTypeChange(v as ConnectionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONNECTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Host & Port */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 grid gap-2">
              <label className="text-sm font-medium">Host</label>
              <Input
                placeholder="localhost or db.example.com"
                value={formData.host}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, host: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Port</label>
              <Input
                type="number"
                value={formData.port}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    port: parseInt(e.target.value) || 5432,
                  }))
                }
              />
            </div>
          </div>

          {/* Database Name */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Database Name</label>
            <Input
              placeholder="postgres"
              value={formData.database_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  database_name: e.target.value,
                }))
              }
            />
          </div>

          {/* Username & Password */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                placeholder="postgres"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder={isEditing ? "••••••••" : "Enter password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
          </div>

          {/* SSL Mode */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">SSL Mode</label>
            <Select
              value={formData.ssl_mode}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, ssl_mode: v as SSLMode }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SSL_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-sm ${
                testResult.success
                  ? "bg-accent/10 border border-accent/20 text-accent"
                  : "bg-error/10 border border-error/20 text-error"
              }`}
            >
              {testResult.success ? (
                <HiOutlineCheck size={16} className="inline mr-2" />
              ) : (
                <HiOutlineX size={16} className="inline mr-2" />
              )}
              {testResult.message}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={
              isTesting ||
              !formData.host ||
              !formData.username ||
              (!isEditing && !formData.password)
            }
          >
            {isTesting ? (
              <>
                <HiOutlineRefresh size={16} className="mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <HiOutlineDatabase size={16} className="mr-2" />
                Test Connection
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !formData.name ||
                !formData.host ||
                !formData.username ||
                (!isEditing && !formData.password)
              }
            >
              {isSubmitting ? (
                <>
                  <HiOutlineRefresh size={16} className="mr-2 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Connection"
              ) : (
                "Create Connection"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =====================================================
// SCHEMA VIEWER
// =====================================================

const SchemaViewer: React.FC = () => {
  const { currentConnection, currentSchema, isLoadingSchema, refreshSchema } =
    useContext(ConnectionContext);

  if (!currentConnection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-secondary">
        <HiOutlineTable size={48} className="mb-4 opacity-50" />
        <p>Select a connection to view its schema</p>
      </div>
    );
  }

  if (isLoadingSchema) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-secondary">
        <HiOutlineRefresh size={48} className="mb-4 animate-spin" />
        <p>Loading schema...</p>
      </div>
    );
  }

  if (!currentSchema) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-secondary">
        <HiOutlineX size={48} className="mb-4 opacity-50" />
        <p>Failed to load schema</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => refreshSchema(currentConnection.id)}
        >
          Retry
        </Button>
      </div>
    );
  }

  const tables = Object.entries(currentSchema.tables || {});

  return (
    <div className="h-full overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          {currentSchema.connection_name} Schema
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refreshSchema(currentConnection.id)}
        >
          <HiOutlineRefresh size={16} className="mr-2" />
          Refresh
        </Button>
      </div>
      <p className="text-sm text-secondary mb-4">
        {currentSchema.table_count} tables found
        {currentSchema.cached_at && (
          <span className="ml-2">
            • Cached {new Date(currentSchema.cached_at).toLocaleString()}
          </span>
        )}
      </p>

      <div className="space-y-4">
        {tables.map(([tableName, table]) => (
          <Card key={tableName} className="bg-background_alt">
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HiOutlineTable size={16} />
                {tableName}
                {table.row_count_estimate && (
                  <Badge variant="outline" className="ml-2">
                    ~{table.row_count_estimate.toLocaleString()} rows
                  </Badge>
                )}
              </CardTitle>
              {table.description && (
                <CardDescription>{table.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="py-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-foreground_alt">
                    <th className="text-left py-2 px-2 font-medium">Column</th>
                    <th className="text-left py-2 px-2 font-medium">Type</th>
                    <th className="text-left py-2 px-2 font-medium">Info</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((column) => (
                    <tr
                      key={column.name}
                      className="border-b border-foreground_alt/50 last:border-0"
                    >
                      <td className="py-2 px-2">
                        <span
                          className={
                            column.is_primary_key ? "font-medium text-accent" : ""
                          }
                        >
                          {column.name}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-secondary">
                        {column.type}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1">
                          {column.is_primary_key && (
                            <Badge variant="outline" className="text-xs">
                              PK
                            </Badge>
                          )}
                          {column.references && (
                            <Badge variant="outline" className="text-xs">
                              FK → {column.references.table}
                            </Badge>
                          )}
                          {!column.nullable && (
                            <Badge variant="outline" className="text-xs">
                              NOT NULL
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// =====================================================
// MAIN PAGE
// =====================================================

const ConnectionsPage: React.FC = () => {
  const {
    connections,
    currentConnection,
    selectConnection,
    deleteConnection,
    isLoading,
  } = useContext(ConnectionContext);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<DataConnection | null>(null);
  const [deletingConnection, setDeletingConnection] =
    useState<DataConnection | null>(null);

  const handleDelete = async () => {
    if (deletingConnection) {
      await deleteConnection(deletingConnection.id);
      setDeletingConnection(null);
    }
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-120px)] overflow-hidden">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6 flex-shrink-0"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-accent/10 text-accent p-2 rounded-md">
            <HiOutlineDatabase size={24} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-primary">
              Data Connections
            </h1>
            <p className="text-sm text-secondary">
              {connections.length} connection{connections.length !== 1 ? "s" : ""}{" "}
              configured
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <HiOutlinePlus size={18} className="mr-2" />
          New Connection
        </Button>
      </motion.div>

      {/* Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Connections List */}
        <div className="w-1/2 overflow-y-auto pr-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <HiOutlineRefresh size={32} className="animate-spin text-secondary" />
            </div>
          ) : connections.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center h-full text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-secondary/10 p-6 rounded-full mb-4">
                <HiOutlineDatabase size={48} className="text-secondary" />
              </div>
              <h2 className="text-lg font-medium mb-2">No Connections Yet</h2>
              <p className="text-secondary mb-4 max-w-sm">
                Connect your database to start asking questions in natural
                language
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <HiOutlinePlus size={18} className="mr-2" />
                Create Your First Connection
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence>
              {connections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  isSelected={currentConnection?.id === connection.id}
                  onSelect={() => selectConnection(connection.id)}
                  onEdit={() => setEditingConnection(connection)}
                  onDelete={() => setDeletingConnection(connection)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Schema Viewer */}
        <div className="w-1/2 border-l border-foreground_alt pl-6">
          <SchemaViewer />
        </div>
      </div>

      {/* Create/Edit Dialog */}
      {(showCreateDialog || editingConnection) && (
        <ConnectionFormDialog
          open={showCreateDialog || !!editingConnection}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingConnection(null);
          }}
          connection={editingConnection}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingConnection}
        onOpenChange={() => setDeletingConnection(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingConnection?.name}&quot;? This
              action cannot be undone. All saved queries using this connection
              will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingConnection(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConnectionsPage;
