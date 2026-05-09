import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Siren, ShieldAlert, Zap, AlertTriangle, CheckCircle2, MessageSquareWarning, Radio, Send, Activity } from "lucide-react";
import { a as adminService, b as BrandLine, C as Card, d as CardContent, j as CardHeader, v as CardTitle, w as CardDescription, c as cn, B as Button } from "../main.mjs";
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
function WarRoomCommand() {
  const [directives, setDirectives] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [narratives, setNarratives] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchWarRoomIntelligence();
  }, []);
  const fetchWarRoomIntelligence = async () => {
    setLoading(true);
    try {
      const [dirData, incData, narData] = await Promise.all([
        adminService.getRapidResponseDirectives(),
        adminService.getCrisisIncidents(),
        adminService.getMediaCounterNarratives()
      ]);
      setDirectives(dirData);
      setIncidents(incData);
      setNarratives(narData);
    } catch (error) {
      console.error("[WAR_ROOM] Failed to fetch intelligence:", error);
      toast.error("Failed to synchronize with War Room servers.");
    } finally {
      setLoading(false);
    }
  };
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "DEFCON1":
        return "bg-destructive text-white animate-pulse";
      case "SEVERE":
        return "bg-orange-500 text-white";
      case "MODERATE":
        return "bg-accent text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-on-surface", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx(Siren, { className: "w-12 h-12 text-destructive animate-spin" }),
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-destructive animate-pulse", children: "Initializing war room protocols..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container animate-in fade-in duration-700", children: [
    /* @__PURE__ */ jsx("div", { className: "flex-columns items-center", style: { "--column-gap": "2rem" }, children: /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.5rem" }, children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta m-0", children: [
        /* @__PURE__ */ jsx(ShieldAlert, { className: "w-8 h-8 text-brand-red" }),
        "War room"
      ] }),
      /* @__PURE__ */ jsx(BrandLine, {}),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mb-0 prose-standard", children: "Real-time intelligence, rapid response dispatch, and threat neutralization." })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "flex-columns items-stretch mb-8", style: { "--column-gap": "1.5rem", "--column-min-width": "24ch" }, children: /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.25rem" }, children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-muted-foreground/40 mb-0", children: "Operational readiness" }),
        /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold text-destructive tracking-tight m-0", children: "Level 2" })
      ] }),
      /* @__PURE__ */ jsx(Zap, { className: "w-8 h-8 text-accent" })
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-start", style: { "--column-gap": "2rem", "--column-breakpoint": "120ch" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-[2] min-w-0 flow", style: { "--flow-space": "2rem" }, children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white overflow-hidden", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/10", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.25rem" }, children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta flex items-center gap-2 m-0", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-orange-500" }),
              " Active crisis incidents"
            ] }),
            /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/40 mb-0", children: "Localized resistance and PR threats" })
          ] }) }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-border/40", children: incidents.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "w-8 h-8 text-primary mx-auto mb-3" }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: "No active incidents. All sectors secure." })
          ] }) : incidents.map((incident) => /* @__PURE__ */ jsxs("div", { className: "p-6 hover:bg-muted/10 transition-colors flow", style: { "--flow-space": "1rem" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("span", { className: cn("px-3 py-1 text-micro font-bold normal-case rounded-full", getSeverityColor(incident.severity)), children: incident.severity.toLowerCase() }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/80 normal-case", children: incident.region })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/40 shrink-0", children: format(new Date(incident.created_at), "MMM dd, HH:mm") })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-on-surface normal-case m-0", children: incident.incident_type.replace("_", " ").toLowerCase() }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-on-surface/80 font-medium leading-relaxed mb-0 prose-standard", children: incident.description }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-border/40", children: [
              /* @__PURE__ */ jsx("span", { className: cn(
                "text-micro font-bold normal-case px-2 py-1 rounded-full",
                incident.status === "INVESTIGATING" ? "bg-orange-100 text-orange-600" : incident.status === "CONTAINED" ? "bg-blue-100 text-blue-600" : "bg-primary/10 text-primary"
              ), children: incident.status.toLowerCase() }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "primary",
                  size: "sm",
                  className: "h-11 px-10 rounded-sm text-micro font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
                  children: "Update Status"
                }
              )
            ] })
          ] }, incident.id)) }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-on-surface shadow-sm bg-on-surface text-white overflow-hidden relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" }),
          /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-white/10 relative z-10", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta text-white flex items-center gap-2 m-0", children: [
              /* @__PURE__ */ jsx(MessageSquareWarning, { className: "w-4 h-4 text-blue-400" }),
              " Digital strike directives"
            ] }),
            /* @__PURE__ */ jsx(Radio, { className: "w-4 h-4 text-white/40" })
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-0 relative z-10", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-white/10", children: narratives.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-white/40 normal-case", children: "No active media campaigns." }) }) : narratives.map((nar) => /* @__PURE__ */ jsxs("div", { className: "p-6 hover:bg-white/5 transition-colors flow", style: { "--flow-space": "0.75rem" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-blue-400 normal-case", children: nar.target_platform }),
              /* @__PURE__ */ jsx("span", { className: cn(
                "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                nar.dispatch_status === "DEPLOYED" ? "bg-emerald-900/50 text-emerald-400" : "bg-orange-900/50 text-orange-400"
              ), children: nar.dispatch_status.toLowerCase() })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-white/80 m-0 leading-relaxed", children: [
              '"',
              nar.approved_messaging,
              '"'
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-white/40 normal-case mb-0", children: nar.hashtags }),
              nar.dispatch_status === "PENDING" && /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "primary",
                  className: "h-12 px-10 rounded-sm text-micro font-bold tracking-tight bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-900/40 border-0 transition-all hover:scale-[1.02] active:scale-95",
                  children: [
                    /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
                    " Dispatch Strike"
                  ]
                }
              )
            ] })
          ] }, nar.id)) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white overflow-hidden h-full", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/10", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta flex items-center gap-2 m-0", children: [
          /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 text-destructive" }),
          " Rapid directives"
        ] }) }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-border/40 max-h-[800px] overflow-y-auto", children: directives.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: "No active directives." }) }) : directives.map((dir) => /* @__PURE__ */ jsxs("div", { className: cn(
          "p-5 transition-colors border-l-4 flow",
          dir.priority === "CRITICAL" ? "border-destructive bg-destructive/5" : "border-border/40 hover:bg-muted/10"
        ), style: { "--flow-space": "0.5rem" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-4", children: [
            /* @__PURE__ */ jsx("span", { className: cn(
              "text-[8px] font-bold normal-case",
              dir.priority === "CRITICAL" ? "text-destructive animate-pulse" : "text-on-surface/80"
            ), children: dir.priority.toLowerCase() }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/40 shrink-0", children: dir.target_region })
          ] }),
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-on-surface normal-case m-0", children: dir.title }),
          /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/80 font-medium m-0", children: dir.action_type.replace("_", " ").toLowerCase() }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center pt-2", children: /* @__PURE__ */ jsx("span", { className: cn(
            "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
            dir.status === "ACTIVE" ? "bg-primary/10 text-primary" : "bg-muted/30 text-on-surface/40"
          ), children: dir.status.toLowerCase() }) })
        ] }, dir.id)) }) })
      ] }) })
    ] })
  ] });
}
export {
  WarRoomCommand as default
};
