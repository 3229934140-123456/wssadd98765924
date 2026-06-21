import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: "green" | "yellow" | "red" | "blue";
  unit?: string;
}

const colorClasses = {
  green: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    border: "border-emerald-500/20",
    value: "text-emerald-400",
  },
  yellow: {
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    border: "border-amber-500/20",
    value: "text-amber-400",
  },
  red: {
    bg: "bg-red-500/10",
    icon: "text-red-400",
    border: "border-red-500/20",
    value: "text-red-400",
  },
  blue: {
    bg: "bg-blue-500/10",
    icon: "text-blue-400",
    border: "border-blue-500/20",
    value: "text-blue-400",
  },
};

export default function StatCard({ title, value, icon: Icon, color, unit = "辆" }: StatCardProps) {
  const classes = colorClasses[color];
  const isAlert = color === "red";

  return (
    <div
      className={`bg-slate-900/60 border ${classes.border} rounded-xl p-5 transition-all hover:bg-slate-800/60`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-2">{title}</p>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-3xl font-bold font-mono tabular-nums ${classes.value} ${
                isAlert ? "animate-pulse" : ""
              }`}
            >
              {value}
            </span>
            <span className="text-sm text-slate-500">{unit}</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${classes.bg}`}>
          <Icon className={`w-6 h-6 ${classes.icon}`} />
        </div>
      </div>
    </div>
  );
}
