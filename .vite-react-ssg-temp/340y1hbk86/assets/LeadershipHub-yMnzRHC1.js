import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { ShieldCheck, Clock, Download, Search, Filter, FileText, UserCheck, MapPin, XCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { t as useToast, a as adminService, b as BrandLine, B as Button, C as Card, d as CardContent, j as CardHeader, v as CardTitle, w as CardDescription, c as cn } from "../main.mjs";
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
function LeadershipHub() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const fetchApplications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const data = await adminService.getChapterApplications();
    setApplications(data);
    setIsLoading(false);
  }, []);
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const data = await adminService.getChapterApplications();
      if (isMounted) {
        setApplications(data);
        setIsLoading(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);
  const handleApprove = async (appId, name) => {
    const success = await adminService.approveChapterApplication(appId, "Approved by SuperAdmin via Command Center");
    if (success) {
      toast({
        title: "Leadership promoted",
        description: `${name} has been officially appointed as Chapter Leader.`
      });
      fetchApplications();
    } else {
      toast({
        title: "Promotion failed",
        description: "An error occurred during the leadership transition.",
        variant: "destructive"
      });
    }
  };
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const report = await adminService.generateComplianceReport();
      const blob = new Blob([report], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `THE-BASE-COMPLIANCE-REPORT-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Report generated",
        description: "Compliance audit manifest has been downloaded."
      });
    } catch (err) {
      console.error("[AUDIT] Report generation failed:", err);
      toast({
        title: "Generation failed",
        description: "Could not compile movement audit data.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  const filteredApps = applications.filter(
    (app) => app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) || app.proposed_chapter_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { className: "w-8 h-8 text-on-surface" }),
          "Leadership hub"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Managing the administrative pipeline for local leadership applications." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "primary",
          size: "lg",
          onClick: handleGenerateReport,
          disabled: isGenerating,
          className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          children: [
            isGenerating ? /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
            isGenerating ? "Compiling Audit..." : "Export Audit Manifest"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/60 p-4 flex flex-wrap items-center gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[240px] relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "Search applications...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "w-full h-10 pl-10 pr-4 bg-muted/5 border-none text-tiny font-bold placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-border/40 rounded-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "default",
          className: "h-11 px-8 text-micro font-bold tracking-tight border-border/40 hover:bg-stone-50 rounded-sm transition-all shadow-sm active:scale-95",
          children: [
            /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4 mr-2 text-muted-foreground/40" }),
            " Filter Status"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid-stats mb-10", style: { "--grid-min-width": "240px" }, children: [
      /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm relative overflow-hidden bg-white", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-1 h-full bg-destructive" }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 normal-case tracking-tight", children: "Growth rate" }),
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold font-meta text-on-surface mt-1", children: "+12%" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm relative overflow-hidden bg-white", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-1 h-full bg-accent" }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 normal-case tracking-tight", children: "Pending requests" }),
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold font-meta text-on-surface mt-1", children: applications.filter((a) => a.status === "Pending").length })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm relative overflow-hidden bg-white", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-1 h-full bg-primary" }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 normal-case tracking-tight", children: "New leaders appointed" }),
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold font-meta text-on-surface mt-1", children: applications.filter((a) => a.status === "Approved").length })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "rounded-none border-border/60 shadow-sm overflow-hidden bg-white", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "p-8 border-b border-border/40", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg font-bold font-meta normal-case", children: "Active applications" }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-xs", children: "Review and approve new Chapter Leaders." })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "default",
            onClick: () => fetchApplications(),
            className: "h-11 w-11 p-0 rounded-sm hover:bg-stone-50 border-border/40 text-muted-foreground/40 hover:text-on-surface transition-all shadow-sm active:scale-95",
            children: /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" })
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/30 border-b border-border/40", children: [
          /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-muted-foreground/40 normal-case", children: "Applicant" }),
          /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-muted-foreground/40 normal-case", children: "Proposed chapter" }),
          /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-muted-foreground/40 normal-case", children: "Geography" }),
          /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-muted-foreground/40 normal-case", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-on-surface normal-case", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/10", children: isLoading ? Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx("tr", { className: "animate-pulse", children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-6", children: /* @__PURE__ */ jsx("div", { className: "h-12 bg-muted/5 w-full" }) }) }, i)) : filteredApps.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 5, className: "p-20 text-center", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-12 h-12 text-border/40 mx-auto mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/40 text-micro font-bold normal-case", children: "No leadership applications found" })
        ] }) }) : filteredApps.map((app) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors group", children: [
          /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-border/40 flex items-center justify-center font-bold text-micro normal-case rounded-sm", children: app.applicant_name?.split(" ").map((n) => n[0]).join("") }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-on-surface normal-case", children: app.applicant_name }),
              /* @__PURE__ */ jsxs("p", { className: "text-micro text-muted-foreground/40 font-bold normal-case mt-0.5", children: [
                "Member ID: ",
                app.applicant_id.substring(0, 8)
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(UserCheck, { className: "w-3.5 h-3.5 text-accent" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface normal-case", children: app.proposed_chapter_name })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-muted-foreground/40" }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/80 normal-case", children: app.region })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/40 font-bold normal-case ml-4", children: app.constituency })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsx("span", { className: cn(
            "px-2 py-0.5 text-[8px] font-bold normal-case border rounded-full",
            app.status === "Approved" ? "bg-primary/10 text-primary border-primary/20" : app.status === "Pending" ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"
          ), children: app.status }) }),
          /* @__PURE__ */ jsx("td", { className: "p-6 text-right", children: app.status === "Pending" ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "destructive",
                className: "h-11 px-8 text-micro font-bold tracking-tight transition-all shadow-sm rounded-sm active:scale-95 shadow-lg shadow-brand-red/20",
                children: [
                  /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 mr-2" }),
                  " Reject Application"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "primary",
                onClick: () => handleApprove(app.id, app.applicant_name || "Applicant"),
                className: "h-11 px-10 text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 mr-2 text-accent" }),
                  " Appoint Leader"
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsxs(Button, { variant: "ghost", className: "h-8 text-muted-foreground/40 text-micro font-bold normal-case pointer-events-none rounded-sm", children: [
            "Processed ",
            /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3 ml-1" })
          ] }) })
        ] }, app.id)) })
      ] }) }) })
    ] }),
    filteredApps.some((a) => a.status === "Pending") && /* @__PURE__ */ jsx("div", { className: "flex-columns items-stretch", style: { "--column-gap": "2rem" }, children: filteredApps.filter((a) => a.status === "Pending").slice(0, 2).map((app) => /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-muted/30 overflow-hidden", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "p-8 pb-4", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Applicant vision statement" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "p-8 pt-0", children: [
        /* @__PURE__ */ jsxs("blockquote", { className: "border-l-2 border-accent pl-4 py-1 italic text-on-surface/80 text-sm leading-relaxed mb-6 font-body-md", children: [
          '"',
          app.vision_statement,
          '"'
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/40 p-4 rounded-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-muted-foreground/40 mb-2", children: "Experience summary" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground/80 leading-relaxed prose-standard", children: app.experience_summary })
        ] })
      ] })
    ] }, `detail-${app.id}`)) })
  ] });
}
export {
  LeadershipHub as default
};
