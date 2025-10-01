"use client";

import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
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
