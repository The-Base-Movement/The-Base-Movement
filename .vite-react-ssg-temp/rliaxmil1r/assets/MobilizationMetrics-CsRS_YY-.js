import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Trophy, Filter, Download, Target, Shield, TrendingUp, MapPin, Users, Zap, Award } from "lucide-react";
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
function MobilizationMetrics() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leaderboardData, achievementsData, pulseData] = await Promise.all([
          adminService.getRegionalLeaderboard(),
          adminService.getAchievements(),
          adminService.getMovementPulse()
        ]);
        setLeaderboard(leaderboardData);
        setAchievements(achievementsData);
        setPulse(pulseData);
      } catch (error) {
        console.error("[METRICS] Failed to synchronize mobilization operational metrics:", error);
        toast.error("Failed to synchronize mobilization operational metrics.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Trophy, { className: "w-8 h-8 text-on-surface" }),
          "Mobilization metrics"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Performance tracking and impact analytics for regional chapters across the movement's jurisdictional boundaries." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            size: "lg",
            className: "rounded-sm text-micro font-bold tracking-tight px-10 h-12 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4 mr-2" }),
              " Filter metrics"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            size: "lg",
            className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
              " Export intelligence"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid-stats mb-12", style: { "--grid-min-width": "220px" }, children: [
      { label: "Impact Points", value: pulse?.totalMobilizationPoints?.toLocaleString() || "0", sub: "Total performance score", icon: Target, color: "text-primary", bg: "bg-primary/10" },
      { label: "Active Chapters", value: pulse?.activeChapters || "0", sub: "Verified chapters", icon: Shield, color: "text-blue-500", bg: "bg-blue-50" },
      { label: "Top Region", value: pulse?.topPerformingRegion || "N/A", sub: "Highest performing area", icon: Trophy, color: "text-accent", bg: "bg-accent/10" },
      { label: "Growth Rate", value: `${pulse?.nationalGrowth || 0}%`, sub: "Quarterly increase", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50" }
    ].map((stat, i) => /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white group hover:border-border/60 transition-all duration-300", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80 uppercase tracking-widest", children: stat.label }),
        /* @__PURE__ */ jsx("div", { className: cn("w-10 h-10 rounded-sm flex items-center justify-center transition-transform group-hover:scale-110", stat.bg), children: /* @__PURE__ */ jsx(stat.icon, { className: cn("w-5 h-5", stat.color) }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold tracking-tight text-on-surface mb-1", children: stat.value }),
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 tracking-tight", children: stat.sub })
    ] }) }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-start", style: { "--column-gap": "2rem" }, children: [
      /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-2 rounded-sm border-border/60 shadow-sm bg-background overflow-hidden", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-border/10 flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-xl font-bold tracking-tight", children: "Regional power rankings" }),
            /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold text-muted-foreground/80 mt-1", children: "Aggregated mobilization points by jurisdictional chapter." })
          ] }),
          /* @__PURE__ */ jsx(TrendingUp, { className: "w-6 h-6 text-border/60" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto hidden md:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/30 border-b border-border/10", children: [
              /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Rank" }),
              /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Chapter / region" }),
              /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-muted-foreground/80 tracking-tight text-center", children: "Members" }),
              /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-muted-foreground/80 tracking-tight text-center", children: "Achievements" }),
              /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-muted-foreground/80 tracking-tight text-right", children: "Impact points" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/5", children: loading ? Array(5).fill(0).map((_, i) => /* @__PURE__ */ jsx("tr", { className: "animate-pulse", children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-6 h-16 bg-muted/20" }) }, i)) : leaderboard.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-20 text-center text-muted-foreground/80 font-bold normal-case text-micro", children: "No regional mobilization data for this period." }) }) : leaderboard.map((entry, index) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors group cursor-pointer", children: [
              /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsx("div", { className: cn(
                "w-8 h-8 flex items-center justify-center font-bold text-xs rounded-full",
                index === 0 ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20" : index === 1 ? "bg-muted/60 text-on-surface/80" : index === 2 ? "bg-orange-300 text-orange-900" : "bg-muted/30 text-muted-foreground/80"
              ), children: index + 1 }) }),
              /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold tracking-tight text-on-surface", children: entry.chapter }),
                /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/80 flex items-center gap-1 mt-0.5", children: [
                  /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
                  " ",
                  entry.region
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-6 text-center", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/30 rounded-full", children: [
                /* @__PURE__ */ jsx(Users, { className: "w-3 h-3 text-on-surface/60" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface/80", children: entry.total_patriots })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-6 text-center", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/30 rounded-full", children: [
                /* @__PURE__ */ jsx(Zap, { className: "w-3 h-3 text-primary" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface/80", children: entry.achievements_unlocked })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-6 text-right", children: /* @__PURE__ */ jsx("span", { className: "text-lg font-bold tracking-tight text-on-surface", children: entry.total_mobilization_points.toLocaleString() }) })
            ] }, entry.chapter)) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "md:hidden divide-y divide-border/10", children: loading ? Array(3).fill(0).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "p-6 animate-pulse space-y-4", children: [
            /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/30 w-3/4 rounded" }),
            /* @__PURE__ */ jsx("div", { className: "h-12 bg-muted/20 w-full rounded-sm" })
          ] }, i)) : leaderboard.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-muted-foreground/80 font-bold text-micro", children: "No regional mobilization data." }) : leaderboard.map((entry, index) => /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: cn(
                  "w-10 h-10 flex items-center justify-center font-bold text-sm rounded-sm shadow-md",
                  index === 0 ? "bg-accent text-accent-foreground" : index === 1 ? "bg-muted/60 text-on-surface/80" : index === 2 ? "bg-orange-300 text-orange-900" : "bg-muted/30 text-muted-foreground/80"
                ), children: index + 1 }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-on-surface tracking-tight", children: entry.chapter }),
                  /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-muted-foreground/80 flex items-center gap-1 mt-0.5 normal-case tracking-tight", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
                    " ",
                    entry.region
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/70 tracking-tight", children: "Points" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-on-surface tracking-tighter", children: entry.total_mobilization_points.toLocaleString() })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-3 bg-muted/30 rounded-sm border border-border/10", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-sm bg-background flex items-center justify-center border border-border/10", children: /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-muted-foreground/80" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/70", children: "Members" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface", children: entry.total_patriots })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-3 bg-muted/30 rounded-sm border border-border/10", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-sm bg-background flex items-center justify-center border border-border/10", children: /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4 text-accent" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/70", children: "Badges" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface", children: entry.achievements_unlocked })
                ] })
              ] })
            ] })
          ] }, entry.chapter)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 flow", style: { "--flow-space": "2rem" }, children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-background overflow-hidden", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/10 bg-muted/30", children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold tracking-tight flex items-center gap-2 text-on-surface", children: [
              /* @__PURE__ */ jsx(Award, { className: "w-4 h-4 text-accent" }),
              " Available milestones"
            ] }),
            /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold text-muted-foreground/80 mt-1", children: "Recognition badges for chapter growth." })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-4 space-y-3", children: achievements.map((achievement) => /* @__PURE__ */ jsx("div", { className: "p-4 bg-muted/5 border border-border/10 hover:border-border/40 transition-all group cursor-pointer relative overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-4 relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-muted/10 rounded-sm self-start group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(Target, { className: "w-5 h-5 text-accent" }) }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-tiny font-bold leading-none", children: achievement.name }),
              /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/80 font-medium leading-tight", children: achievement.description }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-1", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-accent", children: [
                  achievement.points_awarded,
                  " points"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/80", children: [
                  "• ",
                  (achievement.category || "General").toLowerCase()
                ] })
              ] })
            ] })
          ] }) }, achievement.id)) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-background p-8 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-micro font-bold text-muted-foreground/80", children: "Movement velocity" }),
            /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4 text-accent fill-accent" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/80", children: "Mobilization efficiency" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold", children: "87%" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "h-1.5 bg-muted/30 overflow-hidden rounded-full", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-on-surface w-[87%] transition-all duration-1000" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/80", children: "Recruitment conversion" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold", children: "62%" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "h-1.5 bg-muted/30 overflow-hidden rounded-full", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-on-surface w-[62%] transition-all duration-1000" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pt-4 border-t border-border/10", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 leading-relaxed text-center", children: "Currently tracking activity across 12 active chapters and 4 key regions." }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  MobilizationMetrics as default
};
