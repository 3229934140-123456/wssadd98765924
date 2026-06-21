import { useState, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Truck, MapPin, AlertTriangle, ThermometerSnowflake, FileText, LogOut, User, ChevronDown } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useAnomalyStore } from "@/store/anomalyStore";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, shift, shiftTime, setUser } = useUserStore();
  const anomalies = useAnomalyStore((s) => s.anomalies);
  const statusFilter = useAnomalyStore((s) => s.statusFilter);
  const getFilteredAnomalies = useAnomalyStore((s) => s.getFilteredAnomalies);
  const [showMenu, setShowMenu] = useState(false);

  const pendingCount = useMemo(() => {
    return getFilteredAnomalies().filter((a) => a.status === "pending").length;
  }, [anomalies, statusFilter, getFilteredAnomalies]);

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
      badge: pendingCount,
    },
    {
      path: "/daily-report",
      label: "值班日报",
      icon: FileText,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/vehicles") {
      return location.pathname.startsWith("/vehicles");
    }
    return location.pathname === path;
  };

  const handleShiftChange = () => {
    const shifts = [
      { shift: "早班", time: "08:00-16:00" },
      { shift: "中班", time: "16:00-24:00" },
      { shift: "晚班", time: "00:00-08:00" },
    ];
    const currentIdx = shifts.findIndex((s) => s.shift === shift);
    const nextShift = shifts[(currentIdx + 1) % shifts.length];
    const newName = prompt("请输入值班员姓名：", userName);
    if (newName && newName.trim()) {
      setUser(newName.trim(), nextShift.shift, nextShift.time);
      navigate("/daily-report");
    }
    setShowMenu(false);
  };

  const handleLogout = () => {
    const newName = prompt("请输入值班员姓名：", userName);
    if (newName && newName.trim()) {
      setUser(newName.trim(), shift, shiftTime);
    }
    setShowMenu(false);
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
              {item.badge && item.badge > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {userName.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium text-slate-200 truncate">
              {userName}
            </div>
            <div className="text-xs text-slate-500">
              {shift} · {shiftTime}
            </div>
          </div>
          <ChevronDown size={14} className="text-slate-500" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl z-20">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <User size={16} />
                更换值班员
              </button>
              <button
                onClick={handleShiftChange}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <LogOut size={16} />
                交班换班
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
