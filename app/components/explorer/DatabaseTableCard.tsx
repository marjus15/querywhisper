"use client";

import React from "react";
import { DatabaseTable } from "@/app/api/getDatabaseTables";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Eye } from "lucide-react";

interface DatabaseTableCardProps {
  table: DatabaseTable;
  onViewTable?: (tableName: string) => void;
}

const DatabaseTableCard: React.FC<DatabaseTableCardProps> = ({
  table,
  onViewTable,
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{table.name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {table.type}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {onViewTable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewTable(table.name)}
                className="h-8 px-2"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default DatabaseTableCard;
