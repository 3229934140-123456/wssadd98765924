import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useLocation } from "react-router-dom";

export default function Layout() {
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname.startsWith("/vehicles/") && location.pathname !== "/vehicles") {
      return { title: "单车轨迹", subtitle: "温度追踪与历史回放" };
    }
    if (location.pathname === "/vehicles" || location.pathname === "/") {
      return { title: "车辆监控", subtitle: "在途车辆实时温度监控" };
    }
    if (location.pathname === "/anomalies") {
      return { title: "异常处置", subtitle: "温度异常事件处理与交接" };
    }
    if (location.pathname === "/daily-report") {
      return { title: "值班日报", subtitle: "当日异常处理汇总与交接" };
    }
    return { title: "冷链监控", subtitle: "" };
  };

  const { title, subtitle } = getTitle();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
