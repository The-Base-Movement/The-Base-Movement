import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { Users, Filter, Plus, Activity, MapPin, Clock, Navigation, Search, ShieldCheck, AlertCircle } from "lucide-react";
import { a as adminService, b as BrandLine, B as Button, C as Card, j as CardHeader, v as CardTitle, d as CardContent, c as cn, w as CardDescription } from "../main.mjs";
import { toast } from "sonner";
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
import "react-easy-crop";
import "qrcode.react";
import "@radix-ui/react-label";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-toast";
function RallyCommand() {
  const [actions, setActions] = useState([]);
  const [selectedAction, setSelectedAction] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const fetchActions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getFieldActions();
      setActions(data);
      if (data.length > 0 && !selectedAction) {
        setSelectedAction(data[0]);
      }
    } catch (error) {
      console.error("[MOBILIZATION] Failed to fetch field actions:", error);
      toast.error("Failed to synchronize field actions.");
    } finally {
      setLoading(false);
    }
  }, [selectedAction]);
  const fetchAttendance = useCallback(async (actionId) => {
    try {
      const data = await adminService.getFieldActionAttendance(actionId);
      setAttendance(data);
    } catch (error) {
      console.error("[MOBILIZATION] Failed to fetch attendance:", error);
      toast.error("Failed to synchronize attendance manifest.");
    }
  }, []);
  useEffect(() => {
    fetchActions();
  }, [fetchActions]);
  useEffect(() => {
    if (selectedAction) {
      fetchAttendance(selectedAction.id);
    }
  }, [selectedAction, fetchAttendance]);
  const handleVerify = async (id) => {
    setVerifying(id);
    try {
      const success = await adminService.verifyRallyAttendance(id);
      if (success) {
        toast.success("Attendance verified. Points awarded.");
        setAttendance((prev) => prev.map((a) => a.id === id ? { ...a, is_verified: true } : a));
      }
    } catch (error) {
      console.error("[MOBILIZATION] Manual verification failed:", error);
      toast.error("Verification failed.");
    } finally {
      setVerifying(null);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 border-4 border-border/40 border-t-destructive animate-spin" }),
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-primary", children: "Initializing mobilization command..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Users, { className: "w-8 h-8 text-on-surface" }),
          "Rally command"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Real-time attendance operational metrics and geo-fenced verification for field actions." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            size: "lg",
            className: "rounded-sm border-border/40 text-on-surface/80 text-micro px-10 font-bold tracking-tight hover:bg-stone-50 transition-all h-12 shadow-sm active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4 mr-2" }),
              " Global Manifest"
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
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              " Schedule Action"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-1 space-y-6", children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white overflow-hidden", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/10", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-xs font-bold normal-case font-meta", children: "Field actions" }),
          /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 text-muted-foreground/80" })
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-border/40 max-h-[600px] overflow-y-auto", children: actions.map((action) => /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => setSelectedAction(action),
            className: cn(
              "p-5 cursor-pointer transition-all border-l-4",
              selectedAction?.id === action.id ? "bg-muted/10 border-destructive" : "hover:bg-muted/5 border-transparent"
            ),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: cn(
                  "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                  action.status === "Live" ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted/10 text-muted-foreground/80"
                ), children: action.status.toLowerCase() }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80", children: format(new Date(action.start_time), "MMM dd, HH:mm") })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "text-tiny font-bold normal-case tracking-tight text-on-surface leading-tight", children: action.title }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-muted-foreground/40" }),
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case truncate", children: action.location_name })
              ] })
            ]
          },
          action.id
        )) }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-8", children: selectedAction ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case text-muted-foreground/80", children: "Verified strength" }),
              /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-muted-foreground/80" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold tracking-tighter text-on-surface", children: attendance.filter((a) => a.is_verified).length }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case mt-1", children: "Confirmed field personnel" })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case text-muted-foreground/80", children: "Check-in velocity" }),
              /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-muted-foreground/80" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold tracking-tighter text-on-surface", children: attendance.length }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case mt-1", children: "Total signals received" })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case text-muted-foreground/80", children: "Target achievement" }),
              /* @__PURE__ */ jsx(Navigation, { className: "w-4 h-4 text-muted-foreground/80" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-3xl font-bold tracking-tighter text-on-surface", children: [
              Math.round(attendance.length / selectedAction.target_attendance * 100),
              "%"
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case mt-1", children: [
              "Goal: ",
              selectedAction.target_attendance
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white overflow-hidden", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 flex flex-row items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-xs font-bold normal-case font-meta", children: "Attendance manifest" }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/80 mt-1", children: "Verified check-ins via geo-fenced mobile operational metrics." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  className: "bg-muted/10 border-none h-9 pl-9 pr-4 text-micro font-bold normal-case focus:ring-1 focus:ring-border/40 rounded-sm w-48",
                  placeholder: "Search member..."
                }
              )
            ] }) })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/10 border-b border-border/40", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Member" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Signal time" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80 text-right", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: attendance.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-6 py-12 text-center text-micro font-bold text-muted-foreground/80 normal-case", children: "No signals detected for this action" }) }) : attendance.map((entry) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/5 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-muted/10 flex items-center justify-center font-bold text-micro normal-case rounded-sm", children: entry.user_name?.charAt(0) }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case text-on-surface", children: entry.user_name })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface/60", children: format(new Date(entry.check_in_time), "HH:mm:ss") }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: entry.is_verified ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-primary", children: [
                /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case", children: "Verified" })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-orange-500", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case", children: "Pending" })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: !entry.is_verified && /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "primary",
                  size: "sm",
                  className: "rounded-sm text-micro font-bold capitalize tracking-tight h-9 px-6 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
                  onClick: () => handleVerify(entry.id),
                  disabled: verifying === entry.id,
                  children: verifying === entry.id ? "Verifying Signal..." : "Manual Verify"
                }
              ) })
            ] }, entry.id)) })
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm bg-background overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-on-surface px-6 py-4 flex items-center justify-between border-b border-white/5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 text-destructive" }),
              /* @__PURE__ */ jsx("h3", { className: "text-white text-micro font-bold normal-case", children: "Geo-fence boundary verification" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-white/40 normal-case", children: [
              selectedAction.geofence_radius_meters,
              "m radius"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "h-64 bg-muted/10 flex items-center justify-center relative group", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" }),
            /* @__PURE__ */ jsxs("div", { className: "relative text-center", children: [
              /* @__PURE__ */ jsx(Navigation, { className: "w-12 h-12 text-muted-foreground/20 mx-auto mb-3 group-hover:rotate-45 transition-transform duration-700" }),
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-muted-foreground/80", children: "Satellite engagement visualization" }),
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-on-surface mt-2 normal-case", children: selectedAction.location_name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: [
              /* @__PURE__ */ jsx("div", { className: "w-32 h-32 rounded-full border-2 border-dashed border-destructive/20 animate-ping opacity-20" }),
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-destructive/5 border border-destructive/20" })
            ] })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "h-[600px] flex items-center justify-center border-2 border-dashed border-border/40 rounded-sm bg-muted/5", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-12 h-12 text-muted-foreground/20 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-muted-foreground/80", children: "Select a field action to view tactical operational metrics" })
      ] }) }) })
    ] })
  ] });
}
export {
  RallyCommand as default
};
