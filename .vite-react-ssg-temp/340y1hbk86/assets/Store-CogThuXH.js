import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Package, Truck, History, Plus, Loader2, AlertTriangle, TrendingUp, Search, ArrowUpDown, Edit3, Trash2, Download, Clock, ArrowRight, MapPin, Box, X, Trash } from "lucide-react";
import { D as DeleteConfirmationModal } from "./DeleteConfirmationModal-Cn3j2Cup.js";
import { b as BrandLine, B as Button, c as cn, C as Card, d as CardContent, j as CardHeader, v as CardTitle, I as Input, z as CardFooter, A as Label, x as contentService, a as adminService, l as logisticsService } from "../main.mjs";
import { toast } from "sonner";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-D9Fxht2W.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-DitN4BtB.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DF-S1mCR.js";
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
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-select";
function AdminStore() {
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("inventory");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await contentService.uploadImage(file, "product-images");
      if (url) {
        setSelectedProduct((prev) => {
          const currentImages = prev?.images || [];
          return {
            ...prev,
            images: [...currentImages, url],
            image: prev?.image || url
            // Set as primary if none
          };
        });
        toast.success("Product image added to gallery");
      } else {
        toast.error("Image upload failed");
      }
    } catch {
      toast.error("An error occurred during upload");
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };
  const removeImage = (url) => {
    setSelectedProduct((prev) => ({
      ...prev,
      images: prev?.images?.filter((img) => img !== url) || []
    }));
  };
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [inv, reqs, logs] = await Promise.all([
        adminService.getInventory(),
        adminService.getResourceRequests(),
        adminService.getLogisticsAudit()
      ]);
      setProducts(inv);
      setRequests(reqs);
      setAuditLogs(logs);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleOpenModal = (product) => {
    setSelectedProduct(product || {
      name: "",
      category: "Apparel",
      price: "GHS 0.00",
      stock: 0,
      status: "Stable",
      image: "👕",
      color: "#000000"
    });
    setIsModalOpen(true);
  };
  const handleSave = async () => {
    if (!selectedProduct?.name || !selectedProduct?.price) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSaving(true);
    let success = false;
    if ("id" in selectedProduct && selectedProduct.id) {
      success = await adminService.updateInventoryItem(selectedProduct.id, selectedProduct);
    } else {
      success = await adminService.addInventoryItem(selectedProduct);
    }
    if (success) {
      handleStoreAction(selectedProduct.id ? "UPDATE_INVENTORY" : "ADD_INVENTORY", selectedProduct.name);
      toast.success(selectedProduct.id ? "Product updated" : "Product added to movement catalog");
      setIsModalOpen(false);
      fetchData();
    } else {
      toast.error("Failed to save product");
    }
    setIsSaving(false);
  };
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(deleteConfirm.id);
    try {
      const success = await logisticsService.deleteInventoryItem(deleteConfirm.id);
      if (success) {
        handleStoreAction("TRASH_INVENTORY", deleteConfirm.name);
        toast.success(`"${deleteConfirm.name}" moved to trash vault`);
        fetchData();
      } else {
        toast.error("Failed to move item to trash");
      }
    } catch {
      toast.error("An error occurred during deletion");
    } finally {
      setIsDeleting(null);
      setDeleteConfirm(null);
    }
  };
  const handleStatusUpdate = async (id, status) => {
    const success = await adminService.updateResourceRequestStatus(id, status);
    if (success) {
      handleStoreAction("STATUS_UPDATE", `Request ${id.slice(0, 8)}`);
      toast.success(`Request marked as ${status}`);
      fetchData();
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const lowStockItems = products.filter((p) => p.stock < 50 && p.stock > 0);
  const categories = ["All", "Apparel", "Accessories", "Lifestyle", "Stationery", "Limited Edition"];
  const [sortConfig, setSortConfig] = useState(null);
  const handleSort = (key) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
  };
  const sortedAndFilteredProducts = [...products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  })].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aVal = a[key] ?? "";
    const bVal = b[key] ?? "";
    let aComp = aVal;
    let bComp = bVal;
    if (key === "price") {
      aComp = parseFloat(aVal.replace(/[^0-9.-]+/g, "")) || 0;
      bComp = parseFloat(bVal.replace(/[^0-9.-]+/g, "")) || 0;
    }
    if (aComp < bComp) return direction === "asc" ? -1 : 1;
    if (aComp > bComp) return direction === "asc" ? 1 : -1;
    return 0;
  });
  const handleStoreAction = (action, productName) => {
    adminService.logAction(action, `STORE/${productName}`, "Success");
    toast.success(`${action.replace("_", " ")}: ${productName} recorded in Audit Vault`);
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-8 h-8 text-on-surface" }),
          "Logistics and supply"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Movement inventory, merchandising, and regional distribution infrastructure." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex bg-muted/10 p-1 rounded-sm mr-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: activeTab === "inventory" ? "primary" : "ghost",
              onClick: () => setActiveTab("inventory"),
              className: cn(
                "px-5 py-2 text-micro font-bold rounded-sm transition-all h-auto",
                activeTab === "inventory" ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
              ),
              children: [
                /* @__PURE__ */ jsx(Package, { className: "w-3.5 h-3.5 mr-1.5 inline" }),
                " Inventory"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: activeTab === "requests" ? "primary" : "ghost",
              onClick: () => setActiveTab("requests"),
              className: cn(
                "px-5 py-2 text-micro font-bold rounded-sm transition-all h-auto",
                activeTab === "requests" ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
              ),
              children: [
                /* @__PURE__ */ jsx(Truck, { className: "w-3.5 h-3.5 mr-1.5 inline" }),
                " Requests"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: activeTab === "audit" ? "primary" : "ghost",
              onClick: () => setActiveTab("audit"),
              className: cn(
                "px-5 py-2 text-micro font-bold rounded-sm transition-all h-auto",
                activeTab === "audit" ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
              ),
              children: [
                /* @__PURE__ */ jsx(History, { className: "w-3.5 h-3.5 mr-1.5 inline" }),
                " Audit"
              ]
            }
          )
        ] }),
        activeTab === "inventory" && /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            size: "lg",
            onClick: () => handleOpenModal(),
            className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              " Add Item"
            ]
          }
        )
      ] })
    ] }),
    isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center min-h-[400px] gap-4 bg-muted/30 border border-dashed border-border/60", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-muted-foreground/60" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold tracking-tight text-muted-foreground/80", children: "Synchronizing movement vault..." })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      lowStockItems.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-accent/10 border-l-4 border-accent p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-500", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface", children: "Inventory alert" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface/90", children: "Some items require replenishment soon." })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "destructive",
            size: "sm",
            className: "h-10 px-8 text-micro font-bold tracking-tight transition-all shadow-sm rounded-sm active:scale-95",
            children: "Scan Alerts"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid-stats mb-12", style: { "--grid-min-width": "220px" }, children: [
        /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/60 uppercase tracking-widest", children: "Stock value" }),
            /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-primary/20" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-3xl font-bold text-on-surface mb-1", children: [
            "GHS ",
            products.reduce((acc, p) => acc + parseFloat(p.price.replace(/[^0-9.-]+/g, "")) * p.stock, 0).toLocaleString(void 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold tracking-tight text-muted-foreground/60 mt-1.5", children: "Movement asset valuation" })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/60 uppercase tracking-widest", children: "Active requests" }),
            /* @__PURE__ */ jsx(Truck, { className: "w-4 h-4 text-primary/20" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-on-surface mb-1", children: requests.filter((r) => r.status === "Pending").length }),
          /* @__PURE__ */ jsx("p", { className: cn(
            "text-tiny font-bold tracking-tight mt-1.5",
            requests.filter((r) => r.status === "Pending").length > 0 ? "text-accent" : "text-muted-foreground/60"
          ), children: requests.filter((r) => r.status === "Pending").length > 0 ? "Pending HQ approval" : "All requests processed" })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/60 uppercase tracking-widest", children: "Stock units" }),
            /* @__PURE__ */ jsx(Package, { className: "w-4 h-4 text-muted-foreground/10" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-on-surface mb-1", children: products.reduce((acc, p) => acc + p.stock, 0).toLocaleString() }),
          /* @__PURE__ */ jsxs("p", { className: "text-tiny font-bold tracking-tight text-muted-foreground/60 mt-1.5", children: [
            "Across ",
            products.length,
            " catalog items"
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { className: cn(
          "rounded-sm border-border/60 shadow-sm bg-white",
          lowStockItems.length > 0 ? "border-destructive/40" : ""
        ), children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsx("span", { className: cn(
              "text-micro font-bold uppercase tracking-widest",
              lowStockItems.length > 0 ? "text-destructive" : "text-muted-foreground/60"
            ), children: "Inventory alerts" }),
            /* @__PURE__ */ jsx(AlertTriangle, { className: cn("w-4 h-4", lowStockItems.length > 0 ? "text-destructive/20" : "text-muted-foreground/10") })
          ] }),
          /* @__PURE__ */ jsx("p", { className: cn(
            "text-3xl font-bold mb-1",
            lowStockItems.length > 0 ? "text-destructive" : "text-on-surface"
          ), children: lowStockItems.length }),
          /* @__PURE__ */ jsx("p", { className: cn(
            "text-tiny font-bold tracking-tight mt-1.5",
            lowStockItems.length > 0 ? "text-destructive/60" : "text-muted-foreground/60"
          ), children: lowStockItems.length > 0 ? "Replenishment required" : "Supply chain stable" })
        ] }) })
      ] }),
      activeTab === "inventory" ? /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-bold tracking-tight flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Package, { className: "w-4 h-4 text-on-surface" }),
            "Inventory"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center bg-muted/10 p-1 rounded-sm overflow-x-auto no-scrollbar", children: categories.map((cat) => /* @__PURE__ */ jsx(
            Button,
            {
              variant: activeCategory === cat ? "primary" : "ghost",
              onClick: () => setActiveCategory(cat),
              className: cn(
                "px-4 py-1.5 text-micro font-bold tracking-tight transition-all h-auto",
                activeCategory === cat ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
              ),
              children: cat
            },
            cat
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "relative w-full md:w-64", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Search products...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 h-9 text-xs rounded-sm border-border/60"
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto hidden md:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/40 bg-muted/30", children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Product" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Category" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight cursor-pointer hover:text-on-surface/80 transition-colors", onClick: () => handleSort("price"), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Price ",
                /* @__PURE__ */ jsx(ArrowUpDown, { className: "w-3 h-3" })
              ] }) }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight text-center cursor-pointer hover:text-on-surface/80 transition-colors", onClick: () => handleSort("stock"), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
                "In stock ",
                /* @__PURE__ */ jsx(ArrowUpDown, { className: "w-3 h-3" })
              ] }) }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight cursor-pointer hover:text-on-surface/80 transition-colors", onClick: () => handleSort("status"), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Status ",
                /* @__PURE__ */ jsx(ArrowUpDown, { className: "w-3 h-3" })
              ] }) }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: sortedAndFilteredProducts.map((product) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/5 transition-colors group", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-muted/10 rounded-sm flex items-center justify-center text-xl overflow-hidden", children: product.image?.startsWith("http") ? /* @__PURE__ */ jsx("img", { src: product.image, alt: product.name, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx("span", { className: "grayscale group-hover:grayscale-0 transition-all", children: product.image }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface tracking-tight", children: product.name }),
                  /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/80 mt-0.5 normal-case", children: [
                    "#ITM-",
                    product.id.substring(0, 6)
                  ] })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface/80", children: product.category }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface", children: product.price }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-center", children: /* @__PURE__ */ jsx("span", { className: cn(
                "text-xs font-bold",
                product.stock === 0 ? "text-brand-red" : product.stock < 50 ? "text-accent" : "text-on-surface"
              ), children: product.stock.toLocaleString() }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full", style: { backgroundColor: product.color } }),
                /* @__PURE__ */ jsx("span", { className: cn(
                  "px-2.5 py-1 text-micro font-bold tracking-tight border rounded-md",
                  product.status === "Critical" ? "bg-destructive/10 text-destructive border-destructive/20" : product.status === "Low Stock" ? "bg-accent/10 text-accent border-accent/20" : product.status === "Processing" ? "bg-muted/10 text-on-surface border-border/60" : "bg-primary/10 text-primary border-primary/20"
                ), children: product.status })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "gold",
                    size: "icon",
                    className: "w-10 h-10 rounded-sm transition-all shadow-sm active:scale-95",
                    onClick: () => handleOpenModal(product),
                    children: /* @__PURE__ */ jsx(Edit3, { className: "w-5 h-5" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "destructive",
                    size: "icon",
                    className: "w-10 h-10 rounded-sm transition-all shadow-sm active:scale-95",
                    disabled: isDeleting === product.id,
                    onClick: () => setDeleteConfirm({ id: product.id, name: product.name }),
                    children: isDeleting === product.id ? /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" })
                  }
                )
              ] }) })
            ] }, product.id)) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "md:hidden divide-y divide-border/40", children: sortedAndFilteredProducts.map((product) => /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-muted/10 rounded-sm flex items-center justify-center text-2xl border border-border/60 overflow-hidden shrink-0", children: product.image?.startsWith("http") ? /* @__PURE__ */ jsx("img", { src: product.image, alt: product.name, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx("span", { children: product.image }) }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-on-surface tracking-tight", children: product.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight normal-case", children: [
                    "#ITM-",
                    product.id.substring(0, 6)
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: cn(
                "px-2.5 py-1 text-micro font-bold tracking-tight border rounded-full",
                product.status === "Critical" ? "bg-destructive/10 text-destructive border-destructive/20" : product.status === "Low Stock" ? "bg-accent/10 text-accent border-accent/20" : "bg-primary/10 text-primary border-primary/20"
              ), children: product.status })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-muted/10 rounded-sm border border-border/40", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight mb-1", children: "Price" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-on-surface", children: product.price })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-muted/10 rounded-sm border border-border/40", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight mb-1", children: "Stock" }),
                /* @__PURE__ */ jsx("p", { className: cn(
                  "text-sm font-bold",
                  product.stock < 50 ? "text-accent" : "text-on-surface"
                ), children: product.stock.toLocaleString() })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "gold",
                  className: "flex-1 h-12 rounded-sm text-micro font-bold tracking-tight transition-all shadow-sm active:scale-95",
                  onClick: () => handleOpenModal(product),
                  children: [
                    /* @__PURE__ */ jsx(Edit3, { className: "w-4 h-4 mr-2" }),
                    " Edit Asset"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "destructive",
                  size: "icon",
                  className: "h-12 w-12 rounded-sm transition-all shadow-sm active:scale-95",
                  onClick: () => setDeleteConfirm({ id: product.id, name: product.name }),
                  children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" })
                }
              )
            ] })
          ] }, product.id)) })
        ] }),
        /* @__PURE__ */ jsxs(CardFooter, { className: "px-6 py-4 bg-muted/30 border-t border-border/40 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]" }),
              /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: [
                "Stable: ",
                products.filter((p) => p.status === "Stable").length
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]" }),
              /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: [
                "Low stock: ",
                products.filter((p) => p.status === "Low Stock").length
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(var(--destructive-rgb),0.4)]" }),
              /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: [
                "Critical: ",
                products.filter((p) => p.status === "Critical").length
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-micro font-bold text-muted-foreground/80 italic", children: [
            "Showing ",
            sortedAndFilteredProducts.length,
            " movement assets in the current view"
          ] })
        ] })
      ] }) : activeTab === "requests" ? /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/30", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-bold tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Truck, { className: "w-4 h-4 text-primary" }),
          "Regional resource requests"
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto hidden md:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/40 bg-muted/30", children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Region" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Items" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Requested" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Priority" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight text-right", children: "Action" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: requests.map((req) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/5 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface tracking-tight", children: req.region }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80 mt-0.5", children: req.constituency || "Regional HQ" })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1", children: req.items.map((item) => /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-on-surface/80", children: [
                item.quantity,
                "x ",
                item.productName || "Unknown Product"
              ] }, item.id)) }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-muted-foreground/80", children: new Date(req.createdAt).toLocaleDateString() }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("span", { className: cn(
                "px-2 py-0.5 text-micro font-bold tracking-tight rounded-full",
                req.priority === "Urgent" ? "bg-destructive/10 text-destructive" : req.priority === "High" ? "bg-accent/10 text-accent" : "bg-muted/10 text-on-surface/80"
              ), children: req.priority }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("span", { className: cn(
                "px-2.5 py-1 text-micro font-bold tracking-tight border rounded-md",
                req.status === "Pending" ? "bg-accent/10 text-accent border-accent/20" : req.status === "Approved" ? "bg-blue-50 text-blue-700 border-blue-100" : req.status === "Dispatched" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : req.status === "Delivered" ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"
              ), children: req.status }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-right", children: /* @__PURE__ */ jsxs(Select, { onValueChange: (v) => handleStatusUpdate(req.id, v), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "w-32 h-8 text-micro font-bold tracking-tight rounded-sm border-border/60", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Update Status" }) }),
                /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-sm", children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "Approved", children: "Approve" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Dispatched", children: "Dispatch" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Delivered", children: "Deliver" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Rejected", children: "Reject" })
                ] })
              ] }) })
            ] }, req.id)) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "md:hidden divide-y divide-border/40", children: requests.map((req) => /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-on-surface tracking-tight", children: req.region }),
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case tracking-tight", children: req.constituency || "Regional HQ" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: cn(
                "px-2 py-0.5 text-micro font-bold tracking-tight rounded-full",
                req.priority === "Urgent" ? "bg-brand-red/10 text-brand-red" : "bg-muted/10 text-on-surface/80"
              ), children: req.priority })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case tracking-tight", children: "Requested items" }),
              /* @__PURE__ */ jsx("div", { className: "p-4 bg-muted/10 rounded-sm border border-border/40 space-y-2", children: req.items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-on-surface", children: item.productName }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-muted-foreground/80", children: [
                  "x",
                  item.quantity
                ] })
              ] }, item.id)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case tracking-tight", children: "Status" }),
                /* @__PURE__ */ jsx("div", { className: cn(
                  "px-2.5 py-1 text-micro font-bold tracking-tight border rounded-md",
                  req.status === "Pending" ? "bg-accent/10 text-accent border-accent/20" : "bg-primary/10 text-primary border-primary/20"
                ), children: req.status })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right space-y-1", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 normal-case tracking-tight", children: "Date" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface", children: new Date(req.createdAt).toLocaleDateString() })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsxs(Select, { onValueChange: (v) => handleStatusUpdate(req.id, v), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full h-11 text-xs font-bold tracking-tight rounded-sm border-border/60", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Update Request Status" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-sm", children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "Approved", children: "Approve" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "Dispatched", children: "Dispatch" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "Delivered", children: "Deliver" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "Rejected", children: "Reject" })
              ] })
            ] }) })
          ] }, req.id)) }),
          requests.length === 0 && /* @__PURE__ */ jsx("div", { className: "p-16 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
            /* @__PURE__ */ jsx(Truck, { className: "w-8 h-8 text-border/60" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/80 text-xs font-bold", children: "No active resource requests." })
          ] }) })
        ] })
      ] }) : /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-bold tracking-tight flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(History, { className: "w-4 h-4 text-muted-foreground/80" }),
            "Audit log"
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "default",
              size: "lg",
              className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95",
              disabled: auditLogs.length === 0,
              onClick: () => {
                try {
                  const headers = ["Timestamp", "Action", "Resource", "Quantity Change", "Source", "Destination"];
                  const csvData = auditLogs.map((log) => [
                    new Date(log.timestamp).toLocaleString(),
                    log.action,
                    `"${log.productName || "Unknown"}"`,
                    log.quantityChange,
                    `"${log.sourceLocation}"`,
                    `"${log.destinationLocation || "Internal"}"`
                  ]);
                  const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `audit_log_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success(`Exported ${auditLogs.length} audit records.`);
                } catch {
                  toast.error("Failed to export audit log.");
                }
              },
              children: [
                /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
                "Export operational metrics"
              ]
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto hidden md:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/40 bg-muted/30", children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Timestamp" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Action" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Resource" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Change" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Location" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: auditLogs.map((log) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/5 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5 whitespace-nowrap", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-muted-foreground/80", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold", children: new Date(log.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("span", { className: cn(
                "px-2 py-0.5 text-micro font-bold tracking-tight border rounded-md",
                log.action === "DISPATCHED" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : log.action === "REPLENISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-muted/10 text-on-surface/80 border-border/40"
              ), children: log.action }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface tracking-tight", children: log.productName || "Unknown Asset" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("span", { className: cn(
                "text-xs font-bold",
                log.quantityChange > 0 ? "text-[var(--brand-green)]" : "text-[var(--brand-red)]"
              ), children: [
                log.quantityChange > 0 ? "+" : "",
                log.quantityChange
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-micro font-bold text-muted-foreground/80", children: [
                /* @__PURE__ */ jsx("span", { children: log.sourceLocation }),
                /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" }),
                /* @__PURE__ */ jsx("span", { children: log.destinationLocation || "Internal" })
              ] }) })
            ] }, log.id)) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "md:hidden divide-y divide-border/40", children: auditLogs.map((log) => /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-muted-foreground/80", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold", children: new Date(log.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: cn(
                "px-2 py-0.5 text-micro font-bold tracking-tight border rounded-md",
                log.action === "DISPATCHED" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : log.action === "REPLENISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-muted/5 text-on-surface/80 border-border/40"
              ), children: log.action })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-on-surface tracking-tight", children: log.productName || "Unknown Asset" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-micro font-bold text-muted-foreground/80 mt-2", children: [
                  /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
                  /* @__PURE__ */ jsx("span", { children: log.sourceLocation }),
                  /* @__PURE__ */ jsx(ArrowRight, { className: "w-2.5 h-2.5" }),
                  /* @__PURE__ */ jsx("span", { children: log.destinationLocation || "Internal" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: cn(
                "text-lg font-bold",
                log.quantityChange > 0 ? "text-emerald-600" : "text-red-600"
              ), children: [
                log.quantityChange > 0 ? "+" : "",
                log.quantityChange
              ] })
            ] })
          ] }, log.id)) }),
          auditLogs.length === 0 && /* @__PURE__ */ jsx("div", { className: "p-16 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
            /* @__PURE__ */ jsx(History, { className: "w-8 h-8 text-border/60" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/80 text-xs font-bold", children: "No audit entries recorded." })
          ] }) })
        ] })
      ] }),
      requests.length > 0 && (() => {
        const total = requests.length;
        const delivered = requests.filter((r) => r.status === "Delivered").length;
        const processing = requests.filter((r) => r.status === "Approved" || r.status === "Dispatched").length;
        const rejected = requests.filter((r) => r.status === "Rejected").length;
        const deliveredPct = Math.round(delivered / total * 100);
        const processingPct = Math.round(processing / total * 100);
        const rejectedPct = Math.round(rejected / total * 100);
        return /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/30", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-bold tracking-tight flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Box, { className: "w-4 h-4 text-on-surface" }),
              "Fulfillment intelligence"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Live metrics" })
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-6 space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-micro font-bold tracking-tight", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/80", children: "Delivered" }),
                /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
                  deliveredPct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full h-1.5 bg-muted/10 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-emerald-500 rounded-full transition-all duration-1000", style: { width: `${deliveredPct}%` } }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-micro font-bold tracking-tight", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/80", children: "In progress" }),
                /* @__PURE__ */ jsxs("span", { className: "text-amber-600", children: [
                  processingPct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full h-1.5 bg-muted/10 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-amber-400 rounded-full transition-all duration-1000", style: { width: `${processingPct}%` } }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-micro font-bold tracking-tight", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/80", children: "Rejected" }),
                /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                  rejectedPct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full h-1.5 bg-muted/10 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-red-400 rounded-full transition-all duration-1000", style: { width: `${rejectedPct}%` } }) })
            ] })
          ] }) })
        ] });
      })(),
      /* @__PURE__ */ jsx("div", { className: "pt-8 mt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 pb-12", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80", children: "© 2026 The Base Movement" }) })
    ] }),
    /* @__PURE__ */ jsx(
      DeleteConfirmationModal,
      {
        isOpen: !!deleteConfirm,
        onClose: () => setDeleteConfirm(null),
        onConfirm: handleDelete,
        title: "Move to trash",
        description: "This product will be moved to the trash vault. You can restore it within 30 days before it is permanently removed from the catalog.",
        itemName: deleteConfirm?.name || "",
        isLoading: !!isDeleting,
        isPermanent: false
      }
    ),
    /* @__PURE__ */ jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[500px] rounded-sm border-border/60", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl font-bold tracking-tight", children: selectedProduct?.id ? "Edit inventory item" : "New movement gear" }),
        /* @__PURE__ */ jsx(DialogDescription, { className: "text-xs font-bold text-muted-foreground/80", children: "Configure product metadata and logistical constraints." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6 py-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 items-center gap-4", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-right text-micro font-bold tracking-tight", children: "Name" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: selectedProduct?.name || "",
              onChange: (e) => setSelectedProduct((prev) => ({ ...prev, name: e.target.value })),
              className: "col-span-3 h-10 rounded-sm border-border/60 text-xs"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 items-center gap-4", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-right text-micro font-bold tracking-tight", children: "Category" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: selectedProduct?.category,
              onValueChange: (v) => setSelectedProduct((prev) => ({ ...prev, category: v })),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "col-span-3 h-10 rounded-sm border-border/60 text-xs font-bold", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select category" }) }),
                /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-sm", children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "Apparel", children: "Apparel" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Accessories", children: "Accessories" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Print", children: "Print material" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Digital", children: "Digital goods" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 items-center gap-4", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-right text-micro font-bold tracking-tight", children: "Price" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: selectedProduct?.price || "",
                onChange: (e) => setSelectedProduct((prev) => ({ ...prev, price: e.target.value })),
                className: "h-10 rounded-sm border-border/60 text-xs font-bold"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 items-center gap-4", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-right text-micro font-bold tracking-tight", children: "Stock" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: selectedProduct?.stock || 0,
                onChange: (e) => setSelectedProduct((prev) => ({ ...prev, stock: parseInt(e.target.value) })),
                className: "h-10 rounded-sm border-border/60 text-xs font-bold"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 items-start gap-4", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-right text-micro font-bold tracking-tight mt-3", children: "Summary" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: selectedProduct?.description || "",
              onChange: (e) => setSelectedProduct((prev) => ({ ...prev, description: e.target.value })),
              placeholder: "Short patriotic summary...",
              className: "col-span-3 min-h-[80px] bg-white rounded-sm border border-border/60 p-3 text-xs focus:ring-1 focus:ring-brand-green outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 items-start gap-4", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-right text-micro font-bold tracking-tight mt-3", children: "Full details" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: selectedProduct?.longDescription || "",
              onChange: (e) => setSelectedProduct((prev) => ({ ...prev, longDescription: e.target.value })),
              placeholder: "Complete product specs and movement significance...",
              className: "col-span-3 min-h-[120px] bg-white rounded-sm border border-border/60 p-3 text-xs focus:ring-1 focus:ring-brand-green outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 items-start gap-4", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-right text-micro font-bold tracking-tight mt-3", children: "Product gallery" }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-3 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-2", children: [
              (selectedProduct?.images || []).map((url, idx) => /* @__PURE__ */ jsxs("div", { className: "relative aspect-square rounded-sm overflow-hidden border border-border/60 bg-muted/10 group", children: [
                /* @__PURE__ */ jsx("img", { src: url, alt: `Product ${idx}`, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => removeImage(url),
                    className: "absolute top-1 right-1 w-5 h-5 bg-on-surface/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                    children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
                  }
                )
              ] }, idx)),
              /* @__PURE__ */ jsxs("label", { className: "aspect-square rounded-sm border border-dashed border-muted-foreground/60 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/10 transition-colors", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    className: "hidden",
                    accept: "image/*",
                    onChange: handleImageUpload,
                    disabled: isUploadingImage
                  }
                ),
                isUploadingImage ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-muted-foreground/80" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 text-muted-foreground/80" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-muted-foreground/80", children: "Add image" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-muted-foreground/80 capitalize tracking-tight", children: "Icon fallback" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: selectedProduct?.image?.startsWith("http") ? "" : selectedProduct?.image || "",
                  onChange: (e) => setSelectedProduct((prev) => ({ ...prev, image: e.target.value })),
                  placeholder: "👕, 🧢, 🎒",
                  className: "h-9 rounded-sm border-border/60 text-lg text-center w-24"
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setIsModalOpen(false), className: "rounded-sm text-micro font-bold capitalize tracking-tight h-11 px-8 hover:bg-muted/10 transition-all active:scale-95", children: "Cancel" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleSave,
            disabled: isSaving,
            className: "rounded-sm text-micro font-bold capitalize tracking-tight bg-on-surface text-white hover:bg-on-surface/90 h-11 px-10 min-w-[160px] shadow-lg transition-all hover:scale-[1.02] active:scale-95",
            children: isSaving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : "Confirm changes"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteConfirm, onOpenChange: (open) => !open && setDeleteConfirm(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: "rounded-sm border-border/60", children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxs(AlertDialogTitle, { className: "text-xl font-bold tracking-tight flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600", children: /* @__PURE__ */ jsx(Trash, { className: "w-5 h-5" }) }),
          "Remove item?"
        ] }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { className: "text-xs font-bold text-muted-foreground/80 leading-relaxed", children: [
          "Are you sure you want to remove ",
          /* @__PURE__ */ jsxs("span", { className: "text-on-surface", children: [
            '"',
            deleteConfirm?.name,
            '"'
          ] }),
          " from the movement catalog? This action will archive all associated inventory data."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { className: "gap-2 sm:gap-0 mt-4", children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { className: "rounded-sm text-micro font-bold tracking-tight h-10 px-6 border-border/60", children: "Cancel" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: handleDelete,
            className: "rounded-sm text-micro font-bold tracking-tight bg-red-600 text-white hover:bg-red-700 h-10 px-8 active:scale-95",
            children: "Confirm removal"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  AdminStore as default
};
