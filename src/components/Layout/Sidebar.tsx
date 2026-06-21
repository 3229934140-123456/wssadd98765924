import { NavLink, useLocation } from "react-router-dom";
import { Truck, MapPin, AlertTriangle, ThermometerSnowflake } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    {
      path: "/vehicles",
      label: "车辆监控",
      icon: Truck,
    },
    {
      path: "/anomalies",
      label: "异常处置",
      icon: AlertTriangle,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/vehicles") {
      return location.pathname.startsWith("/vehicles");
    }
    return location.pathname === path;
  };

  return (
    <aside className="w-56 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <ThermometerSnowflake className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-100">冷链监控</div>
          <div className="text-xs text-slate-500">Cold Chain Monitor</div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3">
        <div className="text-xs text-slate-500 px-3 mb-2 font-medium">监控中心</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                active
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.path === "/anomalies" && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                  3
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-300">值</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">刘值班</div>
            <div className="text-xs text-slate-500">早班 · 08:00-16:00</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
