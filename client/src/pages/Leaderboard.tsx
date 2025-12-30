import { Card } from "@/components/ui/card";
import { Trophy, Medal, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Leaderboard() {
  const topMiners = [
    { rank: 1, name: "CryptoWhale", hashRate: "850.5 MH/s", earnings: "1.25 BTC" },
    { rank: 2, name: "MiningKing", hashRate: "720.2 MH/s", earnings: "0.98 BTC" },
    { rank: 3, name: "Satoshi_N", hashRate: "680.1 MH/s", earnings: "0.85 BTC" },
    { rank: 4, name: "BlockMaster", hashRate: "540.8 MH/s", earnings: "0.62 BTC" },
    { rank: 5, name: "NodeRunner", hashRate: "490.5 MH/s", earnings: "0.55 BTC" },
  ];

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <Trophy className="w-8 h-8 text-yellow-500" />
      </div>

      <div className="grid grid-cols-3 gap-2 py-4">
        <div className="flex flex-col items-center gap-2 pt-6">
          <div className="relative">
            <Avatar className="w-14 h-14 border-2 border-silver-400">
              <AvatarFallback>2</AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-2 bg-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">2nd</div>
          </div>
          <div className="text-xs font-bold text-center">MiningKing</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-yellow-400 shadow-lg">
              <AvatarFallback>1</AvatarFallback>
            </Avatar>
            <Trophy className="absolute -top-4 -right-2 w-8 h-8 text-yellow-500 drop-shadow-md" />
          </div>
          <div className="text-sm font-bold text-center">CryptoWhale</div>
        </div>
        <div className="flex flex-col items-center gap-2 pt-8">
          <div className="relative">
            <Avatar className="w-12 h-12 border-2 border-orange-400">
              <AvatarFallback>3</AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-2 bg-orange-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">3rd</div>
          </div>
          <div className="text-xs font-bold text-center">Satoshi_N</div>
        </div>
      </div>

      <div className="space-y-3">
        {topMiners.slice(3).map((miner) => (
          <Card key={miner.rank} className="p-4 flex items-center justify-between shadow-none bg-muted/10">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-muted-foreground w-4">{miner.rank}</span>
              <Avatar className="w-10 h-10">
                <AvatarFallback>{miner.name[0]}</AvatarFallback>
              </Avatar>
              <div className="font-semibold">{miner.name}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-primary">{miner.hashRate}</div>
              <div className="text-[10px] text-muted-foreground">{miner.earnings} total</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
