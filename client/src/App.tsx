import { useState, useEffect, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SplashScreen } from "@/components/SplashScreen";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ConsentModal } from "@/components/ConsentModal";
import { Home, Settings, History, Bell, Wallet as WalletIcon, User } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import SettingsPage from "@/pages/Settings";
import HistoryPage from "@/pages/History";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Wallet from "@/pages/Wallet";
import SetWalletPin from "@/pages/SetWalletPin";
import NotFound from "@/pages/not-found";
import { UsernameSetupModal } from "./components/UsernameSetupModal";
import type { Notification } from "@shared/schema";

function ProtectedRoute({ component: Component, requirePin = true }: { component: React.ComponentType; requirePin?: boolean }) {
  const [location, setLocation] = useLocation();
  const token = localStorage.getItem("authToken");

  const { data: pinStatus, isLoading } = useQuery<{ hasPin: boolean }>({
    queryKey: ["/api/wallet/has-pin"],
    enabled: !!token && requirePin,
  });

  useEffect(() => {
    if (!token) {
      setLocation("/login");
    } else if (requirePin && !isLoading && pinStatus && !pinStatus.hasPin && location !== "/set-wallet-pin") {
      setLocation("/set-wallet-pin");
    }
  }, [token, setLocation, requirePin, isLoading, pinStatus, location]);

  if (!token) {
    return null;
  }

  if (requirePin && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <Component />;
}

function BottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/wallet", icon: WalletIcon, label: "Wallet" },
    { path: "/settings", icon: Settings, label: "Settings" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Router() {
  const [location, setLocation] = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [showConsent, setShowConsent] = useState(false);
  const isAuthenticated = !!localStorage.getItem("authToken");

  // Auto scroll to top on route change - scroll main content area only
  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
  }, [location]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('userId');

    if (token && userId) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userId);
      window.history.replaceState({}, document.title, "/");
      setLocation("/");
    }
  }, [setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/set-wallet-pin">
        {() => <ProtectedRoute component={SetWalletPin} requirePin={false} />}
      </Route>
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={SettingsPage} />}
      </Route>
      <Route path="/history">
        {() => <ProtectedRoute component={HistoryPage} />}
      </Route>
      <Route path="/wallet">
        {() => <ProtectedRoute component={Wallet} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [showConsent, setShowConsent] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [location] = useLocation();
  const isAuthPage = location === "/login" || location === "/signup";
  const isSetPinPage = location === "/set-wallet-pin";
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const consent = localStorage.getItem("consent");
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  // Check if username needs to be set, especially after Google OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const needsUsernameSetup = urlParams.get('needsUsernameSetup');
    if (needsUsernameSetup === 'true') {
      setShowUsernameSetup(true);
      // Clean up the URL to prevent re-showing the modal
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);


  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 5000,
    enabled: !!token && !isAuthPage,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/notifications", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleClearAll = () => {
    clearAllMutation.mutate();
  };

  const handleUsernameSetupComplete = () => {
    setShowUsernameSetup(false);
    // Potentially redirect or update UI after username setup
  };

  if (isAuthPage || isSetPinPage) {
    return (
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <div className="flex flex-col h-screen w-full">
          <header className="flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-40">
            <h1 className="text-xl font-bold">MineOS</h1>
            <div className="flex items-center gap-2">
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={handleClearAll}
              />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto pb-20">
            <Router />
          </main>
          <BottomNav />
        </div>
        <ConsentModal open={showConsent} onAccept={() => setShowConsent(false)} />
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

function App() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false); // State for the modal

  useEffect(() => {
    // Check for OAuth callback parameters in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('userId');
    const needsUsernameSetup = params.get('needsUsernameSetup');

    if (token && userId) {
      // Store the token and userId from OAuth callback
      localStorage.setItem("authToken", token);
      localStorage.setItem("userId", userId);
      setIsAuthenticated(true);

      if (needsUsernameSetup === 'true') {
        setShowUsernameSetup(true);
        // Clean up URL by redirecting to dashboard without query params
        window.history.replaceState({}, '', '/');
      } else {
        // Clean up URL by redirecting to dashboard
        window.history.replaceState({}, '', '/');
        setLocation('/');
      }
      setIsLoading(false);
      return;
    }

    // Check for existing token
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [setLocation]); // Added setLocation to dependency array


  const handleUsernameSetupComplete = () => {
    setShowUsernameSetup(false);
    // After username setup is complete, ensure we navigate to the dashboard
    // if the user was initially redirected here by the OAuth flow.
    // If they were already on a different page, they should remain there.
    if (window.location.pathname === '/' && !window.location.search) {
        setLocation('/');
    }
  };

  if (isLoading) {
    return <SplashScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <UsernameSetupModal
        open={showUsernameSetup}
        onComplete={handleUsernameSetupComplete}
      />
    </QueryClientProvider>
  );
}

export default App;