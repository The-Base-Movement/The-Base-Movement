import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Shield, UserPlus, Search, ShieldAlert, ShieldCheck, Zap, MoreHorizontal } from "lucide-react";
import { t as useToast, b as BrandLine, B as Button, C as Card, d as CardContent, c as cn, D as DropdownMenu, n as DropdownMenuTrigger, o as DropdownMenuContent, p as DropdownMenuLabel, q as DropdownMenuSeparator, r as DropdownMenuItem, I as Input, a as adminService } from "../main.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-D9Fxht2W.js";
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
import "@radix-ui/react-dialog";
const DEFAULT_PERMISSIONS = {
  "FOUNDER": [
    { action: "VERIFY_MEMBER", resource: "MEMBERS" },
    { action: "DELETE_MEMBER", resource: "MEMBERS" },
    { action: "MANAGE_CHAPTER", resource: "CHAPTERS" },
    { action: "MANAGE_POLLS", resource: "POLLS" },
    { action: "MANAGE_INVENTORY", resource: "STORE" },
    { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" },
    { action: "MANAGE_BLOGS", resource: "BLOGS" },
    { action: "MANAGE_DONATIONS", resource: "DONATIONS" },
    { action: "APPOINT_LEAD", resource: "CHAPTERS" }
  ],
  "ORGANIZER": [
    { action: "VERIFY_MEMBER", resource: "MEMBERS" },
    { action: "MANAGE_CHAPTER", resource: "CHAPTERS" },
    { action: "MANAGE_POLLS", resource: "POLLS" },
    { action: "MANAGE_INVENTORY", resource: "STORE" },
    { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" },
    { action: "MANAGE_BLOGS", resource: "BLOGS" }
  ],
  "SUPER_ADMIN": [
    { action: "VERIFY_MEMBER", resource: "MEMBERS" },
    { action: "DELETE_MEMBER", resource: "MEMBERS" },
    { action: "MANAGE_CHAPTER", resource: "CHAPTERS" },
    { action: "MANAGE_POLLS", resource: "POLLS" },
    { action: "MANAGE_INVENTORY", resource: "STORE" },
    { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" },
    { action: "MANAGE_BLOGS", resource: "BLOGS" },
    { action: "MANAGE_DONATIONS", resource: "DONATIONS" }
  ],
  "REGIONAL_DIRECTOR": [
    { action: "VERIFY_MEMBER", resource: "MEMBERS" },
    { action: "MANAGE_CHAPTER", resource: "CHAPTERS" },
    { action: "MANAGE_POLLS", resource: "POLLS" },
    { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" }
  ],
  "CONSTITUENCY_LEAD": [
    { action: "VERIFY_MEMBER", resource: "MEMBERS" },
    { action: "MANAGE_CHAPTER", resource: "CHAPTERS" }
  ],
  "VERIFIER": [
    { action: "VERIFY_MEMBER", resource: "MEMBERS" }
  ],
  "CHIEF_EDITOR": [
    { action: "MANAGE_BLOGS", resource: "BLOGS" },
    { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" }
  ],
  "SENIOR_EDITOR": [
    { action: "MANAGE_BLOGS", resource: "BLOGS" }
  ],
  "EDITOR": [
    { action: "MANAGE_BLOGS", resource: "BLOGS" }
  ],
  "JUNIOR_EDITOR": [
    { action: "MANAGE_BLOGS", resource: "BLOGS" }
  ],
  "REGIONAL_CORRESPONDENT": [
    { action: "MANAGE_BLOGS", resource: "BLOGS" }
  ]
};
function Administrators() {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newAdmin, setNewAdmin] = useState({ id: "", role: "VERIFIER" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const fetchAdmins = async () => {
    setIsLoading(true);
    const data = await adminService.getAdministrators();
    setAdmins(data);
    setIsLoading(false);
  };
  useEffect(() => {
    fetchAdmins();
  }, []);
  const handleProvision = async () => {
    if (!newAdmin.id) {
      toast({ title: "Validation Error", description: "Please enter a valid Patriot ID.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await adminService.provisionAdministrator(
        newAdmin.id,
        newAdmin.role,
        DEFAULT_PERMISSIONS[newAdmin.role]
      );
      if (success) {
        toast({ title: "Access granted", description: `Credentials provisioned for ${newAdmin.id}.` });
        setIsProvisionModalOpen(false);
        setNewAdmin({ id: "", role: "VERIFIER" });
        fetchAdmins();
      } else {
        toast({ title: "Provisioning failed", description: "Ensure the ID exists and is not already an admin.", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleRevoke = async (id, name) => {
    if (!window.confirm(`Are you sure you want to revoke administrative access for ${name}?`)) return;
    const success = await adminService.revokeAdministrator(id);
    if (success) {
      toast({ title: "Access revoked", description: `${name} has been decommissioned.` });
      fetchAdmins();
    } else {
      toast({ title: "Revocation failed", description: "An error occurred while revoking access.", variant: "destructive" });
    }
  };
  const handleUpdatePermissions = async () => {
    if (!selectedAdmin) return;
    toast({ title: "Permissions updated", description: `Access controls refined for ${selectedAdmin.name}.` });
    setIsPermissionsModalOpen(false);
  };
  const filteredAdmins = admins.filter((a) => {
    const term = searchTerm.toLowerCase();
    return a.name?.toLowerCase().includes(term) || a.id?.toLowerCase().includes(term) || a.role?.toLowerCase().includes(term);
  });
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Shield, { className: "w-8 h-8 text-on-surface" }),
          "Administrators"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Authorized personnel with leadership credentials and platform oversight." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "primary",
          size: "lg",
          className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          onClick: () => setIsProvisionModalOpen(true),
          children: [
            /* @__PURE__ */ jsx(UserPlus, { className: "w-4 h-4 mr-2" }),
            "Provision Credentials"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm", children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "relative max-w-md", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          placeholder: "Search by name, ID or role...",
          className: "w-full pl-12 pr-4 h-12 bg-muted/5 border border-border/10 focus:bg-white focus:border-on-surface focus:ring-0 transition-all text-tiny outline-none font-bold placeholder:text-muted-foreground/20 rounded-sm",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value)
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden hidden md:block", children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/5 border-b border-border/60", children: [
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/40 tracking-tight", children: "Administrator" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/40 tracking-tight", children: "Access level" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/40 tracking-tight", children: "Region" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/40 tracking-tight text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/10", children: isLoading ? Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ jsxs("tr", { className: "animate-pulse", children: [
        /* @__PURE__ */ jsx("td", { className: "px-6 py-6", children: /* @__PURE__ */ jsx("div", { className: "h-10 bg-muted/5 w-48" }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-6", children: /* @__PURE__ */ jsx("div", { className: "h-6 bg-muted/5 w-24" }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-6", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/5 w-32" }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-6 text-right", children: /* @__PURE__ */ jsx("div", { className: "h-8 w-8 bg-muted/5 ml-auto" }) })
      ] }, i)) : filteredAdmins.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-6 py-12 text-center text-muted-foreground/40 font-bold text-xs tracking-tight", children: "No authorized personnel found." }) }) : filteredAdmins.map((admin) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/5 transition-colors", children: [
        /* @__PURE__ */ jsx("td", { className: "px-6 py-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: cn(
            "w-10 h-10 flex items-center justify-center font-bold text-xs shadow-md overflow-hidden rounded-sm",
            admin.role === "SUPER_ADMIN" ? "bg-destructive text-white" : "bg-on-surface text-white"
          ), children: admin.avatarUrl ? /* @__PURE__ */ jsx("img", { src: admin.avatarUrl, alt: admin.name, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : admin.name.split(" ").map((n) => n[0]).join("") }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-on-surface tracking-tight", children: admin.name }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 mt-0.5", children: admin.id })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          admin.role === "SUPER_ADMIN" ? /* @__PURE__ */ jsx(ShieldAlert, { className: "w-4 h-4 text-destructive" }) : /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-primary" }),
          /* @__PURE__ */ jsx("span", { className: cn(
            "text-micro font-bold",
            admin.role === "SUPER_ADMIN" ? "text-destructive" : "text-primary"
          ), children: admin.role.charAt(0).toUpperCase() + admin.role.slice(1).toLowerCase().replace("_", " ") })
        ] }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-6", children: /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface/60", children: admin.region || "National HQ" }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-6 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "gold",
              size: "icon",
              className: "w-9 h-9 rounded-sm transition-all active:scale-95",
              onClick: () => {
                setSelectedAdmin(admin);
                setIsActivityModalOpen(true);
                toast({ title: "Identity verified", description: `Full audit trail active for ${admin.name}.` });
              },
              children: /* @__PURE__ */ jsx(Zap, { className: "w-3.5 h-3.5" })
            }
          ),
          /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
              Button,
              {
                variant: "gold",
                size: "icon",
                className: "w-9 h-9 rounded-sm transition-all active:scale-95",
                children: /* @__PURE__ */ jsx(MoreHorizontal, { className: "w-4 h-4" })
              }
            ) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-48 rounded-sm border-border/60", children: [
              /* @__PURE__ */ jsx(DropdownMenuLabel, { className: "text-micro font-bold text-muted-foreground/40", children: "Admin actions" }),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
              /* @__PURE__ */ jsx(
                DropdownMenuItem,
                {
                  className: "text-xs font-bold py-2 cursor-pointer",
                  onSelect: () => {
                    setSelectedAdmin(admin);
                    setIsPermissionsModalOpen(true);
                  },
                  children: "Edit permissions"
                }
              ),
              /* @__PURE__ */ jsx(
                DropdownMenuItem,
                {
                  className: "text-xs font-bold py-2 cursor-pointer",
                  onSelect: () => {
                    setSelectedAdmin(admin);
                    setIsActivityModalOpen(true);
                  },
                  children: "Activity logs"
                }
              ),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
              /* @__PURE__ */ jsx(
                DropdownMenuItem,
                {
                  className: "text-xs font-bold text-destructive py-2 cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10",
                  onSelect: () => handleRevoke(admin.id, admin.name),
                  children: "Revoke access"
                }
              )
            ] })
          ] })
        ] }) })
      ] }, admin.id)) })
    ] }) }) }) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4 md:hidden", children: isLoading ? Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm animate-pulse", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-muted/5 rounded-sm" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/5 w-32" }),
          /* @__PURE__ */ jsx("div", { className: "h-3 bg-muted/5 w-24" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-8 bg-muted/5 w-full rounded-sm" })
    ] }) }, i)) : filteredAdmins.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-10 text-muted-foreground/40 font-bold text-xs", children: "No authorized personnel found." }) : filteredAdmins.map((admin) => /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: cn(
            "w-12 h-12 flex items-center justify-center font-bold text-sm shadow-md overflow-hidden rounded-sm",
            admin.role === "SUPER_ADMIN" ? "bg-destructive text-white" : "bg-on-surface text-white"
          ), children: admin.avatarUrl ? /* @__PURE__ */ jsx("img", { src: admin.avatarUrl, alt: admin.name, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : admin.name.split(" ").map((n) => n[0]).join("") }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-on-surface tracking-tight", children: admin.name }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 mt-0.5 tracking-tight", children: admin.id })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3 py-1 bg-muted/5 rounded-full border border-border/10", children: [
          admin.role === "SUPER_ADMIN" ? /* @__PURE__ */ jsx(ShieldAlert, { className: "w-3.5 h-3.5 text-destructive" }) : /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3.5 h-3.5 text-primary" }),
          /* @__PURE__ */ jsx("span", { className: cn(
            "text-micro font-bold tracking-tight",
            admin.role === "SUPER_ADMIN" ? "text-destructive" : "text-primary"
          ), children: admin.role.replace("_", " ") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/5 rounded-sm border border-border/10", children: [
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/40 tracking-tight", children: "Region" }),
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface tracking-tight", children: admin.region || "National HQ" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "gold",
              className: "flex-1 h-12 rounded-sm text-micro font-bold tracking-tight transition-all shadow-sm active:scale-95",
              onClick: () => {
                setSelectedAdmin(admin);
                setIsActivityModalOpen(true);
              },
              children: [
                /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4 mr-2" }),
                " Inspect Logs"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
              Button,
              {
                variant: "gold",
                className: "h-10 px-4 rounded-sm transition-all active:scale-95",
                children: /* @__PURE__ */ jsx(MoreHorizontal, { className: "w-4 h-4" })
              }
            ) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-48 rounded-sm border-border/60", children: [
              /* @__PURE__ */ jsx(DropdownMenuLabel, { className: "text-micro font-bold text-muted-foreground/40", children: "Admin Actions" }),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
              /* @__PURE__ */ jsx(
                DropdownMenuItem,
                {
                  className: "text-xs font-bold py-2",
                  onSelect: () => {
                    setSelectedAdmin(admin);
                    setIsPermissionsModalOpen(true);
                  },
                  children: "Edit Permissions"
                }
              ),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
              /* @__PURE__ */ jsx(
                DropdownMenuItem,
                {
                  className: "text-xs font-bold text-destructive py-2 hover:bg-destructive/10 focus:bg-destructive/10",
                  onSelect: () => handleRevoke(admin.id, admin.name),
                  children: "Revoke Access"
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] }) }, admin.id)) }),
    /* @__PURE__ */ jsx("div", { className: "bg-muted/5 border border-border/60 p-8 text-on-surface/60 relative overflow-hidden rounded-sm shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex-columns items-center", style: { "--column-gap": "2rem" }, children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-white flex items-center justify-center shrink-0 rounded-sm shadow-sm border border-border/10", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-6 h-6 text-primary" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "0.25rem" }, children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-on-surface mb-0", children: "Security protocol" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-tiny leading-relaxed max-w-3xl font-medium mb-0 normal-case", children: "Administrative access is governed by movement encryption standards. All actions within the command center are logged in the audit vault for transparency and security. Unauthorized access attempts will be intercepted." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: isProvisionModalOpen, onOpenChange: setIsProvisionModalOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[425px] rounded-sm border-border/60", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-lg font-bold tracking-tight", children: "Provision administrator" }),
        /* @__PURE__ */ jsx(DialogDescription, { className: "text-xs text-muted-foreground/80", children: "Assign administrative credentials to an existing movement patriot." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 py-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-micro font-bold text-muted-foreground/40", children: "Member ID (Registration Number)" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "e.g. PATRIOT-123456",
              value: newAdmin.id,
              onChange: (e) => setNewAdmin({ ...newAdmin, id: e.target.value }),
              className: "rounded-sm border-border/60 text-xs font-bold"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-micro font-bold text-muted-foreground/40", children: "Access Level / Role" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: newAdmin.role,
              onChange: (e) => setNewAdmin({ ...newAdmin, role: e.target.value }),
              className: "w-full h-10 px-3 text-xs font-bold border border-border/60 rounded-sm focus:outline-none focus:border-on-surface",
              children: [
                /* @__PURE__ */ jsx("option", { value: "FOUNDER", children: "Founder" }),
                /* @__PURE__ */ jsx("option", { value: "ORGANIZER", children: "Organizer" }),
                /* @__PURE__ */ jsx("option", { value: "VERIFIER", children: "Verifier" }),
                /* @__PURE__ */ jsx("option", { value: "CONSTITUENCY_LEAD", children: "Constituency Lead" }),
                /* @__PURE__ */ jsx("option", { value: "REGIONAL_DIRECTOR", children: "Regional Director" }),
                /* @__PURE__ */ jsx("option", { value: "SUPER_ADMIN", children: "Super Admin" }),
                /* @__PURE__ */ jsx("option", { value: "CHIEF_EDITOR", children: "Chief Editor" }),
                /* @__PURE__ */ jsx("option", { value: "SENIOR_EDITOR", children: "Senior Editor" }),
                /* @__PURE__ */ jsx("option", { value: "EDITOR", children: "Editor" }),
                /* @__PURE__ */ jsx("option", { value: "JUNIOR_EDITOR", children: "Junior Editor" }),
                /* @__PURE__ */ jsx("option", { value: "REGIONAL_CORRESPONDENT", children: "Regional Correspondent" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-4", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "default",
            className: "flex-1 h-12 text-micro font-bold capitalize tracking-tight rounded-sm border-border/40 hover:bg-stone-50 transition-all active:scale-95",
            onClick: () => setIsProvisionModalOpen(false),
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "primary",
            className: "flex-1 h-12 text-micro font-bold capitalize tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            onClick: handleProvision,
            disabled: isSubmitting,
            children: "Grant Access"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: isPermissionsModalOpen, onOpenChange: setIsPermissionsModalOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[500px] rounded-sm border-border/60", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-lg font-bold tracking-tight", children: "Access control / Permissions" }),
        /* @__PURE__ */ jsxs(DialogDescription, { className: "text-xs text-muted-foreground/80", children: [
          "Refine administrative privileges for ",
          selectedAdmin?.name,
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "py-4 space-y-4", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: [
        "Verify member",
        "Delete member",
        "Manage chapter",
        "Manage polls",
        "Manage inventory",
        "View audit logs"
      ].map((perm) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/5 border border-border/10 rounded-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/60 tracking-tight", children: perm }),
        /* @__PURE__ */ jsx("div", { className: "w-8 h-4 bg-on-surface rounded-full relative", children: /* @__PURE__ */ jsx("div", { className: "absolute right-1 top-1 w-2 h-2 bg-white rounded-full" }) })
      ] }, perm)) }) }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-4", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "default",
            className: "flex-1 h-12 text-micro font-bold capitalize tracking-tight rounded-sm border-border/40 hover:bg-stone-50 transition-all active:scale-95",
            onClick: () => setIsPermissionsModalOpen(false),
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "active-tab",
            className: "flex-1 h-12 text-micro font-bold capitalize tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            onClick: handleUpdatePermissions,
            children: "Update Credentials"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: isActivityModalOpen, onOpenChange: setIsActivityModalOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[600px] rounded-sm border-border/60", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-lg font-bold tracking-tight", children: "Audit vault / Activity logs" }),
        /* @__PURE__ */ jsxs(DialogDescription, { className: "text-xs text-muted-foreground/80", children: [
          "Complete movement engagement history for ",
          selectedAdmin?.name,
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "py-4 space-y-3", children: [
        { action: "Member verified", target: "PAT-88291", time: "14 minutes ago" },
        { action: "Chapter modified", target: "Ashanti Central", time: "2 hours ago" },
        { action: "Poll launched", target: "National Sentiment 2026", time: "Yesterday" }
      ].map((log, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-muted/5 border border-border/10 rounded-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface tracking-tight", children: log.action }),
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/40 mt-0.5", children: log.target })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/40", children: log.time })
      ] }, i)) }),
      /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(
        Button,
        {
          variant: "primary",
          className: "w-full h-12 text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          onClick: () => setIsActivityModalOpen(false),
          children: "Close Vault"
        }
      ) })
    ] }) })
  ] });
}
export {
  Administrators as default
};
