/**
 * Jalaku — Dashboard Analytics Charts (React Island)
 *
 * 4 chart sections using Recharts with DUMMY DATA:
 * 1. Revenue Trend — Area Chart (6-month trend)
 * 2. Orders Status — Stacked Bar (success vs cancelled per month)
 * 3. Bookings Overview — Bar Chart (active/completed)
 * 4. Reviews Distribution — Bar Chart with interactive star filter
 *
 * All data is static dummy data — no API integration.
 * Dark mode aware via theme store.
 */

import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $isDark } from "../../stores/themeStore";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ============ DUMMY DATA ============

const revenueData = [
  { month: "Jan", pendapatan: 4200000 },
  { month: "Feb", pendapatan: 5800000 },
  { month: "Mar", pendapatan: 4900000 },
  { month: "Apr", pendapatan: 7200000 },
  { month: "Mei", pendapatan: 6100000 },
  { month: "Jun", pendapatan: 8500000 },
  { month: "Jul", pendapatan: 7800000 },
  { month: "Agu", pendapatan: 9200000 },
  { month: "Sep", pendapatan: 8100000 },
  { month: "Okt", pendapatan: 10500000 },
  { month: "Nov", pendapatan: 9800000 },
  { month: "Des", pendapatan: 12000000 },
];

const ordersStatusData = [
  { month: "Jul", sukses: 45, batal: 5 },
  { month: "Agu", sukses: 52, batal: 8 },
  { month: "Sep", sukses: 48, batal: 3 },
  { month: "Okt", sukses: 61, batal: 7 },
  { month: "Nov", sukses: 55, batal: 4 },
  { month: "Des", sukses: 72, batal: 6 },
];

const bookingsData = [
  { month: "Jul", aktif: 12, selesai: 30 },
  { month: "Agu", aktif: 18, selesai: 28 },
  { month: "Sep", aktif: 15, selesai: 35 },
  { month: "Okt", aktif: 22, selesai: 40 },
  { month: "Nov", aktif: 20, selesai: 38 },
  { month: "Des", aktif: 25, selesai: 45 },
];

// Full reviews dataset — each review has a star rating
const allReviews = [
  { rating: 5, count: 48 },
  { rating: 4, count: 32 },
  { rating: 3, count: 15 },
  { rating: 2, count: 7 },
  { rating: 1, count: 3 },
];

const STAR_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
const PIE_COLORS_LIGHT = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];
const PIE_COLORS_DARK = ["#4ade80", "#a3e635", "#facc15", "#fb923c", "#f87171"];

function formatRupiahShort(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
  return value.toString();
}

function formatRupiahFull(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

type StarFilter = "all" | 1 | 2 | 3 | 4 | 5;

export default function DashboardCharts() {
  const isDark = useStore($isDark);
  const [starFilter, setStarFilter] = useState<StarFilter>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter reviews based on selected star
  const filteredReviews =
    starFilter === "all"
      ? allReviews
      : allReviews.filter((r) => r.rating === starFilter);

  // Chart colors that adapt to theme
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const textColor = isDark ? "#9CA3AF" : "#6B7280";
  const tooltipBg = isDark ? "#1F2937" : "#FFFFFF";
  const tooltipBorder = isDark ? "#374151" : "#E5E7EB";

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-xl px-4 py-3 shadow-xl border text-sm"
        style={{
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
        }}
      >
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
          {label}
        </p>
        {payload.map((item: any, i: number) => (
          <p key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-500 dark:text-gray-400">
              {item.name}:
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">
              {item.name === "Pendapatan"
                ? formatRupiahFull(item.value)
                : item.value}
            </span>
          </p>
        ))}
      </div>
    );
  };

  // Section wrapper component
  const ChartCard = ({
    title,
    children,
    action,
  }: {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
  }) => (
    <div className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between flex-wrap gap-2">
        <h3
          className="text-base font-bold text-gray-900 dark:text-white"
          style={{ fontFamily: "Outfit, Montserrat, sans-serif" }}
        >
          {title}
        </h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  if (!mounted) {
    // SSR/hydration placeholder
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 h-80 animate-pulse"
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
              <div className="w-36 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="p-5 flex items-center justify-center h-56">
              <div className="w-full h-full bg-gray-100 dark:bg-gray-700/50 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ===== Chart 1: Revenue Trend (Area Chart) ===== */}
      <ChartCard title="📈 Tren Pendapatan">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isDark ? "#4ade80" : "#2D5016"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isDark ? "#4ade80" : "#2D5016"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatRupiahShort}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pendapatan"
              name="Pendapatan"
              stroke={isDark ? "#4ade80" : "#2D5016"}
              strokeWidth={2.5}
              fill="url(#gradientRevenue)"
              dot={{
                r: 4,
                fill: isDark ? "#4ade80" : "#2D5016",
                strokeWidth: 2,
                stroke: isDark ? "#1F2937" : "#FFFFFF",
              }}
              activeDot={{
                r: 6,
                fill: isDark ? "#4ade80" : "#2D5016",
                strokeWidth: 3,
                stroke: isDark ? "#1F2937" : "#FFFFFF",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ===== Chart 2: Orders Status (Stacked Bar) ===== */}
      <ChartCard title="📦 Status Pesanan">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ordersStatusData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: textColor }}
            />
            <Bar
              dataKey="sukses"
              name="Sukses"
              stackId="orders"
              fill={isDark ? "#4ade80" : "#22c55e"}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="batal"
              name="Batal"
              stackId="orders"
              fill={isDark ? "#f87171" : "#ef4444"}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ===== Chart 3: Bookings Overview (Bar Chart) ===== */}
      <ChartCard title="📅 Overview Booking">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={bookingsData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: textColor }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: textColor }}
            />
            <Bar
              dataKey="aktif"
              name="Aktif"
              fill={isDark ? "#fbbf24" : "#D4A853"}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="selesai"
              name="Selesai"
              fill={isDark ? "#4ade80" : "#2D5016"}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ===== Chart 4: Reviews Distribution (Pie + Filter) ===== */}
      <ChartCard
        title="⭐ Distribusi Review"
        action={
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", 5, 4, 3, 2, 1] as StarFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setStarFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  starFilter === filter
                    ? "bg-primary text-white dark:bg-green-600 shadow-md shadow-primary/20"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {filter === "all" ? "Semua" : `${filter}★`}
              </button>
            ))}
          </div>
        }
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Pie chart */}
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={filteredReviews}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="count"
                nameKey="rating"
                stroke="none"
              >
                {filteredReviews.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      (isDark ? PIE_COLORS_DARK : PIE_COLORS_LIGHT)[
                        5 - entry.rating
                      ]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} review`,
                  `${name}★`,
                ]}
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend breakdown */}
          <div className="flex flex-row sm:flex-col gap-3 flex-wrap justify-center min-w-[120px]">
            {filteredReviews.map((item) => {
              const total = filteredReviews.reduce((s, r) => s + r.count, 0);
              const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : "0";
              return (
                <div key={item.rating} className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: (isDark ? PIE_COLORS_DARK : PIE_COLORS_LIGHT)[
                        5 - item.rating
                      ],
                    }}
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {item.rating}★
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
