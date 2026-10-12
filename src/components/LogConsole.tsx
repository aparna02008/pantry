import { Terminal, Trash2 } from "lucide-react";

export interface LogEntry {
  timestamp: string;
  type: "success" | "error" | "info";
  message: string;
}

interface LogConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

export default function LogConsole({ logs, onClear }: LogConsoleProps) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 font-mono shadow-inner max-w-full">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5 mb-3">
        <div className="flex items-center space-x-2 text-gray-400 text-xs">
          <Terminal className="h-4 w-4 text-emerald-500 animate-pulse" />
          <span className="font-bold tracking-wider uppercase text-[10px]">Diagnostics & Server Logs</span>
        </div>
        {logs.length > 0 && (
          <button
            onClick={onClear}
            className="text-gray-500 hover:text-red-400 transition-colors flex items-center space-x-1 text-xs px-2 py-1 rounded hover:bg-gray-800"
            title="Clear Terminal Logs"
            id="btn-clear-logs"
          >
            <Trash2 className="h-3 w-3" />
            <span className="text-[10px] uppercase font-bold">Clear</span>
          </button>
        )}
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent" id="terminal-log-rows">
        {logs.length === 0 ? (
          <div className="text-gray-600 italic text-center py-4">
            System idle. Add ingredients, upload images, or trigger meal formulations to view backend lifecycle logs.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2 leading-relaxed" id={`log-row-${idx}`}>
              <span className="text-gray-600 shrink-0 font-medium select-none">[{log.timestamp}]</span>
              <span
                className={`font-semibold shrink-0 select-none ${
                  log.type === "success"
                    ? "text-emerald-400"
                    : log.type === "error"
                    ? "text-rose-400"
                    : "text-sky-400"
                }`}
              >
                {log.type.toUpperCase()}:
              </span>
              <span className="text-gray-300 break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
