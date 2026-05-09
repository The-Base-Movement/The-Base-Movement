import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Activity, MapPin, BarChart3, Plus, Users, DollarSign, Calendar, Search, Clock, ChevronRight, TrendingUp } from "lucide-react";
import { b as BrandLine, B as Button, C as Card, d as CardContent, c as cn, j as CardHeader, v as CardTitle, w as CardDescription, a as adminService } from "../main.mjs";
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
function ChapterLeadHub() {
  const [events, setEvents] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chapterName, setChapterName] = useState("");
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = adminService.getCurrentUser();
        const chapter = user?.chapter || "Greater Accra Central";
        setChapterName(chapter);
        const [eventsData, ledgerData] = await Promise.all([
          adminService.getFieldEvents(chapter),
          adminService.getChapterMobilizationLedger(chapter)
        ]);
        setEvents(eventsData);
        setLedger(ledgerData);
      } catch (err) {
        console.error("Failed to load hub data:", err);
        toast.error("Failed to load regional hub data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const stats = {
    totalEvents: events.length,
    activeMembers: 1240,
    // Mocked for now
    availableBudget: ledger.reduce(
      (acc, curr) => curr.transaction_type === "Allocation" ? acc + curr.amount : acc - curr.amount,
      0
    ),
    mobilizationStrength: 88
    // Percentage
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "h-full w-full flex flex-col items-center justify-center py-20 space-y-4", children: [
      /* @__PURE__ */ jsx(Activity, { className: "w-12 h-12 text-muted-foreground/20 animate-pulse" }),
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Synchronizing chapter hub..." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "w-8 h-8 text-on-surface" }),
          chapterName,
          " hub"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Empowering regional autonomy through tactical coordination." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            size: "lg",
            className: "rounded-sm border-border/40 text-on-surface/80 text-micro px-8 font-bold capitalize tracking-tight hover:bg-stone-100 h-10 transition-all active:scale-95",
            children: [
              /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4 mr-2" }),
              " Local operational metrics"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            size: "lg",
            className: "rounded-sm text-micro font-bold capitalize tracking-tight px-8 h-10 transition-all shadow-lg shadow-brand-green/20 active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              " New Field Event"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
      { label: "Mobilization strength", value: `${stats.mobilizationStrength}%`, icon: Activity, color: "text-destructive", bg: "bg-destructive/5" },
      { label: "Active patriots", value: stats.activeMembers.toLocaleString(), icon: Users, color: "text-primary", bg: "bg-primary/5" },
      { label: "Operations budget", value: `GH₵${stats.availableBudget.toLocaleString()}`, icon: DollarSign, color: "text-accent", bg: "bg-accent/5" },
      { label: "Planned events", value: stats.totalEvents.toString(), icon: Calendar, color: "text-on-surface/60", bg: "bg-muted/5" }
    ].map((stat, i) => /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm group hover:border-on-surface transition-colors overflow-hidden", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-muted-foreground/40 mb-1", children: stat.label }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold font-meta text-on-surface tracking-tighter", children: stat.value })
      ] }),
      /* @__PURE__ */ jsx("div", { className: cn("w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110 rounded-sm", stat.bg), children: /* @__PURE__ */ jsx(stat.icon, { className: cn("w-5 h-5", stat.color) }) })
    ] }) }) }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold normal-case tracking-tight font-meta flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-destructive" }),
            " Upcoming field operations"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" }),
            /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Filter events...", className: "pl-9 pr-4 py-2 bg-muted/5 border-none text-micro font-bold normal-case rounded-sm focus:ring-1 focus:ring-on-surface w-48 shadow-inner" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: events.length > 0 ? events.map((event) => /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden group hover:shadow-md transition-all", children: [
          /* @__PURE__ */ jsx("div", { className: "h-1.5 w-full bg-muted/5 relative overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: cn(
            "h-full transition-all duration-1000",
            event.status === "Completed" ? "bg-primary" : event.status === "In Progress" ? "bg-accent" : "bg-destructive"
          ), style: { width: `${event.budget_spent / event.budget_allocated * 100}%` } }) }),
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 pb-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: event.type }),
              /* @__PURE__ */ jsx("div", { className: cn(
                "px-2 py-0.5 text-[8px] font-bold normal-case border rounded-full",
                event.status === "Completed" ? "bg-primary/10 text-primary border-primary/20" : event.status === "In Progress" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted/5 text-muted-foreground/60 border-border/10"
              ), children: event.status.toLowerCase() })
            ] }),
            /* @__PURE__ */ jsx(CardTitle, { className: "text-base font-bold normal-case tracking-tight text-on-surface leading-tight group-hover:text-destructive transition-colors", children: event.title })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-6 pt-4 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-muted-foreground/80", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case", children: new Date(event.date).toLocaleDateString() })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case truncate max-w-[120px]", children: event.location })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-border/10", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex -space-x-2", children: [
                [1, 2, 3].map((i) => /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-full border-2 border-white bg-muted/10 flex items-center justify-center text-[8px] font-bold overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: `https://i.pravatar.cc/100?img=${i + 10}`, alt: "attendee", className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) }, i)),
                /* @__PURE__ */ jsxs("div", { className: "w-7 h-7 rounded-full border-2 border-white bg-on-surface flex items-center justify-center text-[8px] font-bold text-white", children: [
                  "+",
                  event.attendees_expected - 3
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "ghost",
                  className: "h-9 px-4 text-micro font-bold capitalize tracking-tight hover:bg-muted/5 group-hover:text-destructive rounded-sm active:scale-95",
                  children: [
                    "Logistics Hub ",
                    /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5 ml-2" })
                  ]
                }
              )
            ] })
          ] })
        ] }, event.id)) : /* @__PURE__ */ jsxs("div", { className: "col-span-2 border-2 border-dashed border-border/60 rounded-sm p-12 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/5", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-12 h-12 mb-4 opacity-20" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case", children: "No field operations scheduled." })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-on-surface text-white overflow-hidden flex flex-col h-full relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" }),
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-white/5 bg-white/5 relative z-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-bold normal-case flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(DollarSign, { className: "w-4 h-4 text-accent" }),
              " Regional ledger"
            ] }),
            /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 text-white/20" })
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-white/40 text-micro font-bold normal-case", children: "Real-time mobilization expenditures." })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0 flex-1 overflow-y-auto max-h-[600px] sidebar-scroll relative z-10", children: ledger.length > 0 ? ledger.map((item, i) => /* @__PURE__ */ jsx("div", { className: cn(
          "p-6 border-b border-white/5 hover:bg-white/5 transition-colors group",
          i % 2 === 0 ? "bg-white/[0.02]" : ""
        ), children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-accent opacity-70", children: item.category }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold leading-tight", children: item.description })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxs("p", { className: cn(
              "text-sm font-bold font-meta",
              item.transaction_type === "Allocation" ? "text-primary" : "text-destructive"
            ), children: [
              item.transaction_type === "Allocation" ? "+" : "-",
              " GH₵",
              item.amount.toLocaleString()
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[8px] font-bold text-white/30 normal-case", children: new Date(item.timestamp).toLocaleDateString() })
          ] })
        ] }) }, item.id)) : /* @__PURE__ */ jsxs("div", { className: "p-12 text-center text-white/20", children: [
          /* @__PURE__ */ jsx(TrendingUp, { className: "w-12 h-12 mx-auto mb-4 opacity-10" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case", children: "Ledger manifest empty." })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 mt-auto border-t border-white/5 bg-white/5 relative z-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case text-white/40", children: "Total allocation" }),
            /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold font-meta text-primary", children: [
              "GH₵",
              ledger.filter((l) => l.transaction_type === "Allocation").reduce((a, b) => a + b.amount, 0).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "default",
              className: "w-full h-12 border-white/20 text-white font-bold text-micro capitalize tracking-tight hover:bg-white/10 rounded-sm transition-all active:scale-95",
              children: "Request Additional Funds"
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  ChapterLeadHub as default
};
