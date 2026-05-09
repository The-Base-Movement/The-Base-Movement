import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Package, Download, RefreshCw, Search, Filter, XCircle, CheckCircle2, Truck, Clock, Eye, X } from "lucide-react";
import { b as BrandLine, B as Button, c as cn, C as Card, d as CardContent, j as CardHeader, v as CardTitle, a as adminService } from "../main.mjs";
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
import "date-fns";
import "@radix-ui/react-label";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-toast";
const STATUS_CONFIG = {
  Pending: { label: "Pending", color: "text-[var(--brand-gold)]", bg: "bg-[var(--brand-gold)]/10 border-[var(--brand-gold)]/20", icon: Clock },
  Processing: { label: "Processing", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", icon: Package },
  Dispatched: { label: "Dispatched", color: "text-stone-500", bg: "bg-stone-500/10 border-stone-500/20", icon: Truck },
  Delivered: { label: "Delivered", color: "text-[var(--brand-green)]", bg: "bg-[var(--brand-green)]/10 border-[var(--brand-green)]/20", icon: CheckCircle2 },
  Cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", icon: XCircle }
};
const NEXT_STATUS = {
  Pending: "Processing",
  Processing: "Dispatched",
  Dispatched: "Delivered"
};
function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [orderData, statsData] = await Promise.all([
        adminService.getOrders(),
        adminService.getOrderStats()
      ]);
      setOrders(orderData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load orders:", err);
      toast.error("Failed to load order data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  const handleStatusAdvance = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order.id);
    const success = await adminService.updateOrderStatus(order.id, next);
    if (success) {
      toast.success(`Order #${order.id.slice(0, 8)} → ${next}`);
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: next } : o));
      if (selectedOrder?.id === order.id) setSelectedOrder((prev) => prev ? { ...prev, status: next } : null);
      loadData(true);
    } else {
      toast.error("Failed to update order status.");
    }
    setUpdatingId(null);
  };
  const handleCancel = async (order) => {
    if (!confirm(`Cancel order #${order.id.slice(0, 8)}? This cannot be undone.`)) return;
    setUpdatingId(order.id);
    const success = await adminService.updateOrderStatus(order.id, "Cancelled");
    if (success) {
      toast.success("Order cancelled.");
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "Cancelled" } : o));
      if (selectedOrder?.id === order.id) setSelectedOrder((prev) => prev ? { ...prev, status: "Cancelled" } : null);
      loadData(true);
    } else {
      toast.error("Failed to cancel order.");
    }
    setUpdatingId(null);
  };
  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || o.full_name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });
  const handleExport = () => {
    try {
      const headers = ["Order ID", "Customer", "Email", "Region", "Amount", "Status", "Date"];
      const csvData = filtered.map((o) => [
        o.id,
        `"${o.full_name}"`,
        o.email,
        o.region_or_state || "N/A",
        o.total_amount,
        o.status,
        new Date(o.created_at).toLocaleDateString()
      ]);
      const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `orders_export_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${filtered.length} order records.`);
    } catch {
      toast.error("Failed to export orders.");
    }
  };
  const statCards = stats ? [
    {
      label: "Total Orders",
      value: stats.totalOrders,
      color: "text-on-surface",
      sub: `GHS ${stats.totalRevenue.toFixed(2)} total revenue`
    },
    {
      label: "Avg Delivery",
      value: `${(stats.avgDeliveryDays || 0).toFixed(1)}d`,
      color: (stats.avgDeliveryDays ?? 0) === 0 ? "text-muted-foreground/40" : (stats.avgDeliveryDays ?? 0) <= 3 ? "text-primary" : (stats.avgDeliveryDays ?? 0) <= 5 ? "text-accent" : "text-destructive",
      sub: "Dispatch to Delivery Latency"
    },
    {
      label: "In Transit",
      value: stats.dispatchedOrders,
      color: stats.dispatchedOrders === 0 ? "text-muted-foreground/40" : "text-violet-600",
      sub: "Dispatched to customers"
    },
    {
      label: "Delivered",
      value: stats.deliveredOrders,
      color: stats.deliveredOrders === 0 ? "text-muted-foreground/40" : "text-primary",
      sub: `GHS ${stats.revenueToday.toFixed(2)} today`
    }
  ] : [];
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-10 h-10 text-on-surface" }),
          "Order Management"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Live merchandise dispatch and fulfillment intelligence." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            size: "lg",
            onClick: handleExport,
            className: "rounded-sm border-border/40 text-on-surface/80 text-micro px-8 font-bold tracking-tight hover:bg-stone-50 transition-all shadow-sm h-12 active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
              " Export Manifest"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            size: "lg",
            onClick: () => loadData(true),
            className: "rounded-sm text-micro px-10 h-12 font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: cn("w-4 h-4 mr-2", refreshing && "animate-spin") }),
              "Synchronize"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid-stats mb-12", style: { "--grid-min-width": "220px" }, children: loading ? Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 animate-pulse bg-white shadow-sm", children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 h-32" }) }, i)) : statCards.map((s) => /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white group hover:shadow-md transition-all duration-300", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8", children: [
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 mb-2 tracking-tight", children: s.label }),
      /* @__PURE__ */ jsx("p", { className: cn("text-4xl font-bold font-meta tracking-tighter mb-1", s.color), children: s.value }),
      /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/40 font-bold tracking-tight", children: s.sub })
    ] }) }, s.label)) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-start", style: { "--column-gap": "2rem" }, children: [
      /* @__PURE__ */ jsx("div", { className: cn("min-w-0", selectedOrder ? "flex-[2]" : "flex-1"), children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-border/10 flex flex-row items-center justify-between gap-4 bg-muted/5", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-micro font-bold text-muted-foreground/40 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Package, { className: "w-4 h-4 text-brand-green" }),
            " Order Feed"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative w-full md:w-64", children: [
              /* @__PURE__ */ jsx(Search, { className: "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Search by name, email, or ID...",
                  value: search,
                  onChange: (e) => setSearch(e.target.value),
                  className: "pl-9 pr-4 h-9 text-tiny font-bold bg-white border border-border/40 focus:outline-none focus:border-brand-green/40 w-full rounded-sm placeholder:text-muted-foreground/20"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center gap-4", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Filter, { className: "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: statusFilter,
                  onChange: (e) => setStatusFilter(e.target.value),
                  className: "pl-9 pr-8 h-9 text-tiny font-bold bg-white border border-border/40 focus:outline-none focus:border-brand-green/40 appearance-none rounded-sm cursor-pointer text-muted-foreground/60",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "ALL", children: "All Statuses" }),
                    Object.keys(STATUS_CONFIG).map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s))
                  ]
                }
              )
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: loading ? /* @__PURE__ */ jsxs("div", { className: "p-20 text-center", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "w-8 h-8 animate-spin text-brand-green/20 mx-auto mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case tracking-tight text-slate-300", children: "Synchronizing order flow..." })
        ] }) : filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-20 text-center", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-12 h-12 text-slate-100 mx-auto mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case tracking-tight text-slate-400", children: "No orders found" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-300 mt-2 max-w-xs mx-auto", children: "The merchandise feed is currently idle. Activity will appear as members complete movement-wide purchases." })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("table", { className: "w-full text-xs hidden md:table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "border-b border-border/10 bg-muted/5", children: ["Order ID", "Member", "Region", "Amount", "Payment", "Status", "Date", "Actions"].map((h) => /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left text-micro font-bold text-muted-foreground/40", children: h }, h)) }) }),
            /* @__PURE__ */ jsx("tbody", { children: filtered.map((order) => {
              const cfg = STATUS_CONFIG[order.status];
              const StatusIcon = cfg.icon;
              const nextStatus = NEXT_STATUS[order.status];
              return /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: cn(
                    "border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group",
                    selectedOrder?.id === order.id && "bg-slate-50/50 border-l-2 border-l-brand-green"
                  ),
                  onClick: () => setSelectedOrder((prev) => prev?.id === order.id ? null : order),
                  children: [
                    /* @__PURE__ */ jsxs("td", { className: "px-6 py-5 font-mono text-tiny text-slate-400", children: [
                      "#",
                      order.id.slice(0, 8).toUpperCase()
                    ] }),
                    /* @__PURE__ */ jsxs("td", { className: "px-6 py-5", children: [
                      /* @__PURE__ */ jsx("p", { className: "font-bold text-charcoal-dark text-sm", children: order.full_name }),
                      /* @__PURE__ */ jsx("p", { className: "text-micro font-medium text-slate-400", children: order.email })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-tiny font-bold text-slate-500", children: order.region_or_state || "-" }),
                    /* @__PURE__ */ jsxs("td", { className: "px-6 py-5 font-bold text-charcoal-dark text-sm", children: [
                      "GHS ",
                      Number(order.total_amount).toLocaleString(void 0, { minimumFractionDigits: 2 })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-micro font-bold text-slate-400 normal-case tracking-tight", children: order.payment_method === "momo" ? "MoMo" : "Card" }),
                    /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("span", { className: cn("inline-flex items-center gap-1.5 px-3 py-1 text-micro font-bold border rounded-full", cfg.bg, cfg.color), children: [
                      /* @__PURE__ */ jsx(StatusIcon, { className: "w-3 h-3" }),
                      cfg.label
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-micro font-bold text-slate-400", children: new Date(order.created_at).toLocaleDateString() }),
                    /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", onClick: (e) => e.stopPropagation(), children: [
                      nextStatus && /* @__PURE__ */ jsx(
                        Button,
                        {
                          variant: "primary",
                          size: "sm",
                          onClick: () => handleStatusAdvance(order),
                          disabled: updatingId === order.id,
                          className: "h-9 px-6 text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20",
                          children: updatingId === order.id ? "..." : `→ ${nextStatus}`
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        Button,
                        {
                          size: "sm",
                          variant: "ghost",
                          onClick: () => setSelectedOrder((prev) => prev?.id === order.id ? null : order),
                          className: "h-9 w-9 p-0 hover:bg-slate-100 rounded-none text-slate-300 hover:text-brand-green transition-all",
                          children: /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" })
                        }
                      )
                    ] }) })
                  ]
                },
                order.id
              );
            }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "md:hidden divide-y divide-border/40", children: filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status];
            const StatusIcon = cfg.icon;
            const nextStatus = NEXT_STATUS[order.status];
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn(
                  "p-6 space-y-6 transition-colors",
                  selectedOrder?.id === order.id ? "bg-muted/10" : "bg-white"
                ),
                onClick: () => setSelectedOrder((prev) => prev?.id === order.id ? null : order),
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsxs("p", { className: "text-micro font-mono font-bold text-muted-foreground/60 tracking-tight normal-case", children: [
                        "#",
                        order.id.slice(0, 8)
                      ] }),
                      /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-on-surface", children: order.full_name }),
                      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60", children: order.region_or_state || "Unknown Region" })
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: cn("inline-flex items-center gap-1 px-2 py-0.5 text-micro font-bold normal-case border rounded-full", cfg.bg, cfg.color), children: [
                      /* @__PURE__ */ jsx(StatusIcon, { className: "w-2.5 h-2.5" }),
                      cfg.label
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-white border border-border/40 rounded-sm shadow-sm", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 normal-case tracking-tight mb-1", children: "Value" }),
                      /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-on-surface", children: [
                        "GHS ",
                        Number(order.total_amount).toFixed(2)
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-white border border-border/40 rounded-sm shadow-sm", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 normal-case tracking-tight mb-1", children: "Payment" }),
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-on-surface capitalize", children: order.payment_method })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2", children: [
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        variant: "gold",
                        className: "flex-1 h-12 rounded-sm text-micro font-bold capitalize tracking-tight shadow-sm transition-all active:scale-95",
                        onClick: (e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        },
                        children: [
                          /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 mr-2" }),
                          " Details"
                        ]
                      }
                    ),
                    nextStatus && /* @__PURE__ */ jsx(
                      Button,
                      {
                        variant: "primary",
                        className: "flex-1 h-12 rounded-sm text-micro font-bold capitalize tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
                        disabled: updatingId === order.id,
                        onClick: (e) => {
                          e.stopPropagation();
                          handleStatusAdvance(order);
                        },
                        children: updatingId === order.id ? "..." : `→ ${nextStatus}`
                      }
                    ),
                    "                        "
                  ] })
                ]
              },
              order.id
            );
          }) })
        ] }) })
      ] }) }),
      selectedOrder && (() => {
        const cfg = STATUS_CONFIG[selectedOrder.status];
        const StatusIcon = cfg.icon;
        return /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-xl flex-1 h-fit sticky top-6 bg-white overflow-hidden animate-in slide-in-from-right-4 duration-500", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-border/10 flex flex-row items-center justify-between bg-muted/5", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-micro font-bold text-muted-foreground/40", children: "Order Manifest" }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                size: "icon",
                onClick: () => setSelectedOrder(null),
                className: "w-8 h-8 flex items-center justify-center rounded-sm bg-white border border-border/40 text-muted-foreground/40 hover:text-brand-green transition-all active:scale-95",
                children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-8 flow", style: { "--flow-space": "2rem" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 mb-1", children: "Manifest ID" }),
                /* @__PURE__ */ jsxs("p", { className: "font-mono text-xs font-bold text-on-surface", children: [
                  "#",
                  selectedOrder.id.toUpperCase()
                ] })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: cn("inline-flex items-center gap-1.5 px-3 py-1.5 text-micro font-bold border rounded-full", cfg.bg, cfg.color), children: [
                /* @__PURE__ */ jsx(StatusIcon, { className: "w-3 h-3" }),
                cfg.label
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flow pt-6 border-t border-border/10", style: { "--flow-space": "1rem" }, children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40", children: "Recipient Details" }),
              /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.25rem" }, children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-base text-on-surface", children: selectedOrder.full_name }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground/60", children: selectedOrder.email }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground/60", children: selectedOrder.phone })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flow pt-6 border-t border-border/10", style: { "--flow-space": "1rem" }, children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40", children: "Logistics Destination" }),
              /* @__PURE__ */ jsxs("div", { className: "flow text-xs font-medium text-muted-foreground/60 leading-relaxed", style: { "--flow-space": "0.25rem" }, children: [
                /* @__PURE__ */ jsx("p", { children: selectedOrder.shipping_address }),
                /* @__PURE__ */ jsxs("p", { children: [
                  selectedOrder.city,
                  ", ",
                  selectedOrder.region_or_state
                ] }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-on-surface pt-1", children: selectedOrder.country })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flow pt-6 border-t border-slate-50", style: { "--flow-space": "1rem" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case tracking-tight text-slate-400", children: "Manifest items" }),
                /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-slate-400", children: [
                  selectedOrder.items.length,
                  " Units"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flow", style: { "--flow-space": "0.75rem" }, children: selectedOrder.items.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50/50 border border-slate-100 flex items-center justify-between group", children: [
                /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.25rem" }, children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-charcoal-dark group-hover:text-brand-green transition-colors", children: item.product_name || "Legacy Movement Asset" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-micro font-medium text-slate-400", children: [
                    "Unit Price: GHS ",
                    Number(item.price_at_purchase).toFixed(2)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-charcoal-dark", children: [
                    "x",
                    item.quantity
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-slate-400 normal-case tracking-tight", children: [
                    "GHS ",
                    (item.quantity * item.price_at_purchase).toFixed(2)
                  ] })
                ] })
              ] }, idx)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flow pt-6 border-t border-border/10", style: { "--flow-space": "0.75rem" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-medium text-muted-foreground/60", children: [
                /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
                /* @__PURE__ */ jsxs("span", { className: "font-bold text-on-surface", children: [
                  "GHS ",
                  Number(selectedOrder.subtotal).toLocaleString(void 0, { minimumFractionDigits: 2 })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-medium text-muted-foreground/60", children: [
                /* @__PURE__ */ jsx("span", { children: "Shipping Logistics" }),
                /* @__PURE__ */ jsxs("span", { className: "font-bold text-on-surface", children: [
                  "GHS ",
                  Number(selectedOrder.shipping_fee).toLocaleString(void 0, { minimumFractionDigits: 2 })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between pt-4 border-t border-border/10", children: [
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface", children: "Total Manifest Value" }),
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-brand-green", children: [
                  "GHS ",
                  Number(selectedOrder.total_amount).toLocaleString(void 0, { minimumFractionDigits: 2 })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-6 flow", style: { "--flow-space": "0.75rem" }, children: [
              NEXT_STATUS[selectedOrder.status] && /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "primary",
                  className: "w-full h-14 text-tiny font-bold tracking-tight rounded-sm shadow-xl shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
                  onClick: () => handleStatusAdvance(selectedOrder),
                  disabled: updatingId === selectedOrder.id,
                  children: updatingId === selectedOrder.id ? "Synchronizing..." : `Advance to ${NEXT_STATUS[selectedOrder.status]}`
                }
              ),
              selectedOrder.status !== "Cancelled" && selectedOrder.status !== "Delivered" && /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "destructive",
                  className: "w-full h-14 text-micro font-bold tracking-tight rounded-sm transition-all active:scale-95 shadow-lg shadow-brand-red/20",
                  onClick: () => handleCancel(selectedOrder),
                  disabled: updatingId === selectedOrder.id,
                  children: "Terminate Order"
                }
              )
            ] })
          ] })
        ] });
      })()
    ] })
  ] });
}
export {
  AdminOrders as default
};
