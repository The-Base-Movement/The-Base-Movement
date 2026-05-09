import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Brain, Activity, BarChart3, Target, Zap, Map, MessageSquare } from "lucide-react";
import { t as useToast, b as BrandLine, c as cn, B as Button, C as Card, j as CardHeader, v as CardTitle, w as CardDescription, d as CardContent, a as adminService } from "../main.mjs";
import { format } from "date-fns";
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
import "@radix-ui/react-label";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-toast";
function SentimentIntelligence() {
  const [feedback, setFeedback] = useState([]);
  const [sentimentMetrics, setSentimentMetrics] = useState([]);
  const [projections, setProjections] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => {
    async function fetchIntelligence() {
      setLoading(true);
      try {
        const [fbData, telData, projData] = await Promise.all([
          adminService.getMemberFeedback(),
          adminService.getSentimentIntelligence(),
          adminService.getImpactProjections()
        ]);
        setFeedback(fbData);
        setSentimentMetrics(telData);
        setProjections(projData);
      } catch (error) {
        console.error("[INTELLIGENCE] Failed to fetch sentiment data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchIntelligence();
  }, []);
  const getSentimentColor = (score) => {
    if (score >= 0.5) return "text-primary bg-primary/10";
    if (score <= -0.5) return "text-destructive bg-destructive/10";
    return "text-muted-foreground/80 bg-muted/30";
  };
  const getSentimentLabel = (score) => {
    if (score >= 0.5) return "Positive";
    if (score <= -0.5) return "Critical";
    return "Neutral";
  };
  const nationalScore = sentimentMetrics.length > 0 ? sentimentMetrics.reduce((acc, curr) => acc + curr.avg_sentiment, 0) / sentimentMetrics.length : 0;
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 border-4 border-border/40 border-t-destructive animate-spin" }),
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-primary", children: "Initializing AI intelligence core..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container animate-in fade-in duration-700", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-center flex-between", style: { "--column-gap": "2rem" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.5rem" }, children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta m-0", children: [
          /* @__PURE__ */ jsx(Brain, { className: "w-8 h-8 text-on-surface" }),
          "Sentiment intelligence"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, {}),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mb-0", children: "AI-powered member sentiment tracking and mobilization impact forecasting." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-4 px-6 py-3 bg-white border border-border/40 rounded-sm shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-right flow", style: { "--flow-space": "0.1em" }, children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/40 block normal-case mb-0", children: "National average" }),
            /* @__PURE__ */ jsx("span", { className: cn(
              "text-lg font-bold tracking-tight m-0",
              nationalScore >= 0 ? "text-primary" : "text-brand-red"
            ), children: (nationalScore * 100).toFixed(1) })
          ] }),
          /* @__PURE__ */ jsx(Activity, { className: cn("w-5 h-5", nationalScore >= 0 ? "text-primary" : "text-brand-red") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "primary",
              size: "lg",
              className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
              onClick: () => toast({ title: "Analysis started", description: "Aggregating regional sentiment data..." }),
              children: [
                /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 mr-2" }),
                " Run AI Analysis"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "default",
              size: "lg",
              className: "rounded-sm border-border/40 text-on-surface/80 text-micro px-10 h-12 font-bold tracking-tight hover:bg-stone-50 transition-all shadow-sm active:scale-95",
              onClick: () => toast({ title: "Report exported", description: "Your intelligence briefing is ready for download." }),
              children: [
                /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4 mr-2" }),
                " Export Briefing"
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-start", style: { "--column-gap": "2rem", "--column-breakpoint": "120ch" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-[2] min-w-0 flow", style: { "--flow-space": "2rem" }, children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border shadow-sm bg-card overflow-hidden", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border bg-muted/20", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.25rem" }, children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-xs font-bold text-on-surface m-0", children: "Impact forecasts" }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold text-muted-foreground/40 m-0", children: "30-day mobilization projections" })
            ] }),
            /* @__PURE__ */ jsx(Target, { className: "w-4 h-4 text-muted-foreground" })
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-8", children: /* @__PURE__ */ jsx("div", { className: "space-y-8", children: projections.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
            /* @__PURE__ */ jsx(BarChart3, { className: "w-8 h-8 text-muted mx-auto mb-3" }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground normal-case tracking-tight", children: "No data yet. Projections appear after 30 days of activity." })
          ] }) : projections.map((proj) => /* @__PURE__ */ jsxs("div", { className: "relative flow", style: { "--flow-space": "0.5rem" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-tiny font-bold text-on-surface m-0", children: proj.region }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/40", children: "Projected reach" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-brand-red m-0", children: proj.projected_reach_30d.toLocaleString() })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "h-2 bg-muted rounded-full overflow-hidden flex", children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-full bg-primary transition-all duration-1000",
                  style: { width: `${proj.current_reach / proj.projected_reach_30d * 100}%` }
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-full bg-destructive/50 animate-pulse transition-all duration-1000",
                  style: { width: `${(proj.projected_reach_30d - proj.current_reach) / proj.projected_reach_30d * 100}%` }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground normal-case tracking-tight flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Zap, { className: "w-3 h-3" }),
                " +",
                proj.mobilization_velocity,
                "/day"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground normal-case tracking-tight", children: [
                "Confidence: ",
                (proj.confidence_score * 100).toFixed(0),
                "%"
              ] })
            ] })
          ] }, proj.id)) }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-on-surface text-white overflow-hidden relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" }),
          /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-white/10 relative z-10", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-xs font-bold normal-case font-meta text-white m-0", children: "Regional metrics" }),
            /* @__PURE__ */ jsx(Map, { className: "w-4 h-4 text-muted-foreground/80" })
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-0 relative z-10", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-white/10 max-h-[400px] overflow-y-auto sidebar-scroll", children: sentimentMetrics.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case mb-0", children: "No regional data available yet." }) }) : sentimentMetrics.map((t) => /* @__PURE__ */ jsxs("div", { className: "p-5 flex items-center justify-between hover:bg-white/5 transition-colors", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case", children: t.region }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2 text-micro font-bold text-white/40", children: [
                /* @__PURE__ */ jsx("span", { className: "text-primary", children: t.positive_count }),
                /* @__PURE__ */ jsx("span", { className: "text-white/20", children: "/" }),
                /* @__PURE__ */ jsx("span", { className: "text-white/40", children: t.neutral_count }),
                /* @__PURE__ */ jsx("span", { className: "text-white/20", children: "/" }),
                /* @__PURE__ */ jsx("span", { className: "text-brand-red", children: t.negative_count })
              ] }),
              /* @__PURE__ */ jsx("span", { className: cn(
                "px-2 py-0.5 text-micro font-bold normal-case rounded-full min-w-[70px] text-center",
                getSentimentColor(t.avg_sentiment)
              ), children: getSentimentLabel(t.avg_sentiment).toLowerCase() })
            ] })
          ] }, t.id)) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white overflow-hidden h-full", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.25rem" }, children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-xs font-bold normal-case font-meta m-0", children: "Live feedback" }),
            /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/80 m-0", children: "Direct member sentiment" })
          ] }),
          /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4 text-muted-foreground/80" })
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-border/40 max-h-[850px] overflow-y-auto", children: feedback.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case mb-0", children: "No feedback intercepted" }) }) : feedback.map((item) => /* @__PURE__ */ jsxs("div", { className: "p-6 hover:bg-muted/30 transition-colors flow", style: { "--flow-space": "0.75rem" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
            /* @__PURE__ */ jsx("span", { className: cn(
              "text-[8px] font-bold normal-case px-2.5 py-1 rounded-full",
              getSentimentColor(item.sentiment_score)
            ), children: item.category.toLowerCase() }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/40", children: format(new Date(item.created_at), "HH:mm") })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[13px] text-on-surface/90 m-0 leading-relaxed font-medium", children: item.feedback_text || item.content || item.text || "Sentiment intercept recorded without textual content." }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-1", children: [
            /* @__PURE__ */ jsx(Map, { className: "w-3 h-3 text-muted-foreground/20" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: item.region })
          ] })
        ] }, item.id)) }) })
      ] }) })
    ] })
  ] });
}
export {
  SentimentIntelligence as default
};
