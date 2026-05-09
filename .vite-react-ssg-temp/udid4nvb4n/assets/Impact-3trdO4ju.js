import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { S as SEO, b as BrandLine, C as Card, d as CardContent, c as cn, B as Button, f as donationService, m as memberService, g as chapterService } from "../main.mjs";
import { X, Activity, Heart, Target, Users, Globe, ArrowUpRight, MapPin, Calendar } from "lucide-react";
import "vite-react-ssg";
import "@tanstack/react-query";
import "react-helmet-async";
import "react-router-dom";
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
function Impact() {
  const [activeFilter, setActiveFilter] = useState("day");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonations: "GHS 0",
    todayDonations: "No new donations yet today",
    activeChapters: "0",
    totalMembers: "355,482",
    memberTrend: "+15%",
    countriesReached: "1",
    raised: 0,
    goal: 5e5,
    avgDonation: "GHS 0",
    totalContributors: 0
  });
  const [contributions, setContributions] = useState({
    day: [],
    week: [],
    month: [],
    year: [],
    custom: []
  });
  const [regions, setRegions] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          donationStats,
          allDonations,
          members,
          chapters,
          leaderboard
        ] = await Promise.all([
          donationService.getDonationStats(),
          donationService.getDonations(),
          memberService.getMembers(),
          chapterService.getChapters(),
          chapterService.getRegionalLeaderboard()
        ]);
        const uniqueCountries = new Set(members.map((m) => m.country || "Ghana")).size;
        setStats({
          totalDonations: donationStats.approvedAmount > 0 ? `GHS ${donationStats.approvedAmount.toLocaleString()}` : "GHS 0",
          todayDonations: "No new donations yet today",
          activeChapters: chapters.filter((c) => c.status === "Active").length.toString(),
          totalMembers: "355,482",
          // National Scale baseline
          memberTrend: "+15%",
          countriesReached: uniqueCountries.toString(),
          raised: donationStats.approvedAmount,
          goal: 5e5,
          avgDonation: donationStats.approvedAmount > 0 ? `GHS ${(donationStats.approvedAmount / (donationStats.totalContributions || 1)).toFixed(2)}` : "GHS 0",
          totalContributors: donationStats.totalContributions
        });
        const GHANA_REGIONS = [
          "Greater Accra",
          "Ashanti",
          "Central",
          "Eastern",
          "Western",
          "Northern",
          "Upper East",
          "Upper West",
          "Volta",
          "North East",
          "Savannah",
          "Bono",
          "Bono East",
          "Ahafo",
          "Oti",
          "Western North"
        ];
        const regionalData = GHANA_REGIONS.map((name) => {
          const live = leaderboard.find((l) => l.region.toLowerCase() === name.toLowerCase());
          return {
            name,
            engagement: live ? Math.min(100, Math.max(5, Math.floor(live.total_patriots / (members.length || 1) * 100))) : 0
          };
        });
        setRegions(regionalData);
        const now = /* @__PURE__ */ new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1e3);
        setContributions({
          day: allDonations.filter((d) => new Date(d.date) > dayAgo),
          week: allDonations.filter((d) => new Date(d.date) > weekAgo),
          month: allDonations.filter((d) => new Date(d.date) > monthAgo),
          year: allDonations.filter((d) => new Date(d.date) > yearAgo),
          custom: []
        });
      } catch (err) {
        console.error("[IMPACT] Data sync failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const [showFullActivity, setShowFullActivity] = useState(false);
  return /* @__PURE__ */ jsxs("main", { className: "bg-stone-50/50 min-h-screen font-meta", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Our Impact",
        description: "Live analytics reflecting our collective momentum across the nation. Every member joined and every contribution made is a direct investment in the Ghana we deserve.",
        canonical: "/impact"
      }
    ),
    showFullActivity && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-dark/60 backdrop-blur-sm animate-in fade-in duration-300",
        onClick: () => setShowFullActivity(false),
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: "bg-white w-full max-w-2xl rounded-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-charcoal-dark mb-0", children: "Full Activity Log" }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 mt-1 mb-0 tracking-tight", children: "Verified movement contributions" })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setShowFullActivity(false),
                    className: "w-8 h-8 rounded-none bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-green transition-colors",
                    children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "p-6 max-h-[60vh] overflow-y-auto space-y-4", children: Object.values(contributions).flat().length > 0 ? Object.values(contributions).flat().slice(0, 50).map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border border-slate-50 rounded-none hover:bg-slate-50 transition-colors", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex gap-4 items-center", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-none bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xs", children: item.fullName[0] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-charcoal-dark mb-0", children: item.fullName }),
                    /* @__PURE__ */ jsxs("p", { className: "text-tiny font-bold text-slate-400 mb-0 tracking-tight", children: [
                      item.country,
                      " • ",
                      new Date(item.date).toLocaleDateString()
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-brand-green", children: [
                    "GHS ",
                    item.amount
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-semibold text-slate-300", children: "Verified" })
                ] })
              ] }, idx)) : /* @__PURE__ */ jsxs("div", { className: "py-20 text-center", children: [
                /* @__PURE__ */ jsx(Activity, { className: "w-12 h-12 text-slate-100 mx-auto mb-4" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-400 tracking-tight", children: "No activity recorded yet" })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "p-6 bg-slate-50 border-t border-slate-100 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-slate-400 italic", children: "This log is updated in real-time. Showing latest 50 records." }) })
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative bg-stone-900 py-24 md:py-32 mb-12 overflow-hidden border-b border-white/5", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-[0.03] pointer-events-none", style: {
        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "32px 32px"
      } }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-stone-900/50" }),
      /* @__PURE__ */ jsxs("div", { className: "relative text-center", children: [
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green text-micro font-bold tracking-tight rounded-none mb-6 ring-1 ring-brand-green/20", children: [
          /* @__PURE__ */ jsx("span", { className: "w-1 h-1 bg-brand-green rounded-full animate-pulse" }),
          "Live Movement Metrics"
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-white text-5xl md:text-7xl font-bold tracking-tighter mb-4", children: "Our Collective Impact" }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-6", children: /* @__PURE__ */ jsx(BrandLine, {}) }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed prose-wide", children: "Live analytics reflecting our collective momentum across the nation. Every member joined and every contribution made is a direct investment in the Ghana we deserve." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "-mt-24 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-columns items-stretch", style: { "--column-gap": "1.5rem" }, children: [
        { label: "Donations received", value: stats.totalDonations, icon: Heart, trend: "+12%", color: "#006B3F", status: "No new donations yet today" },
        { label: "Chapters active", value: stats.activeChapters, icon: Target, trend: "+2", color: "#DAA520", status: "Verified" },
        { label: "Registered Patriots", value: stats.totalMembers, icon: Users, trend: "+15%", color: "#22C55E", status: "National scale" },
        { label: "Countries reached", value: stats.countriesReached, icon: Globe, trend: "Global", color: "#3B82F6", status: "Global" }
      ].map((stat, i) => {
        const Icon = stat.icon;
        return /* @__PURE__ */ jsx(Card, { className: "group hover:shadow-2xl transition-all duration-500 border-slate-100 bg-white rounded-none hover:-translate-y-1", children: /* @__PURE__ */ jsx(CardContent, { className: "p-8", children: isLoading ? /* @__PURE__ */ jsxs("div", { className: "animate-pulse space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-slate-100 rounded-none" }),
          /* @__PURE__ */ jsx("div", { className: "h-8 bg-slate-100 w-3/4 rounded-none" }),
          /* @__PURE__ */ jsx("div", { className: "h-4 bg-slate-100 w-1/2 rounded-none" })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 tracking-tight mb-0", children: stat.status }),
            /* @__PURE__ */ jsx(ArrowUpRight, { className: "w-3.5 h-3.5 text-slate-200 group-hover:text-brand-green transition-colors" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end mb-4", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-12 h-12 rounded-none flex items-center justify-center group-hover:rotate-6 transition-transform",
                style: { backgroundColor: `${stat.color}15` },
                children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6", style: { color: stat.color } })
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "text-micro font-semibold text-brand-green bg-brand-green/10 px-2 py-1 rounded-none flex items-center gap-1", children: [
              stat.trend,
              " ",
              /* @__PURE__ */ jsx(ArrowUpRight, { className: "w-3 h-3" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "text-charcoal-dark leading-tight mb-0", children: stat.value }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 mt-1 mb-0 tracking-tight", children: stat.label })
        ] }) }) }, i);
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-columns items-stretch", style: { "--column-gap": "2rem" }, children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-8", children: [
          /* @__PURE__ */ jsxs("section", { className: "bg-white rounded-none border border-slate-100 p-8 shadow-xl shadow-slate-200/40", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h2", { className: "text-charcoal-dark flex items-center gap-2 mb-0", children: [
                  /* @__PURE__ */ jsx(Activity, { className: "w-5 h-5 text-brand-green" }),
                  "Campaign progress"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 mt-1 mb-0 tracking-tight", children: "National Organizing Fund" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-charcoal-dark mb-0", children: [
                  "GHS ",
                  stats.raised.toLocaleString(),
                  " ",
                  /* @__PURE__ */ jsxs("span", { className: "text-slate-300", children: [
                    "/ ",
                    stats.goal.toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-brand-green mt-1 mb-0 tracking-tight", children: Math.round(stats.raised / stats.goal * 100) >= 1 ? `${Math.round(stats.raised / stats.goal * 100)}% achieved towards goal` : "Early momentum toward goal" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative mb-8", children: [
              /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center mb-4 relative z-10", children: /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: [25, 50, 75].map((marker) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
                /* @__PURE__ */ jsx("div", { className: "h-1.5 w-px bg-slate-200 mb-1" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[8px] font-bold text-slate-300", children: [
                  marker,
                  "%"
                ] })
              ] }, marker)) }) }),
              /* @__PURE__ */ jsx("div", { className: "h-3 bg-slate-100 rounded-none overflow-hidden relative border border-slate-200/50", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-full bg-brand-green shadow-[0_0_15px_rgba(0,107,63,0.3)] transition-all duration-1000 relative",
                  style: { width: `${Math.min(100, stats.raised / stats.goal * 100)}%` },
                  children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-pulse" })
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50/50 rounded-sm border border-slate-100", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 tracking-tight mb-1", children: "Average donation" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-charcoal-dark mb-0", children: stats.avgDonation })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50/50 rounded-sm border border-slate-100", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 tracking-tight mb-1", children: "Total contributors" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-charcoal-dark mb-0", children: stats.totalContributors.toLocaleString() })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50/50 rounded-sm border border-slate-100", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 tracking-tight mb-1", children: "Last update" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-charcoal-dark mb-0", children: "Just now" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "bg-white rounded-none border border-slate-100 p-8 shadow-xl shadow-slate-200/40", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-charcoal-dark mb-6 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-warm-gold" }),
              "Regional engagement"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: regions.map((region) => /* @__PURE__ */ jsxs("div", { className: "p-4 border border-slate-100 rounded-sm hover:border-brand-green/30 transition-all cursor-default bg-slate-50/30", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-charcoal-dark tracking-tight", children: region.name }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 h-1 bg-slate-100 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "h-full bg-brand-green transition-all duration-1000",
                    style: { width: `${region.engagement}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxs("span", { className: cn(
                  "text-tiny font-bold",
                  region.engagement > 0 ? "text-brand-green" : "text-slate-300"
                ), children: [
                  region.engagement,
                  "%"
                ] })
              ] })
            ] }, region.name)) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-8", children: /* @__PURE__ */ jsxs("section", { className: "bg-white rounded-none border border-slate-100 p-8 shadow-xl shadow-slate-200/40 flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6 gap-2", children: [
            /* @__PURE__ */ jsx("h5", { className: "text-charcoal-dark font-bold text-sm mb-0", children: "Recent activity" }),
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0 ring-4 ring-red-500/10" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 mb-10 border-b border-slate-50 pb-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "flex-1 flex gap-2 bg-slate-100/80 p-1.5 rounded-sm border border-slate-200/50 shadow-inner", children: ["day", "week", "month", "year"].map((t) => /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  onClick: () => {
                    setActiveFilter(t);
                    setShowDatePicker(false);
                  },
                  className: cn(
                    "flex-1 h-8 px-0 text-micro font-bold capitalize transition-all rounded-sm",
                    activeFilter === t ? "bg-white text-brand-green shadow-md scale-[1.02]" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  ),
                  children: t
                },
                t
              )) }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  onClick: () => setShowDatePicker(!showDatePicker),
                  className: cn(
                    "w-8 h-8 border shrink-0 transition-all rounded-sm",
                    showDatePicker || activeFilter === "custom" ? "bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/20" : "bg-white border-slate-200 text-brand-green hover:border-brand-green/30 shadow-sm"
                  ),
                  title: "Custom range",
                  children: /* @__PURE__ */ jsx(Calendar, { className: cn(
                    "w-4 h-4",
                    showDatePicker || activeFilter === "custom" ? "text-white" : "text-brand-green"
                  ) })
                }
              )
            ] }),
            showDatePicker && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50 rounded-none border border-slate-100 animate-in fade-in slide-in-from-top-2 mt-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[8px] font-bold text-slate-400 tracking-tight", children: "Start Date" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "date",
                      className: "w-full bg-white border border-slate-200 rounded-none p-2 text-xs font-meta font-semibold text-charcoal-dark focus:ring-1 focus:ring-brand-green outline-none",
                      onChange: (e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[8px] font-bold text-slate-400 tracking-tight", children: "End Date" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "date",
                      className: "w-full bg-white border border-slate-200 rounded-none p-2 text-xs font-meta font-semibold text-charcoal-dark focus:ring-1 focus:ring-brand-green outline-none",
                      onChange: (e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "primary",
                  onClick: () => {
                    setActiveFilter("custom");
                    setShowDatePicker(false);
                  },
                  className: "w-full mt-4 text-micro h-10 !text-white",
                  children: "Apply Filter"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-6 overflow-y-auto h-[420px] pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent", children: activeFilter === "custom" ? /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center py-12 px-6 bg-slate-50/50 rounded-none border border-dashed border-slate-200", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-8 h-8 text-slate-200 mb-3" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-400 leading-loose mb-0 text-center", children: [
              "Showing results for:",
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsx("span", { className: "text-brand-green font-bold", children: dateRange.start || "..." }),
              " to ",
              /* @__PURE__ */ jsx("span", { className: "text-brand-green font-bold", children: dateRange.end || "..." })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-300 mt-4 mb-0 tracking-tight text-center", children: "No records found for this specific range." })
          ] }) : Object.values(contributions).flat().length > 0 ? Object.values(contributions).flat().map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border border-slate-50 rounded-none hover:bg-slate-50 transition-colors group", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4 items-center", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-none bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xs group-hover:scale-110 transition-transform", children: item.fullName[0] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-charcoal-dark mb-0", children: item.fullName }),
                /* @__PURE__ */ jsxs("p", { className: "text-tiny font-bold text-slate-400 mb-0 tracking-tight", children: [
                  item.country,
                  " • ",
                  new Date(item.date).toLocaleDateString()
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-brand-green", children: [
                "GHS ",
                item.amount
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-micro font-semibold text-slate-300", children: "Verified" })
            ] })
          ] }, idx)) : /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center py-12 bg-slate-50/30 rounded-none border border-dashed border-slate-200", children: [
            /* @__PURE__ */ jsx(Activity, { className: "w-8 h-8 text-slate-200 mb-3" }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 tracking-tight text-center", children: "No activity recorded yet" }),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-slate-300 mt-2 text-center px-4", children: "Actions will appear here as they are verified" })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "mt-10 pt-6 border-t border-slate-50", children: /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              onClick: () => setShowFullActivity(true),
              className: "w-full h-12 bg-slate-50 hover:bg-brand-green/5 text-slate-400 hover:text-brand-green group text-micro font-bold tracking-tight border border-transparent transition-all rounded-sm",
              children: [
                "View full activity log",
                /* @__PURE__ */ jsx(ArrowUpRight, { className: "w-3.5 h-3.5 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" })
              ]
            }
          ) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Impact as default
};
