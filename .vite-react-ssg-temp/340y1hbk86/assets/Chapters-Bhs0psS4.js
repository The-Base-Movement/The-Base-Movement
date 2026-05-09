import { jsxs, jsx } from "react/jsx-runtime";
import { MapPin, History, Plus, Shield, Users, Globe, Search, Crown, ChevronRight } from "lucide-react";
import { h as useChapters, b as BrandLine, a as adminService, B as Button, C as Card, d as CardContent, c as cn, j as CardHeader, v as CardTitle, w as CardDescription, I as Input } from "../main.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-D9Fxht2W.js";
import { P as Pagination, a as PaginationContent, b as PaginationItem, c as PaginationPrevious, d as PaginationLink, e as PaginationNext } from "./pagination-6T6KqOsk.js";
import { T as Textarea } from "./textarea-samz4tOC.js";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip, Scatter, Cell } from "recharts";
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
import "@radix-ui/react-dialog";
function ChaptersManagement() {
  const { chapters, addChapter, updateChapter, deleteChapter } = useChapters();
  const [regionalStats, setRegionalStats] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    city_or_region: "",
    country: "Ghana",
    description: "",
    status: "Pending"
  });
  const handleSaveChapter = async (e) => {
    e.preventDefault();
    const chapterData = {
      name: formData.name,
      city_or_region: formData.city_or_region,
      country: formData.country,
      leader_name: "Unassigned",
      member_count: 0,
      status: formData.status
    };
    if (editingChapterId) {
      const success = await updateChapter(editingChapterId, chapterData);
      if (success) toast.success(`Chapter "${formData.name}" updated successfully.`);
    } else {
      const success = await addChapter(chapterData);
      if (success) toast.success(`Chapter "${formData.name}" registered successfully.`);
    }
    closeModal();
  };
  const openAddModal = () => {
    setEditingChapterId(null);
    setFormData({
      name: "",
      city_or_region: "",
      country: "Ghana",
      description: "",
      status: "Pending"
    });
    setIsModalOpen(true);
  };
  const openEditModal = (chapter) => {
    setEditingChapterId(chapter.id);
    setFormData({
      name: chapter.name,
      city_or_region: chapter.city_or_region,
      country: chapter.country || "Ghana",
      description: "",
      status: chapter.status
    });
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingChapterId(null);
  };
  useEffect(() => {
    const fetchStats = async () => {
      const stats = await adminService.getRegionalStats();
      setRegionalStats(stats);
    };
    fetchStats();
  }, []);
  useEffect(() => {
    if (chapters.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const chapterId = params.get("id");
      if (chapterId) {
        const chapter = chapters.find((c) => c.id === chapterId);
        if (chapter) {
          setTimeout(() => {
            openEditModal(chapter);
            window.history.replaceState({}, "", window.location.pathname);
          }, 0);
        }
      }
    }
  }, [chapters]);
  const handleDeleteChapter = async (id, name) => {
    if (window.confirm(`Are you sure you want to decommission the "${name}" chapter?`)) {
      const success = await deleteChapter(id, name);
      if (success) toast.error(`Chapter "${name}" has been decommissioned.`);
    }
  };
  const filteredChapters = useMemo(() => {
    return chapters.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.city_or_region.toLowerCase().includes(search.toLowerCase());
      const normalizedStatus = c.status === "Active" ? "Active" : "Pending";
      const matchesStatus = statusFilter === "All" || normalizedStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [chapters, search, statusFilter]);
  const totalMembers = useMemo(
    () => chapters.reduce((sum, c) => sum + (c.member_count || 0), 0),
    [chapters]
  );
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredChapters.length / itemsPerPage);
  const currentChapters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredChapters.slice(start, start + itemsPerPage);
  }, [filteredChapters, currentPage, itemsPerPage]);
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "w-8 h-8 text-on-surface" }),
          "Chapters"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Coordinate regional cells and constituency headquarters across the national movement infrastructure." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "gold",
            size: "lg",
            onClick: () => toast.info("Accessing audit vault..."),
            className: "rounded-sm text-micro px-10 h-12 font-bold tracking-tight transition-all shadow-sm active:scale-95",
            children: [
              /* @__PURE__ */ jsx(History, { className: "w-4 h-4 mr-2" }),
              " Inspect Audit Trail"
            ]
          }
        ),
        adminService.can("MANAGE_CHAPTER", "CHAPTERS") && /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            size: "lg",
            onClick: openAddModal,
            className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              " Add Chapter"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid-stats mb-10", style: { "--grid-min-width": "220px" }, children: [
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-charcoal-dark text-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-white/10 flex items-center justify-center rounded-sm", children: /* @__PURE__ */ jsx(Shield, { className: "w-6 h-6 text-white" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.1em" }, children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-white/60 uppercase tracking-widest mb-1", children: "Total chapters" }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold font-meta m-0", children: chapters.length })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-border/40 flex items-center justify-center rounded-sm", children: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6 text-on-surface" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.1em" }, children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 uppercase tracking-widest mb-1", children: "Member count" }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold font-meta text-on-surface m-0", children: totalMembers.toLocaleString() })
        ] })
      ] }) }),
      regionalStats.slice(0, 2).map((stat) => /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden relative group cursor-pointer", children: [
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex items-center gap-4 relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-border/40 flex items-center justify-center transition-colors group-hover:bg-charcoal-dark group-hover:text-white rounded-sm", children: /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.1em" }, children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 group-hover:text-on-surface transition-colors normal-case mb-0", children: stat.region }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold font-meta text-on-surface m-0", children: stat.memberCount.toLocaleString() }),
              /* @__PURE__ */ jsx("div", { className: cn(
                "px-1.5 py-0.5 text-[8px] font-bold border rounded normal-case",
                stat.performance === "High" && "bg-primary/10 text-primary border-primary/20",
                stat.performance === "Medium" && "bg-accent/10 text-accent border-accent/20",
                stat.performance === "Low" && "bg-destructive/10 text-destructive border-destructive/20"
              ), children: stat.performance })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 h-1 bg-border/60 transition-all duration-300 w-0 group-hover:w-full", style: { backgroundColor: stat.color } })
      ] }, stat.region))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8", children: [
      /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-background p-6", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-0 mb-8", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4 text-primary" }),
            " Resource-to-impact correlation"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/40 mt-1", children: "Mapping jurisdictional investment against mobilization strength." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-[300px] w-full", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(ScatterChart, { margin: { top: 20, right: 20, bottom: 20, left: 20 }, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "rgba(0,0,0,0.05)" }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              type: "number",
              dataKey: "chapters",
              name: "Chapters",
              unit: "",
              axisLine: false,
              tickLine: false,
              tick: { fontSize: 10, fontWeight: 600, fill: "rgba(0,0,0,0.3)" },
              label: { value: "Chapter Density", position: "bottom", offset: 0, fontSize: 10, fill: "rgba(0,0,0,0.5)" }
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              type: "number",
              dataKey: "memberCount",
              name: "Patriots",
              unit: "",
              axisLine: false,
              tickLine: false,
              tick: { fontSize: 10, fontWeight: 600, fill: "rgba(0,0,0,0.3)" },
              label: { value: "Mobilization Strength", angle: -90, position: "insideLeft", fontSize: 10, fill: "rgba(0,0,0,0.5)" }
            }
          ),
          /* @__PURE__ */ jsx(ZAxis, { type: "number", dataKey: "chapters", range: [60, 400] }),
          /* @__PURE__ */ jsx(
            Tooltip,
            {
              cursor: { strokeDasharray: "3 3" },
              contentStyle: { backgroundColor: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px" },
              itemStyle: { fontSize: "10px", fontWeight: "bold" }
            }
          ),
          /* @__PURE__ */ jsx(Scatter, { name: "Regions", data: regionalStats, fill: "var(--brand-green)", children: regionalStats.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`)) })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm bg-background p-6", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-0 mb-8", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-xs font-bold normal-case font-meta flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 text-primary" }),
            " Logistical footprint"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-micro font-bold normal-case text-muted-foreground/40 mt-1", children: "Jurisdictional resource distribution hierarchy." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-5", children: regionalStats.slice(0, 5).map((stat) => /* @__PURE__ */ jsxs("div", { className: "group cursor-pointer", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/80 group-hover:text-on-surface transition-colors normal-case", children: stat.region }),
            /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: [
              stat.chapters,
              " active hubs"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-1.5 w-full bg-muted/10 overflow-hidden rounded-full border border-white/5", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--brand-green-rgb),0.3)]",
              style: {
                width: `${Math.min(stat.memberCount / 2e3 * 100, 100)}%`,
                backgroundColor: stat.color
              }
            }
          ) })
        ] }, stat.region)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "rounded-none border-border/60 shadow-sm overflow-hidden bg-white", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-border/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg font-bold tracking-tight flex items-center gap-2 text-on-surface", children: [
            /* @__PURE__ */ jsx(Globe, { className: "w-5 h-5 text-muted-foreground/40" }),
            "Regional movement density"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-xs mt-1 font-medium text-muted-foreground/40", children: "Geospatial distribution of chapters and mobilization strength." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 md:flex md:gap-4 w-full md:w-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 bg-primary rounded-sm shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "High strength" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 bg-accent rounded-sm shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Moderate" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 col-span-2 sm:col-span-1", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 bg-border/40 rounded-sm shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Emerging density" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "p-10 cq-container bg-muted/20", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-start gap-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative w-full md:w-auto md:min-w-[280px] md:max-w-[340px] aspect-[4/5] bg-border/20 flex items-center justify-center border border-border/40 group overflow-hidden shrink-0", children: [
          /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 400 500", className: "w-full h-full p-8 opacity-80 group-hover:opacity-100 transition-opacity duration-700", children: [
            /* @__PURE__ */ jsx("path", { d: "M50,50 L350,50 L350,200 L50,200 Z", fill: "var(--destructive)", fillOpacity: "0.15", stroke: "var(--destructive)", strokeWidth: "2", className: "hover:fill-opacity-40 transition-all cursor-pointer" }),
            /* @__PURE__ */ jsx("path", { d: "M50,205 L350,205 L350,350 L50,350 Z", fill: "var(--accent)", fillOpacity: "0.2", stroke: "var(--accent)", strokeWidth: "2", className: "hover:fill-opacity-50 transition-all cursor-pointer" }),
            /* @__PURE__ */ jsx("path", { d: "M50,355 L200,355 L200,480 L50,480 Z", fill: "var(--primary)", fillOpacity: "0.25", stroke: "var(--primary)", strokeWidth: "2", className: "hover:fill-opacity-60 transition-all cursor-pointer" }),
            /* @__PURE__ */ jsx("path", { d: "M205,355 L350,355 L350,480 L205,480 Z", fill: "var(--primary)", fillOpacity: "0.25", stroke: "var(--primary)", strokeWidth: "2", className: "hover:fill-opacity-60 transition-all cursor-pointer" }),
            /* @__PURE__ */ jsx("circle", { cx: "275", cy: "420", r: "8", fill: "hsl(var(--on-surface))", className: "animate-pulse" }),
            /* @__PURE__ */ jsx("circle", { cx: "125", cy: "420", r: "8", fill: "hsl(var(--on-surface))" }),
            /* @__PURE__ */ jsx("circle", { cx: "200", cy: "275", r: "8", fill: "hsl(var(--on-surface))" }),
            /* @__PURE__ */ jsx("circle", { cx: "100", cy: "125", r: "8", fill: "hsl(var(--on-surface))" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: /* @__PURE__ */ jsx("span", { className: "text-micro font-bold normal-case text-muted-foreground/20 transform -rotate-45", children: "National Geospatial Grid" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-6 w-full", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-muted-foreground/40 border-b border-border/40 pb-2 normal-case", children: "Regional performance tier" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-4", children: regionalStats.map((stat) => /* @__PURE__ */ jsxs("div", { className: "group cursor-pointer", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/80 group-hover:text-on-surface transition-colors normal-case", children: stat.region }),
              /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: [
                stat.performance,
                " impact"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-1.5 w-full bg-border/40 overflow-hidden rounded-full", children: /* @__PURE__ */ jsx(
              "div",
              {
                className: "h-full transition-all duration-1000",
                style: {
                  width: `${stat.memberCount / 2e4 * 100}%`,
                  backgroundColor: stat.color
                }
              }
            ) })
          ] }, stat.region)) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: search,
            onChange: (e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            },
            placeholder: "Search chapters by name, region or country...",
            className: "pl-10 h-11 rounded-sm border-border/60 shadow-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: statusFilter,
          onChange: (e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          },
          className: "h-11 px-4 text-micro font-bold rounded-sm border border-border/60 bg-white focus:outline-none focus:border-charcoal-dark shadow-sm normal-case",
          children: [
            /* @__PURE__ */ jsx("option", { value: "All", children: "All statuses" }),
            /* @__PURE__ */ jsx("option", { value: "Active", children: "Active" }),
            /* @__PURE__ */ jsx("option", { value: "Pending", children: "Pending" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
      currentChapters.map((chapter) => /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/10 bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: chapter.id.slice(0, 8) }),
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-on-surface tracking-tight leading-tight", children: chapter.name })
          ] }),
          /* @__PURE__ */ jsx("div", { className: cn(
            "px-2 py-0.5 text-[8px] font-bold border normal-case rounded-full",
            chapter.status === "Active" ? "bg-primary/10 text-primary border-primary/20" : "bg-accent/10 text-accent border-accent/20"
          ), children: chapter.status })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flow", style: { "--flow-space": "1.25rem" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1 group/lead", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-muted-foreground/40 normal-case flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Crown, { className: "w-2.5 h-2.5 text-accent" }),
                " Regional hub"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface tracking-tight truncate", children: chapter.city_or_region })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: "Strength" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-on-surface flex items-center justify-end gap-1", children: [
                /* @__PURE__ */ jsx(Users, { className: "w-3 h-3 text-primary" }),
                (chapter.member_count || 0).toLocaleString()
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 pt-4 border-t border-border/10", children: [
            adminService.can("MANAGE_CHAPTER", "CHAPTERS") && /* @__PURE__ */ jsx(
              Button,
              {
                variant: "gold",
                size: "sm",
                onClick: () => openEditModal(chapter),
                className: "h-11 px-0 text-micro font-bold tracking-tight shadow-sm active:scale-95",
                children: "Configure Hub"
              }
            ),
            adminService.can("MANAGE_CHAPTER", "CHAPTERS") && /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "destructive",
                onClick: () => handleDeleteChapter(chapter.id, chapter.name),
                className: "h-11 px-0 text-micro font-bold tracking-tight transition-all rounded-sm active:scale-95",
                children: [
                  "Decommission ",
                  /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5 ml-1" })
                ]
              }
            )
          ] })
        ] })
      ] }, chapter.id)),
      adminService.can("MANAGE_CHAPTER", "CHAPTERS") && /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "active-tab",
          onClick: openAddModal,
          className: "rounded-sm p-10 flex flex-col items-center justify-center gap-6 transition-all group bg-brand-green h-full shadow-sm hover:shadow-md active:scale-95",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-brand-green transition-all shadow-inner", children: /* @__PURE__ */ jsx(Plus, { className: "w-7 h-7" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight", children: "Add new chapter" })
          ]
        }
      )
    ] }),
    totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border/60", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/40 normal-case text-center md:text-left w-full md:w-auto", children: [
        "Showing ",
        (currentPage - 1) * itemsPerPage + 1,
        " to ",
        Math.min(currentPage * itemsPerPage, filteredChapters.length),
        " of ",
        filteredChapters.length,
        " chapters"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-full md:w-auto flex-1", children: /* @__PURE__ */ jsx(Pagination, { children: /* @__PURE__ */ jsxs(PaginationContent, { className: "justify-center md:justify-end", children: [
        /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsx(
          PaginationPrevious,
          {
            onClick: () => setCurrentPage((p) => Math.max(1, p - 1)),
            className: cn("h-11 rounded-sm shadow-sm active:scale-95 text-micro font-bold", currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer")
          }
        ) }),
        Array.from({ length: totalPages }).map((_, i) => /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsx(
          PaginationLink,
          {
            isActive: currentPage === i + 1,
            onClick: () => setCurrentPage(i + 1),
            className: cn("h-11 w-11 rounded-sm text-micro font-bold", currentPage === i + 1 ? "shadow-md shadow-brand-green/20" : "cursor-pointer"),
            children: i + 1
          }
        ) }, i)),
        /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsx(
          PaginationNext,
          {
            onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
            className: cn("h-11 rounded-sm shadow-sm active:scale-95 text-micro font-bold", currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer")
          }
        ) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[500px] border-none rounded-none p-0 overflow-hidden bg-white", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { className: "p-8 bg-charcoal-dark text-white relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-on-surface/20" }),
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl font-bold tracking-tight", children: editingChapterId ? "Configure regional hub" : "Add new chapter" }),
        /* @__PURE__ */ jsx(DialogDescription, { className: "text-white/60 text-xs mt-2", children: editingChapterId ? "Update infrastructure settings and mobilization status for this regional cell." : "Register a new mobilization hub. This chapter will immediately be visible on the public platform once active." })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveChapter, className: "p-8 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: "Chapter name" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                required: true,
                placeholder: "e.g. Adabraka hub",
                value: formData.name,
                onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                className: "h-12 bg-muted/5 border-border/60 rounded-sm focus:ring-0 focus:border-on-surface font-medium text-sm shadow-sm"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: "City / region" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                required: true,
                placeholder: "e.g. Accra",
                value: formData.city_or_region,
                onChange: (e) => setFormData({ ...formData, city_or_region: e.target.value }),
                className: "h-12 bg-muted/5 border-border/60 rounded-sm focus:ring-0 focus:border-on-surface font-medium text-sm shadow-sm"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: "Country" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                required: true,
                placeholder: "e.g. Ghana",
                value: formData.country,
                onChange: (e) => setFormData({ ...formData, country: e.target.value }),
                className: "h-12 bg-muted/5 border-border/60 rounded-sm focus:ring-0 focus:border-on-surface font-medium text-sm shadow-sm"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: "Hub status" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: formData.status,
                onChange: (e) => setFormData({ ...formData, status: e.target.value }),
                className: "w-full h-12 bg-muted/5 border border-border/60 rounded-sm focus:ring-0 focus:border-charcoal-dark px-4 text-sm font-medium shadow-sm outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "Pending", children: "Pending" }),
                  /* @__PURE__ */ jsx("option", { value: "Active", children: "Active" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: "Mission description" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              required: true,
              placeholder: "Describe the chapter's focus area...",
              value: formData.description,
              onChange: (e) => setFormData({ ...formData, description: e.target.value }),
              className: "min-h-[100px] bg-muted/5 border-border/60 rounded-sm focus:ring-0 focus:border-on-surface font-medium text-sm p-4 shadow-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(DialogFooter, { className: "pt-4 gap-4 flex-row", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "default",
              onClick: closeModal,
              className: "flex-1 h-14 text-micro font-bold tracking-tight rounded-sm border-border/40 hover:bg-stone-50 transition-all active:scale-95",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              variant: "primary",
              className: "flex-1 h-14 text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
              children: editingChapterId ? "Synchronize Hub" : "Add Chapter"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  ChaptersManagement as default
};
