import { useState, useEffect, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SplashScreen } from "@/components/SplashScreen";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ConsentModal } from "@/components/ConsentModal";
import { Sidebar } from "@/components/Sidebar";
import { Home, Settings, History, Bell, Wallet as WalletIcon, User, Menu } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import SettingsPage from "@/pages/Settings";
import HistoryPage from "@/pages/History";
import Profile from "@/pages/Profile";
import NotificationsPage from "@/pages/Notifications";
import Referral from "@/pages/Referral";
import Leaderboard from "@/pages/Leaderboard";
import Offers from "@/pages/Offers";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Wallet from "@/pages/Wallet";
import SetWalletPin from "@/pages/SetWalletPin";
import NotFound from "@/pages/not-found";
import { ReferralCodeSetup } from "./components/ReferralCodeSetup";
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
    } else if (requirePin && !isLoading && pinStatus && !pinStatus.hasPin && location !== "/set-wallet-pin" && !window.location.search.includes('needsUsernameSetup')) {
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
    { path: "/history", icon: History, label: "History" },
    { path: "/wallet", icon: WalletIcon, label: "Wallet" },
    { path: "/settings", icon: Settings, label: "Settings" },
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
      
      const needsUsernameSetup = urlParams.get('needsUsernameSetup');
      
      if (needsUsernameSetup === 'true') {
        window.history.replaceState({}, document.title, "/?needsUsernameSetup=true");
      } else {
        window.history.replaceState({}, document.title, "/");
      }
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
      <Route path="/notifications">
        {() => <ProtectedRoute component={NotificationsPage} />}
      </Route>
      <Route path="/referral">
        {() => <ProtectedRoute component={Referral} />}
      </Route>
      <Route path="/leaderboard">
        {() => <ProtectedRoute component={Leaderboard} />}
      </Route>
      <Route path="/offers">
        {() => <ProtectedRoute component={Offers} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [showConsent, setShowConsent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const isAuthPage = location === "/login" || location === "/signup";
  const isSetPinPage = location === "/set-wallet-pin";
  const token = localStorage.getItem("authToken");

  const { data: pinStatus } = useQuery<{ hasPin: boolean }>({
    queryKey: ["/api/wallet/has-pin"],
    enabled: !!token,
  });

  useEffect(() => {
    const consent = localStorage.getItem("consent");
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token && !isAuthPage,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { referralCode: string }) => apiRequest("POST", "/api/auth/update-profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      localStorage.removeItem("pendingReferralCode");
    },
  });

  useEffect(() => {
    if (user && !user.referredBy) {
      const pendingCode = localStorage.getItem("pendingReferralCode");
      if (pendingCode) {
        updateProfileMutation.mutate({ referralCode: pendingCode });
      }
    }
  }, [user]);

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
    // No-op or cleanup handled by parent
  };

  const hideHeaderPages = ["/notifications", "/history", "/wallet", "/settings", "/profile"];
  const showHeader = !hideHeaderPages.includes(location);

  if (isAuthPage || isSetPinPage) {
    return (
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen w-full">
        <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} user={user} />
        {showHeader && (
          <header className="flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                data-testid="button-menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold">MineOS</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation("/notifications")}
                className={`relative flex items-center justify-center transition-colors ${
                  location === "/notifications" ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid="button-notifications-header"
              >
                <Bell className="w-6 h-6" />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center border-2 border-background">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setLocation("/profile")}
                className={`flex items-center justify-center transition-colors ${
                  location === "/profile" ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid="button-profile-header"
              >
                <User className="w-6 h-6" />
              </button>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-auto pb-20">
          <Router />
        </main>
        <BottomNav />
      </div>
      <ConsentModal open={showConsent} onAccept={() => setShowConsent(false)} />
      <Toaster />
    </TooltipProvider>
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
        window.history.replaceState({}, '', '/?needsUsernameSetup=true');
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

  if (isLoading) {
    return <SplashScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppWrapper 
        showUsernameSetup={showUsernameSetup} 
        setShowUsernameSetup={setShowUsernameSetup} 
      />
    </QueryClientProvider>
  );
}

function AppWrapper({ 
  showUsernameSetup, 
  setShowUsernameSetup 
}: { 
  showUsernameSetup: boolean; 
  setShowUsernameSetup: (show: boolean) => void;
}) {
  const [, setLocation] = useLocation();
  
  const { data: pinStatus } = useQuery<{ hasPin: boolean }>({
    queryKey: ["/api/wallet/has-pin"],
    enabled: !!localStorage.getItem("authToken"),
  });

  const handleUsernameSetupComplete = () => {
    setShowUsernameSetup(false);
    window.history.replaceState({}, '', '/');
    
    // Redirect to PIN setup only if they don't have one
    if (pinStatus && !pinStatus.hasPin) {
      setLocation('/set-wallet-pin');
    } else {
      setLocation('/');
    }
  };

  return (
    <>
      <AppContent />
      <ReferralCodeSetup
        open={showUsernameSetup}
        onComplete={handleUsernameSetupComplete}
      />
    </>
  );
}

export default App;