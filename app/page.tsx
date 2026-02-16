"use client";

import React, { useContext } from "react";

import { RouterContext } from "./components/contexts/RouterContext";
import ChatPage from "./pages/ChatPage";
import DataPage from "./pages/DataPage";
import CollectionPage from "./pages/CollectionPage";
import EvalPage from "./pages/EvalPage";
import FeedbackPage from "./pages/FeedbackPage";
import DisplayPage from "./pages/DisplayPage";
import DashboardsPage from "./pages/DashboardsPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import { ToastContext } from "./components/contexts/ToastContext";
import ConfirmationModal from "./components/dialog/ConfirmationModal";

export default function Home() {
  const { currentPage } = useContext(RouterContext);
  const { isConfirmModalOpen } = useContext(ToastContext);
  return (
    <div className="flex flex-1 min-w-0 flex-col md:flex-row w-full gap-2 md:gap-6 items-start justify-start p-2 md:p-6 overflow-hidden">
      {isConfirmModalOpen && <ConfirmationModal />}
      {currentPage === "chat" && <ChatPage />}
      {currentPage === "data" && <DataPage />}
      {currentPage === "collection" && <CollectionPage />}
      {currentPage === "eval" && <EvalPage />}
      {currentPage === "feedback" && <FeedbackPage />}
      {currentPage === "display" && <DisplayPage />}
      {currentPage === "dashboards" && <DashboardsPage />}
      {currentPage === "connections" && <ConnectionsPage />}
    </div>
  );
}
