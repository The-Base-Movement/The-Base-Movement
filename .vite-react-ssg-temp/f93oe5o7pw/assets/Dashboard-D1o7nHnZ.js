import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Activity, Users, MapPin, Trash2, ShoppingBag, Globe } from "lucide-react";
import { t as useToast, b as BrandLine, B as Button, C as Card, j as CardHeader, v as CardTitle, w as CardDescription, d as CardContent, c as cn, a as adminService, l as logisticsService, x as contentService } from "../main.mjs";
import { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Area } from "recharts";
import { useNavigate } from "react-router-dom";
import "vite-react-ssg";
import "@tanstack/react-query";
import "react-helmet-async";
import "@supabase/supabase-js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "sonner";
import "react-easy-crop";
import "qrcode.react";
import "date-fns";
import "@radix-ui/react-label";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-toast";
function SkeletonCard() {
  return /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-none overflow-hidden bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5 space-y-3", children: [
    /* @__PURE__ */ jsx("dt", { className: "w-1/4 h-2 bg-muted/10 animate-pulse rounded-full" }),
    /* @__PURE__ */ jsx("dd", { className: "m-0 w-1/2 h-6 bg-muted/10 animate-pulse rounded-sm" })
  ] }) });
}
function StatCard({ title, value, change, icon: Icon, color }) {
  return /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 shadow-sm transition-all overflow-hidden bg-white hover:border-border/60", children: /* @__PURE__ */ jsx(CardContent, { className: "p-4 sm:p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx("dt", { className: "text-micro font-bold text-muted-foreground uppercase tracking-widest truncate", children: title }),
      /* @__PURE__ */ jsxs("dd", { className: "m-0 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xl sm:text-2xl font-bold text-on-surface tabular-nums truncate", children: value }),
        /* @__PURE__ */ jsx("span", { className: cn(
          "text-micro font-bold flex items-center gap-0.5 whitespace-nowrap",
          change.startsWith("+") ? "text-primary" : "text-muted-foreground"
        ), children: change })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: cn("w-8 h-8 shrink-0 flex items-center justify-center rounded-sm bg-muted/10", color.replace("bg-", "text-")), children: /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }) })
  ] }) }) });
}
function AdminDashboard() {
  const [growthData, setGrowthData] = useState([]);
  const [sentimentStats, setSentimentStats] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [regionalStats, setRegionalStats] = useState([]);
  const [globalStats, setGlobalStats] = useState([]);
  const [logisticsData, setLogisticsData] = useState([]);
  const [trashCount, setTrashCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      console.log("[SYSTEM] Dashboard: Starting data fetch...");
      setIsLoading(true);
      try {
        const [growth, sentiment, audit, regions, stats, logistics, trashedBlogs, trashedProducts, trashedMedia] = await Promise.all([
          adminService.getGrowthTrends(),
          adminService.getSentimentAnalysis(),
          adminService.getSystemAuditLogs(),
          adminService.getRegionalStats(),
          adminService.getGlobalStats(),
          logisticsService.getLogisticsLatency(),
          contentService.getTrashedBlogPosts(),
          logisticsService.getTrashedInventory(),
          contentService.getTrashedMedia()
        ]);
        setGrowthData(growth);
        setSentimentStats(sentiment);
        setAuditLogs(audit);
        setRegionalStats(regions);
        setGlobalStats(stats);
        setLogisticsData(logistics);
        setTrashCount(trashedBlogs.length + trashedProducts.length + trashedMedia.length);
        console.log("[SYSTEM] Dashboard: Data fetch complete.");
      } catch (error) {
        console.error("[SYSTEM] Dashboard: Data fetch failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    if (regionalStats.length === 0) {
      toast({
        title: "No data available",
        description: "There is no regional data to export at this time.",
        variant: "destructive"
      });
      return;
    }
    setIsExporting(true);
    toast({
      title: "Generating export",
      description: "Aggregating regional performance telemetry..."
    });
    try {
      const headers = ["Region", "Member Count", "Chapters", "Performance Status", "Activity Level"];
      const rows = regionalStats.map((r) => [
        r.region,
        r.memberCount,
        r.chapters,
        r.performance,
        r.memberCount > 1e3 ? "Peak" : r.memberCount > 100 ? "High" : "Normal"
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      a.setAttribute("href", url);
      a.setAttribute("download", `base_regional_performance_${timestamp}.csv`);
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      setIsExporting(false);
      toast({
        title: "Export complete",
        description: "The regional performance report has been successfully generated."
      });
    } catch (error) {
      console.error("[DASHBOARD] Export failure:", error);
      setIsExporting(false);
      toast({
        title: "Export failed",
        description: "A critical error occurred during data aggregation.",
        variant: "destructive"
      });
    }
  };
  const handlePlatformLogs = () => {
    navigate("/admin/settings?tab=audit");
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Activity, { className: "w-8 h-8 text-on-surface" }),
          "Operational dashboard"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mt-1", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-xs flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 bg-primary rounded-full" }),
            "16 regions active"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs font-medium", children: "Telemetry updated 2m ago" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "primary",
            size: "lg",
            className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            onClick: handleExport,
            disabled: isExporting,
            children: isExporting ? "Exporting telemetry..." : "Export regional data"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "default",
            size: "lg",
            className: "rounded-sm text-micro font-bold tracking-tight px-10 border-border/40 hover:bg-stone-50 h-12 transition-all active:scale-95",
            onClick: handlePlatformLogs,
            children: "System logs"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("dl", { className: "grid-stats mb-8", style: { "--grid-min-width": "220px" }, children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(SkeletonCard, {}),
      /* @__PURE__ */ jsx(SkeletonCard, {}),
      /* @__PURE__ */ jsx(SkeletonCard, {}),
      /* @__PURE__ */ jsx(SkeletonCard, {})
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(StatCard, { title: "Members", value: globalStats[0]?.value || "0", change: globalStats[0]?.change || "0%", icon: Users, color: "bg-destructive" }),
      /* @__PURE__ */ jsx(StatCard, { title: "Chapters", value: globalStats[1]?.value || "0", change: globalStats[1]?.change || "0%", icon: MapPin, color: "bg-accent" }),
      /* @__PURE__ */ jsx(StatCard, { title: "Trash Vault", value: trashCount.toString(), change: "30d retention", icon: Trash2, color: "bg-on-surface" }),
      /* @__PURE__ */ jsx(StatCard, { title: "Inventory", value: globalStats[3]?.value || "0", change: globalStats[3]?.change || "0%", icon: ShoppingBag, color: "bg-primary" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-10 items-start", children: [
      /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 space-y-10", children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden bg-white", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-on-surface flex items-center gap-2", children: "Membership Growth" }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-tiny font-medium text-muted-foreground/80 mt-1", children: "Rolling 30-day expansion trend" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex items-center gap-6 mr-6 border-r border-border/40 pr-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 uppercase tracking-widest leading-none mb-1.5", children: "Total Growth" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-tiny font-bold text-primary", children: [
                    "+",
                    growthData.reduce((acc, curr) => acc + curr.count, 0).toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 uppercase tracking-widest leading-none mb-1.5", children: "Peak Day" }),
                  /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-on-surface", children: Math.max(...growthData.map((d) => d.count), 0) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 uppercase tracking-widest leading-none mb-1.5", children: "Avg/Day" }),
                  /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-on-surface", children: (growthData.reduce((acc, curr) => acc + curr.count, 0) / (growthData.length || 1)).toFixed(0) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "h-7 px-2 bg-white border border-border/60 text-micro font-bold text-on-surface/80 rounded-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all", children: [
                /* @__PURE__ */ jsx("option", { children: "Last 30 Days" }),
                /* @__PURE__ */ jsx("option", { children: "Last 90 Days" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-8 h-[360px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: growthData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [
            /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "colorGrowth", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "hsl(var(--destructive))", stopOpacity: 0.15 }),
              /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "hsl(var(--destructive))", stopOpacity: 0.01 })
            ] }) }),
            /* @__PURE__ */ jsx(
              CartesianGrid,
              {
                strokeDasharray: "3 3",
                vertical: false,
                horizontal: true,
                stroke: "hsl(var(--border) / 0.3)"
              }
            ),
            /* @__PURE__ */ jsx(
              XAxis,
              {
                dataKey: "date",
                axisLine: false,
                tickLine: false,
                tick: { fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground) / 0.8)" },
                tickFormatter: (value) => value.toUpperCase(),
                dy: 12
              }
            ),
            /* @__PURE__ */ jsx(
              YAxis,
              {
                axisLine: false,
                tickLine: false,
                tick: { fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground) / 0.8)" }
              }
            ),
            /* @__PURE__ */ jsx(
              Tooltip,
              {
                cursor: { fill: "hsl(var(--muted) / 0.3)", radius: 2 },
                content: ({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return /* @__PURE__ */ jsxs("div", { className: "bg-on-surface p-3 border border-white/10 rounded-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 min-w-[140px]", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 border-b border-white/5 pb-1.5", children: label }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
                          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-white/60 uppercase", children: "Daily Gain" }),
                          /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-white", children: [
                            "+",
                            payload[0].value
                          ] })
                        ] }),
                        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: /* @__PURE__ */ jsx("div", { className: "h-1 flex-1 bg-white/5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                          "div",
                          {
                            className: "h-full bg-primary transition-all duration-500",
                            style: { width: `${Number(payload[0].value) / Math.max(...growthData.map((d) => d.count), 1) * 100}%` }
                          }
                        ) }) })
                      ] })
                    ] });
                  }
                  return null;
                }
              }
            ),
            /* @__PURE__ */ jsx(
              Bar,
              {
                dataKey: "count",
                fill: "hsl(var(--destructive))",
                radius: [2, 2, 0, 0],
                barSize: 12,
                animationDuration: 1500
              }
            ),
            /* @__PURE__ */ jsx(
              Area,
              {
                type: "monotone",
                dataKey: "count",
                stroke: "none",
                fill: "url(#colorGrowth)",
                animationDuration: 2500
              }
            )
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden bg-white", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/5 flex flex-row items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-on-surface", children: "Regional Distribution" }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-tiny font-medium text-muted-foreground/80 mt-1", children: "Top performing regions by member count" })
            ] }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", className: "h-7 px-2 text-micro font-bold tracking-tight text-muted-foreground/80 hover:text-on-surface active:scale-95", children: "View All" })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/30 border-b border-border/40", children: [
              /* @__PURE__ */ jsx("th", { className: "p-4 pl-6 text-micro font-bold tracking-tight text-muted-foreground/80", children: "Region" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-micro font-bold tracking-tight text-muted-foreground/80", children: "Members" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-micro font-bold tracking-tight text-muted-foreground/80", children: "Chapters" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 pr-6 text-right text-micro font-bold tracking-tight text-muted-foreground/80", children: "Status" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: regionalStats.filter((r) => r.memberCount > 0).length > 0 ? regionalStats.filter((r) => r.memberCount > 0).slice(0, 5).map((region) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/5 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "p-4 pl-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full", style: { backgroundColor: region.color } }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-on-surface", children: region.region })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-medium text-on-surface/80 tabular-nums", children: region.memberCount.toLocaleString() }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-medium text-on-surface/80 tabular-nums", children: region.chapters }),
              /* @__PURE__ */ jsx("td", { className: "p-4 pr-6 text-right", children: /* @__PURE__ */ jsx("span", { className: cn(
                "px-2 py-0.5 text-micro font-bold rounded-full",
                region.performance === "High" ? "bg-primary/10 text-primary" : "bg-border/40 text-muted-foreground/80"
              ), children: region.performance }) })
            ] }, region.region)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "p-12 text-center text-muted-foreground/80 text-xs font-medium italic", children: "No regional data available for current filters." }) }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-10", children: [
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden bg-white", children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/5", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-on-surface", children: "System Activity" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
              /* @__PURE__ */ jsx("table", { className: "w-full text-left", children: /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: auditLogs.length > 0 ? auditLogs.slice(0, 6).map((log) => /* @__PURE__ */ jsxs("tr", { className: "text-tiny hover:bg-muted/5 transition-colors", children: [
                /* @__PURE__ */ jsx("td", { className: "p-4 pl-6 text-muted-foreground/80 font-medium whitespace-nowrap", children: new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }),
                /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-on-surface", children: log.adminName.split(" ")[0] }),
                  /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/80 ml-1.5", children: log.action.toLowerCase() })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "p-4 pr-6 text-right", children: /* @__PURE__ */ jsx("div", { className: cn(
                  "w-1.5 h-1.5 rounded-full inline-block",
                  log.status === "Success" ? "bg-primary" : "bg-accent"
                ) }) })
              ] }, log.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { className: "p-12 text-center text-muted-foreground/80 text-xs font-medium italic", children: "No recent system activity." }) }) }) }),
              /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-border/40 text-center", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: handlePlatformLogs, className: "h-7 text-micro font-bold tracking-tight text-muted-foreground/80 hover:text-on-surface active:scale-95", children: "View full activity log" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden bg-white", children: [
            /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/5 flex flex-row items-center justify-between", children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-on-surface", children: "Logistics Performance" }),
              /* @__PURE__ */ jsx(ShoppingBag, { className: "w-4 h-4 text-muted-foreground/40" })
            ] }),
            /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-6", children: [
              logisticsData.length > 0 ? logisticsData.slice(0, 3).map((item) => /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-wide", children: item.region }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-on-surface tabular-nums", children: [
                    item.avgDispatchToDeliveryDays,
                    "d ",
                    /* @__PURE__ */ jsx("span", { className: "text-micro font-medium text-muted-foreground/80 ml-1", children: "avg" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-1 w-full bg-muted/10 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-on-surface rounded-full", style: { width: `${Math.min(100, 3 / item.avgDispatchToDeliveryDays * 100)}%` } }) })
              ] }, item.region)) : /* @__PURE__ */ jsx("div", { className: "py-8 text-center text-muted-foreground/80 text-xs font-medium italic", children: "Logistics data unavailable." }),
              /* @__PURE__ */ jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-muted/10 rounded-sm p-4 flex justify-between items-center border border-border/40", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Overall velocity" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-on-surface tracking-tight", children: "3.2 Days" })
              ] }) })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-10", children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white overflow-hidden", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/5", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-tiny font-bold tracking-tight text-muted-foreground/80", children: "Operations health" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium text-on-surface/80", children: "Infrastructure" }),
                /* @__PURE__ */ jsx("span", { className: "text-primary font-bold", children: "Optimal" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium text-on-surface/80", children: "Database Engine" }),
                /* @__PURE__ */ jsx("span", { className: "text-primary font-bold", children: "Stable" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium text-on-surface/80", children: "Regional Sync" }),
                /* @__PURE__ */ jsx("span", { className: "text-primary font-bold", children: "Active" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-px bg-border/40" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Sentiment pulse" }),
              sentimentStats.length > 0 && sentimentStats.some((s) => s.score > 0) ? sentimentStats.slice(0, 3).map((stat) => /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-on-surface", children: stat.topic }),
                  /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold tabular-nums", children: [
                    stat.score,
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-1 w-full bg-muted/10 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-on-surface opacity-20 rounded-full", style: { width: `${stat.score}%` } }) })
              ] }, stat.topic)) : /* @__PURE__ */ jsx("div", { className: "text-center text-muted-foreground/80 text-micro font-medium italic py-4", children: "No recent sentiment data." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-px bg-border/40" }),
            /* @__PURE__ */ jsxs("div", { className: "bg-on-surface rounded-sm p-6 text-white relative overflow-hidden group shadow-lg", children: [
              /* @__PURE__ */ jsx(Globe, { className: "absolute -bottom-6 -right-6 w-32 h-32 text-white/5" }),
              /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-6", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-primary rounded-full animate-pulse" }),
                  /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight text-white/70", children: "Core system status" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-4xl font-bold tabular-nums tracking-tighter", children: "99.8%" }),
                  /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-white/60 tracking-tight uppercase", children: "Operational" })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white overflow-hidden", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/5", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-tiny font-bold tracking-tight text-muted-foreground/80", children: "Regional traffic" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-sm bg-muted/10 flex items-center justify-center text-micro font-bold text-on-surface border border-border/40", children: "GA" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface", children: "Greater Accra" }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/80 font-medium", children: "Peak flow detected" })
                ] })
              ] }),
              /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 text-destructive" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-sm bg-muted/10 flex items-center justify-center text-micro font-bold text-on-surface border border-border/40", children: "AS" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface", children: "Ashanti" }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/80 font-medium", children: "Normal operations" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-primary rounded-full" })
            ] })
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminDashboard as default
};
