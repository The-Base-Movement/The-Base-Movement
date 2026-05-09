import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Vote, Target, Activity, PieChart, BarChart, ClipboardList, Crosshair, Map, TrendingUp, Car, Users } from "lucide-react";
import { a as adminService, b as BrandLine, C as Card, d as CardContent, j as CardHeader, v as CardTitle, w as CardDescription, B as Button, c as cn } from "../main.mjs";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, PieChart as PieChart$1, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { toast } from "sonner";
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
import "@radix-ui/react-label";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-toast";
function GroundGameCommand() {
  const navigate = useNavigate();
  const [voterRegs, setVoterRegs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [transportReqs, setTransportReqs] = useState([]);
  const [fieldLogs, setFieldLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchGroundGameIntelligence();
  }, []);
  const fetchGroundGameIntelligence = async () => {
    setLoading(true);
    try {
      const [voterData, campData, transData, logData] = await Promise.all([
        adminService.getVoterRegistrations(),
        adminService.getCanvassingCampaigns(),
        adminService.getGOTVTransportRequests(),
        adminService.getCanvasserLogs()
      ]);
      setVoterRegs(voterData);
      setCampaigns(campData);
      setTransportReqs(transData);
      setFieldLogs(logData);
    } catch (error) {
      console.error("[GROUND_GAME] Failed to fetch intelligence:", error);
      toast.error("Failed to synchronize with Ground Game servers.");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx(MapPin, { className: "w-12 h-12 text-primary animate-bounce" }),
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-primary", children: "Initializing ground game protocols..." })
    ] }) });
  }
  const handleDispatchAsset = async (requestId) => {
    const success = await adminService.updateTransportRequest(requestId, "DISPATCHED");
    if (success) {
      toast.success("Logistics asset dispatched to pickup location.");
      setTransportReqs((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "DISPATCHED" } : r));
    } else {
      toast.error("Failed to initialize dispatch protocol.");
    }
  };
  const handleDeployMission = () => {
    navigate("/admin/ground-game/deploy");
  };
  const verifiedVoters = voterRegs.filter((v) => v.registration_status === "VERIFIED_VOTER").length;
  const totalContacts = campaigns.reduce((acc, curr) => acc + (curr.goal_contacts || 0), 0);
  const regTrends = Array.from({ length: 7 }, (_, i) => {
    const date = /* @__PURE__ */ new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().slice(0, 10);
    return {
      date: format(date, "MMM dd"),
      count: voterRegs.filter((v) => v.created_at?.slice(0, 10) === dateStr).length
    };
  });
  const sentimentData = [
    { name: "Strong Support", value: fieldLogs.filter((l) => l.interaction_result === "STRONG_SUPPORT").length, color: "var(--brand-green)" },
    { name: "Leaning", value: fieldLogs.filter((l) => l.interaction_result === "LEANING").length, color: "#3b82f6" },
    { name: "Undecided", value: fieldLogs.filter((l) => l.interaction_result === "UNDECIDED").length, color: "#f59e0b" },
    { name: "Hostile", value: fieldLogs.filter((l) => l.interaction_result === "HOSTILE").length, color: "#ef4444" }
  ].filter((d) => d.value > 0);
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "w-8 h-8 text-on-surface" }),
        "Ground command"
      ] }),
      /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Election day logistics, voter registration tracking, and canvassing command." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid-stats mb-12", style: { "--grid-min-width": "220px" }, children: [
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 mb-1 tracking-widest uppercase", children: "Registered voters" }),
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold text-primary tracking-tight", children: verifiedVoters.toLocaleString() }),
          /* @__PURE__ */ jsx("p", { className: "text-tiny text-muted-foreground/60 font-bold tracking-tight mt-1.5", children: "Verified personnel" })
        ] }),
        /* @__PURE__ */ jsx(Vote, { className: "w-8 h-8 text-muted-foreground/10" })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 mb-1 tracking-widest uppercase", children: "Canvassing goal" }),
          /* @__PURE__ */ jsxs("h3", { className: "text-3xl font-bold text-on-surface tracking-tight", children: [
            totalContacts.toLocaleString(),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-sm font-normal text-muted-foreground/70", children: "doors" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-tiny text-muted-foreground/60 font-bold tracking-tight mt-1.5", children: "Active outreach target" })
        ] }),
        /* @__PURE__ */ jsx(Target, { className: "w-8 h-8 text-muted-foreground/10" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8", children: [
      /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-background p-6", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-0 mb-6", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 text-primary" }),
            " Registration velocity"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/80 mt-1", children: "7-day mobilization trend" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-[240px] w-full", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: regTrends, children: [
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "colorReg", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "var(--brand-green)", stopOpacity: 0.1 }),
            /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "var(--brand-green)", stopOpacity: 0 })
          ] }) }),
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "rgba(255,255,255,0.05)" }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "date",
              axisLine: false,
              tickLine: false,
              tick: { fontSize: 10, fontWeight: 600, fill: "rgba(255,255,255,0.6)" }
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              axisLine: false,
              tickLine: false,
              tick: { fontSize: 10, fontWeight: 600, fill: "rgba(255,255,255,0.6)" }
            }
          ),
          /* @__PURE__ */ jsx(
            Tooltip,
            {
              contentStyle: { backgroundColor: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px" },
              itemStyle: { fontSize: "10px", fontWeight: "bold", color: "white" },
              labelStyle: { color: "white", fontWeight: "bold", marginBottom: "4px" }
            }
          ),
          /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "count", stroke: "var(--brand-green)", fillOpacity: 1, fill: "url(#colorReg)", strokeWidth: 2 })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-background p-6", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-0 mb-6", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(PieChart, { className: "w-4 h-4 text-primary" }),
            " Field sentiment breakdown"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/80 mt-1", children: "Canvassing interaction intelligence" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-[240px] w-full flex items-center justify-center", children: sentimentData.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart$1, { children: [
          /* @__PURE__ */ jsx(
            Pie,
            {
              data: sentimentData,
              cx: "50%",
              cy: "50%",
              innerRadius: 60,
              outerRadius: 80,
              paddingAngle: 5,
              dataKey: "value",
              children: sentimentData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`))
            }
          ),
          /* @__PURE__ */ jsx(
            Tooltip,
            {
              contentStyle: { backgroundColor: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px" },
              itemStyle: { fontSize: "10px", fontWeight: "bold", color: "white" },
              labelStyle: { color: "white", fontWeight: "bold", marginBottom: "4px" }
            }
          )
        ] }) }) : /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx(BarChart, { className: "w-8 h-8 text-muted-foreground/10 mx-auto mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/70 normal-case", children: "Awaiting canvassing data..." })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-6", children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-background overflow-hidden", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/10 bg-muted/5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(ClipboardList, { className: "w-4 h-4 text-primary" }),
              " Active canvassing"
            ] }),
            /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/80 mt-1", children: "Door-to-door outreach missions" })
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "primary",
              onClick: handleDeployMission,
              className: "h-12 px-10 rounded-sm text-micro font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
              children: [
                /* @__PURE__ */ jsx(Crosshair, { className: "w-4 h-4 mr-2" }),
                " Deploy Mission"
              ]
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-border/10", children: campaigns.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
          /* @__PURE__ */ jsx(Map, { className: "w-8 h-8 text-muted-foreground/20 mx-auto mb-3" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: "No active campaigns. Awaiting deployment." })
        ] }) : campaigns.map((campaign) => /* @__PURE__ */ jsxs("div", { className: "p-6 hover:bg-muted/5 transition-colors", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: cn(
                "px-3 py-1 text-micro font-bold normal-case rounded-full",
                campaign.status === "ACTIVE" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/60"
              ), children: campaign.status.toLowerCase() }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/60 normal-case", children: campaign.target_constituency })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/80", children: [
              "Target: ",
              campaign.goal_contacts,
              " doors"
            ] })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-on-surface normal-case mb-2", children: campaign.title }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground/80 font-medium leading-relaxed mb-4", children: campaign.description }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-4", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-muted-foreground/20" }),
            /* @__PURE__ */ jsxs("div", { className: "h-2 w-full bg-muted/10 rounded-full overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "h-full bg-primary", style: { width: "45%" } }),
              " "
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80 normal-case w-12 text-right", children: "45%" })
          ] })
        ] }, campaign.id)) }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-1 space-y-6", children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-background overflow-hidden h-full", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/10 bg-muted/5", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Car, { className: "w-4 h-4 text-primary" }),
              " Transport logistics"
            ] }),
            /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/80 mt-1", children: "Election day GOTV" })
          ] }) }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-border/10 max-h-[600px] overflow-y-auto", children: transportReqs.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case", children: "No transport requests." }) }) : transportReqs.map((req) => /* @__PURE__ */ jsxs("div", { className: "p-5 hover:bg-muted/5 transition-colors", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
              /* @__PURE__ */ jsx("span", { className: cn(
                "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                req.status === "PENDING" ? "bg-orange-500/10 text-orange-600" : "bg-primary/10 text-primary"
              ), children: req.status.toLowerCase() }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80", children: format(new Date(req.requested_time), "HH:mm") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1 mb-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-micro font-medium text-on-surface/60", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-muted-foreground/80" }),
                /* @__PURE__ */ jsx("span", { className: "truncate", children: req.pickup_address })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-micro font-bold text-on-surface", children: [
                /* @__PURE__ */ jsx(Vote, { className: "w-3 h-3 text-primary" }),
                /* @__PURE__ */ jsxs("span", { className: "normal-case truncate", children: [
                  "Polling station: ",
                  req.polling_station_id
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-3 border-t border-border/10", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/80 normal-case", children: [
                /* @__PURE__ */ jsx(Users, { className: "w-3 h-3 inline mr-1" }),
                " ",
                req.passengers,
                " pax"
              ] }),
              req.status === "PENDING" && /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "primary",
                  onClick: () => handleDispatchAsset(req.id),
                  className: "h-11 px-8 rounded-sm text-micro font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
                  children: "Dispatch Asset"
                }
              )
            ] })
          ] }, req.id)) }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-on-surface text-white overflow-hidden relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" }),
          /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-white/10 relative z-10", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 text-primary" }),
            " Live field ops"
          ] }) }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-0 relative z-10", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-white/5 max-h-[400px] overflow-y-auto sidebar-scroll", children: fieldLogs.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-white/60", children: "Awaiting field intelligence..." }) }) : fieldLogs.map((log) => /* @__PURE__ */ jsxs("div", { className: "p-5 hover:bg-white/5 transition-colors", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
              /* @__PURE__ */ jsx("span", { className: cn(
                "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                log.interaction_result === "STRONG_SUPPORT" ? "bg-primary/20 text-primary" : log.interaction_result === "LEANING" ? "bg-blue-500/20 text-blue-400" : log.interaction_result === "UNDECIDED" ? "bg-accent/20 text-accent" : log.interaction_result === "HOSTILE" ? "bg-destructive/20 text-destructive" : "bg-white/10 text-white/40"
              ), children: log.interaction_result.replace("_", " ").toLowerCase() }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-white/60", children: format(new Date(log.created_at), "HH:mm") })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-tiny text-white/80 mb-2", children: [
              '"',
              log.address_notes || "No notes provided",
              '"'
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-white/20" }),
              /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-white/80", children: [
                "Sector ",
                log.canvasser_id.substring(0, 4)
              ] })
            ] })
          ] }, log.id)) }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  GroundGameCommand as default
};
