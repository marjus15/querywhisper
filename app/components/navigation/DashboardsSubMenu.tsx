"use client";

import React, { useState, useRef, useContext } from "react";

import { FaPlus } from "react-icons/fa6";
import { GoTrash } from "react-icons/go";
import { MdEdit } from "react-icons/md";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenuAction,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { Button } from "@/components/ui/button";

import { SlOptionsVertical } from "react-icons/sl";
import { DashboardContext } from "../contexts/DashboardContext";

const DashboardsSubMenu: React.FC = () => {
  const {
    dashboards,
    currentDashboard,
    createDashboard,
    removeDashboard,
    renameDashboard,
    selectDashboard,
  } = useContext(DashboardContext);

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [dashboardToRename, setDashboardToRename] = useState<string | null>(
    null
  );
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRenameClick = (dashboardId: string) => {
    const dashboard = dashboards.find((d) => d.id === dashboardId);
    if (dashboard) {
      setDashboardToRename(dashboardId);
      setNewTitle(dashboard.title);
      setTimeout(() => {
        setRenameDialogOpen(true);
      }, 100);
    }
  };

  const handleRenameConfirm = () => {
    if (dashboardToRename && newTitle.trim()) {
      renameDashboard(dashboardToRename, newTitle.trim());
      inputRef.current?.blur();
      setRenameDialogOpen(false);
      setDashboardToRename(null);
      setNewTitle("");
    }
  };

  const handleRenameCancel = () => {
    inputRef.current?.blur();
    setRenameDialogOpen(false);
    setDashboardToRename(null);
    setNewTitle("");
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
    setRenameDialogOpen(open);
  };

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between">
        <SidebarGroupLabel className="flex items-center">
          <p>Dashboards</p>
        </SidebarGroupLabel>
        <SidebarGroupAction title="Add Dashboard" onClick={createDashboard}>
          <FaPlus /> <span className="sr-only">Add Dashboard</span>
        </SidebarGroupAction>
      </div>
      <SidebarGroupContent>
        {dashboards.length === 0 ? (
          <div className="px-2 py-4 text-sm text-secondary text-center">
            No dashboards yet. Click + to create one.
          </div>
        ) : (
          dashboards.map((dashboard) => (
            <SidebarMenuItem className="list-none fade-in" key={dashboard.id}>
              <SidebarMenuButton
                variant={
                  currentDashboard === dashboard.id ? "active" : "default"
                }
                onClick={() => selectDashboard(dashboard.id)}
              >
                <p className="truncate max-w-[13rem]">
                  {dashboard.title}
                  {dashboard.charts.length > 0 && (
                    <span className="text-secondary text-xs ml-1">
                      ({dashboard.charts.length})
                    </span>
                  )}
                </p>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction>
                    <SlOptionsVertical />
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem
                    onClick={() => handleRenameClick(dashboard.id)}
                  >
                    <MdEdit />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => removeDashboard(dashboard.id)}
                  >
                    <GoTrash className="text-error" />
                    <span className="text-error">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))
        )}
      </SidebarGroupContent>

      <Dialog open={renameDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Rename Dashboard</DialogTitle>
            <DialogDescription>
              Enter a new name for this dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Dashboard name"
              maxLength={200}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRenameConfirm();
                } else if (e.key === "Escape") {
                  handleRenameCancel();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleRenameCancel}>
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm} disabled={!newTitle.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  );
};

export default DashboardsSubMenu;
