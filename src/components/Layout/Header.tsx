import { Bell, RefreshCw, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6">
      <div>
        <h1 className="text-base font-semibold text-slate-100">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span className="font-mono tabular-nums">{formatTime(currentTime)}</span>
        </div>

        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="刷新数据"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>

        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
