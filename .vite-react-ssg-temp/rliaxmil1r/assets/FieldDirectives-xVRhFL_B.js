import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Target, BarChart, Plus, Layers, Clock, Shield, Eye, Filter, Camera, MapPin, XCircle, CheckCircle, AlertTriangle, Send } from "lucide-react";
import { b as BrandLine, B as Button, C as Card, j as CardHeader, c as cn, v as CardTitle, d as CardContent, w as CardDescription, a as adminService } from "../main.mjs";
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
function FieldDirectives() {
  const [directives, setDirectives] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDirective, setNewDirective] = useState({
    title: "",
    description: "",
    target_type: "Regional",
    priority: "Normal",
    points_awarded: 50,
    deadline: ""
  });
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [directivesData, reportsData] = await Promise.all([
          adminService.getFieldDirectives(),
          adminService.getFieldReports()
        ]);
        setDirectives(directivesData);
        setReports(reportsData);
      } catch (err) {
        console.error("Failed to load tactical data:", err);
        toast.error("Tactical synchronization failed.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const handleIssueDirective = async () => {
    if (!newDirective.title || !newDirective.description) {
      toast.error("Tactical title and objective description are required.");
      return;
    }
    setIsSubmitting(true);
    const success = await adminService.createFieldDirective({
      ...newDirective
    });
    if (success) {
      toast.success("Tactical directive deployed to the field.");
      setIsCreating(false);
      setNewDirective({
        title: "",
        description: "",
        target_type: "Regional",
        priority: "Normal",
        points_awarded: 50,
        deadline: ""
      });
      const updated = await adminService.getFieldDirectives();
      setDirectives(updated);
    } else {
      toast.error("Failed to deploy tactical protocol.");
    }
    setIsSubmitting(false);
  };
  const handleVerify = async (reportId, status) => {
    const success = await adminService.verifyFieldReport(reportId, status);
    if (success) {
      toast.success(`Report ${status.toLowerCase()} successfully.`);
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status } : r));
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "h-full w-full flex flex-col items-center justify-center py-20", children: [
      /* @__PURE__ */ jsx(Target, { className: "w-12 h-12 text-muted-foreground/20 animate-spin mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40", children: "Synchronizing tactical feed..." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Target, { className: "w-8 h-8 text-on-surface" }),
          "Field directives"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Deploying decentralized tactical objectives across the movement." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            size: "lg",
            className: "rounded-sm border-border/40 text-on-surface/80 text-micro px-10 font-bold tracking-tight hover:bg-stone-50 transition-all h-12 shadow-sm active:scale-95",
            children: [
              /* @__PURE__ */ jsx(BarChart, { className: "w-4 h-4 mr-2" }),
              " Tactical Analytics"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            size: "lg",
            onClick: () => setIsCreating(true),
            className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              " Issue New Directive"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "xl:col-span-1 space-y-6", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Layers, { className: "w-5 h-5 text-destructive" }),
          " Active directives"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: directives.length > 0 ? directives.map((directive) => /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm hover:border-on-surface transition-colors group", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 pb-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
              /* @__PURE__ */ jsxs("span", { className: cn(
                "px-2 py-0.5 text-[8px] font-bold normal-case border rounded-full",
                directive.priority === "Urgent" ? "bg-destructive/10 text-destructive border-destructive/20" : directive.priority === "High" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted/10 text-on-surface/60 border-border/10"
              ), children: [
                directive.priority.toLowerCase(),
                " priority"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: directive.target_type.toLowerCase() })
            ] }),
            /* @__PURE__ */ jsx(CardTitle, { className: "text-base font-bold tracking-tight text-on-surface leading-tight", children: directive.title })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-6 pt-2 space-y-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground/80 line-clamp-2", children: directive.description }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-border/10", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground/40", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case", children: directive.deadline ? new Date(directive.deadline).toLocaleDateString() : "No deadline" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-accent", children: [
                /* @__PURE__ */ jsx(Shield, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold", children: [
                  directive.points_awarded,
                  " pts"
                ] })
              ] })
            ] })
          ] })
        ] }, directive.id)) : /* @__PURE__ */ jsxs("div", { className: "border-2 border-dashed border-border/40 p-12 text-center text-muted-foreground/20 rounded-sm", children: [
          /* @__PURE__ */ jsx(Target, { className: "w-12 h-12 mx-auto mb-4 opacity-10" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case", children: "No active directives." })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold tracking-tight flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5 text-destructive" }),
            " Situational awareness feed"
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "default",
              className: "h-11 px-8 text-micro font-bold tracking-tight hover:bg-stone-50 rounded-sm border-border/40 transition-all shadow-sm active:scale-95",
              children: [
                /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4 mr-2" }),
                " Filter Feed"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: reports.length > 0 ? reports.map((report) => /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "aspect-video bg-muted/10 relative group overflow-hidden", children: [
            report.media_url ? /* @__PURE__ */ jsx("img", { src: report.media_url, alt: "Field verification", className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center text-muted-foreground/20", children: [
              /* @__PURE__ */ jsx(Camera, { className: "w-8 h-8 mb-2 opacity-20" }),
              /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold normal-case", children: "No media verification" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-4 left-4", children: /* @__PURE__ */ jsx("div", { className: cn(
              "px-2 py-1 text-[8px] font-bold normal-case shadow-xl border rounded-full",
              report.status === "Verified" ? "bg-primary text-white border-primary/20" : report.status === "Rejected" ? "bg-destructive text-white border-destructive/20" : "bg-white/90 text-on-surface border-white"
            ), children: report.status.toLowerCase() }) }),
            report.location_lat && /* @__PURE__ */ jsx("div", { className: "absolute bottom-4 left-4", children: /* @__PURE__ */ jsxs("div", { className: "px-2 py-1 bg-on-surface/60 backdrop-blur-md text-white text-[8px] font-bold normal-case flex items-center gap-1.5 rounded-full border border-white/10", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-2.5 h-2.5 text-destructive" }),
              " Verified location"
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-4 flex-1 flex flex-col", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-muted/10 rounded-full flex items-center justify-center overflow-hidden border border-border/10", children: /* @__PURE__ */ jsx("img", { src: `https://i.pravatar.cc/100?u=${report.member_id}`, alt: "Member", className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold normal-case tracking-tight leading-none mb-1", children: [
                  "Member #",
                  report.member_id.slice(0, 5)
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-[8px] font-bold text-muted-foreground/40 normal-case", children: [
                  new Date(report.created_at).toLocaleTimeString(),
                  " - ",
                  new Date(report.created_at).toLocaleDateString()
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-on-surface/80 leading-relaxed", children: [
              '"',
              report.report_text || "Completed tactical directive as requested. Awaiting point verification.",
              '"'
            ] }),
            report.status === "Pending" && /* @__PURE__ */ jsxs("div", { className: "pt-6 mt-auto grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "default",
                  onClick: () => handleVerify(report.id, "Rejected"),
                  className: "h-12 border-border/40 text-brand-red hover:bg-brand-red/10 rounded-sm text-micro font-bold tracking-tight transition-all active:scale-95",
                  children: [
                    /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 mr-2" }),
                    " Reject Report"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "primary",
                  onClick: () => handleVerify(report.id, "Verified"),
                  className: "h-12 rounded-sm text-micro font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
                  children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 mr-2" }),
                    " Verify Action"
                  ]
                }
              )
            ] })
          ] })
        ] }, report.id)) : /* @__PURE__ */ jsxs("div", { className: "col-span-2 border-2 border-dashed border-border/40 p-12 flex flex-col items-center justify-center text-muted-foreground/20 rounded-sm", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-12 h-12 mb-4 opacity-10" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case", children: "Situational feed currently quiet." })
        ] }) })
      ] })
    ] }),
    isCreating && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300", children: /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-xl rounded-sm border-border/60 shadow-2xl animate-in zoom-in-95 duration-300", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "p-8 border-b border-border/10 bg-muted/5", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-xl font-bold normal-case font-meta", children: "Issue new directive" }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-muted-foreground/80 text-micro font-bold normal-case mt-1", children: "Deploy tactical objectives to the field." })
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setIsCreating(false), className: "h-8 w-8 p-0 rounded-sm hover:bg-muted/10", children: /* @__PURE__ */ jsx(XCircle, { className: "w-5 h-5 text-muted-foreground/40" }) })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "p-8 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Directive title" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "e.g. Regional Flyer Blitz",
                  className: "w-full h-11 bg-muted/5 border-border/60 text-xs font-bold px-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm",
                  value: newDirective.title,
                  onChange: (e) => setNewDirective({ ...newDirective, title: e.target.value })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Target level" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "w-full h-11 bg-muted/5 border-border/60 text-xs font-bold px-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm",
                  value: newDirective.target_type,
                  onChange: (e) => setNewDirective({ ...newDirective, target_type: e.target.value }),
                  children: [
                    /* @__PURE__ */ jsx("option", { children: "Regional" }),
                    /* @__PURE__ */ jsx("option", { children: "Chapter" }),
                    /* @__PURE__ */ jsx("option", { children: "Global" })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Objective description" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 3,
                placeholder: "Describe the tactical goal...",
                className: "w-full bg-muted/5 border-border/60 text-xs font-bold p-4 focus:ring-1 focus:ring-on-surface outline-none resize-none rounded-sm",
                value: newDirective.description,
                onChange: (e) => setNewDirective({ ...newDirective, description: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Points awarded" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  className: "w-full h-11 bg-muted/5 border-border/60 text-xs font-bold px-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm",
                  value: newDirective.points_awarded,
                  onChange: (e) => setNewDirective({ ...newDirective, points_awarded: Number(e.target.value) })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Priority" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "w-full h-11 bg-muted/5 border-border/60 text-xs font-bold px-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm",
                  value: newDirective.priority,
                  onChange: (e) => setNewDirective({ ...newDirective, priority: e.target.value }),
                  children: [
                    /* @__PURE__ */ jsx("option", { children: "Normal" }),
                    /* @__PURE__ */ jsx("option", { children: "High" }),
                    /* @__PURE__ */ jsx("option", { children: "Urgent" })
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-6 flex gap-4", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "default",
              onClick: () => setIsCreating(false),
              className: "flex-1 h-12 rounded-sm border-border/40 font-bold text-micro tracking-tight hover:bg-stone-50 transition-all active:scale-95",
              disabled: isSubmitting,
              children: "Cancel Directive"
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "primary",
              className: "flex-1 h-12 rounded-sm font-bold text-micro tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
              onClick: handleIssueDirective,
              disabled: isSubmitting,
              children: [
                /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
                " ",
                isSubmitting ? "Deploying..." : "Deploy Protocol"
              ]
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  FieldDirectives as default
};
