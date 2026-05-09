import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Package, Loader2, Filter, PackagePlus, CheckCircle2, AlertTriangle, Clock, TrendingUp, FileText, BarChart3, Map, History, ShieldCheck } from "lucide-react";
import { b as BrandLine, B as Button, C as Card, c as cn, j as CardHeader, v as CardTitle, w as CardDescription, d as CardContent, a as adminService } from "../main.mjs";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter } from "./alert-dialog-DitN4BtB.js";
import { format } from "date-fns";
import { toast } from "sonner";
import "vite-react-ssg";
import "@tanstack/react-query";
import "react-helmet-async";
import "react-router-dom";
import "@supabase/supabase-js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "react-easy-crop";
import "qrcode.react";
import "@radix-ui/react-label";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-toast";
import "@radix-ui/react-alert-dialog";
function LogisticsIntelligence() {
  const [velocity, setVelocity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReplenishing, setIsReplenishing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingPO, setIsGeneratingPO] = useState(false);
  const [showReplenishConfirm, setShowReplenishConfirm] = useState(false);
  useEffect(() => {
    const fetchLogisticsData = async () => {
      setLoading(true);
      try {
        const [velocityData, alertsData, auditData] = await Promise.all([
          adminService.getLogisticsVelocity(),
          adminService.getInventoryAlerts(),
          adminService.getLogisticsAudit(15)
        ]);
        setVelocity(velocityData);
        setAlerts(alertsData);
        setAuditLogs(auditData);
      } catch (error) {
        console.error("[LOGISTICS] Failed to synchronize supply chain telemetry:", error);
        toast.error("Failed to synchronize supply chain telemetry.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogisticsData();
  }, []);
  const handleReplenishAll = async () => {
    setIsReplenishing(true);
    const success = await adminService.replenishInventory();
    if (success) {
      toast.success("Replenishment protocol initiated for all low-stock assets.");
      const [updatedAlerts, updatedAudit] = await Promise.all([
        adminService.getInventoryAlerts(),
        adminService.getLogisticsAudit(15)
      ]);
      setAlerts(updatedAlerts);
      setAuditLogs(updatedAudit);
    } else {
      toast.error("Replenishment protocol failed.");
    }
    setIsReplenishing(false);
    setShowReplenishConfirm(false);
  };
  const handleGeneratePurchaseOrder = async () => {
    setIsGeneratingPO(true);
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    toast.success("Purchase order documentation generated successfully.");
    setIsGeneratingPO(false);
  };
  const handleRouteOptimization = async () => {
    setIsOptimizing(true);
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    toast.success("Route optimization protocols initiated for all regional hubs.");
    setIsOptimizing(false);
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 border-4 border-border/40 border-t-primary animate-spin" }),
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-primary", children: "Synchronizing supply chain telemetry..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-in fade-in duration-700", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-8 h-8 text-on-surface" }),
          "Logistics monitoring"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Automated supply chain monitoring and regional dispatch tracking." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            size: "lg",
            onClick: handleRouteOptimization,
            disabled: isOptimizing,
            className: "rounded-sm border-border/40 text-on-surface/80 text-micro px-10 font-bold tracking-tight hover:bg-stone-50 h-12 transition-all active:scale-95",
            children: [
              isOptimizing ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4 mr-2" }),
              "Route Optimization"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            size: "lg",
            onClick: () => setShowReplenishConfirm(true),
            disabled: isReplenishing,
            className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            children: [
              isReplenishing ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(PackagePlus, { className: "w-4 h-4 mr-2" }),
              "Replenish All"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6", children: (() => {
      const avgDispatch = velocity.length > 0 ? (velocity.reduce((sum, v) => sum + v.avg_dispatch_hours, 0) / velocity.length).toFixed(1) : "0";
      const avgFulfillment = velocity.length > 0 ? (velocity.reduce((sum, v) => sum + v.fulfillment_rate, 0) / velocity.length).toFixed(1) : "0";
      const health = velocity.length > 0 ? Math.round(velocity.reduce((sum, v) => sum + v.fulfillment_rate, 0) / velocity.length) : 0;
      return [
        {
          label: "Supply Chain Health",
          value: `${health}%`,
          sub: "Logistics Efficiency",
          icon: health >= 80 ? CheckCircle2 : AlertTriangle,
          color: health >= 80 ? "text-primary" : health >= 51 ? "text-accent" : "text-destructive",
          className: "col-span-2 md:col-span-1"
        },
        { label: "Urgent Alerts", value: alerts.length, sub: "Inventory Alerts", icon: AlertTriangle, color: alerts.length > 0 ? "text-destructive" : "text-muted-foreground/80" },
        { label: "Avg Dispatch", value: `${avgDispatch}h`, sub: "30 Day Aggregate", icon: Clock, color: "text-blue-500" },
        {
          label: "Fulfillment Rate",
          value: `${avgFulfillment}%`,
          sub: "Verified Delivery",
          icon: Number(avgFulfillment) >= 80 ? TrendingUp : AlertTriangle,
          color: Number(avgFulfillment) >= 80 ? "text-orange-500" : Number(avgFulfillment) >= 51 ? "text-accent" : "text-destructive",
          className: "col-span-2 md:col-span-1"
        }
      ].map((stat, i) => /* @__PURE__ */ jsxs(Card, { className: cn("rounded-sm border-border/60 shadow-sm bg-white p-6 hover:border-on-surface/40 transition-colors", stat.className), children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80", children: stat.label }),
          /* @__PURE__ */ jsx(stat.icon, { className: cn("w-5 h-5", stat.color) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xl md:text-3xl font-bold tracking-tighter text-on-surface", children: stat.value }),
          /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-muted-foreground/60 mt-1.5", children: stat.sub })
        ] })
      ] }, i));
    })() }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-1 rounded-sm border-border/60 shadow-sm bg-white overflow-hidden", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/30", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-xs font-bold normal-case font-meta", children: "Inventory alerts" }),
            /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-destructive" })
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/80 mt-1", children: "Items requiring immediate replenishment." })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-border/40", children: alerts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-8 h-8 text-border/60 mx-auto mb-3" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case", children: "All stock levels normal" })
        ] }) : alerts.map((item) => /* @__PURE__ */ jsxs("div", { className: "p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case tracking-tight text-on-surface", children: item.name }),
            /* @__PURE__ */ jsx("p", { className: "text-[8px] text-muted-foreground/80 font-bold normal-case mt-1", children: item.category.toLowerCase() })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-destructive", children: [
              item.stock_quantity,
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-[8px] text-muted-foreground/40 font-bold normal-case ml-1", children: "in stock" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-[8px] text-muted-foreground/80 font-bold normal-case mt-1", children: [
              "Threshold: ",
              item.low_stock_threshold
            ] })
          ] })
        ] }, item.id)) }) }),
        alerts.length > 0 && /* @__PURE__ */ jsx("div", { className: "p-4 bg-muted/30 border-t border-border/40 flex justify-end", children: /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            onClick: handleGeneratePurchaseOrder,
            disabled: isGeneratingPO,
            className: "bg-brand-red text-white hover:bg-brand-red/90 rounded-sm h-11 px-10 font-bold text-micro tracking-tight flex items-center gap-2 shadow-lg shadow-brand-red/20 border-0 transition-all hover:scale-[1.02] active:scale-95",
            children: [
              isGeneratingPO ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
              "Generate Purchase Order"
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-2 rounded-sm border-border/60 shadow-sm bg-white overflow-hidden", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-xs font-bold normal-case font-meta", children: "Regional dispatch performance" }),
            /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/80 mt-1", children: "Average processing and transit times by movement jurisdiction." })
          ] }),
          /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4 text-muted-foreground/80" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxs("div", { className: "overflow-x-auto", children: [
          /* @__PURE__ */ jsxs("table", { className: "w-full text-left hidden md:table", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/30 border-b border-border/40", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Jurisdiction" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Orders" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Dispatch time" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Delivery" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Fulfillment" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: velocity.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "px-6 py-12 text-center text-micro font-bold text-muted-foreground/80 normal-case", children: "No dispatch telemetry available" }) }) : velocity.map((v, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors group", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case text-on-surface", children: v.region || "Unknown" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-xs font-bold text-on-surface/80", children: v.total_orders }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 text-border/60" }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-on-surface", children: [
                  v.avg_dispatch_hours,
                  "h"
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-on-surface/80", children: [
                v.avg_delivery_hours,
                "h"
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 h-1 bg-muted/10 max-w-[60px] overflow-hidden rounded-full", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "h-full bg-primary",
                    style: { width: `${v.fulfillment_rate}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-primary", children: [
                  v.fulfillment_rate,
                  "%"
                ] })
              ] }) })
            ] }, idx)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "md:hidden divide-y divide-border/40", children: velocity.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case", children: "No dispatch telemetry available" }) }) : velocity.map((v, idx) => /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-on-surface", children: v.region || "Unknown" }),
              /* @__PURE__ */ jsx("div", { className: "px-3 py-1 bg-muted/10 rounded-full", children: /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-on-surface/80 tracking-tight", children: [
                v.total_orders,
                " Orders"
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[8px] font-bold text-muted-foreground/80 tracking-tight", children: "Dispatch Time" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 text-muted-foreground/80" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-on-surface", children: [
                    v.avg_dispatch_hours,
                    "h"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[8px] font-bold text-muted-foreground/80 tracking-tight", children: "Delivery" }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-on-surface", children: [
                  v.avg_delivery_hours,
                  "h"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-[8px] font-bold text-muted-foreground/80 tracking-tight", children: [
                /* @__PURE__ */ jsx("span", { children: "Fulfillment Rate" }),
                /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
                  v.fulfillment_rate,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full h-1.5 bg-muted/10 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-full bg-primary transition-all duration-1000",
                  style: { width: `${v.fulfillment_rate}%` }
                }
              ) })
            ] })
          ] }, idx)) })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white overflow-hidden p-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-on-surface p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-white text-xl font-bold font-meta leading-tight", children: "National supply chain map" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-white/70 mt-2", children: "Real-time visualization of material flow across the 16 regions." })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            size: "lg",
            onClick: () => toast.success("Initializing high-fidelity enterprise visualization protocol..."),
            className: "w-full sm:w-auto bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-sm h-12 px-10 font-bold text-micro tracking-tight shadow-xl shadow-black/20 transition-all active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Map, { className: "w-4 h-4 mr-2" }),
              " Enterprise View"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "h-[320px] bg-muted/30 flex items-center justify-center relative overflow-hidden group", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-[0.03] pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[size:32px_32px]" }) }),
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: [
          /* @__PURE__ */ jsx("div", { className: "w-[200px] h-[200px] rounded-full border border-border/40 animate-ping opacity-20" }),
          /* @__PURE__ */ jsx("div", { className: "absolute w-[350px] h-[350px] rounded-full border border-border/20 animate-pulse" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative text-center z-10 px-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-white rounded-sm shadow-sm border border-border/40 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500", children: /* @__PURE__ */ jsx(Map, { className: "w-8 h-8 text-border/60" }) }),
          /* @__PURE__ */ jsx("h4", { className: "text-on-surface text-tiny font-bold mb-2", children: "Syncing regional data" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-muted-foreground/90", children: "No regional data available yet. Waiting for hub connection." }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 mt-6", children: [
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-border/60 animate-bounce" }),
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-border/60 animate-bounce delay-150" }),
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-border/60 animate-bounce delay-300" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-full border-[20px] border-transparent border-t-muted/5 border-l-muted/5 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 right-0 w-full h-full border-[20px] border-transparent border-b-muted/5 border-r-muted/5 pointer-events-none" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white overflow-hidden", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(History, { className: "w-4 h-4 text-primary" }),
            " Supply chain audit vault"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/80 mt-1", children: "Immutable ledger of replenishment and stock adjustment events." })
        ] }),
        /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-primary" })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/30 border-b border-border/40", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Timestamp" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Action" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Change" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Source Hub" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Authorized By" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: auditLogs.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "px-6 py-12 text-center text-micro font-bold text-muted-foreground/80 normal-case", children: "No audit entries detected in the ledger." }) }) : auditLogs.map((log) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case text-on-surface/80", children: format(new Date(log.timestamp), "MMM dd, HH:mm") }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: cn(
            "px-2 py-0.5 text-[8px] font-bold normal-case rounded-full",
            log.action === "REPLENISHED" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/60"
          ), children: log.action }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-on-surface", children: [
            "+",
            log.quantityChange,
            " units"
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-micro font-bold text-on-surface/80 normal-case", children: log.sourceLocation }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-2 h-2 text-primary" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/80 normal-case", children: log.performedBy })
          ] }) })
        ] }, log.id)) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx(AlertDialog, { open: showReplenishConfirm, onOpenChange: setShowReplenishConfirm, children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "rounded-sm border-border/60", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxs(AlertDialogTitle, { className: "text-xl font-bold tracking-tight flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center text-on-surface", children: /* @__PURE__ */ jsx(PackagePlus, { className: "w-5 h-5" }) }),
          "Confirm bulk replenishment?"
        ] }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-tiny font-bold text-muted-foreground/80 leading-relaxed", children: [
          "This action will initiate a movement-wide replenishment protocol for all ",
          /* @__PURE__ */ jsx("span", { className: "text-text-on-surface", children: "low-stock assets" }),
          ". Standard procurement workflows will be triggered for each identified item."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { className: "gap-2 sm:gap-0 mt-4", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "default",
            onClick: () => setShowReplenishConfirm(false),
            className: "rounded-sm text-micro font-bold tracking-tight h-12 px-8 border-border/40 hover:bg-stone-50 transition-all active:scale-95",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "primary",
            onClick: handleReplenishAll,
            disabled: isReplenishing,
            className: "rounded-sm text-micro font-bold tracking-tight h-12 px-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            children: isReplenishing ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : "Confirm Protocol"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  LogisticsIntelligence as default
};
