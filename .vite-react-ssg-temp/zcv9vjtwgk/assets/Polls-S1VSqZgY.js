import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { BarChart3, Plus, TrendingUp, Clock, MessageSquare, Search, Trash2, MoreVertical, Users, ChevronRight, X, Calendar } from "lucide-react";
import { a as adminService, b as BrandLine, B as Button, C as Card, d as CardContent, j as CardHeader, v as CardTitle, I as Input, c as cn } from "../main.mjs";
import { B as Badge } from "./badge-JuJFKxOQ.js";
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
function PollsManagement() {
  const [polls, setPolls] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [newPoll, setNewPoll] = useState({
    question: "",
    targetBase: "GHANA",
    // GHANA or DIASPORA
    region: "National",
    country: "International",
    status: "Active",
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    options: ["", ""]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pollData, statData, regionsData, countriesData] = await Promise.all([
        adminService.getPolls(),
        adminService.getPollStats(),
        adminService.getGhanaRegions(),
        adminService.getCountries()
      ]);
      setPolls(pollData);
      setStats(statData);
      setAvailableRegions(regionsData);
      setAvailableCountries(countriesData);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handlePollAction = (action, pollTitle) => {
    adminService.logAction(action, `POLLS/${pollTitle}`, "Success");
    toast.success(`${action.replace("_", " ")}: ${pollTitle} updated in Audit Vault`);
  };
  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (newPoll.options.filter((o) => o.trim()).length < 2) {
      toast.error("Please provide at least 2 options.");
      return;
    }
    setIsSubmitting(true);
    try {
      const targetRegion = newPoll.targetBase === "GHANA" ? newPoll.region : newPoll.country;
      const success = await adminService.createPoll({
        ...newPoll,
        region: targetRegion,
        options: newPoll.options.filter((o) => o.trim())
      });
      if (success) {
        toast.success("Poll created successfully!");
        setShowCreateModal(false);
        setNewPoll({
          question: "",
          targetBase: "GHANA",
          region: "National",
          country: "International",
          status: "Active",
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
          options: ["", ""]
        });
        fetchData();
      } else {
        toast.error("Failed to create poll.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeletePoll = async (id, question) => {
    if (!window.confirm(`Are you sure you want to delete the poll: "${question}"?`)) return;
    try {
      const success = await adminService.deletePoll(id);
      if (success) {
        toast.success("Poll deleted successfully.");
        fetchData();
      } else {
        toast.error("Failed to delete poll.");
      }
    } catch (err) {
      console.error("[POLLS] Delete operation failed:", err);
      toast.error("An error occurred while deleting the poll.");
    }
  };
  const filteredPolls = polls.filter((p) => p.question.toLowerCase().includes(searchQuery.toLowerCase()));
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(BarChart3, { className: "w-8 h-8 text-on-surface" }),
          "Engagement hub"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Manage movement-wide opinion polls, surveys, and live member feedback intercepts." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "primary",
          size: "lg",
          className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          onClick: () => setShowCreateModal(true),
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            " Create Campaign"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid-stats mb-10", style: { "--grid-min-width": "260px" }, children: [
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm group hover:border-primary transition-all bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(TrendingUp, { className: "w-6 h-6 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.1rem" }, children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 m-0 tracking-tight", children: "Total engagements" }),
          /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-bold text-on-surface m-0", children: [
            stats?.totalEngagements || "...",
            /* @__PURE__ */ jsx("span", { className: "text-micro text-primary ml-2", children: "+15.2%" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm group hover:border-primary transition-all bg-on-surface text-white relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6 relative z-10", children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-white/40 mb-2 tracking-tight", children: "National sentiment" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-3", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-bold text-primary m-0", children: [
              stats?.nationalSentimentScore || "...",
              "%"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1", children: "Positive" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-micro text-white/20 font-bold tracking-tight mt-3 leading-tight", children: "Live engagement analysis from field chapters" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm group hover:border-primary transition-all bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-sm bg-muted/5 flex items-center justify-center shrink-0 border border-border/10", children: /* @__PURE__ */ jsx(Clock, { className: "w-6 h-6 text-muted-foreground/40" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.1rem" }, children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 m-0 tracking-tight", children: "Avg response time" }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-on-surface m-0", children: stats?.avgResponseTime || "..." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm group hover:border-primary transition-all bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-sm bg-muted/5 flex items-center justify-center shrink-0 border border-border/10", children: /* @__PURE__ */ jsx(MessageSquare, { className: "w-6 h-6 text-muted-foreground/40" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.1rem" }, children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 m-0 tracking-tight", children: "Feedback rate" }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-on-surface m-0", children: stats?.feedbackRate || "..." })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-bold tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4 text-destructive" }),
          "Campaign Management"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full md:w-64", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Search polls...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "pl-9 h-9 text-xs rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto hidden md:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/40 bg-muted/20", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Campaign title" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight text-center", children: "Responses" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Region" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "End date" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: isLoading ? Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsxs("tr", { className: "animate-pulse", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/30 w-3/4 rounded" }),
              /* @__PURE__ */ jsx("div", { className: "h-2 bg-muted/20 w-1/2 rounded" })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/20 w-full rounded" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/20 w-full rounded" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "h-6 bg-muted/20 w-16 rounded" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/20 w-full rounded" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-right", children: /* @__PURE__ */ jsx("div", { className: "h-8 w-8 bg-muted/20 ml-auto rounded" }) })
          ] }, i)) : filteredPolls.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-12 text-center text-muted-foreground/80 text-xs font-bold tracking-tight", children: "No matching polls found in the campaign hub." }) }) : filteredPolls.map((poll) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface tracking-tight", children: poll.question }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80 mt-0.5", children: poll.id })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface", children: poll.totalVotes.toLocaleString() }),
              /* @__PURE__ */ jsx("div", { className: "w-20 h-1 bg-muted/30 mt-2 overflow-hidden", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-full transition-all duration-1000",
                  style: {
                    width: poll.totalVotes > 1e4 ? "90%" : poll.totalVotes > 5e3 ? "60%" : "30%",
                    backgroundColor: poll.status === "Active" ? "var(--primary)" : "var(--accent)"
                  }
                }
              ) })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface/80 tracking-tight", children: poll.region }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full animate-pulse", style: { backgroundColor: poll.status === "Active" ? "var(--primary)" : "var(--accent)" } }),
              /* @__PURE__ */ jsx("span", { className: cn(
                "px-2.5 py-1 text-micro font-bold tracking-tight border rounded-md",
                poll.status === "Active" ? "bg-primary/10 text-primary border-primary/20" : poll.status === "Draft" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted/30 text-on-surface border-border/60"
              ), children: poll.status })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-micro font-bold text-muted-foreground/80", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
              poll.endDate
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 justify-end", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "destructive",
                  size: "icon",
                  className: "h-9 w-9 rounded-sm transition-all shadow-sm active:scale-95",
                  onClick: () => handleDeletePoll(poll.id, poll.question),
                  children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "gold",
                  size: "icon",
                  className: "h-9 w-9 rounded-sm transition-all shadow-sm active:scale-95",
                  onClick: () => handlePollAction("POLL_MANAGE", poll.question),
                  children: /* @__PURE__ */ jsx(MoreVertical, { className: "w-5 h-5" })
                }
              )
            ] }) })
          ] }, poll.id)) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "md:hidden divide-y divide-border/40", children: isLoading ? Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "p-6 animate-pulse space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/30 w-3/4 rounded" }),
          /* @__PURE__ */ jsx("div", { className: "h-3 bg-muted/20 w-1/2 rounded" }),
          /* @__PURE__ */ jsx("div", { className: "h-8 bg-muted/30 w-full rounded-sm" })
        ] }, i)) : filteredPolls.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-muted-foreground/80 text-xs font-bold", children: "No matching polls found." }) : filteredPolls.map((poll) => /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-on-surface leading-tight", children: poll.question }),
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case tracking-tight", children: poll.id })
            ] }),
            /* @__PURE__ */ jsx("div", { className: cn(
              "px-2 py-0.5 text-micro font-bold tracking-tight border rounded-full",
              poll.status === "Active" ? "bg-primary/10 text-primary border-primary/20" : "bg-accent/10 text-accent border-accent/20"
            ), children: poll.status })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-muted/5 rounded-sm border border-border/10", children: /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-on-surface" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Field participants" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-on-surface", children: poll.totalVotes.toLocaleString() })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-full h-1.5 bg-muted/30 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-full transition-all duration-1000",
              style: {
                width: poll.totalVotes > 1e4 ? "90%" : poll.totalVotes > 5e3 ? "60%" : "30%",
                backgroundColor: poll.status === "Active" ? "var(--primary)" : "var(--accent)"
              }
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Global engagement" }),
              /* @__PURE__ */ jsx(Badge, { variant: "default", className: "px-2 py-0.5 text-micro font-bold tracking-tight border rounded-full", children: "HQ Verified" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Expires" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface/80", children: poll.endDate })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "gold",
                className: "flex-1 h-11 rounded-sm text-micro font-bold tracking-tight transition-all shadow-sm active:scale-95",
                onClick: () => handlePollAction("POLL_MANAGE", poll.question),
                children: "Manage Campaign"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "destructive",
                size: "icon",
                className: "h-11 w-11 rounded-sm transition-all shadow-sm active:scale-95",
                onClick: () => handleDeletePoll(poll.id, poll.question),
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" })
              }
            )
          ] })
        ] }, poll.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-stretch", style: { "--column-gap": "2rem" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 bg-on-surface text-white relative overflow-hidden rounded-sm shadow-xl border border-white/5 flow", style: { "--flow-space": "1rem" }, children: [
        /* @__PURE__ */ jsx("h4", { className: "text-lg font-bold tracking-tight", children: "Maximize engagement" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-white/60 leading-relaxed max-w-sm", children: "Use regional-specific polls to gather more precise data. Our research shows chapters with localized campaigns see 40% higher member participation." }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "default",
            size: "sm",
            className: "h-11 px-10 text-micro font-bold tracking-tight border-white/20 bg-transparent text-white hover:bg-white hover:text-on-surface rounded-sm transition-all shadow-lg active:scale-95",
            onClick: () => setIsAnalyticsModalOpen(true),
            children: "Scan Analytics Guide"
          }
        ),
        /* @__PURE__ */ jsx(BarChart3, { className: "absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 border border-border/60 bg-white flow rounded-sm shadow-sm", style: { "--flow-space": "1.5rem" }, children: [
        /* @__PURE__ */ jsx("h4", { className: "text-lg font-bold tracking-tight text-on-surface", children: "Recent feedback highlights" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-muted/10 border border-border/40 flex items-center justify-center shrink-0 rounded-sm", children: /* @__PURE__ */ jsx(MessageSquare, { className: "w-5 h-5 text-muted-foreground/80" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-on-surface/80 italic leading-relaxed", children: '"The new regional chapter meetings have significantly improved communication between constituency leads..."' }),
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 mt-2", children: "- Member feedback from Ashanti Region" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              className: "h-9 px-0 text-micro font-bold tracking-tight text-accent hover:bg-transparent hover:text-accent/80 transition-colors group/btn active:scale-95",
              onClick: () => setIsFeedbackModalOpen(true),
              children: [
                "Scan Feedback Vault ",
                /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" })
              ]
            }
          )
        ] })
      ] })
    ] }),
    showCreateModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300", children: /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-2xl rounded-sm border-border/60 bg-white shadow-2xl animate-in zoom-in-95 duration-300", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/30", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-bold tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 text-destructive" }),
          "Create Campaign"
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-8 w-8 text-muted-foreground/80 hover:text-destructive",
            onClick: () => setShowCreateModal(false),
            children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleCreatePoll, children: [
        /* @__PURE__ */ jsx(CardContent, { className: "p-6 space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80", children: "Campaign question / topic" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  required: true,
                  placeholder: "e.g. Should we increase regional chapter funding?",
                  value: newPoll.question,
                  onChange: (e) => setNewPoll({ ...newPoll, question: e.target.value }),
                  className: "rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80", children: "Target Audience Base" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: newPoll.targetBase,
                    onChange: (e) => {
                      const val = e.target.value;
                      setNewPoll({
                        ...newPoll,
                        targetBase: val,
                        region: val === "GHANA" ? "National" : "International"
                      });
                    },
                    className: "w-full h-10 px-3 text-xs border border-border/60 rounded-sm focus:ring-on-surface/20 focus:border-on-surface focus:outline-none bg-white",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "GHANA", children: "Ghana Local Base" }),
                      /* @__PURE__ */ jsx("option", { value: "DIASPORA", children: "Diaspora Global Base" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80", children: newPoll.targetBase === "GHANA" ? "Specific Region" : "Target Country" }),
                /* @__PURE__ */ jsx(
                  "select",
                  {
                    value: newPoll.targetBase === "GHANA" ? newPoll.region : newPoll.country,
                    onChange: (e) => {
                      if (newPoll.targetBase === "GHANA") {
                        setNewPoll({ ...newPoll, region: e.target.value });
                      } else {
                        setNewPoll({ ...newPoll, country: e.target.value });
                      }
                    },
                    className: "w-full h-10 px-3 text-xs border border-border/60 rounded-sm focus:ring-on-surface/20 focus:border-on-surface focus:outline-none bg-white",
                    children: newPoll.targetBase === "GHANA" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx("option", { value: "National", children: "All Regions (National)" }),
                      availableRegions.map((r) => /* @__PURE__ */ jsx("option", { value: r.name, children: r.name }, r.id))
                    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx("option", { value: "International", children: "All Countries (Global)" }),
                      availableCountries.map((c) => /* @__PURE__ */ jsx("option", { value: c.name, children: c.name }, c.name))
                    ] })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80", children: "Operational title" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80 pointer-events-none" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "date",
                    value: newPoll.endDate,
                    onChange: (e) => setNewPoll({ ...newPoll, endDate: e.target.value }),
                    className: "pl-9 h-10 text-xs rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80 flex justify-between", children: [
              "Engagement Options",
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/40", children: "Min 2 Required" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar", children: newPoll.options.map((opt, idx) => /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                Input,
                {
                  placeholder: `Option ${idx + 1}`,
                  value: opt,
                  onChange: (e) => {
                    const updated = [...newPoll.options];
                    updated[idx] = e.target.value;
                    setNewPoll({ ...newPoll, options: updated });
                  },
                  className: "rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                }
              ),
              newPoll.options.length > 2 && /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "icon",
                  className: "shrink-0 text-muted-foreground/40 hover:text-red-500",
                  onClick: () => {
                    const updated = newPoll.options.filter((_, i) => i !== idx);
                    setNewPoll({ ...newPoll, options: updated });
                  },
                  children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                }
              )
            ] }, idx)) }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                variant: "primary",
                className: "w-full h-11 text-micro font-bold tracking-tight rounded-sm transition-all shadow-sm active:scale-95",
                onClick: () => setNewPoll({ ...newPoll, options: [...newPoll.options, ""] }),
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
                  " Add Selection"
                ]
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 pt-0 flex gap-4", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "default",
              className: "flex-1 h-12 text-micro font-bold tracking-tight rounded-sm border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95",
              onClick: () => setShowCreateModal(false),
              children: "Discard"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              variant: "primary",
              disabled: isSubmitting,
              className: "flex-1 h-12 text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
              children: isSubmitting ? "Launching..." : "Deploy Campaign"
            }
          )
        ] })
      ] })
    ] }) }),
    isFeedbackModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300", children: /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-2xl rounded-sm border-border/60 bg-white shadow-2xl overflow-hidden", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/30", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-bold tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4 text-destructive" }),
          "Movement Feedback Vault"
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-8 w-8 text-muted-foreground/80 hover:text-destructive",
            onClick: () => setIsFeedbackModalOpen(false),
            children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "p-6 space-y-4 max-h-[60vh] overflow-y-auto", children: [
        { author: "Ashanti Member", region: "Ashanti", text: "The new regional chapter meetings have significantly improved communication between constituency leads." },
        { author: "Greater Accra Lead", region: "Greater Accra", text: "Requesting more mobilization materials for the upcoming town hall sessions." },
        { author: "Western Member", region: "Western", text: "The digital strategy polls are a great way to stay engaged with the leadership." }
      ].map((fb, idx) => /* @__PURE__ */ jsxs("div", { className: "p-4 bg-muted/10 border border-border/40 rounded-sm space-y-2", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-on-surface/80 italic leading-relaxed", children: [
          '"',
          fb.text,
          '"'
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-muted-foreground/80", children: [
          "- ",
          fb.author,
          " from ",
          fb.region,
          " Region"
        ] })
      ] }, idx)) }),
      /* @__PURE__ */ jsx("div", { className: "p-6 pt-0 border-t border-border/40 bg-muted/5 flex justify-end mt-4", children: /* @__PURE__ */ jsx(
        Button,
        {
          variant: "primary",
          className: "h-12 text-micro font-bold tracking-tight rounded-sm w-full shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          onClick: () => setIsFeedbackModalOpen(false),
          children: "Close Vault"
        }
      ) })
    ] }) }),
    isAnalyticsModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300", children: /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-lg rounded-sm border-border/60 bg-white shadow-2xl overflow-hidden", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/30", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-bold tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4 text-destructive" }),
          "Engagement Analytics Guide"
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-8 w-8 text-muted-foreground/80 hover:text-destructive",
            onClick: () => setIsAnalyticsModalOpen(false),
            children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "p-6 space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-sm text-on-surface/80 leading-relaxed", children: [
        /* @__PURE__ */ jsx("p", { children: "Learn how to interpret movement engagement data to drive more effective mobilization campaigns." }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 space-y-2 text-xs", children: [
          /* @__PURE__ */ jsx("li", { children: "Analyze regional participation rates to identify high-growth areas." }),
          /* @__PURE__ */ jsx("li", { children: "Monitor sentiment scores to proactively address movement concerns." }),
          /* @__PURE__ */ jsx("li", { children: "Use average response times to optimize survey length and timing." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "p-6 pt-0", children: /* @__PURE__ */ jsx(
        Button,
        {
          variant: "primary",
          className: "h-12 text-micro font-bold tracking-tight rounded-sm w-full shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          onClick: () => setIsAnalyticsModalOpen(false),
          children: "Got It"
        }
      ) })
    ] }) })
  ] });
}
export {
  PollsManagement as default
};
