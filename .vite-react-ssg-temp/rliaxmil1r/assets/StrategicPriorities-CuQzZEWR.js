import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Loader2, Target, Plus, DollarSign, TrendingUp, Clock, Search, Image, Calendar, Edit2, Trash2, X } from "lucide-react";
import { a as adminService, b as BrandLine, B as Button, C as Card, d as CardContent, c as cn, j as CardHeader, v as CardTitle, w as CardDescription } from "../main.mjs";
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
function StrategicPriorities() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetAmount: 0,
    endDate: "",
    status: "Active",
    imageUrl: ""
  });
  useEffect(() => {
    fetchCampaigns();
  }, []);
  async function fetchCampaigns() {
    setLoading(true);
    try {
      const data = await adminService.getDonationCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error("[STRATEGIC PRIORITIES] Synchronization failed:", err);
      toast.error("Failed to synchronize strategic priorities.");
    } finally {
      setLoading(false);
    }
  }
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await adminService.createDonationCampaign(formData);
      if (success) {
        toast.success("Strategic priority deployed successfully.");
        setIsCreating(false);
        setFormData({
          title: "",
          description: "",
          targetAmount: 0,
          endDate: "",
          status: "Active",
          imageUrl: ""
        });
        fetchCampaigns();
      } else {
        toast.error("Failed to deploy strategic protocol.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingCampaign) return;
    setIsSubmitting(true);
    try {
      const success = await adminService.updateDonationCampaign(editingCampaign.id, formData);
      if (success) {
        toast.success("Strategic priority updated.");
        setEditingCampaign(null);
        fetchCampaigns();
      } else {
        toast.error("Failed to update protocol.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to decommission the "${title}" priority? This action is immutable.`)) return;
    try {
      const success = await adminService.deleteDonationCampaign(id, title);
      if (success) {
        toast.success("Priority decommissioned.");
        fetchCampaigns();
      } else {
        toast.error("Decommissioning failed.");
      }
    } catch (err) {
      console.error("[STRATEGIC PRIORITIES] Decommissioning failed:", err);
      toast.error("Operational error during decommissioning.");
    }
  };
  const filteredCampaigns = campaigns.filter(
    (c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "h-full w-full flex flex-col items-center justify-center py-20", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-12 h-12 text-primary animate-spin mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-muted-foreground/40", children: "Synchronizing tactical priorities..." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Target, { className: "w-8 h-8 text-on-surface" }),
          "Strategic priorities"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Manage movement-wide mobilization goals, financial targets, and operational milestones." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "primary",
          size: "lg",
          onClick: () => {
            setFormData({
              title: "",
              description: "",
              targetAmount: 0,
              endDate: "",
              status: "Active",
              imageUrl: ""
            });
            setIsCreating(true);
          },
          className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            " Add Priority"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid-stats mb-10", style: { "--grid-min-width": "240px" }, children: [
      { label: "Active priorities", value: campaigns.filter((c) => c.status === "Active").length, icon: Target, color: "text-primary", bg: "bg-primary/10" },
      { label: "Total Mobilized", value: `$${campaigns.reduce((acc, c) => acc + c.raisedAmount, 0).toLocaleString()}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/5" },
      { label: "Average progress", value: `${campaigns.length > 0 ? (campaigns.reduce((acc, c) => acc + c.raisedAmount / c.targetAmount, 0) / campaigns.length * 100).toFixed(0) : 0}%`, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
      { label: "Upcoming deadlines", value: campaigns.filter((c) => new Date(c.endDate) > /* @__PURE__ */ new Date()).length, icon: Clock, color: "text-on-surface/60", bg: "bg-muted/10" }
    ].map((stat, i) => /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white overflow-hidden group hover:border-border/60 transition-all backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 h-full flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: cn("w-12 h-12 rounded-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", stat.bg), children: /* @__PURE__ */ jsx(stat.icon, { className: cn("w-6 h-6", stat.color) }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flow", style: { "--flow-space": "0.1rem" }, children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 m-0 uppercase tracking-widest", children: stat.label }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-on-surface leading-tight m-0", children: stat.value })
      ] })
    ] }) }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-8 items-start relative", children: [
      /* @__PURE__ */ jsxs("aside", { className: "w-full lg:w-80 sticky lg:top-32 space-y-6 shrink-0 z-30", children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden bg-white", children: [
          /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border/10 bg-muted/5", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-xs normal-case", children: "Tactical filters" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold text-stone-500 uppercase tracking-widest", children: "Search priorities" }),
              /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    placeholder: "Keywords...",
                    className: "w-full pl-11 pr-4 h-11 bg-white border border-border/60 focus:ring-1 focus:ring-primary focus:border-transparent rounded-sm text-tiny font-bold outline-none",
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value)
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-border/10 space-y-4", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between text-micro font-bold text-muted-foreground/60 uppercase tracking-widest", children: /* @__PURE__ */ jsx("span", { children: "Intelligence Summary" }) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/5 rounded-sm border border-border/10", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/60", children: "Total Active" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-primary", children: campaigns.filter((c) => c.status === "Active").length })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/5 rounded-sm border border-border/10", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/60", children: "Success Rate" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-accent", children: [
                    campaigns.length > 0 ? (campaigns.filter((c) => c.raisedAmount / c.targetAmount >= 1).length / campaigns.length * 100).toFixed(0) : 0,
                    "%"
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden bg-on-surface text-white p-6 group", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-micro font-bold tracking-tight text-white/40 uppercase mb-4", children: "Tactical Awareness" }),
          /* @__PURE__ */ jsx("p", { className: "text-tiny font-medium text-white/60 leading-relaxed", children: "Setting strategic priorities allows the movement to synchronize resource allocation across multiple regional cells." }),
          /* @__PURE__ */ jsxs(Button, { variant: "ghost", className: "w-full justify-between h-9 mt-4 px-0 text-micro font-bold tracking-tight text-white hover:bg-transparent group-hover:text-primary transition-colors", children: [
            "Operational Handbook ",
            /* @__PURE__ */ jsx(TrendingUp, { className: "w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-[500px]", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: filteredCampaigns.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "col-span-full py-24 text-center border-2 border-dashed border-border/20 rounded-sm bg-white", children: [
        /* @__PURE__ */ jsx(Target, { className: "w-12 h-12 text-muted mx-auto mb-4 opacity-10" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-on-surface", children: "No priorities found" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground/40 mt-1 max-w-xs mx-auto", children: "Try refining your search or add a new strategic priority." }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "default",
            onClick: () => setSearchQuery(""),
            className: "mt-6 rounded-sm border-border/40 font-bold text-micro tracking-tight px-10 h-12 hover:bg-stone-50 transition-all shadow-sm active:scale-95",
            children: "Reset Filter"
          }
        )
      ] }) : filteredCampaigns.map((campaign) => /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden group hover:border-on-surface/40 transition-all bg-white flex flex-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative h-48 bg-stone-100 overflow-hidden shrink-0 border-b border-border/10", children: [
          campaign.imageUrl ? /* @__PURE__ */ jsx("img", { src: campaign.imageUrl, alt: campaign.title, className: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Image, { className: "w-12 h-12 text-muted-foreground/20" }) }),
          /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-4", children: /* @__PURE__ */ jsx("span", { className: cn(
            "px-3 py-1 text-micro font-bold tracking-tight rounded-full border shadow-sm backdrop-blur-md",
            campaign.status === "Active" ? "bg-primary text-white border-primary/20" : "bg-white text-on-surface border-border/60"
          ), children: campaign.status }) })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex-1 flex flex-col justify-between space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-on-surface leading-tight tracking-tight m-0", children: campaign.title }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground/80 leading-relaxed m-0 line-clamp-3 font-medium", children: campaign.description })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: "Progress" }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-on-surface", children: [
                  (campaign.raisedAmount / campaign.targetAmount * 100).toFixed(0),
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "h-1.5 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-full bg-primary transition-all duration-1000 ease-out",
                  style: { width: `${Math.min(campaign.raisedAmount / campaign.targetAmount * 100, 100)}%` }
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-micro font-bold tracking-tight", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
                  "$",
                  campaign.raisedAmount.toLocaleString()
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground/40 normal-case", children: [
                  "of $",
                  campaign.targetAmount.toLocaleString()
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-border/10", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-micro font-bold text-muted-foreground/60 uppercase", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Ends: ",
                  new Date(campaign.endDate).toLocaleDateString()
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "icon",
                    className: "h-8 w-8 text-muted-foreground/40 hover:text-on-surface hover:bg-stone-50 rounded-sm transition-all",
                    onClick: () => {
                      setEditingCampaign(campaign);
                      setFormData({
                        title: campaign.title,
                        description: campaign.description,
                        targetAmount: campaign.targetAmount,
                        endDate: campaign.endDate.split("T")[0],
                        status: campaign.status,
                        imageUrl: campaign.imageUrl || ""
                      });
                    },
                    children: /* @__PURE__ */ jsx(Edit2, { className: "w-3.5 h-3.5" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "icon",
                    className: "h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 rounded-sm transition-all",
                    onClick: () => handleDelete(campaign.id, campaign.title),
                    children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" })
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] }, campaign.id)) }) })
    ] }),
    (isCreating || editingCampaign) && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300", children: /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-xl rounded-sm border-border/60 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden bg-white", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "p-8 border-b border-border/10 bg-muted/5", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-xl font-bold tracking-tight font-meta", children: isCreating ? "Deploy New Priority" : "Adjust Strategic Protocol" }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-muted-foreground/80 text-micro font-bold tracking-tight mt-1", children: "Defining critical resource allocation for the movement." })
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => {
          setIsCreating(false);
          setEditingCampaign(null);
        }, className: "h-8 w-8 p-0 rounded-sm hover:bg-muted/10", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5 text-muted-foreground/40" }) })
      ] }) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: isCreating ? handleCreate : handleUpdate, children: [
        /* @__PURE__ */ jsx(CardContent, { className: "p-8 space-y-6 max-h-[60vh] overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/40", children: "Priority Title" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                required: true,
                placeholder: "e.g. Ashanti Region Media Blitz",
                className: "w-full h-12 bg-muted/5 border-b border-border/60 text-sm font-bold px-4 focus:border-on-surface outline-none transition-all",
                value: formData.title,
                onChange: (e) => setFormData({ ...formData, title: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/40", children: "Mission Description" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 3,
                required: true,
                placeholder: "Define the scope and impact of this priority...",
                className: "w-full bg-muted/5 border-b border-border/60 text-sm font-bold p-4 focus:border-on-surface outline-none resize-none transition-all",
                value: formData.description,
                onChange: (e) => setFormData({ ...formData, description: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/40", children: "Target Capital (GHS)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  required: true,
                  className: "w-full h-12 bg-muted/5 border-b border-border/60 text-sm font-bold font-meta px-4 focus:border-on-surface outline-none transition-all",
                  value: formData.targetAmount,
                  onChange: (e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/40", children: "Mission Deadline" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  required: true,
                  className: "w-full h-12 bg-muted/5 border-b border-border/60 text-sm font-bold px-4 focus:border-on-surface outline-none transition-all",
                  value: formData.endDate,
                  onChange: (e) => setFormData({ ...formData, endDate: e.target.value })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/40", children: "Status" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "w-full h-12 bg-muted/5 border-b border-border/60 text-sm font-bold px-4 focus:border-on-surface outline-none appearance-none transition-all",
                  value: formData.status,
                  onChange: (e) => setFormData({ ...formData, status: e.target.value }),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "Active", children: "Active Mobilization" }),
                    /* @__PURE__ */ jsx("option", { value: "Closed", children: "Mission Completed" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-bold tracking-tight text-muted-foreground/40", children: "Visual URL (Optional)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "url",
                  placeholder: "https://...",
                  className: "w-full h-12 bg-muted/5 border-b border-border/60 text-sm font-bold px-4 focus:border-on-surface outline-none transition-all",
                  value: formData.imageUrl,
                  onChange: (e) => setFormData({ ...formData, imageUrl: e.target.value })
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 border-t border-border/10 bg-muted/5 flex gap-4", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "default",
              onClick: () => {
                setIsCreating(false);
                setEditingCampaign(null);
              },
              className: "flex-1 h-12 rounded-sm border-border/40 font-bold text-micro tracking-tight hover:bg-stone-50 transition-all active:scale-95",
              disabled: isSubmitting,
              children: "Abort Mission"
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "submit",
              variant: "primary",
              className: "flex-1 h-12 rounded-sm font-bold text-micro tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
              disabled: isSubmitting,
              children: [
                isSubmitting ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 mr-2" }),
                isCreating ? "Deploy Protocol" : "Sync Adjustments"
              ]
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  StrategicPriorities as default
};
