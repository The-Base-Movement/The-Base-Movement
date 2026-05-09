import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { MapPin, Plus, Search, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { b as BrandLine, B as Button, C as Card, d as CardContent, I as Input, c as cn, a as adminService } from "../main.mjs";
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
function AdminRegions() {
  const [regions, setRegions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRegions, setExpandedRegions] = useState([]);
  const [constituencySearch, setConstituencySearch] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await adminService.getRegions();
      setRegions(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);
  const totalConstituencies = regions.reduce((acc, r) => acc + (r.constituencies?.length || 0), 0);
  const toggleRegion = (id) => {
    setExpandedRegions(
      (prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };
  const filteredRegions = regions.filter((region) => {
    const rName = region.name || "";
    const rConstituencies = region.constituencies || [];
    return rName.toLowerCase().includes(searchQuery.toLowerCase()) || rConstituencies.some((c) => c?.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  const handleAction = (action, region, constituency) => {
    const resource = constituency ? `REGIONS/${region}/CONSTITUENCIES/${constituency}` : `REGIONS/${region}`;
    adminService.logAction(action, resource, "Success");
    toast.success(`${action.replace("_", " ")} recorded in Audit Vault for ${constituency || region}`);
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "w-8 h-8 text-on-surface" }),
          "Regions & constituencies"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Manage administrative regions and regional jurisdictions." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "primary",
          size: "lg",
          className: "rounded-sm text-micro font-bold capitalize tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            " Define New Region"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 shadow-sm bg-on-surface text-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-white/10 flex items-center justify-center shrink-0 rounded-sm", children: /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case opacity-60", children: "Regions" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold tracking-tight", children: "16" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 shadow-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-destructive/10 flex items-center justify-center shrink-0 rounded-sm", children: /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-destructive" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-muted-foreground/80", children: "Constituencies" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold tracking-tight text-on-surface", children: totalConstituencies })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 shadow-sm col-span-2 md:col-span-2", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0 rounded-sm", children: /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-muted-foreground/80", children: "Avg. per region" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold tracking-tight text-on-surface", children: Math.round(totalConstituencies / 16) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          placeholder: "Search regions or constituencies...",
          className: "pl-10 h-11 rounded-sm border-border/40 shadow-sm"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: isLoading ? Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ jsx(Card, { className: "rounded-none border-border/40 shadow-none animate-pulse", children: /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-muted/10" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/10 w-24" }),
          /* @__PURE__ */ jsx("div", { className: "h-2 bg-muted/5 w-16" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-6 w-6 bg-muted/5" })
    ] }) }, i)) : filteredRegions.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-20 text-center text-muted-foreground/80 text-sm font-bold tracking-tight border border-dashed border-border/40 rounded-sm bg-muted/5", children: "No matching geographical data found." }) : filteredRegions.map((region) => {
      const isExpanded = expandedRegions.includes(region.id);
      const cSearch = constituencySearch[region.id] || "";
      const visibleConstituencies = (region.constituencies || []).filter(
        (c) => c?.toLowerCase().includes(cSearch.toLowerCase())
      );
      return /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm overflow-hidden bg-white", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: "w-full flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors group",
            onClick: () => toggleRegion(region.id),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: cn(
                  "w-8 h-8 flex items-center justify-center transition-colors rounded-sm",
                  isExpanded ? "bg-on-surface text-white" : "bg-muted/10 text-muted-foreground/80 group-hover:bg-muted/20"
                ), children: /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold tracking-tight text-on-surface", children: region.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-micro text-muted-foreground/80 font-bold tracking-tight", children: [
                    region.constituencies.length,
                    " constituencies"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "gold",
                    size: "icon",
                    className: "h-10 w-10 rounded-sm transition-all shadow-sm active:scale-95",
                    onClick: (e) => {
                      e.stopPropagation();
                      handleAction("REGION_EDIT", region.name);
                    },
                    children: /* @__PURE__ */ jsx(Edit2, { className: "w-5 h-5" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "destructive",
                    size: "icon",
                    className: "h-10 w-10 rounded-sm transition-all shadow-sm active:scale-95",
                    onClick: (e) => {
                      e.stopPropagation();
                      handleAction("REGION_DELETE", region.name);
                    },
                    children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" })
                  }
                ),
                isExpanded ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground/80" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 text-muted-foreground/80" })
              ] })
            ]
          }
        ),
        isExpanded && /* @__PURE__ */ jsxs("div", { className: "border-t border-border/40 bg-muted/5 px-6 py-5 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-xs", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: cSearch,
                  onChange: (e) => setConstituencySearch((prev) => ({ ...prev, [region.id]: e.target.value })),
                  placeholder: "Filter constituencies...",
                  className: "pl-9 h-9 rounded-sm border-border/40 text-xs shadow-sm"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "primary",
                className: "h-10 px-8 text-micro font-bold capitalize tracking-tight rounded-sm transition-all shadow-lg shadow-brand-green/20 active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
                  " Define Constituency"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2", children: [
            visibleConstituencies.map((con) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "group flex items-center justify-between gap-1 px-3 py-2 bg-white border border-border/40 hover:border-on-surface/40 transition-colors rounded-sm",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight text-on-surface/80 group-hover:text-on-surface truncate", children: con }),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "gold",
                      size: "icon",
                      className: "h-8 w-8 rounded-sm opacity-0 group-hover:opacity-100 transition-all shrink-0 shadow-sm active:scale-95",
                      onClick: () => handleAction("CONSTITUENCY_EDIT", region.name, con),
                      children: /* @__PURE__ */ jsx(Edit2, { className: "w-3.5 h-3.5" })
                    }
                  )
                ]
              },
              con
            )),
            visibleConstituencies.length === 0 && /* @__PURE__ */ jsx("p", { className: "col-span-full text-center text-micro text-muted-foreground/60 font-bold tracking-tight py-4", children: "No match found." })
          ] })
        ] })
      ] }, region.id);
    }) })
  ] });
}
export {
  AdminRegions as default
};
