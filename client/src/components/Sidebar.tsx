import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, Trophy, Flame, User, Home, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

export function Sidebar({ open, onOpenChange, user }: SidebarProps) {
  const [, setLocation] = useLocation();

  const menuItems = [
    { label: "Referral", icon: Share2, path: "/referral" },
    { label: "Leaderboard", icon: Trophy, path: "/leaderboard" },
    { label: "Offers", icon: Flame, path: "/offers" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    onOpenChange(false);
    setLocation("/login");
  };

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    setLocation(path);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85%] sm:w-[320px] p-0 flex flex-col">
        <div className="p-6 bg-primary/5 border-b border-border">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{user?.username || "Mining Expert"}</h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email || "Connected via Google"}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Main Menu</h3>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/5 active:bg-primary/10 transition-colors text-foreground font-medium"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="px-4">
             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Account</h3>
             <button
                onClick={() => handleNavigate("/profile")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/5 active:bg-primary/10 transition-colors text-foreground font-medium"
              >
                <User className="w-5 h-5 text-primary" />
                <span>My Profile</span>
              </button>
          </div>
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive font-medium hover:bg-destructive/5 active:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
