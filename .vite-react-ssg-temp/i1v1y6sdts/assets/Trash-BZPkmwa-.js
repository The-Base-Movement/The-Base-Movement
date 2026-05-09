import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { x as contentService, l as logisticsService, b as BrandLine, C as Card, d as CardContent, B as Button, c as cn } from "../main.mjs";
import { Trash2, ShieldAlert, FileText, Package, Image, PenTool, Search, AlertCircle, Archive, Clock, History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { D as DeleteConfirmationModal } from "./DeleteConfirmationModal-Cn3j2Cup.js";
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
import "./dialog-D9Fxht2W.js";
import "@radix-ui/react-dialog";
function TrashPage() {
  const [activeTab, setActiveTab] = useState("blogs");
  const [blogs, setBlogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [media, setMedia] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null,
    id: null,
    name: null
  });
  const loadTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      const [trashedBlogs, trashedProducts, trashedMedia, trashedAuthors] = await Promise.all([
        contentService.getTrashedBlogPosts(),
        logisticsService.getTrashedInventory(),
        contentService.getTrashedMedia(),
        contentService.getTrashedAuthors()
      ]);
      setBlogs(trashedBlogs);
      setProducts(trashedProducts);
      setMedia(trashedMedia);
      setAuthors(trashedAuthors);
    } catch {
      toast.error("Failed to load trash contents");
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadTrash();
  }, [loadTrash]);
  const handleRestore = async (type, idOrUrl) => {
    try {
      let success = false;
      if (type === "blogs") success = await contentService.restoreBlogPost(idOrUrl);
      if (type === "products") success = await logisticsService.restoreInventoryItem(idOrUrl);
      if (type === "media") success = await contentService.restoreMediaFile(idOrUrl);
      if (type === "authors") success = await contentService.restoreAuthor(idOrUrl);
      if (success) {
        toast.success("Item successfully reintegrated into active operations");
        loadTrash();
      } else {
        toast.error("Restoration protocol failed");
      }
    } catch {
      toast.error("An error occurred during restoration");
    }
  };
  const handlePermanentDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;
    try {
      let success = false;
      if (deleteModal.type === "blogs") success = await contentService.permanentlyDeleteBlogPost(deleteModal.id);
      if (deleteModal.type === "products") success = await logisticsService.permanentlyDeleteInventoryItem(deleteModal.id);
      if (deleteModal.type === "media") success = await contentService.permanentlyDeleteMediaFile(deleteModal.id);
      if (deleteModal.type === "authors") success = await contentService.permanentlyDeleteAuthor(deleteModal.id);
      if (success) {
        toast.success("Record purged permanently");
        setDeleteModal({ isOpen: false, type: null, id: null, name: null });
        loadTrash();
      } else {
        toast.error("Decommissioning sequence failed");
      }
    } catch {
      toast.error("An error occurred during deletion");
    }
  };
  const formatDaysRemaining = (deletedAt) => {
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1e3);
    const now = /* @__PURE__ */ new Date();
    const diff = expiryDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1e3 * 60 * 60 * 24));
    return days;
  };
  const getFilteredItems = () => {
    let items = [];
    if (activeTab === "blogs") items = blogs;
    else if (activeTab === "products") items = products;
    else if (activeTab === "media") items = media;
    else if (activeTab === "authors") items = authors;
    if (!searchQuery) return items;
    return items.filter((item) => {
      const r = item;
      const name = String(r["title"] ?? r["name"] ?? r["filename"] ?? "");
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };
  const filteredItems = getFilteredItems();
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Trash2, { className: "w-8 h-8 text-on-surface" }),
          "Trash vault"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Staging area for decommissioned assets and intelligence records awaiting purge." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-stone-50/80 backdrop-blur-sm rounded-sm px-8 py-5 border border-stone-200/60 flex items-center gap-8 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold tracking-tight text-on-surface/60 uppercase", children: "Retention protocol" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-on-surface", children: "30" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/40", children: "Days" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-stone-200" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-bold text-destructive", children: [
          /* @__PURE__ */ jsx(ShieldAlert, { className: "w-5 h-5" }),
          "Purge sequence active"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-8 items-start relative", children: [
      /* @__PURE__ */ jsxs("aside", { className: "w-full lg:w-72 sticky lg:top-32 space-y-6 shrink-0 z-30", children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border/10 bg-muted/5", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-xs normal-case", children: "Vault sectors" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-2", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: activeTab === "blogs" ? "primary" : "ghost",
                onClick: () => setActiveTab("blogs"),
                className: cn(
                  "w-full flex items-center justify-start gap-4 px-6 py-3 rounded-sm text-micro font-bold tracking-tight transition-all h-14 active:scale-95",
                  activeTab === "blogs" ? "shadow-lg shadow-brand-green/20" : "text-on-surface/60 hover:bg-stone-50 hover:text-on-surface border border-transparent hover:border-stone-100"
                ),
                children: [
                  /* @__PURE__ */ jsx(FileText, { className: cn("w-4 h-4", activeTab === "blogs" ? "text-white" : "text-muted-foreground/40") }),
                  /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Blog intelligence" }),
                  /* @__PURE__ */ jsx("span", { className: cn("text-micro font-bold", activeTab === "blogs" ? "text-white/70" : "text-muted-foreground/40"), children: blogs.length })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: activeTab === "products" ? "primary" : "ghost",
                onClick: () => setActiveTab("products"),
                className: cn(
                  "w-full flex items-center justify-start gap-4 px-6 py-3 rounded-sm text-micro font-bold tracking-tight transition-all h-14 active:scale-95",
                  activeTab === "products" ? "shadow-lg shadow-brand-green/20" : "text-on-surface/60 hover:bg-stone-50 hover:text-on-surface border border-transparent hover:border-stone-100"
                ),
                children: [
                  /* @__PURE__ */ jsx(Package, { className: cn("w-4 h-4", activeTab === "products" ? "text-white" : "text-muted-foreground/40") }),
                  /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Logistics store" }),
                  /* @__PURE__ */ jsx("span", { className: cn("text-micro font-bold", activeTab === "products" ? "text-white/70" : "text-muted-foreground/40"), children: products.length })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: activeTab === "media" ? "primary" : "ghost",
                onClick: () => setActiveTab("media"),
                className: cn(
                  "w-full flex items-center justify-start gap-4 px-6 py-3 rounded-sm text-micro font-bold tracking-tight transition-all h-14 active:scale-95",
                  activeTab === "media" ? "shadow-lg shadow-brand-green/20" : "text-on-surface/60 hover:bg-stone-50 hover:text-on-surface border border-transparent hover:border-stone-100"
                ),
                children: [
                  /* @__PURE__ */ jsx(Image, { className: cn("w-4 h-4", activeTab === "media" ? "text-white" : "text-muted-foreground/40") }),
                  /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Visual assets" }),
                  /* @__PURE__ */ jsx("span", { className: cn("text-micro font-bold", activeTab === "media" ? "text-white/70" : "text-muted-foreground/40"), children: media.length })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: activeTab === "authors" ? "primary" : "ghost",
                onClick: () => setActiveTab("authors"),
                className: cn(
                  "w-full flex items-center justify-start gap-4 px-6 py-3 rounded-sm text-micro font-bold tracking-tight transition-all h-14 active:scale-95",
                  activeTab === "authors" ? "shadow-lg shadow-brand-green/20" : "text-on-surface/60 hover:bg-stone-50 hover:text-on-surface border border-transparent hover:border-stone-100"
                ),
                children: [
                  /* @__PURE__ */ jsx(PenTool, { className: cn("w-4 h-4", activeTab === "authors" ? "text-white" : "text-muted-foreground/40") }),
                  /* @__PURE__ */ jsx("span", { className: "flex-1 text-left", children: "Editorial roster" }),
                  /* @__PURE__ */ jsx("span", { className: cn("text-micro font-bold", activeTab === "authors" ? "text-white/70" : "text-muted-foreground/40"), children: authors.length })
                ]
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border/10 bg-muted/5", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-xs normal-case", children: "Vault scanner" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-4 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative group/search", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/search:text-on-surface transition-colors z-10" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Scan keywords...",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  className: "w-full h-10 pl-10 pr-4 bg-muted/30 border border-border/40 focus:bg-white focus:border-border/60 rounded-sm text-xs font-medium outline-none transition-all"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-destructive/5 rounded-sm p-4 border border-destructive/10 space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(AlertCircle, { className: "w-3.5 h-3.5 text-destructive shrink-0" }),
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-destructive tracking-tight uppercase", children: "Critical awareness" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-micro font-medium text-destructive/80 leading-relaxed", children: "Permanent deletion occurs at T-0. Records cannot be recovered once purged." })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-[500px]", children: isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-40 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative w-16 h-16", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 border-4 border-stone-100 rounded-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 border-4 border-destructive border-t-transparent rounded-none animate-spin" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold tracking-tight text-on-surface/20", children: "Syncing vault sectors" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-on-surface/40", children: "Accessing restricted archival blocks..." })
        ] })
      ] }) : filteredItems.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-sm p-24 text-center space-y-8 border-dashed border-2 border-stone-200 animate-in zoom-in-95 duration-500 bg-white", children: [
        /* @__PURE__ */ jsx("div", { className: "w-24 h-24 rounded-sm bg-stone-50 flex items-center justify-center mx-auto border border-stone-100 shadow-inner group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(Archive, { className: "w-10 h-10 text-stone-200" }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold text-on-surface tracking-tight", children: "Vault sector clear" }),
          /* @__PURE__ */ jsx("p", { className: "text-on-surface/40 text-sm max-w-sm mx-auto font-medium leading-relaxed", children: "No records currently match your scan parameters. The sector is clear or filters are overly restrictive." })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "default",
            onClick: () => setSearchQuery(""),
            className: "h-12 px-10 rounded-sm text-micro font-bold tracking-tight border-stone-200 hover:border-destructive/30 hover:bg-destructive/5 transition-all shadow-sm",
            children: "Reset scanner filters"
          }
        )
      ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-700", children: [
        activeTab === "blogs" && blogs.map((post) => /* @__PURE__ */ jsx(
          TrashCard,
          {
            title: post.title,
            subtitle: post.category,
            type: "Blog post",
            deletedAt: post.deletedAt || (/* @__PURE__ */ new Date()).toISOString(),
            daysLeft: formatDaysRemaining(post.deletedAt || (/* @__PURE__ */ new Date()).toISOString()),
            onRestore: () => handleRestore("blogs", post.id),
            onDelete: () => setDeleteModal({ isOpen: true, type: "blogs", id: post.id, name: post.title }),
            icon: /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6" }),
            accent: "red"
          },
          post.id
        )),
        activeTab === "products" && products.map((product) => /* @__PURE__ */ jsx(
          TrashCard,
          {
            title: product.name,
            subtitle: product.category,
            type: "Inventory",
            deletedAt: product.deletedAt || (/* @__PURE__ */ new Date()).toISOString(),
            daysLeft: formatDaysRemaining(product.deletedAt || (/* @__PURE__ */ new Date()).toISOString()),
            onRestore: () => handleRestore("products", product.id),
            onDelete: () => setDeleteModal({ isOpen: true, type: "products", id: product.id, name: product.name }),
            icon: /* @__PURE__ */ jsx(Package, { className: "w-6 h-6" }),
            accent: "gold"
          },
          product.id
        )),
        activeTab === "media" && media.map((item) => /* @__PURE__ */ jsx(
          TrashCard,
          {
            title: item.filename,
            subtitle: item.folder,
            type: "Media asset",
            image: item.url,
            deletedAt: item.deleted_at || (/* @__PURE__ */ new Date()).toISOString(),
            daysLeft: formatDaysRemaining(item.deleted_at || (/* @__PURE__ */ new Date()).toISOString()),
            onRestore: () => handleRestore("media", item.url),
            onDelete: () => setDeleteModal({ isOpen: true, type: "media", id: item.url, name: item.filename }),
            accent: "green"
          },
          item.id
        )),
        activeTab === "authors" && authors.map((author) => /* @__PURE__ */ jsx(
          TrashCard,
          {
            title: author.name,
            subtitle: author.role || "Contributor",
            type: "Personnel",
            image: author.imageUrl,
            deletedAt: author.deletedAt || (/* @__PURE__ */ new Date()).toISOString(),
            daysLeft: formatDaysRemaining(author.deletedAt || (/* @__PURE__ */ new Date()).toISOString()),
            onRestore: () => handleRestore("authors", author.id),
            onDelete: () => setDeleteModal({ isOpen: true, type: "authors", id: author.id, name: author.name }),
            icon: /* @__PURE__ */ jsx(PenTool, { className: "w-6 h-6" }),
            accent: "red"
          },
          author.id
        ))
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(
      DeleteConfirmationModal,
      {
        isOpen: deleteModal.isOpen,
        onClose: () => setDeleteModal({ ...deleteModal, isOpen: false }),
        onConfirm: handlePermanentDelete,
        title: "Final decommissioning",
        description: "Attention: This record will be permanently purged from all movement databases. This action is irreversible and follows strict security protocols.",
        itemName: deleteModal.name || "",
        isPermanent: true
      }
    )
  ] });
}
function TrashCard({
  title,
  subtitle,
  type,
  deletedAt,
  onRestore,
  onDelete,
  daysLeft,
  icon,
  image,
  accent = "red"
}) {
  const isExpiringSoon = daysLeft <= 7;
  return /* @__PURE__ */ jsx(Card, { className: "rounded-sm border border-stone-200/60 overflow-hidden bg-white hover:shadow-2xl hover:border-stone-400 transition-all duration-500 group relative", children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row min-h-[160px]", children: [
    /* @__PURE__ */ jsxs("div", { className: "w-full sm:w-40 relative overflow-hidden bg-stone-50 border-r border-stone-100 flex items-center justify-center shrink-0", children: [
      image ? /* @__PURE__ */ jsx("img", { src: image, alt: "", className: "w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx("div", { className: "text-on-surface/10 group-hover:text-on-surface/30 transition-colors transform group-hover:scale-125 duration-500", children: icon }),
      /* @__PURE__ */ jsx("div", { className: cn(
        "absolute top-0 left-0 w-full h-1 transition-all duration-500 group-hover:h-1.5",
        accent === "red" ? "bg-destructive" : accent === "gold" ? "bg-accent" : "bg-primary"
      ) }),
      /* @__PURE__ */ jsx("div", { className: "absolute top-4 left-4", children: /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight text-white bg-on-surface/90 px-3 py-1 rounded-none backdrop-blur-sm border border-white/10 uppercase", children: type }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 p-6 flex flex-col justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-on-surface/30 tracking-tight", children: subtitle }),
            /* @__PURE__ */ jsx("h4", { className: "text-lg font-bold text-on-surface leading-tight tracking-tight", children: title })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: cn(
            "px-4 py-3 rounded-sm flex flex-col items-center justify-center min-w-[80px] border transition-all duration-300",
            isExpiringSoon ? "bg-destructive border-destructive text-white shadow-lg shadow-destructive/20" : "bg-stone-50 border-stone-200 text-on-surface"
          ), children: [
            /* @__PURE__ */ jsx("span", { className: cn(
              "text-3xl font-bold tabular-nums leading-none tracking-tighter",
              isExpiringSoon ? "text-white" : "text-on-surface"
            ), children: daysLeft }),
            /* @__PURE__ */ jsx("span", { className: cn(
              "text-micro font-bold tracking-tight uppercase mt-1",
              isExpiringSoon ? "text-white/80" : "text-on-surface/40"
            ), children: "Days left" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-micro font-bold text-on-surface/30", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }),
            "Deleted ",
            new Date(deletedAt).toLocaleDateString()
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(History, { className: "w-3.5 h-3.5" }),
            "ID: ",
            title.substring(0, 8).toUpperCase()
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-8 pt-6 border-t border-stone-50", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: onRestore,
            variant: "primary",
            className: "flex-1 h-12 rounded-sm text-micro font-bold tracking-tight gap-2 transition-all active:scale-95 group/btn shadow-lg shadow-brand-green/20",
            children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" }),
              "Restore record"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: onDelete,
            variant: "destructive",
            className: "h-12 w-12 rounded-sm transition-all active:scale-95",
            title: "Permanent purge",
            children: /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5" })
          }
        )
      ] })
    ] })
  ] }) }) });
}
export {
  TrashPage as default
};
