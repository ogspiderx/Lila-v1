import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { isAuthenticated } from "@/lib/auth";
import LoginPage from "@/pages/login";
import ChatPage from "@/pages/chat";
import NotFound from "@/pages/not-found";

function Router() {
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we need to clear old authentication data
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('chat_token');
      if (token) {
        // Test the token with a quick API call
        try {
          const response = await fetch('/api/users/other', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!response.ok) {
            // Token is invalid, clear it
            localStorage.clear();
            setAuthenticated(false);
          } else {
            setAuthenticated(isAuthenticated());
          }
        } catch {
          // Network error or invalid token
          localStorage.clear();
          setAuthenticated(false);
        }
      } else {
        setAuthenticated(isAuthenticated());
      }
      setIsLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  const handleLoginSuccess = () => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-chat-primary"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Switch>
      <Route path="/" component={() => <ChatPage onLogout={handleLogout} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
