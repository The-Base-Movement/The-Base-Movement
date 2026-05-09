import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { PenTool, Plus, Search, Shield, Loader2, Eye, Edit3, Trash2, User, Quote, Calendar } from "lucide-react";
import { x as contentService, b as BrandLine, B as Button, C as Card, I as Input } from "../main.mjs";
import { D as DeleteConfirmationModal } from "./DeleteConfirmationModal-Cn3j2Cup.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription } from "./dialog-D9Fxht2W.js";
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
import "@radix-ui/react-dialog";
function AdminAuthors() {
  const [authors, setAuthors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewingAuthor, setViewingAuthor] = useState(null);
  const [roleFilter, setRoleFilter] = useState("All Roles");
  useEffect(() => {
    fetchAuthors();
  }, []);
  useEffect(() => {
    if (authors.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const viewId = params.get("view");
      if (viewId) {
        const author = authors.find((a) => a.id === viewId);
        if (author) {
          setTimeout(() => {
            setViewingAuthor(author);
            window.history.replaceState({}, "", window.location.pathname);
          }, 0);
        }
      }
    }
  }, [authors]);
  const fetchAuthors = async () => {
    try {
      const data = await contentService.getAuthors();
      setAuthors(data);
    } catch (error) {
      console.error("Failed to fetch authors:", error);
      toast.error("Failed to load authors");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(deleteConfirm.id);
    try {
      const success = await contentService.deleteAuthor(deleteConfirm.id);
      if (success) {
        toast.success(`Author ${deleteConfirm.name} moved to trash vault`);
        setAuthors(authors.filter((a) => a.id !== deleteConfirm.id));
      } else {
        toast.error("Failed to delete author");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(null);
      setDeleteConfirm(null);
    }
  };
  const uniqueRoles = Array.from(new Set(authors.map((a) => a.role || "Contributor"))).sort();
  const filteredAuthors = authors.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.role && a.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All Roles" || (a.role || "Contributor") === roleFilter;
    return matchesSearch && matchesRole;
  });
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(PenTool, { className: "w-8 h-8 text-on-surface" }),
          "Editorial directory"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Official editorial profiles, biographies, and access credentials for the movement's content creators." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "primary",
          size: "lg",
          className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          onClick: () => window.location.href = "/admin/authors/new",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            "Recruit Author"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden bg-white", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-border/10 bg-muted/5 flex-columns items-center flex-between", style: { "--column-gap": "2rem" }, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full md:w-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-80", children: [
            /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Search by name or role...",
                className: "pl-12 h-11 bg-white border-border/60 focus-visible:ring-primary rounded-sm text-tiny font-bold",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: roleFilter,
              onChange: (e) => setRoleFilter(e.target.value),
              className: "h-11 px-4 py-2 text-micro font-bold rounded-sm border border-border/60 bg-white text-on-surface/80 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent cursor-pointer transition-all",
              children: [
                /* @__PURE__ */ jsx("option", { value: "All Roles", children: "All Roles" }),
                uniqueRoles.map((role) => /* @__PURE__ */ jsx("option", { value: role, children: role }, role))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-micro text-muted-foreground/60 font-bold bg-white px-5 py-2.5 rounded-sm border border-border/10 shadow-sm", children: [
          /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4 text-muted-foreground/40" }),
          /* @__PURE__ */ jsx("span", { className: "normal-case", children: "Authorized personnel:" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-on-surface font-bold ml-1", children: authors.length })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm text-left", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-micro text-stone-500 capitalize tracking-tight bg-stone-50/80 border-b border-stone-100", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-bold", children: "Author Profile" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-bold", children: "Role & Title" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-bold", children: "Date Added" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-bold text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-stone-100", children: isLoading ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-6 py-12 text-center text-stone-500", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center space-x-2", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin text-[var(--brand-red)]" }),
          /* @__PURE__ */ jsx("span", { children: "Loading editorial profiles..." })
        ] }) }) }) : filteredAuthors.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 4, className: "px-6 py-12 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 text-stone-400 mb-3", children: /* @__PURE__ */ jsx(PenTool, { className: "w-6 h-6" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-stone-500 font-medium", children: "No authors found." })
        ] }) }) : filteredAuthors.map((author) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-stone-50/80 transition-colors group", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-stone-200 overflow-hidden shrink-0 border border-stone-300", children: author.imageUrl ? /* @__PURE__ */ jsx("img", { src: author.imageUrl, alt: author.name, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-stone-400 bg-stone-100", children: /* @__PURE__ */ jsx(PenTool, { className: "w-5 h-5" }) }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "font-bold text-stone-900 group-hover:text-[var(--brand-red)] transition-colors", children: author.name }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-stone-500 mt-0.5 max-w-[200px] truncate", children: author.bio || "No biography provided" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-stone-100 text-stone-700", children: author.role || "Contributor" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-stone-500 text-xs font-medium", children: format(new Date(author.createdAt), "MMM dd, yyyy") }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                size: "icon",
                className: "h-10 w-10 text-stone-500 hover:text-brand-green border-stone-200 hover:bg-stone-50 rounded-sm transition-all shadow-sm active:scale-95",
                onClick: () => setViewingAuthor(author),
                title: "View Profile",
                children: /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                size: "icon",
                className: "h-10 w-10 text-stone-500 hover:text-accent border-stone-200 hover:bg-stone-50 rounded-sm transition-all shadow-sm active:scale-95",
                onClick: () => window.location.href = `/admin/authors/edit/${author.id}`,
                title: "Edit Profile",
                children: /* @__PURE__ */ jsx(Edit3, { className: "w-5 h-5" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                size: "icon",
                className: "h-10 w-10 text-stone-400 hover:text-destructive border-stone-200 hover:bg-destructive/10 rounded-sm transition-all shadow-sm active:scale-95",
                onClick: () => setDeleteConfirm({ id: author.id, name: author.name }),
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" })
              }
            )
          ] }) })
        ] }, author.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(
      DeleteConfirmationModal,
      {
        isOpen: !!deleteConfirm,
        onClose: () => setDeleteConfirm(null),
        onConfirm: handleDelete,
        title: "Move to Trash Vault?",
        description: `Are you sure you want to move ${deleteConfirm?.name} to the trash? Their profile will be hidden from the platform but can be restored within 30 days.`,
        itemName: deleteConfirm?.name || "",
        isLoading: isDeleting === deleteConfirm?.id
      }
    ),
    /* @__PURE__ */ jsx(
      AuthorDetailModal,
      {
        author: viewingAuthor,
        isOpen: !!viewingAuthor,
        onClose: () => setViewingAuthor(null)
      }
    )
  ] });
}
function AuthorDetailModal({ author, isOpen, onClose }) {
  if (!author) return null;
  return /* @__PURE__ */ jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-4xl bg-white border-stone-200 p-0 overflow-hidden rounded-sm shadow-2xl", children: [
    /* @__PURE__ */ jsx("div", { className: "h-32 bg-stone-100 relative", children: /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 left-8", children: /* @__PURE__ */ jsx("div", { className: "w-24 h-24 rounded-full border-4 border-white bg-stone-200 overflow-hidden shadow-lg", children: author.imageUrl ? /* @__PURE__ */ jsx("img", { src: author.imageUrl, alt: author.name, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-stone-400 bg-stone-100", children: /* @__PURE__ */ jsx(User, { className: "w-10 h-10" }) }) }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "pt-16 px-8 pb-8", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { className: "sr-only", children: [
        /* @__PURE__ */ jsxs(DialogTitle, { children: [
          author.name,
          " Profile"
        ] }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          "Viewing editorial profile for ",
          author.name
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-stone-900 font-meta tracking-tight", children: author.name }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-x-4 gap-y-2 mt-2", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap", children: author.role || "Contributor" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-stone-400 flex items-center gap-1.5 font-medium", children: [
              /* @__PURE__ */ jsx(Shield, { className: "w-3.5 h-3.5 text-stone-300" }),
              "Editorial ID: ",
              /* @__PURE__ */ jsx("span", { className: "text-stone-600 font-mono", children: author.id.substring(0, 8) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            className: "text-xs font-bold uppercase tracking-wider",
            onClick: () => window.location.href = `/admin/authors/edit/${author.id}`,
            children: [
              /* @__PURE__ */ jsx(Edit3, { className: "w-3.5 h-3.5 mr-2" }),
              "Edit Profile"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-8", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Quote, { className: "w-4 h-4 text-stone-300" }),
          "Biography & Editorial Mission"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-stone-600 text-base leading-relaxed bg-stone-50/50 p-6 rounded-sm border border-stone-100 italic relative group", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-1 h-full bg-stone-200 group-hover:bg-brand-red transition-colors" }),
          author.bio || "No biography has been added for this editorial profile. Profiles without biographies may appear less authoritative to the mobilization base."
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-stone-50/80 border-t border-stone-100 px-8 py-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsx("span", { className: "text-micro text-stone-400 uppercase font-bold tracking-tighter mb-0.5", children: "Enlisted Date" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-stone-700 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3 text-stone-400" }),
            format(new Date(author.createdAt), "MMMM dd, yyyy")
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsx("span", { className: "text-micro text-stone-400 uppercase font-bold tracking-tighter mb-0.5", children: "Current Status" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-green-600 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-green-500 animate-pulse" }),
            "Active Duty"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-micro text-stone-300 font-bold uppercase tracking-widest flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Shield, { className: "w-3 h-3" }),
        "Verified Editorial Personnel"
      ] })
    ] })
  ] }) });
}
export {
  AdminAuthors as default
};
