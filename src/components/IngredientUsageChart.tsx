import { useState, useMemo } from "react";
import { CookedMealLog } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar, Utensils, Sparkles, Trash2, Layers } from "lucide-react";

interface IngredientUsageChartProps {
  cookedLogs: CookedMealLog[];
  onClearLogs?: () => void;
  onSeedSampleData?: () => void;
}

const PALETTE = [
  "#10b981", // emerald-500
  "#0ea5e9", // sky-500
  "#f59e0b", // amber-500
  "#8b5cf6", // purple-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
];

export default function IngredientUsageChart({
  cookedLogs,
  onClearLogs,
  onSeedSampleData,
}: IngredientUsageChartProps) {
  const [chartView, setChartView] = useState<"timeline" | "top_ingredients" | "distribution">("timeline");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [timeRange, setTimeRange] = useState<"7" | "14" | "30" | "all">("14");

  // Calculate filtered logs by time range
  const filteredLogs = useMemo(() => {
    if (timeRange === "all") return cookedLogs;
    const days = parseInt(timeRange, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return cookedLogs.filter((log) => new Date(log.timestamp) >= cutoff);
  }, [cookedLogs, timeRange]);

  // Aggregate stats
  const totalMeals = filteredLogs.length;
  const totalIngredientsUsed = useMemo(() => {
    return filteredLogs.reduce((sum, log) => sum + log.ingredientsUsed.length, 0);
  }, [filteredLogs]);

  const avgIngredientsPerMeal = totalMeals > 0 ? (totalIngredientsUsed / totalMeals).toFixed(1) : "0";

  // Frequency map of individual ingredients
  const ingredientFrequencyMap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      log.ingredientsUsed.forEach((ing) => {
        const clean = ing.trim().toLowerCase();
        if (clean) {
          const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
          map[capitalized] = (map[capitalized] || 0) + 1;
        }
      });
    });
    return map;
  }, [filteredLogs]);

  const topIngredientsList = useMemo(() => {
    return Object.entries(ingredientFrequencyMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [ingredientFrequencyMap]);

  const topIngredientName = topIngredientsList.length > 0 ? topIngredientsList[0].name : "N/A";

  // Data for Timeline Chart (grouped by date YYYY-MM-DD or formatted)
  const timelineData = useMemo(() => {
    const daysCount = timeRange === "all" ? 14 : parseInt(timeRange, 10);
    const dateMap: Record<string, { dateStr: string; formattedDate: string; itemsCount: number; mealsCount: number }> = {};

    // Initialize consecutive dates for smooth timeline
    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const isoDate = d.toISOString().split("T")[0];
      const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dateMap[isoDate] = {
        dateStr: isoDate,
        formattedDate: formatted,
        itemsCount: 0,
        mealsCount: 0,
      };
    }

    // Populate actual logs into timeline
    filteredLogs.forEach((log) => {
      const logDate = log.date || (log.timestamp ? log.timestamp.split("T")[0] : null);
      if (logDate) {
        if (!dateMap[logDate]) {
          const d = new Date(logDate);
          const formatted = isNaN(d.getTime())
            ? logDate
            : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          dateMap[logDate] = {
            dateStr: logDate,
            formattedDate: formatted,
            itemsCount: 0,
            mealsCount: 0,
          };
        }
        dateMap[logDate].itemsCount += log.ingredientsUsed.length;
        dateMap[logDate].mealsCount += 1;
      }
    });

    return Object.values(dateMap).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [filteredLogs, timeRange]);

  // Data for Top Ingredients Bar/Pie Chart
  const top10IngredientsData = useMemo(() => {
    return topIngredientsList.slice(0, 10);
  }, [topIngredientsList]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-800 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 font-mono">
          <p className="font-extrabold text-emerald-400 border-b border-gray-800 pb-1 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="flex items-center justify-between gap-4">
              <span className="capitalize text-gray-300" style={{ color: entry.color }}>
                ● {entry.name}:
              </span>
              <span className="font-black text-white">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs" id="ingredient-usage-visualization">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              Recharts Analytics
            </span>
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-xs text-gray-500 font-medium">Real-time Culinary Metrics</span>
          </div>
          <h3 className="text-base font-extrabold text-gray-900 mt-1 flex items-center gap-2">
            Ingredient Usage Over Time
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Track pantry items depleted as you cook zero-waste meals
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onSeedSampleData && cookedLogs.length === 0 && (
            <button
              onClick={onSeedSampleData}
              className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs select-none"
              id="btn-seed-sample-chart-data"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Load Sample Data
            </button>
          )}

          {cookedLogs.length > 0 && onClearLogs && (
            <button
              onClick={onClearLogs}
              className="text-xs font-bold text-gray-400 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-transparent hover:border-rose-100 select-none"
              title="Clear Cooking Logs"
              id="btn-clear-cooking-logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Log
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" id="usage-summary-cards">
        <div className="bg-emerald-50/50 border border-emerald-100/80 p-3.5 rounded-xl">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <Utensils className="h-3 w-3" /> Meals Cooked
          </p>
          <p className="text-xl font-black text-gray-900 mt-1">{totalMeals}</p>
        </div>

        <div className="bg-sky-50/50 border border-sky-100/80 p-3.5 rounded-xl">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1">
            <Layers className="h-3 w-3" /> Items Saved
          </p>
          <p className="text-xl font-black text-gray-900 mt-1">{totalIngredientsUsed}</p>
        </div>

        <div className="bg-amber-50/50 border border-amber-100/80 p-3.5 rounded-xl">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Top Staple
          </p>
          <p className="text-sm font-black text-gray-900 mt-2 truncate capitalize">{topIngredientName}</p>
        </div>

        <div className="bg-purple-50/50 border border-purple-100/80 p-3.5 rounded-xl">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-1">
            <BarChart3 className="h-3 w-3" /> Avg / Dish
          </p>
          <p className="text-xl font-black text-gray-900 mt-1">{avgIngredientsPerMeal} items</p>
        </div>
      </div>

      {/* Chart Filter & Mode Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-150 mb-6" id="chart-controls-bar">
        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setChartView("timeline")}
            className={`text-xs font-bold px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              chartView === "timeline"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
            id="view-btn-timeline"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Usage Timeline
          </button>
          <button
            onClick={() => setChartView("top_ingredients")}
            className={`text-xs font-bold px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              chartView === "top_ingredients"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
            id="view-btn-top-ingredients"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Top Ingredients
          </button>
          <button
            onClick={() => setChartView("distribution")}
            className={`text-xs font-bold px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              chartView === "distribution"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
            id="view-btn-distribution"
          >
            <PieChartIcon className="h-3.5 w-3.5" />
            Share Breakdown
          </button>
        </div>

        {/* Additional Controls */}
        <div className="flex items-center gap-3">
          {chartView === "timeline" && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setChartType("area")}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition-all ${
                  chartType === "area" ? "bg-emerald-100 text-emerald-800" : "text-gray-500"
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition-all ${
                  chartType === "bar" ? "bg-emerald-100 text-emerald-800" : "text-gray-500"
                }`}
              >
                Bar
              </button>
            </div>
          )}

          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-600">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-transparent focus:outline-hidden text-xs font-bold text-gray-800 cursor-pointer"
              id="time-range-select"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recharts Canvas */}
      {cookedLogs.length === 0 ? (
        <div className="py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6" id="chart-empty-state">
          <Utensils className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-800">No Cooking Data Recorded Yet</p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
            When you cook a recipe and click <strong>"I Cooked This! 🍳"</strong>, your ingredient usage history will populate this interactive Recharts visualization automatically!
          </p>
          {onSeedSampleData && (
            <button
              onClick={onSeedSampleData}
              className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              id="btn-seed-empty-chart"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Pre-populate Sample Analytics
            </button>
          )}
        </div>
      ) : (
        <div className="h-72 w-full pt-2" id="recharts-container">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === "timeline" ? (
              chartType === "area" ? (
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Area
                    type="monotone"
                    dataKey="itemsCount"
                    name="Ingredients Depleted"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#emeraldGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="mealsCount"
                    name="Dishes Cooked"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#skyGradient)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="itemsCount" name="Ingredients Depleted" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mealsCount" name="Dishes Cooked" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              )
            ) : chartView === "top_ingredients" ? (
              <BarChart
                layout="vertical"
                data={top10IngredientsData}
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={11} width={80} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Times Used in Dishes" fill="#10b981" radius={[0, 6, 6, 0]}>
                  {top10IngredientsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                  data={top10IngredientsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {top10IngredientsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
