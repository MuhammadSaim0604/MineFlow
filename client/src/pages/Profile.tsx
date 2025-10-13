
import { ProfilePanel } from "@/components/ProfilePanel";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Profile() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLocation("/login");
        return null;
      }
      return apiRequest("GET", "/api/auth/me");
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLocation("/login");
    }
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-md mx-auto flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings</p>
      </div>

      <ProfilePanel user={user} />
    </div>
  );
}
