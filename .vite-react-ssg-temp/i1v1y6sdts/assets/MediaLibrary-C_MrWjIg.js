import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { x as contentService, b as BrandLine, B as Button, C as Card, d as CardContent, I as Input, c as cn, a as adminService } from "../main.mjs";
import { Image, Loader2, Upload, FileText, Search, Check, Copy, ExternalLink, Trash2, Filter } from "lucide-react";
import { D as DeleteConfirmationModal } from "./DeleteConfirmationModal-Cn3j2Cup.js";
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
import "./dialog-D9Fxht2W.js";
import "@radix-ui/react-dialog";
function MediaLibrary() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [activeFolder, setActiveFolder] = useState("branding");
  const [assetToDelete, setAssetToDelete] = useState(null);
  const folders = [
    { id: "branding", label: "Branding Assets", icon: Image },
    { id: "blog-images", label: "Blog Posts", icon: Image },
    { id: "author-images", label: "Authors", icon: Image },
    { id: "product-images", label: "Product Images", icon: Image },
    { id: "logos-favicons", label: "Logos & Favicons", icon: Image },
    { id: "public-assets", label: "Public Assets", icon: Image },
    { id: "editor-content", label: "Editor Media", icon: FileText }
  ];
  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeFolder === "logos-favicons") {
        const localUrls = await contentService.getLocalAssets("logos-favicons");
        setFiles(localUrls);
      } else {
        const cloudUrls = await contentService.getMediaFiles(activeFolder);
        let localUrls = [];
        if (activeFolder === "public-assets") {
          localUrls = await contentService.getLocalAssets("public-assets");
        }
        setFiles([...cloudUrls, ...localUrls]);
      }
    } catch {
      toast.error("Failed to load media files");
    } finally {
      setIsLoading(false);
    }
  }, [activeFolder]);
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await contentService.uploadImage(file, activeFolder);
      if (url) {
        setFiles((prev) => [url, ...prev]);
        toast.success("File uploaded successfully");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("An error occurred during upload");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopiedUrl(null), 2e3);
  };
  const filteredFiles = files.filter(
    (url) => url.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleConfirmedDelete = async () => {
    if (!assetToDelete) return;
    setIsLoading(true);
    try {
      const success = await contentService.deleteMediaFile(assetToDelete);
      if (success) {
        toast.success("Asset moved to trash");
        setAssetToDelete(null);
        loadFiles();
        const filename = assetToDelete.split("/").pop() || "Unknown";
        adminService.logAction("TRASH_MEDIA", `MEDIA/${filename}`, "Success");
      } else {
        toast.error("Failed to move asset to trash");
      }
    } catch {
      toast.error("An error occurred during deletion");
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Image, { className: "w-8 h-8 text-on-surface" }),
          "Media library"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Central repository for movement assets and deployment media." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "default",
            size: "lg",
            className: "rounded-sm border-border/40 text-on-surface/80 text-micro px-10 h-12 font-bold tracking-tight hover:bg-stone-50 transition-all shadow-sm active:scale-95",
            onClick: loadFiles,
            children: "Refresh Vault"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "file",
              id: "media-upload",
              className: "hidden",
              onChange: handleUpload,
              accept: "image/*",
              disabled: isUploading
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "primary",
              size: "lg",
              className: "rounded-sm text-micro font-bold tracking-tight px-10 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
              asChild: true,
              disabled: isUploading,
              children: /* @__PURE__ */ jsxs("label", { htmlFor: "media-upload", className: "cursor-pointer", children: [
                isUploading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 mr-2" }),
                isUploading ? "Ingesting..." : "Ingest Asset"
              ] })
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-8", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:hidden mb-6", children: /* @__PURE__ */ jsx(
        "select",
        {
          value: activeFolder,
          onChange: (e) => setActiveFolder(e.target.value),
          className: "w-full h-12 bg-white border border-border/60 rounded-sm px-4 text-sm font-bold focus:border-on-surface outline-none shadow-sm",
          children: folders.map((folder) => /* @__PURE__ */ jsx("option", { value: folder.id, children: folder.label }, folder.id))
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex lg:flex-col space-y-4 lg:sticky lg:top-24 self-start", children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border/10 bg-muted/5", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-xs normal-case", children: "Search assets" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-on-surface transition-colors z-10" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Search your assets...",
                className: "pl-10 h-10 rounded-sm border-border/60 focus:ring-0 focus:border-on-surface transition-all bg-white text-xs",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value)
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border/10 bg-muted/5", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-xs normal-case", children: "Asset categories" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-2", children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: folders.map((folder) => /* @__PURE__ */ jsxs(
            Button,
            {
              variant: activeFolder === folder.id ? "primary" : "ghost",
              onClick: () => setActiveFolder(folder.id),
              className: cn(
                "w-full flex items-center justify-start gap-4 px-6 py-3 rounded-sm text-micro font-bold tracking-tight transition-all h-14 active:scale-95",
                activeFolder === folder.id ? "shadow-lg shadow-brand-green/20" : "text-on-surface/60 hover:bg-stone-50 hover:text-on-surface border border-transparent hover:border-stone-100"
              ),
              children: [
                /* @__PURE__ */ jsx(folder.icon, { className: cn("w-4 h-4", activeFolder === folder.id ? "text-white" : "text-muted-foreground/40") }),
                folder.label
              ]
            },
            folder.id
          )) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3 space-y-6", children: [
        /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm min-h-[500px] overflow-hidden bg-white", children: /* @__PURE__ */ jsx(CardContent, { className: "p-8", children: isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-[400px] space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 border-3 border-border/10 border-t-on-surface rounded-full animate-spin" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/40 text-sm font-medium", children: "Scanning repository..." })
        ] }) : filteredFiles.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-[400px] space-y-4 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-sm bg-muted/5 flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx(Image, { className: "w-8 h-8 text-muted-foreground/20" }) }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-lg", children: "No assets found" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm max-w-xs", children: searchQuery ? `No results match "${searchQuery}". Try a different term.` : `Your ${activeFolder.replace("-", " ")} folder is currently empty.` }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "primary",
              className: "mt-6 rounded-sm px-12 h-14 text-micro font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
              asChild: true,
              children: /* @__PURE__ */ jsx("label", { htmlFor: "media-upload", className: "cursor-pointer", children: "Initialize Repository" })
            }
          )
        ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4", children: filteredFiles.map((url, idx) => /* @__PURE__ */ jsxs("div", { className: "group relative", children: [
          /* @__PURE__ */ jsxs("div", { className: "aspect-square rounded-sm overflow-hidden bg-muted/5 border border-border/10 shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-1", children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: url,
                alt: "Media asset",
                className: "w-full h-full object-cover",
                decoding: "async",
                loading: "lazy"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "icon",
                  variant: "primary",
                  className: "h-10 w-10 rounded-sm shadow-2xl transition-all hover:scale-110 active:scale-95",
                  onClick: () => copyToClipboard(url),
                  children: copiedUrl === url ? /* @__PURE__ */ jsx(Check, { className: "w-5 h-5 text-white" }) : /* @__PURE__ */ jsx(Copy, { className: "w-5 h-5" })
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "icon",
                  variant: "gold",
                  className: "h-10 w-10 rounded-sm shadow-2xl transition-all hover:scale-110 active:scale-95",
                  asChild: true,
                  children: /* @__PURE__ */ jsx("a", { href: url, target: "_blank", rel: "noopener noreferrer", children: /* @__PURE__ */ jsx(ExternalLink, { className: "w-5 h-5" }) })
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "icon",
                  variant: "destructive",
                  className: "h-10 w-10 rounded-sm shadow-2xl transition-all hover:scale-110 active:scale-95",
                  onClick: () => setAssetToDelete(url),
                  children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 px-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-on-surface truncate", children: url.split("/").pop() }),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/40 font-medium normal-case mt-0.5", children: activeFolder.replace("-", " ") })
          ] })
        ] }, idx)) }) }) }),
        /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-on-surface text-white overflow-hidden p-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-sm bg-primary/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Filter, { className: "w-7 h-7 text-primary" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-lg", children: "Cloud storage intelligence" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-white/60 normal-case mt-1", children: "Real-time usage monitoring for Supabase storage buckets." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 max-w-md space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-tiny font-bold text-white/40 tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { children: "Capacity utilization" }),
              /* @__PURE__ */ jsx("span", { className: "text-primary", children: "12%" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-2 w-full bg-white/10 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-primary w-[12%] shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-micro font-bold text-white/20 tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { className: "normal-case", children: "0.6 GB consumed" }),
              /* @__PURE__ */ jsx("span", { className: "normal-case", children: "5.0 GB limit" })
            ] })
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      DeleteConfirmationModal,
      {
        isOpen: !!assetToDelete,
        onClose: () => setAssetToDelete(null),
        onConfirm: handleConfirmedDelete,
        title: "Move to Trash",
        description: "This asset will be moved to the trash vault. You can restore it within 30 days before it is permanently purged from storage.",
        itemName: assetToDelete?.split("/").pop() || "",
        isLoading,
        isPermanent: false
      }
    )
  ] });
}
export {
  MediaLibrary as default
};
