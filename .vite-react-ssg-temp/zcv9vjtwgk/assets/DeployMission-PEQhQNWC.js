import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, ChevronRight, Crosshair, ArrowLeft, Flag, MapPin, Target, Calendar, Users, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { b as BrandLine, B as Button, C as Card, j as CardHeader, v as CardTitle, w as CardDescription, d as CardContent, a as adminService } from "../main.mjs";
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
import "date-fns";
import "@radix-ui/react-label";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-toast";
function DeployMission() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [filteredConstituencies, setFilteredConstituencies] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedConstituency, setSelectedConstituency] = useState("");
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    description: "",
    goal_contacts: 100,
    status: "ACTIVE",
    start_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0]
  });
  useEffect(() => {
    async function fetchData() {
      const [regionsData, constituenciesData] = await Promise.all([
        adminService.getGhanaRegions(),
        adminService.getGhanaConstituencies()
      ]);
      setRegions(regionsData);
      setConstituencies(constituenciesData);
    }
    fetchData();
  }, []);
  useEffect(() => {
    if (selectedRegion) {
      const regionId = regions.find((r) => r.name === selectedRegion)?.id;
      if (regionId) {
        setFilteredConstituencies(constituencies.filter((c) => c.region_id === regionId));
      } else {
        setFilteredConstituencies([]);
      }
    } else {
      setFilteredConstituencies([]);
    }
    setSelectedConstituency("");
  }, [selectedRegion, regions, constituencies]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCampaign.title || !selectedRegion || !selectedConstituency) {
      toast.error("Please complete all mandatory tactical fields.");
      return;
    }
    setLoading(true);
    try {
      const success = await adminService.createCanvassingCampaign({
        ...newCampaign,
        target_constituency: selectedConstituency,
        target_wards: [selectedRegion]
        // Store region in wards for now or adjust type if needed
      });
      if (success) {
        toast.success("Canvassing mission deployed to the field.");
        navigate("/admin/ground-game");
      } else {
        toast.error("Failed to initialize mobilization protocol.");
      }
    } catch (error) {
      console.error("[DEPLOY] Error:", error);
      toast.error("Operational error during deployment.");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
    /* @__PURE__ */ jsxs("nav", { className: "flex items-center gap-2 text-micro font-bold capitalize tracking-tight text-muted-foreground/60", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/admin/dashboard", className: "hover:text-primary transition-colors flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(LayoutDashboard, { className: "w-3 h-3" }),
        " HQ"
      ] }),
      /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" }),
      /* @__PURE__ */ jsx(Link, { to: "/admin/ground-game", className: "hover:text-primary transition-colors", children: "Ground Game" }),
      /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" }),
      /* @__PURE__ */ jsx("span", { className: "text-on-surface", children: "Deploy Mission" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Crosshair, { className: "w-8 h-8 text-on-surface" }),
          "Deploy canvassing mission"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Initiate high-fidelity voter outreach protocols for specific jurisdictional targets." })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/admin/ground-game", children: /* @__PURE__ */ jsxs(Button, { variant: "default", className: "rounded-sm text-micro font-bold tracking-tight px-8 h-12 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
        " Abort deployment"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-8", children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white overflow-hidden", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-border/10 bg-muted/5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
            /* @__PURE__ */ jsx(Flag, { className: "w-4 h-4 text-primary" }),
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold normal-case font-meta", children: "Tactical deployment parameters" })
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Define the operational scope and objectives for this field mission." })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-8", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", children: [
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold normal-case text-muted-foreground/60 flex items-center gap-2", children: [
              "Mission title ",
              /* @__PURE__ */ jsx("span", { className: "text-primary", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "e.g. Operation Doorstep Blitz - Central",
                className: "w-full h-12 bg-muted/5 border-border/60 text-sm font-bold px-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white",
                value: newCampaign.title,
                onChange: (e) => setNewCampaign({ ...newCampaign, title: e.target.value }),
                required: true
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold normal-case text-muted-foreground/60 flex items-center gap-2", children: [
                "Target region ",
                /* @__PURE__ */ jsx("span", { className: "text-primary", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    className: "w-full h-12 bg-muted/5 border-border/60 text-sm font-bold pl-12 pr-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white appearance-none",
                    value: selectedRegion,
                    onChange: (e) => setSelectedRegion(e.target.value),
                    required: true,
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "Select jurisdiction region" }),
                      regions.map((r) => /* @__PURE__ */ jsx("option", { value: r.name, children: r.name }, r.id))
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold normal-case text-muted-foreground/60 flex items-center gap-2", children: [
                "Target constituency ",
                /* @__PURE__ */ jsx("span", { className: "text-primary", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Target, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    className: "w-full h-12 bg-muted/5 border-border/60 text-sm font-bold pl-12 pr-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white appearance-none disabled:opacity-50",
                    value: selectedConstituency,
                    onChange: (e) => setSelectedConstituency(e.target.value),
                    disabled: !selectedRegion,
                    required: true,
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "Select constituency" }),
                      filteredConstituencies.map((c) => /* @__PURE__ */ jsx("option", { value: c.name, children: c.name }, c.id))
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold normal-case text-muted-foreground/60 flex items-center gap-2", children: [
                "Mission duration (Start) ",
                /* @__PURE__ */ jsx("span", { className: "text-primary", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    className: "w-full h-12 bg-muted/5 border-border/60 text-sm font-bold pl-12 pr-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white",
                    value: newCampaign.start_date,
                    onChange: (e) => setNewCampaign({ ...newCampaign, start_date: e.target.value }),
                    required: true
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold normal-case text-muted-foreground/60 flex items-center gap-2", children: [
                "Mission duration (End) ",
                /* @__PURE__ */ jsx("span", { className: "text-primary", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    className: "w-full h-12 bg-muted/5 border-border/60 text-sm font-bold pl-12 pr-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white",
                    value: newCampaign.end_date,
                    onChange: (e) => setNewCampaign({ ...newCampaign, end_date: e.target.value }),
                    required: true
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold normal-case text-muted-foreground/60 flex items-center gap-2", children: [
              "Contact goal ",
              /* @__PURE__ */ jsx("span", { className: "text-primary", children: "*" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Users, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  className: "w-full h-12 bg-muted/5 border-border/60 text-sm font-bold pl-12 pr-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white",
                  value: newCampaign.goal_contacts,
                  onChange: (e) => setNewCampaign({ ...newCampaign, goal_contacts: Number(e.target.value) }),
                  min: "1",
                  required: true
                }
              )
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/60 flex items-center gap-2", children: "Mission objective & field instructions" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 4,
                placeholder: "Provide clear tactical objectives for canvassers...",
                className: "w-full bg-muted/5 border-border/60 text-sm font-bold p-4 focus:ring-1 focus:ring-on-surface outline-none resize-none rounded-sm transition-all focus:bg-white",
                value: newCampaign.description,
                onChange: (e) => setNewCampaign({ ...newCampaign, description: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pt-6 border-t border-border/10 flex flex-col sm:flex-row gap-4", children: /* @__PURE__ */ jsxs(
            Button,
            {
              type: "submit",
              variant: "primary",
              className: "flex-1 h-14 rounded-sm font-bold text-xs capitalize tracking-tight shadow-xl shadow-brand-green/20 transition-all hover:scale-[1.01] active:scale-95",
              disabled: loading,
              children: [
                /* @__PURE__ */ jsx(Crosshair, { className: "w-5 h-5 mr-3" }),
                " ",
                loading ? "Initializing mission..." : "Initiate tactical deployment"
              ]
            }
          ) })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-4 space-y-6", children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-on-surface text-white overflow-hidden relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" }),
        /* @__PURE__ */ jsx(CardHeader, { className: "p-8 border-b border-white/10 relative z-10", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4 text-primary" }),
          " Tactical guidelines"
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-8 space-y-6 relative z-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-primary" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-white mb-1", children: "Precise targeting" }),
                /* @__PURE__ */ jsx("p", { className: "text-micro text-white/40 leading-relaxed font-medium", children: "Ensure the target constituency aligns with the movement's current strategic priority areas." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-primary" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-white mb-1", children: "Clear objectives" }),
                /* @__PURE__ */ jsx("p", { className: "text-micro text-white/40 leading-relaxed font-medium", children: "Field agents perform best with clear, concise mission objectives and measurable contact goals." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-primary" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-white mb-1", children: "Data integrity" }),
                /* @__PURE__ */ jsx("p", { className: "text-micro text-white/40 leading-relaxed font-medium", children: "All field interactions must be logged in real-time through the canvasser clipboard protocol." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-white/5 bg-primary/5 -mx-8 -mb-8 p-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
              /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5 text-primary" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold capitalize tracking-tight text-white", children: "System Alert" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-white/60 leading-relaxed font-bold normal-case", children: "Deployment protocols are irreversible once initiated. Ensure all tactical parameters have been verified by regional chapter leadership." })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  DeployMission as default
};
