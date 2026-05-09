import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { Flag, Plus, Target, Clock, Search, Calendar, Edit2, Trash2, X } from "lucide-react";
import { a as adminService, b as BrandLine, B as Button, C as Card, d as CardContent, j as CardHeader, v as CardTitle, I as Input, c as cn } from "../main.mjs";
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
function RoadmapManagement() {
  const [milestones, setMilestones] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    status: "Upcoming",
    category: "Mobilization",
    importance_level: "Normal",
    target_members: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getMilestones();
      setMilestones(data);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleOpenModal = (milestone = null) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setFormData({
        title: milestone.title,
        description: milestone.description,
        target_date: milestone.target_date ? new Date(milestone.target_date).toISOString().split("T")[0] : "",
        status: milestone.status,
        category: milestone.category,
        importance_level: milestone.importance_level,
        target_members: milestone.target_members || 0
      });
    } else {
      setEditingMilestone(null);
      setFormData({
        title: "",
        description: "",
        target_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        status: "Upcoming",
        category: "Mobilization",
        importance_level: "Normal",
        target_members: 0
      });
    }
    setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingMilestone) {
        const success = await adminService.updateMilestone(editingMilestone.id, formData);
        if (success) {
          toast.success("Strategic milestone updated.");
          setShowModal(false);
          fetchData();
        } else {
          toast.error("Failed to update milestone.");
        }
      } else {
        const success = await adminService.createMilestone(formData);
        if (success) {
          toast.success("Strategic milestone added.");
          setShowModal(false);
          fetchData();
        } else {
          toast.error("Failed to add milestone.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove this milestone: "${title}"?`)) return;
    try {
      const success = await adminService.deleteMilestone(id, title);
      if (success) {
        toast.success("Milestone removed from roadmap.");
        fetchData();
      } else {
        toast.error("Failed to remove milestone.");
      }
    } catch (err) {
      console.error("[ROADMAP] Delete operation failed:", err);
      toast.error("An error occurred during removal.");
    }
  };
  const filteredMilestones = milestones.filter(
    (m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "var(--brand-green)";
      case "In Progress":
        return "var(--brand-gold)";
      default:
        return "var(--brand-red)";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.5rem" }, children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Flag, { className: "w-8 h-8 text-on-surface" }),
          "National Strategic Roadmap"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, {}),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mb-0", children: "Manage movement objectives, mobilization phases, and strategic timelines." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "primary",
          size: "lg",
          className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          onClick: () => handleOpenModal(),
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            " Add Milestone"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-stretch", style: { "--column-gap": "1.5rem" }, children: [
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Total Milestones" }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-on-surface", children: milestones.length }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-micro font-bold text-primary mt-1", children: [
          /* @__PURE__ */ jsx(Target, { className: "w-3 h-3" }),
          " Movement Trajectory"
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-muted-foreground/80 mb-2", children: "Completion Rate" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-3", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-bold text-[var(--brand-green)]", children: [
            milestones.length ? Math.round(milestones.filter((m) => m.status === "Completed").length / milestones.length * 100) : 0,
            "%"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-[var(--brand-green)] bg-[var(--brand-green)]/10 px-1.5 py-0.5 rounded-md mb-1", children: "Achieved" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/80 font-bold tracking-tight mt-2", children: "Verified Objectives" })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Active Operations" }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-[var(--brand-gold)]", children: milestones.filter((m) => m.status === "In Progress").length }),
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 mt-1", children: "In Real-time Mobilization" })
      ] }) }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Upcoming Phases" }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-[var(--brand-red)]", children: milestones.filter((m) => m.status === "Upcoming").length }),
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 mt-1", children: "Strategic Pipeline" })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-bold tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-destructive" }),
          "National Objective Timeline"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full md:w-64", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Search milestones...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "pl-9 h-9 text-xs rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/40 bg-muted/20", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Milestone Objective" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Target Date" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Priority" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: isLoading ? Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsxs("tr", { className: "animate-pulse", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/30 w-3/4 rounded" }),
            /* @__PURE__ */ jsx("div", { className: "h-2 bg-muted/20 w-1/2 rounded" })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/20 w-16 rounded" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "h-6 bg-muted/20 w-24 rounded" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/20 w-24 rounded" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/20 w-16 rounded" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-right", children: /* @__PURE__ */ jsx("div", { className: "h-8 w-16 bg-muted/20 ml-auto rounded" }) })
        ] }, i)) : filteredMilestones.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-12 text-center text-muted-foreground/80 text-xs font-bold tracking-tight", children: "No strategic objectives found." }) }) : filteredMilestones.map((milestone) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col max-w-md", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface tracking-tight", children: milestone.title }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/60 mt-0.5 line-clamp-1", children: milestone.description })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface/80 tracking-tight", children: milestone.category }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn("w-1.5 h-1.5 rounded-full", milestone.status === "In Progress" && "animate-pulse"),
                style: { backgroundColor: getStatusColor(milestone.status) }
              }
            ),
            /* @__PURE__ */ jsx("span", { className: cn(
              "px-2.5 py-1 text-micro font-bold tracking-tight border rounded-md capitalize",
              milestone.status === "Completed" ? "bg-[var(--brand-green)]/10 text-[var(--brand-green)] border-[var(--brand-green)]/20" : milestone.status === "In Progress" ? "bg-[var(--brand-gold)]/10 text-[var(--brand-gold)] border-[var(--brand-gold)]/20" : "bg-[var(--brand-red)]/10 text-[var(--brand-red)] border-[var(--brand-red)]/20"
            ), children: milestone.status })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-micro font-bold text-muted-foreground/80", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3" }),
            new Date(milestone.target_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("span", { className: cn(
            "text-micro font-bold normal-case tracking-tight",
            milestone.importance_level === "Critical" ? "text-[var(--brand-red)]" : "text-on-surface/40"
          ), children: milestone.importance_level }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 justify-end", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "gold",
                size: "icon",
                className: "h-9 w-9 rounded-sm transition-all shadow-sm active:scale-95",
                onClick: () => handleOpenModal(milestone),
                children: /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "destructive",
                size: "icon",
                className: "h-9 w-9 rounded-sm transition-all shadow-sm active:scale-95",
                onClick: () => handleDelete(milestone.id, milestone.title),
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
              }
            )
          ] }) })
        ] }, milestone.id)) })
      ] }) }) })
    ] }),
    showModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300", children: /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-2xl rounded-sm border-border/60 bg-white shadow-2xl animate-in zoom-in-95 duration-300", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/30", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-bold tracking-tight flex items-center gap-2", children: [
          editingMilestone ? /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4 text-destructive" }) : /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 text-destructive" }),
          editingMilestone ? "Refine Objective" : "Add Milestone"
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "h-8 w-8 text-muted-foreground/80 hover:text-destructive",
            onClick: () => setShowModal(false),
            children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
        /* @__PURE__ */ jsx(CardContent, { className: "p-6 space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80 normal-case", children: "Objective Title" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  required: true,
                  placeholder: "e.g. National Logistics Hub",
                  value: formData.title,
                  onChange: (e) => setFormData({ ...formData, title: e.target.value }),
                  className: "rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80 normal-case", children: "Strategic Category" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: formData.category,
                  onChange: (e) => setFormData({ ...formData, category: e.target.value }),
                  className: "w-full h-10 px-3 text-xs border border-border/60 rounded-sm focus:ring-on-surface/20 focus:border-on-surface focus:outline-none bg-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "Mobilization", children: "Mobilization" }),
                    /* @__PURE__ */ jsx("option", { value: "Infrastructure", children: "Infrastructure" }),
                    /* @__PURE__ */ jsx("option", { value: "Policy", children: "Policy" }),
                    /* @__PURE__ */ jsx("option", { value: "Logistics", children: "Logistics" }),
                    /* @__PURE__ */ jsx("option", { value: "Communication", children: "Communication" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80 normal-case", children: "Target Date" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  required: true,
                  type: "date",
                  value: formData.target_date,
                  onChange: (e) => setFormData({ ...formData, target_date: e.target.value }),
                  className: "rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80 normal-case", children: "Target Member Count" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "number",
                  placeholder: "0",
                  value: formData.target_members,
                  onChange: (e) => setFormData({ ...formData, target_members: parseInt(e.target.value) || 0 }),
                  className: "rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80 normal-case", children: "Status" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: formData.status,
                  onChange: (e) => setFormData({ ...formData, status: e.target.value }),
                  className: "w-full h-10 px-3 text-xs border border-border/60 rounded-sm focus:ring-on-surface/20 focus:border-on-surface focus:outline-none bg-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "Upcoming", children: "Upcoming" }),
                    /* @__PURE__ */ jsx("option", { value: "In Progress", children: "In Progress" }),
                    /* @__PURE__ */ jsx("option", { value: "Completed", children: "Completed" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80 normal-case", children: "Importance Level" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: formData.importance_level,
                  onChange: (e) => setFormData({ ...formData, importance_level: e.target.value }),
                  className: "w-full h-10 px-3 text-xs border border-border/60 rounded-sm focus:ring-on-surface/20 focus:border-on-surface focus:outline-none bg-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "Normal", children: "Normal" }),
                    /* @__PURE__ */ jsx("option", { value: "High", children: "High" }),
                    /* @__PURE__ */ jsx("option", { value: "Critical", children: "Critical" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/80 normal-case", children: "Objective Description" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  required: true,
                  rows: 4,
                  placeholder: "Detailed breakdown of the milestone...",
                  value: formData.description,
                  onChange: (e) => setFormData({ ...formData, description: e.target.value }),
                  className: "w-full p-3 text-xs border border-border/60 rounded-sm focus:ring-on-surface/20 focus:border-on-surface focus:outline-none bg-white resize-none"
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 pt-0 flex gap-4", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "default",
              className: "flex-1 h-12 text-micro font-bold tracking-tight rounded-sm border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95",
              onClick: () => setShowModal(false),
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
              children: isSubmitting ? "Syncing..." : editingMilestone ? "Commit Changes" : "Add Milestone"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  RoadmapManagement as default
};
