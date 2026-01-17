import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MiningSession {
  id: string;
  status: "idle" | "active" | "paused" | "stopped" | "cooldown";
  startTime: string;
  lastActiveAt: string;
  pausedDuration: number;
  earnings: string;
  intensity: number;
}

interface LocalSessionState {
  sessionId: string | null;
  status: "idle" | "active" | "paused" | "cooldown";
  startTime: number;
  duration: number;
  pausedAt: number | null;
  pausedDuration: number;
}

const STORAGE_KEY = "mining_session_state";
const CHANNEL_NAME = "mining_sync";
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const EARNINGS_PER_SECOND = 0.00000001;

export function useMining() {
  const { toast } = useToast();
  const [localState, setLocalState] = useState<LocalSessionState>({
    sessionId: null,
    status: "idle",
    startTime: 0,
    duration: 0,
    pausedAt: null,
    pausedDuration: 0,
  });

  const channelRef = useRef<BroadcastChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get active session from backend
  const { data: activeSession, isLoading } = useQuery<MiningSession | null>({
    queryKey: ["/api/sessions/active"],
    retry: 3,
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery<any>({
    queryKey: ["/api/settings"],
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/sessions/start", {}),
    onSuccess: (data: MiningSession) => {
      const newState: LocalSessionState = {
        sessionId: data.id,
        status: "active",
        startTime: new Date(data.startTime).getTime(),
        duration: 0,
        pausedAt: null,
        pausedDuration: 0,
      };
      setLocalState(newState);
      saveToLocalStorage(newState);
      broadcastState(newState);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      toast({
        title: "Mining Started",
        description: "Your 24-hour mining session has begun",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start mining session",
        variant: "destructive",
      });
    },
  });

  // Pause session mutation
  const pauseSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest("POST", `/api/sessions/${sessionId}/pause`, {}),
    onSuccess: async () => {
      // Fetch updated session from backend to get accurate state
      const updatedSession = await apiRequest("GET", `/api/sessions/active`) as MiningSession;
      
      if (updatedSession) {
        const backendStartTime = new Date(updatedSession.startTime).getTime();
        const backendPausedDuration = updatedSession.pausedDuration || 0;
        const currentActiveDuration = Math.floor((Date.now() - backendStartTime) / 1000) - backendPausedDuration;
        
        const newState: LocalSessionState = {
          ...localState,
          status: "paused",
          pausedAt: Date.now(),
          pausedDuration: backendPausedDuration,
          duration: currentActiveDuration,
        };
        setLocalState(newState);
        saveToLocalStorage(newState);
        broadcastState(newState);
      }
      
      toast({
        title: "Mining Paused",
        description: "Your mining session has been paused",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to pause session",
        variant: "destructive",
      });
    },
  });

  // Resume session mutation
  const resumeSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest("POST", `/api/sessions/${sessionId}/resume`, {}),
    onSuccess: async () => {
      // Fetch updated session from backend to get accurate pausedDuration
      const updatedSession = await apiRequest("GET", `/api/sessions/active`) as MiningSession;
      
      if (updatedSession) {
        const backendStartTime = new Date(updatedSession.startTime).getTime();
        const backendPausedDuration = updatedSession.pausedDuration || 0;
        
        const newState: LocalSessionState = {
          ...localState,
          status: "active",
          pausedAt: null,
          pausedDuration: backendPausedDuration,
          startTime: backendStartTime,
        };
        setLocalState(newState);
        saveToLocalStorage(newState);
        broadcastState(newState);
      }
      
      toast({
        title: "Mining Resumed",
        description: "Your mining session has been resumed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resume session",
        variant: "destructive",
      });
    },
  });

  // Stop session mutation
  const stopSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest("POST", `/api/sessions/${sessionId}/stop`, {}),
    onSuccess: () => {
      const newState: LocalSessionState = {
        sessionId: null,
        status: "cooldown",
        startTime: 0,
        duration: 0,
        pausedAt: null,
        pausedDuration: 0,
      };
      setLocalState(newState);
      saveToLocalStorage(newState);
      broadcastState(newState);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      
      setTimeout(() => {
        const idleState: LocalSessionState = {
          ...newState,
          status: "idle",
        };
        setLocalState(idleState);
        saveToLocalStorage(idleState);
        broadcastState(idleState);
      }, 3000);

      toast({
        title: "Mining Stopped",
        description: "Your session has been completed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop session",
        variant: "destructive",
      });
    },
  });

  // Save state to localStorage
  const saveToLocalStorage = (state: LocalSessionState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  };

  // Broadcast state to other tabs
  const broadcastState = (state: LocalSessionState) => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(state);
      } catch (error) {
        console.error("Failed to broadcast state:", error);
      }
    }
  };

  // Calculate current duration
  const calculateDuration = useCallback(() => {
    if (localState.status === "active" && localState.startTime > 0) {
      const elapsed = Math.floor((Date.now() - localState.startTime) / 1000);
      return Math.max(0, elapsed - localState.pausedDuration);
    } else if (localState.status === "paused" && localState.duration > 0) {
      // When paused, return the stored duration to prevent jumping
      return localState.duration;
    }
    return 0;
  }, [localState]);

  // Check for session timeout
  const checkSessionTimeout = useCallback(() => {
    if ((localState.status === "active" || localState.status === "paused") && localState.startTime > 0) {
      const activeTime = calculateDuration();
      const totalElapsed = Date.now() - localState.startTime;
      
      // Check if active mining time (excluding paused duration) has reached 24 hours
      if (activeTime >= 86400 && localState.sessionId) {
        stopSessionMutation.mutate(localState.sessionId);
        toast({
          title: "Session Complete",
          description: "Your 24-hour mining session has ended",
        });
      } else if (totalElapsed >= SESSION_TIMEOUT + (24 * 60 * 60 * 1000)) {
        // Failsafe: if total elapsed time exceeds 48 hours, force stop
        if (localState.sessionId) {
          stopSessionMutation.mutate(localState.sessionId);
          toast({
            title: "Session Timeout",
            description: "Session exceeded maximum duration",
            variant: "destructive",
          });
        }
      }
    }
  }, [localState, calculateDuration, stopSessionMutation, toast]);

  // Initialize BroadcastChannel for multi-tab sync
  useEffect(() => {
    if (typeof BroadcastChannel !== "undefined") {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
      
      channelRef.current.onmessage = (event) => {
        const receivedState = event.data as LocalSessionState;
        setLocalState(receivedState);
      };

      return () => {
        channelRef.current?.close();
      };
    }
  }, []);

  // Initialize session state on mount - restore from localStorage or backend
  useEffect(() => {
    if (isLoading) return;

    const savedState = localStorage.getItem(STORAGE_KEY);
    
    if (activeSession) {
      // Backend has active session - use it as source of truth
      const backendStartTime = new Date(activeSession.startTime).getTime();
      const backendLastActiveAt = new Date(activeSession.lastActiveAt).getTime();
      const backendPausedDuration = activeSession.pausedDuration || 0;
      
      let calculatedDuration: number;
      let currentPausedDuration = backendPausedDuration;
      
      if (activeSession.status === "paused") {
        // If paused, add the time since lastActiveAt to pausedDuration
        const additionalPausedTime = Math.floor((Date.now() - backendLastActiveAt) / 1000);
        currentPausedDuration = backendPausedDuration + additionalPausedTime;
        
        // Calculate active duration: total elapsed - all paused time
        const totalElapsed = Math.floor((Date.now() - backendStartTime) / 1000);
        calculatedDuration = Math.max(0, totalElapsed - currentPausedDuration);
      } else {
        // If active, calculate normally
        calculatedDuration = Math.floor((Date.now() - backendStartTime) / 1000) - backendPausedDuration;
      }
      
      const restoredState: LocalSessionState = {
        sessionId: activeSession.id,
        status: activeSession.status as any,
        startTime: backendStartTime,
        duration: calculatedDuration,
        pausedAt: activeSession.status === "paused" ? Date.now() : null,
        pausedDuration: currentPausedDuration,
      };
      
      setLocalState(restoredState);
      saveToLocalStorage(restoredState);
    } else if (savedState) {
      // No backend session but have localStorage - might need to clear stale data
      try {
        const parsed = JSON.parse(savedState) as LocalSessionState;
        if (parsed.sessionId) {
          // Had a session but backend doesn't - clear it
          const clearedState: LocalSessionState = {
            sessionId: null,
            status: "idle",
            startTime: 0,
            duration: 0,
            pausedAt: null,
            pausedDuration: 0,
          };
          setLocalState(clearedState);
          saveToLocalStorage(clearedState);
        }
      } catch (error) {
        console.error("Failed to parse saved state:", error);
      }
    }
  }, [isLoading, activeSession]);

  // Update duration timer and check timeout
  useEffect(() => {
    if (localState.status === "active") {
      intervalRef.current = setInterval(() => {
        const newDuration = calculateDuration();
        const updatedState = { ...localState, duration: newDuration };
        setLocalState(updatedState);
        saveToLocalStorage(updatedState);
        checkSessionTimeout();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Still check timeout even when paused
      if (localState.status === "paused") {
        checkSessionTimeout();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [localState.status, localState.startTime, localState.pausedDuration, calculateDuration, checkSessionTimeout]);

  // Handlers
  const handleStart = () => {
    if (localState.status === "idle" || localState.status === "cooldown") {
      startSessionMutation.mutate();
    }
  };

  const handlePause = () => {
    if (localState.sessionId) {
      if (localState.status === "active") {
        pauseSessionMutation.mutate(localState.sessionId);
      } else if (localState.status === "paused") {
        resumeSessionMutation.mutate(localState.sessionId);
      }
    }
  };

  const handleStop = () => {
    if (localState.sessionId) {
      stopSessionMutation.mutate(localState.sessionId);
    }
  };

  const currentDuration = calculateDuration();
  const sessionEarnings = (currentDuration * EARNINGS_PER_SECOND).toFixed(8);
  const projectedDaily =
    currentDuration > 0
      ? (parseFloat(sessionEarnings) * (86400 / currentDuration)).toFixed(8)
      : "0.00000000";

  return {
    status: localState.status,
    duration: currentDuration,
    sessionEarnings,
    projectedDaily,
    intensity: settings?.intensity || 50,
    isLoading: isLoading || isLoadingSettings,
    handleStart,
    handlePause,
    handleStop,
    isStarting: startSessionMutation.isPending,
    isPausing: pauseSessionMutation.isPending,
    isResuming: resumeSessionMutation.isPending,
    isStopping: stopSessionMutation.isPending,
  };
}
