import { useState, useMemo } from "react";
import {
  FileText,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  User,
  ArrowRight,
  Calendar,
  RefreshCw,
  ClipboardCheck,
} from "lucide-react";
import { useAnomalyStore } from "@/store/anomalyStore";
import { formatDateTime, formatDuration } from "@/utils";
import {
  ANOMALY_STATUS_LABELS,
  HANDLE_ACTION_LABELS,
  PHASE_LABELS,
} from "@/types";
import type { DailyReport as DailyReportType, ShiftNote } from "@/types";

export default function DailyReport() {
  const anomalies = useAnomalyStore((s) => s.anomalies);
  const handoverRecords = useAnomalyStore((s) => s.handoverRecords);
  const shiftNotesState = useAnomalyStore((s) => s.shiftNotes);
  const statusHistory = useAnomalyStore((s) => s.statusHistory);
  const getDailyReport = useAnomalyStore((s) => s.getDailyReport);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const report: DailyReportType = useMemo(() => {
    return getDailyReport(selectedDate);
  }, [anomalies, handoverRecords, shiftNotesState, statusHistory, selectedDate, getDailyReport]);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = generateReportText(report);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const text = generateReportText(report);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `值班日报_${report.date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <FileText size={20} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">值班日报</h2>
            <p className="text-xs text-slate-500">交接前汇总当日异常处理情况</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-slate-200 outline-none border-none font-mono"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={16} />
            刷新
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              copied
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
            }`}
          >
            <Copy size={16} />
            {copied ? "已复制" : "复制文本"}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <Download size={16} />
            导出文件
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatCard
          icon={Truck}
          label="在途车辆"
          value={report.totalVehiclesInTransit}
          color="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="当日新增"
          value={report.newAnomaliesToday}
          color="red"
        />
        <StatCard
          icon={Clock}
          label="未闭环"
          value={report.unresolvedAnomalies}
          color="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="今日闭环"
          value={report.resolvedToday}
          color="green"
        />
        <StatCard
          icon={User}
          label="今日处理"
          value={report.processingToday}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <span className="font-semibold">未闭环异常清单</span>
              <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
                {report.unresolvedAnomalies} 项
              </span>
            </div>
          </div>
          <div className="divide-y divide-slate-800/50 max-h-96 overflow-auto">
            {report.anomalySummary
              .filter((s) => s.statusAtEndOfDay !== "resolved")
              .map(({ anomaly, latestRecord, handlers, shiftNote, statusAtEndOfDay }) => (
                <div key={anomaly.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{anomaly.plateNumber}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          statusAtEndOfDay === "pending"
                            ? "bg-red-500/10 text-red-400"
                            : statusAtEndOfDay === "processing"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-purple-500/10 text-purple-400"
                        }`}
                      >
                        {ANOMALY_STATUS_LABELS[statusAtEndOfDay]}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {anomaly.startTime.slice(5, 16)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 mb-2">
                    {anomaly.type === "over_high" ? "温度超高" : "温度超低"} ·{" "}
                    {anomaly.maxTemp.toFixed(1)}°C · {PHASE_LABELS[anomaly.phase]} ·{" "}
                    {anomaly.compartment}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {handlers.length > 0 && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <User size={12} />
                        <span>接手人：{handlers.join("、")}</span>
                      </div>
                    )}
                    {latestRecord && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <ArrowRight size={12} />
                        <span>
                          最后：{HANDLE_ACTION_LABELS[latestRecord.action]} ·{" "}
                          {latestRecord.handleTime.slice(11, 16)}
                        </span>
                      </div>
                    )}
                  </div>
                  {shiftNote && (
                    <div className="mt-2 pt-2 border-t border-slate-800/50">
                      <div className="flex items-start gap-2 text-xs">
                        <ClipboardCheck size={12} className="text-cyan-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <span className="text-slate-300">{shiftNote.note}</span>
                          <span className="text-slate-500 ml-2">— {shiftNote.author}（{shiftNote.shift}）</span>
                          {shiftNote.confirmedBy ? (
                            <span className="text-emerald-400 ml-2">
                              已由 {shiftNote.confirmedAt} {shiftNote.confirmedBy} 确认接手
                            </span>
                          ) : (
                            <span className="text-amber-400 ml-2">待确认</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            {report.anomalySummary.filter((s) => s.statusAtEndOfDay !== "resolved")
              .length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500/50" />
                所有异常已闭环
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-400" />
              <span className="font-semibold">今日处理记录</span>
              <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
                {report.handoverRecords.length} 条
              </span>
            </div>
          </div>
          <div className="divide-y divide-slate-800/50 max-h-96 overflow-auto">
            {report.handoverRecords.map((record) => {
              const anomaly = report.anomalySummary.find(
                (s) => s.anomaly.id === record.anomalyId
              )?.anomaly;
              return (
                <div key={record.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm">
                        {anomaly?.plateNumber || "--"}
                      </span>
                      <span className="text-xs text-blue-400">
                        {HANDLE_ACTION_LABELS[record.action]}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {record.handleTime.slice(11, 16)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 mb-1">{record.remark}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <User size={12} />
                    {record.handler}
                  </div>
                </div>
              );
            })}
            {report.handoverRecords.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                今日暂无处理记录
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <ClipboardCheck size={16} className="text-cyan-400" />
            <span className="font-semibold">当日交班备注</span>
            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
              {report.shiftNotes.length} 条
            </span>
          </div>
          <div className="divide-y divide-slate-800/50 max-h-80 overflow-auto">
            {report.shiftNotes.map((note) => (
              <div key={note.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm">{note.plateNumber}</span>
                    <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                      {note.shift}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {note.createdAt.slice(11, 16)}
                  </span>
                </div>
                <div className="text-sm text-slate-300 mb-2">{note.note}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <User size={12} />
                    {note.author}（{note.shift}）
                  </span>
                  {note.confirmedBy ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      已确认
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Clock size={12} />
                      待确认
                    </span>
                  )}
                </div>
              </div>
            ))}
            {report.shiftNotes.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                当日无交班备注
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">当日接班确认</span>
            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
              {report.confirmedTakeovers.length} 条
            </span>
          </div>
          <div className="divide-y divide-slate-800/50 max-h-80 overflow-auto">
            {report.confirmedTakeovers.map((note) => (
              <div key={note.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm">{note.plateNumber}</span>
                    <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                      {note.shift}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {note.confirmedAt?.slice(11, 16)}
                  </span>
                </div>
                <div className="text-sm text-slate-300 mb-2">{note.note}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <User size={12} />
                  接班确认：{note.confirmedBy}
                </div>
              </div>
            ))}
            {report.confirmedTakeovers.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                当日无接班确认
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-emerald-400" />
            <span className="font-semibold">日报预览</span>
          </div>
        </div>
        <div className="p-5 font-mono text-sm text-slate-300 whitespace-pre-wrap bg-slate-950/50 max-h-80 overflow-auto">
          {generateReportText(report)}
        </div>
      </div>
    </div>
  );
}

function generateReportText(report: DailyReportType): string {
  const now = new Date();
  const lines: string[] = [];

  lines.push("══════════════════════════════════════════════");
  lines.push("           冷 链 运 输 值 班 日 报");
  lines.push("══════════════════════════════════════════════");
  lines.push("");
  lines.push(`日期：${report.date}`);
  lines.push(`生成时间：${formatDateTime(now.toISOString())}`);
  lines.push("");
  lines.push("──────────────────────────────────────────────");
  lines.push("一、当日统计");
  lines.push("──────────────────────────────────────────────");
  lines.push(`  在途车辆数：${report.totalVehiclesInTransit} 辆`);
  lines.push(`  当日新增异常：${report.newAnomaliesToday} 条`);
  lines.push(`  未闭环异常：${report.unresolvedAnomalies} 条`);
  lines.push(`  今日闭环：${report.resolvedToday} 条`);
  lines.push(`  今日处理记录：${report.processingToday} 条`);
  lines.push("");
  lines.push("──────────────────────────────────────────────");
  lines.push("二、未闭环异常清单");
  lines.push("──────────────────────────────────────────────");

  const unresolved = report.anomalySummary.filter(
    (s) => s.statusAtEndOfDay !== "resolved"
  );

  if (unresolved.length === 0) {
    lines.push("  所有异常已闭环 ✓");
  } else {
    unresolved.forEach(({ anomaly, latestRecord, handlers, shiftNote, statusAtEndOfDay }, idx) => {
      lines.push(`  ${idx + 1}. ${anomaly.plateNumber}`);
      lines.push(`     状态：${ANOMALY_STATUS_LABELS[statusAtEndOfDay]}`);
      lines.push(
        `     异常：${anomaly.type === "over_high" ? "温度超高" : "温度超低"} ${
          anomaly.maxTemp
        }°C · ${PHASE_LABELS[anomaly.phase]} · ${anomaly.compartment}`
      );
      lines.push(`     开始时间：${anomaly.startTime}`);
      lines.push(`     持续时间：${formatDuration(anomaly.durationMinutes)}`);
      if (handlers.length > 0) {
        lines.push(`     接手人：${handlers.join("、")}`);
      }
      if (latestRecord) {
        lines.push(
          `     最后处理：${HANDLE_ACTION_LABELS[latestRecord.action]} · ${
            latestRecord.handler
          } · ${latestRecord.handleTime}`
        );
      }
      if (latestRecord?.remark) {
        lines.push(`     备注：${latestRecord.remark}`);
      }
      if (shiftNote) {
        lines.push(`     交班备注：${shiftNote.note}`);
        lines.push(`     备注人：${shiftNote.author}（${shiftNote.shift}）`);
        if (shiftNote.confirmedBy) {
          lines.push(`     接班确认：已由 ${shiftNote.confirmedAt} ${shiftNote.confirmedBy} 确认接手`);
        } else {
          lines.push(`     接班确认：待确认`);
        }
      }
      lines.push("");
    });
  }

  lines.push("──────────────────────────────────────────────");
  lines.push("三、今日处理记录");
  lines.push("──────────────────────────────────────────────");

  if (report.handoverRecords.length === 0) {
    lines.push("  今日暂无处理记录");
  } else {
    report.handoverRecords.forEach((record, idx) => {
      const anomaly = report.anomalySummary.find(
        (s) => s.anomaly.id === record.anomalyId
      )?.anomaly;
      lines.push(`  ${idx + 1}. [${record.handleTime}] ${anomaly?.plateNumber || "--"}`);
      lines.push(`     动作：${HANDLE_ACTION_LABELS[record.action]}`);
      lines.push(`     处理人：${record.handler}`);
      lines.push(`     备注：${record.remark}`);
      lines.push("");
    });
  }

  lines.push("──────────────────────────────────────────────");
  lines.push("四、交班备注");
  lines.push("──────────────────────────────────────────────");

  if (report.shiftNotes.length === 0) {
    lines.push("  当日无交班备注");
  } else {
    report.shiftNotes.forEach((note, idx) => {
      lines.push(`  ${idx + 1}. [${note.plateNumber}] ${note.note}`);
      lines.push(`     备注人：${note.author}（${note.shift}）`);
      lines.push(`     时间：${note.createdAt}`);
      if (note.confirmedBy) {
        lines.push(`     状态：已确认`);
      } else {
        lines.push(`     状态：待确认`);
      }
      lines.push("");
    });
  }

  lines.push("──────────────────────────────────────────────");
  lines.push("五、接班确认");
  lines.push("──────────────────────────────────────────────");

  if (report.confirmedTakeovers.length === 0) {
    lines.push("  当日无接班确认");
  } else {
    report.confirmedTakeovers.forEach((note, idx) => {
      lines.push(`  ${idx + 1}. [${note.plateNumber}] ${note.note}`);
      lines.push(`     接班确认人：${note.confirmedBy}`);
      lines.push(`     确认时间：${note.confirmedAt}`);
      lines.push("");
    });
  }

  lines.push("──────────────────────────────────────────────");
  lines.push("  值班员签字：______________");
  lines.push("  接班员签字：______________");
  lines.push("══════════════════════════════════════════════");

  return lines.join("\n");
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400",
    red: "from-red-500/20 to-red-500/5 border-red-500/20 text-red-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400",
    green: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400",
  };

  return (
    <div
      className={`bg-gradient-to-b border rounded-xl p-4 ${colorMap[color]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs opacity-70">{label}</span>
        <Icon size={18} className="opacity-70" />
      </div>
      <div className="text-3xl font-bold font-mono">{value}</div>
    </div>
  );
}
