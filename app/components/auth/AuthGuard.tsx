"use client";

import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import { useState, useEffect } from "react";
import { AppLoadingScreen } from "@/components/ui/app-loading-screen";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <AppLoadingScreen
        title="Loading session"
        subtitle="Checking your account…"
      />
    );
  }

  if (!user) {
    return (
      <>
        {fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Welcome to QueryWhisper</h1>
              <p className="text-muted-foreground">
                Please sign in to access your SQL query assistant
              </p>
            </div>
          </div>
        )}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return <>{children}</>;
}
