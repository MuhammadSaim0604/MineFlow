import { Card } from "@/components/ui/card";
import { Zap, Shield, Rocket, Flame, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Offers() {
  const offers = [
    { id: 1, title: "Turbo Boost", desc: "Double your hash rate for 2 hours", price: "0.0001 BTC", icon: Rocket, color: "text-blue-500 bg-blue-50" },
    { id: 2, title: "Energy Saver", desc: "Reduce power draw by 40%", price: "0.00005 BTC", icon: Zap, color: "text-green-500 bg-green-50" },
    { id: 3, title: "Premium Shield", desc: "Full protection from network cuts", price: "0.00015 BTC", icon: Shield, color: "text-purple-500 bg-purple-50" },
    { id: 4, title: "Night Mining", desc: "1.5x earnings during night hours", price: "Free", icon: Clock, color: "text-orange-500 bg-orange-50" },
  ];

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Active Offers</h1>
        <Flame className="w-8 h-8 text-orange-500" />
      </div>

      <div className="grid gap-4">
        {offers.map((offer) => (
          <Card key={offer.id} className="p-5 flex items-center gap-4 shadow-none group active:scale-95 transition-transform">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${offer.color}`}>
              <offer.icon className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground">{offer.title}</h3>
              <p className="text-sm text-muted-foreground">{offer.desc}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-bold text-primary">{offer.price}</span>
                <Button size="sm" variant="outline" className="h-8 text-xs font-bold uppercase tracking-tight">Activate</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
