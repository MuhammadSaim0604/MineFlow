import { useState, useEffect } from "react";
import { MiningControl } from "@/components/MiningControl";
import { AnalyticsTile } from "@/components/AnalyticsTile";
import { IncomeCard } from "@/components/IncomeCard";
import { TransactionList } from "@/components/TransactionList";
import { Cpu, Thermometer, Zap, Network, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMining } from "@/hooks/useMining";
import type { Transaction } from "@shared/schema";

export default function Dashboard() {
  // const [analytics, setAnalytics] = useState({
  //   cpuUtilization: 0,
  //   gpuUtilization: 0,
  //   hashRate: 0,
  //   temperature: 35,
  //   networkLatency: 45,
  // });

  const {
    status,
    duration,
    sessionEarnings,
    projectedDaily,
    intensity = 50, // Default intensity
    isLoading: isMiningLoading,
    handleStart,
    handlePause,
    handleStop,
  } = useMining();

  const { data: transactions = [], isLoading: isLoadingTransactions, isError: isTransactionsError } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: balance = "0.00000000", isLoading: isLoadingBalance, isError: isBalanceError } = useQuery<string>({
    queryKey: ["/api/balance"],
    retry: 3,
    retryDelay: 1000,
  });

  // // Update analytics based on mining status
  // useEffect(() => {
  //   let interval: NodeJS.Timeout;
    
  //   if (status === "active") {
  //     interval = setInterval(() => {
  //       // Smart algorithm to simulate realistic load based on intensity
  //       const baseCPU = 10 + (intensity * 0.7);
  //       const baseGPU = intensity * 0.9;
  //       const baseHash = intensity * 4.5;
  //       const baseTemp = 40 + (intensity * 0.35);

  //       setAnalytics({
  //         cpuUtilization: Math.min(99.9, baseCPU + (Math.random() * 5 - 2.5)),
  //         gpuUtilization: Math.min(99.9, baseGPU + (Math.random() * 3 - 1.5)),
  //         hashRate: baseHash + (Math.random() * 20 - 10),
  //         temperature: baseTemp + (Math.random() * 2 - 1),
  //         networkLatency: 35 + Math.random() * 15,
  //       });
  //     }, 1000);
  //   } else if (status === "paused") {
  //     setAnalytics(prev => ({
  //       ...prev,
  //       cpuUtilization: 15 + Math.random() * 5,
  //       gpuUtilization: 0,
  //       hashRate: 0,
  //       temperature: Math.max(35, prev.temperature - 0.5), // Gradually cool down
  //       networkLatency: 40 + Math.random() * 5,
  //     }));
  //   } else {
  //     // Idle or Cooldown - Reset to base levels
  //     setAnalytics({
  //       cpuUtilization: 0,
  //       gpuUtilization: 0,
  //       hashRate: 0,
  //       temperature: 0,
  //       networkLatency: 0,
  //     });
  //   }

  //   return () => clearInterval(interval);
  // }, [status, intensity]);

  if (isLoadingBalance || isLoadingTransactions || isMiningLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-6 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-8 py-8">
          <div className="w-52 h-52 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-40 bg-muted rounded-xl animate-pulse" />
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-6 max-w-md mx-auto">
      <div className="flex flex-col items-center gap-6 py-4">
        <MiningControl
          status={status}
          duration={duration}
          onStart={handleStart}
          onPause={handlePause}
          onStop={handleStop}
        />
      </div>

      <IncomeCard
        balance={balance}
        sessionEarnings={sessionEarnings}
        projectedDaily={projectedDaily}
        percentageChange={status === "active" ? 12.5 : 0}
      />

      {/* <div className="grid grid-cols-2 gap-3">
        <AnalyticsTile
          icon={Cpu}
          label="CPU Usage"
          value={Math.round(analytics.cpuUtilization)}
          unit="%"
          color="text-chart-1"
          trend={status === "active" ? "up" : "stable"}
        />
        <AnalyticsTile
          icon={Activity}
          label="GPU Usage"
          value={Math.round(analytics.gpuUtilization)}
          unit="%"
          color="text-chart-2"
          trend={status === "active" ? "up" : "stable"}
        />
        <AnalyticsTile
          icon={Zap}
          label="Hash Rate"
          value={Math.round(analytics.hashRate)}
          unit="MH/s"
          color="text-primary"
          trend={status === "active" ? "up" : "down"}
        />
        <AnalyticsTile
          icon={Thermometer}
          label="Temperature"
          value={status === "active" ? Math.round(analytics.temperature) : "0"}
          unit="°C"
          color={analytics.temperature > 75 ? "text-chart-3" : "text-chart-4"}
          trend={analytics.temperature > 75 ? "up" : "stable"}
        />
        <AnalyticsTile
          icon={Network}
          label="Network"
          value={Math.round(analytics.networkLatency)}
          unit="ms"
          color="text-chart-5"
          trend="stable"
        />
        <AnalyticsTile
          icon={Activity}
          label="Uptime"
          value={status === "active" ? "99.9" : "0"}
          unit="%"
          color="text-blue-500"
          trend="stable"
        />
        <AnalyticsTile
          icon={Zap}
          label="Efficiency"
          value={status === "active" ? (0.85 + Math.random() * 0.1).toFixed(2) : "0.00"}
          unit="MH/W"
          color="text-yellow-500"
          trend="stable"
        />
        <AnalyticsTile
          icon={Network}
          label="Nodes"
          value={status === "active" ? "12" : "0"}
          unit=""
          color="text-purple-500"
          trend="stable"
        />
      </div> */}

      <TransactionList transactions={transactions} />
    </div>
  );
}
