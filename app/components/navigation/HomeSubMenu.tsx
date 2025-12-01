"use client";

import React, { useContext, useEffect, useState, useRef } from "react";
import { FaCircle } from "react-icons/fa";

import { ConversationContext } from "../contexts/ConversationContext";

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

const HomeSubMenu: React.FC = () => {
  const {
    startNewConversation,
    currentConversation,
    removeConversation,
    renameConversation,
    selectConversation,
    conversationPreviews,
    loadingConversations,
    creatingNewConversation,
    loadingConversation,
  } = useContext(ConversationContext);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState<
    string | null
  >(null);
  const [newTitle, setNewTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug: Track when conversationPreviews changes
  useEffect(() => {
    console.log(
      "🔍 HomeSubMenu - conversationPreviews updated:",
      conversationPreviews
    );
  }, [conversationPreviews]);

  const handleRenameClick = (conversationId: string) => {
    const currentTitle = conversationPreviews[conversationId]?.title || "";
    setConversationToRename(conversationId);
    setNewTitle(currentTitle);
    // Small delay to let dropdown close first before opening dialog
    // This prevents the aria-hidden focus conflict
    setTimeout(() => {
      setRenameDialogOpen(true);
    }, 100);
  };

  const handleRenameConfirm = async () => {
    if (conversationToRename && newTitle.trim() && !isRenaming) {
      setIsRenaming(true);
      try {
        // Blur the input to release focus before closing
        inputRef.current?.blur();

        // Close dialog first to prevent focus issues
        setRenameDialogOpen(false);

        // Small delay to let dialog close and release focus
        await new Promise((resolve) => setTimeout(resolve, 50));

        await renameConversation(conversationToRename, newTitle.trim());
        setConversationToRename(null);
        setNewTitle("");
      } catch (error) {
        console.error("Failed to rename conversation:", error);
        // Reopen dialog on error so user can try again
        setRenameDialogOpen(true);
      } finally {
        setIsRenaming(false);
      }
    }
  };

  const handleRenameCancel = () => {
    // Blur any focused element first
    inputRef.current?.blur();
    setRenameDialogOpen(false);
    setConversationToRename(null);
    setNewTitle("");
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Blur any focused element when dialog is closing
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
          <div
            className={`flex items-center ${loadingConversations || creatingNewConversation || loadingConversation ? "shine" : ""}`}
          >
            {creatingNewConversation && (
              <FaCircle className="text-secondary pulsing mr-2" />
            )}
            {loadingConversations ||
              (loadingConversation && <p>Loading conversations...</p>)}
            {!loadingConversations && !loadingConversation && (
              <p>
                {creatingNewConversation
                  ? "Initializing conversation..."
                  : "Conversations"}
              </p>
            )}
          </div>
        </SidebarGroupLabel>
        <SidebarGroupAction
          title="Add Conversation"
          onClick={() => startNewConversation()}
          disabled={creatingNewConversation}
        >
          <FaPlus /> <span className="sr-only">Add Conversation</span>
        </SidebarGroupAction>
      </div>
      <SidebarGroupContent>
        {/* TODO Add Timestamp Sorting when backend supports it */}
        {Object.entries(conversationPreviews)
          ?.sort(
            ([, a], [, b]) =>
              new Date(b.last_update_time).getTime() -
              new Date(a.last_update_time).getTime()
          )
          .map(([key, value]) => (
            <SidebarMenuItem className="list-none fade-in" key={key}>
              <SidebarMenuButton
                variant={currentConversation === key ? "active" : "default"}
                onClick={() => selectConversation(key)}
              >
                <p className="truncate max-w-[13rem]">{value.title}</p>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction>
                    <SlOptionsVertical />
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem onClick={() => handleRenameClick(key)}>
                    <MdEdit />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => removeConversation(key)}>
                    <GoTrash className="text-error" />
                    <span className="text-error">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
      </SidebarGroupContent>

      <Dialog open={renameDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>
              Enter a new name for this conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Conversation name"
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
            <Button
              onClick={handleRenameConfirm}
              disabled={!newTitle.trim() || isRenaming}
            >
              {isRenaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  );
};

export default HomeSubMenu;
