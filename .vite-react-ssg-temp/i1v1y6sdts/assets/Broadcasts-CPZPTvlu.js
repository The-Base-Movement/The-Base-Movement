import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { Megaphone, Plus, AlertOctagon, Users, Clock, Shield, Search, Loader2, CheckCircle2 } from "lucide-react";
import { a as adminService, b as BrandLine, B as Button, C as Card, d as CardContent, j as CardHeader, v as CardTitle, I as Input, c as cn } from "../main.mjs";
import { B as Badge } from "./badge-JuJFKxOQ.js";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import "vite-react-ssg";
import "@tanstack/react-query";
import "react-helmet-async";
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
function Broadcasts() {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [broadcastMetrics, setBroadcastMetrics] = useState({});
  const fetchMetrics = useCallback(async (id) => {
    try {
      const stats = await adminService.getBroadcastMetrics(id);
      setBroadcastMetrics((prev) => ({ ...prev, [id]: stats }));
    } catch {
    }
  }, []);
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const bData = await adminService.getBroadcasts();
      setBroadcasts(bData);
      bData.slice(0, 5).forEach((b) => fetchMetrics(b.id));
    } catch {
      toast.error("Failed to synchronize mobilization operational metrics");
    } finally {
      setIsLoading(false);
    }
  }, [fetchMetrics]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const filteredBroadcasts = broadcasts.filter(
    (b) => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent":
        return "bg-destructive text-white";
      case "High":
        return "bg-accent text-on-surface";
      default:
        return "bg-muted-foreground text-white";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Megaphone, { className: "w-8 h-8 text-on-surface" }),
          "Communication hub"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Direct HQ-to-field mobilization and broadcast history." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "primary",
          size: "lg",
          onClick: () => navigate("/admin/broadcasts/new"),
          className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            " Create New Broadcast"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid-stats mb-12", style: { "--grid-min-width": "220px" }, children: [
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden relative group hover:border-accent transition-all bg-white cursor-default", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-muted-foreground/80 uppercase tracking-widest", children: "Total" }),
          /* @__PURE__ */ jsx(Megaphone, { className: "w-5 h-5 text-muted-foreground/20 group-hover:text-accent transition-colors" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-4xl font-bold text-on-surface mb-2 tracking-tight transition-transform group-hover:translate-x-1", children: broadcasts.length }),
        /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/40 font-bold tracking-tight uppercase", children: "Total deployments" })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden relative group hover:border-destructive transition-all bg-white cursor-default", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-destructive uppercase tracking-widest", children: "Urgent" }),
          /* @__PURE__ */ jsx(AlertOctagon, { className: "w-5 h-5 text-destructive/20 group-hover:text-destructive transition-colors" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-4xl font-bold text-destructive mb-2 tracking-tight transition-transform group-hover:translate-x-1", children: broadcasts.filter((b) => b.priority === "Urgent").length }),
        /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/40 font-bold tracking-tight uppercase", children: "Critical alerts" })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden relative group hover:border-primary transition-all bg-white cursor-default", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-muted-foreground/80 uppercase tracking-widest", children: "Reach" }),
          /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-muted-foreground/20 group-hover:text-primary transition-colors" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-4xl font-bold text-on-surface mb-2 tracking-tight transition-transform group-hover:translate-x-1", children: "100%" }),
        /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/40 font-bold tracking-tight uppercase", children: "Field saturation" })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden relative group hover:border-on-surface transition-all bg-white cursor-default", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-muted-foreground/80 uppercase tracking-widest", children: "Uptime" }),
          /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-muted-foreground/20 group-hover:text-on-surface transition-colors" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-4xl font-bold text-on-surface mb-2 tracking-tight transition-transform group-hover:translate-x-1", children: "24/7" }),
        /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/40 font-bold tracking-tight uppercase", children: "Direct HQ connection" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-6", children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-xl overflow-hidden", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "border-b border-border/10 bg-muted/5 p-4 sm:p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg font-bold tracking-tight flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4" }),
            " Broadcast history"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Search broadcasts...",
                className: "pl-9 h-8 text-xs rounded-sm border-border/60 focus:ring-0 focus:border-on-surface",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value)
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: isLoading ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin mx-auto text-muted-foreground/20 mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground/80 font-bold normal-case", children: "Retrieving secure comm logs..." })
        ] }) : filteredBroadcasts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
          /* @__PURE__ */ jsx(Megaphone, { className: "w-8 h-8 mx-auto text-muted-foreground/20 mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground/80 font-bold normal-case", children: "No active deployments found" })
        ] }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-border/10", children: filteredBroadcasts.map((broadcast) => /* @__PURE__ */ jsx("div", { className: "p-6 hover:bg-muted/5 transition-colors group", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
              /* @__PURE__ */ jsx(Badge, { className: cn("text-[8px] font-bold normal-case rounded-full px-2", getPriorityColor(broadcast.priority)), children: broadcast.priority }),
              /* @__PURE__ */ jsx(Badge, { variant: "default", className: "text-[8px] font-bold normal-case text-muted-foreground/40 rounded-full border-border/60", children: broadcast.target_type === "ALL" ? "National" : broadcast.target_value })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg tracking-tight text-on-surface group-hover:text-primary transition-colors", children: broadcast.title }),
            /* @__PURE__ */ jsx("p", { className: "text-on-surface/80 text-sm leading-relaxed max-w-2xl", children: broadcast.content }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mt-4 text-micro text-muted-foreground/40 font-bold normal-case", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                " ",
                new Date(broadcast.created_at).toLocaleString()
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-primary" }),
                " Confirmed"
              ] }),
              broadcastMetrics[broadcast.id] && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 ml-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Users, { className: "w-3 h-3 text-muted-foreground/40" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    broadcastMetrics[broadcast.id].read,
                    " / ",
                    broadcastMetrics[broadcast.id].total,
                    " Read"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "w-24 h-1.5 bg-muted/10 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "h-full bg-primary transition-all duration-1000",
                    style: { width: `${broadcastMetrics[broadcast.id].read / broadcastMetrics[broadcast.id].total * 100}%` }
                  }
                ) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "default",
              size: "sm",
              className: "opacity-0 group-hover:opacity-100 transition-all rounded-sm border border-border/40 h-11 px-8 text-micro font-bold tracking-tight hover:bg-stone-50 shadow-sm active:scale-95",
              onClick: () => fetchMetrics(broadcast.id),
              children: "Refresh operational metrics"
            }
          )
        ] }) }, broadcast.id)) }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 lg:sticky lg:top-8 self-start", children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "border-b border-border/10 bg-muted/5", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold normal-case", children: "Mobilization presets" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-4 space-y-4", children: [
            { title: "National Membership Drive", type: "ALL", priority: "High", content: "All chapters are invited to initiate regional registration drives this weekend. Goal: 10,000 new verified members." },
            { title: "Regional Strategic Briefing", type: "REGION", priority: "Normal", content: "Regional leaders are requested to submit their mobilization reports by Friday 18:00 GMT." },
            { title: "Level Red Emergency Alert", type: "ALL", priority: "Urgent", content: "IMMEDIATE FIELD MOBILIZATION REQUIRED. Check regional secure channels for tactical coordinates." },
            { title: "Constituency Outreach", type: "CONSTITUENCY", priority: "Normal", content: "Local chapter engagement initiative starting in your area. Please coordinate with regional leads." }
          ].map((template, idx) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "p-4 border border-border/10 hover:border-primary/40 hover:bg-muted/5 cursor-pointer transition-all group active:scale-[0.98] rounded-sm shadow-sm hover:shadow-md",
              onClick: () => navigate("/admin/broadcasts/new", { state: { template } }),
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                  /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[8px] font-bold uppercase border-border/40 text-muted-foreground/60", children: template.type }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-primary tracking-tighter uppercase", children: "Use Protocol" }),
                    /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3 text-primary" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm tracking-tight text-on-surface mb-2 group-hover:text-primary transition-colors", children: template.title }),
                /* @__PURE__ */ jsx("p", { className: "text-tiny font-medium text-muted-foreground/80 leading-relaxed line-clamp-2", children: template.content })
              ]
            },
            idx
          )) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm bg-on-surface text-white border-none shadow-xl overflow-hidden relative", children: [
          /* @__PURE__ */ jsxs(CardContent, { className: "p-6 relative z-10", children: [
            /* @__PURE__ */ jsx(AlertOctagon, { className: "w-8 h-8 text-destructive mb-4" }),
            /* @__PURE__ */ jsx("h4", { className: "text-lg font-bold tracking-tight mb-2", children: "Protocol red" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-white/60 leading-relaxed mb-6 font-medium", children: "Urgent mobilization triggers immediate notifications to all connected field assets. Use only for critical broadcasts." }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                className: "w-full text-white border-destructive/60 hover:bg-destructive/20 text-micro font-bold tracking-tight h-12 rounded-sm transition-all hover:scale-[1.02] shadow-lg shadow-destructive/10 active:scale-95",
                children: "Trigger Tactical Alert"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(Megaphone, { className: "absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" })
        ] })
      ] })
    ] })
  ] });
}
export {
  Broadcasts as default
};
