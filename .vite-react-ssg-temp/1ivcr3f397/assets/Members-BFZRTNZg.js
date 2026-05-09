import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Users, Download, Plus, CheckCircle2, Clock, Globe2, Search, MapPin, ShieldCheck, RotateCcw, UserCheck, Trash2, X, ArrowUpDown, AlertCircle, Mail, Phone, History, CheckCircle, MoreHorizontal, Lock, FileText } from "lucide-react";
import { t as useToast, b as BrandLine, B as Button, C as Card, d as CardContent, c as cn, I as Input, a as adminService, M as MembershipCard } from "../main.mjs";
import { R as RegistrationForm } from "./RegistrationForm-DA4whMaN.js";
import { D as Dialog, a as DialogContent } from "./dialog-D9Fxht2W.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
function MembersList() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("search") || "";
    }
    return "";
  });
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const cardRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState(/* @__PURE__ */ new Set());
  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      const data = await adminService.getMembers();
      setMembers(data);
      setIsLoading(false);
    };
    fetchMembers();
  }, []);
  const [viewingAuditLogs, setViewingAuditLogs] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditTargetMember, setAuditTargetMember] = useState(null);
  const handleViewAudit = async (member) => {
    setAuditTargetMember(member.name);
    const logs = await adminService.getAuditLogsForResource(`MEMBERS/${member.id}`);
    setViewingAuditLogs(logs);
    setIsAuditModalOpen(true);
  };
  const handleVerify = async (id, name) => {
    if (!adminService.can("VERIFY_MEMBER", "MEMBERS")) {
      toast({ title: "Permission denied", description: "You do not have authorization to verify members.", variant: "destructive" });
      return;
    }
    if (window.confirm(`Are you sure you want to verify and admit ${name} into the movement?`)) {
      const success = await adminService.verifyMember(id, true, "Administrative Approval");
      if (success) {
        toast({ title: "Member verified", description: `${name} has been successfully admitted.` });
        const data = await adminService.getMembers();
        setMembers(data);
      }
    }
  };
  const handlePrint = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 4, useCORS: true, backgroundColor: "#ffffff", logging: false });
      const imgData = canvas.toDataURL("image/png");
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) return;
      iframeDoc.write(`
        <html>
          <head>
            <title>THE BASE - Official Membership Card</title>
            <style>
              @page { size: 85.6mm 53.98mm; margin: 0; }
              body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; -webkit-print-color-adjust: exact; color-adjust: exact; }
              img { width: 85.6mm; height: 53.98mm; display: block; image-rendering: -webkit-optimize-contrast; }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="setTimeout(() = /> { window.print(); }, 200);" />
          </body>
        </html>
      `);
      iframeDoc.close();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 6e4);
    } catch (error) {
      console.error("Error printing card:", error);
    }
  };
  const handleDownload = async () => {
    if (!cardRef.current || !selectedMember) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [85.6, 54] });
      pdf.addImage(imgData, "PNG", 0, 0, 85.6, 54);
      pdf.save(`THE-BASE-CARD-${selectedMember.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };
  const handleExport = async () => {
    if (members.length === 0) return;
    setIsExporting(true);
    toast({
      title: "Preparing export",
      description: "Generating membership directory records..."
    });
    try {
      const headers = ["ID", "Name", "Email", "Phone", "Region", "Constituency", "Status", "Joined", "Type", "Chapter", "Country"];
      const rows = members.map((m) => [
        m.id,
        m.name,
        m.email,
        m.phone,
        m.region,
        m.constituency,
        m.status,
        m.joined,
        m.type,
        m.chapter,
        m.country
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `the-base-members-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        setIsExporting(false);
        toast({
          title: "Export complete",
          description: "Membership directory successfully downloaded."
        });
      }, 1e3);
    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
      toast({
        title: "Export failed",
        description: "An error occurred while generating the directory.",
        variant: "destructive"
      });
    }
  };
  const handleAddMember = () => {
    setIsAdding(true);
  };
  const handleAddSuccess = () => {
    setIsAdding(false);
    toast({
      title: "Member registered",
      description: "Identity successfully registered in the database.",
      variant: "default"
    });
  };
  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase();
    return m.name?.toLowerCase().includes(term) || m.id?.toLowerCase().includes(term) || m.email?.toLowerCase().includes(term) || m.phone?.toLowerCase().includes(term) || m.region?.toLowerCase().includes(term) || m.constituency?.toLowerCase().includes(term);
  });
  const handleBulkVerify = async () => {
    if (!adminService.can("VERIFY_MEMBER", "MEMBERS")) {
      toast({ title: "Permission denied", description: "You lack the authority for bulk verification.", variant: "destructive" });
      return;
    }
    const count = selectedIds.size;
    if (window.confirm(`Are you sure you want to verify and admit all ${count} selected members?`)) {
      let successCount = 0;
      for (const id of selectedIds) {
        const success = await adminService.verifyMember(id, true, "Bulk Administrative Approval");
        if (success) successCount++;
      }
      toast({
        title: "Bulk verification complete",
        description: `Successfully admitted ${successCount} members into the movement.`
      });
      setSelectedIds(/* @__PURE__ */ new Set());
      const data = await adminService.getMembers();
      setMembers(data);
    }
  };
  const handleBulkDelete = async () => {
    if (!adminService.can("DELETE_MEMBER", "MEMBERS")) {
      toast({ title: "Permission denied", description: "You lack the authority for member removal.", variant: "destructive" });
      return;
    }
    if (window.confirm(`Are you sure you want to permanently remove ${selectedIds.size} records from the database? This cannot be undone.`)) {
      toast({ title: "Removing records", description: "Processing secure deletion..." });
      let successCount = 0;
      for (const id of selectedIds) {
        const success = await adminService.deleteMember(id);
        if (success) successCount++;
      }
      toast({
        title: "Removal complete",
        description: `Successfully removed ${successCount} records from the database.`
      });
      setSelectedIds(/* @__PURE__ */ new Set());
      const data = await adminService.getMembers();
      setMembers(data);
    }
  };
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };
  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedMembers.length) {
      setSelectedIds(/* @__PURE__ */ new Set());
    } else {
      setSelectedIds(new Set(paginatedMembers.map((m) => m.id)));
    }
  };
  const handleToggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };
  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === "Active").length,
    pending: members.filter((m) => m.status === "Pending").length,
    regions: new Set(members.filter((m) => m.region).map((m) => m.region)).size
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(Users, { className: "w-8 h-8 text-on-surface" }),
          "Member directory"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Movement registration database, identity verification, and regional deployment oversight." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            size: "lg",
            className: "rounded-sm text-micro font-bold tracking-tight px-10 border-border/40 h-12 shadow-sm transition-all active:scale-95",
            onClick: handleExport,
            disabled: isExporting || members.length === 0,
            children: [
              /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
              isExporting ? "Ingesting records..." : "Export intelligence"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            size: "lg",
            onClick: handleAddMember,
            className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              "Add Member"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid-stats mb-8", style: { "--grid-min-width": "220px" }, children: [
      { label: "Total members", value: stats.total, icon: Users, color: "text-on-surface/80", bg: "bg-muted/10" },
      { label: "Active status", value: stats.active, icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
      { label: "Pending verification", value: stats.pending, icon: Clock, color: "text-accent", bg: "bg-accent/10" },
      { label: "Regions represented", value: stats.regions, icon: Globe2, color: "text-primary", bg: "bg-primary/5" }
    ].map((stat, i) => /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 shadow-sm overflow-hidden group hover:border-border/60 transition-all bg-white/80 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5 h-full flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: cn("w-12 h-12 rounded-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", stat.bg), children: /* @__PURE__ */ jsx(stat.icon, { className: cn("w-6 h-6", stat.color) }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flow", style: { "--flow-space": "0.1rem" }, children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 m-0 tracking-tight", children: stat.label }),
        isLoading ? /* @__PURE__ */ jsx("div", { className: "h-7 w-16 bg-muted/20 animate-pulse rounded-sm mt-1" }) : /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-on-surface leading-tight m-0", children: stat.value.toLocaleString() })
      ] })
    ] }) }, i)) }),
    /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 shadow-sm overflow-hidden bg-white", children: /* @__PURE__ */ jsx(CardContent, { className: "p-2 md:p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-2 items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1 w-full", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search by name, ID, phone, profession, region...",
            className: "pl-12 h-12 rounded-sm border-none bg-muted/10 focus:bg-white focus:ring-2 focus:ring-on-surface/20 transition-all text-sm font-medium",
            value: searchTerm,
            onChange: (e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 w-full md:w-auto p-1 bg-muted/10 md:bg-transparent rounded-sm md:rounded-none", children: [
        /* @__PURE__ */ jsx("div", { className: "h-8 w-px bg-border/40 mx-2 hidden md:block" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col w-full md:w-auto", children: [
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80 px-2 md:hidden mb-1", children: "Quick Filters" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-2", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "ghost",
                className: "flex-1 md:flex-none h-10 px-6 rounded-sm text-micro font-bold tracking-tight text-on-surface/60 hover:text-on-surface hover:bg-stone-50 transition-all border border-border/40 md:border-none active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 mr-2 text-muted-foreground/40" }),
                  " Origins"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "ghost",
                className: "flex-1 md:flex-none h-10 px-6 rounded-sm text-micro font-bold tracking-tight text-on-surface/60 hover:text-on-surface hover:bg-stone-50 transition-all border border-border/40 md:border-none active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 mr-2 text-muted-foreground/40" }),
                  " Statuses"
                ]
              }
            )
          ] })
        ] }),
        searchTerm !== "" && /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            className: "h-10 px-4 rounded-sm text-destructive hover:bg-destructive/10 text-micro font-bold tracking-tight transition-all active:scale-95",
            onClick: () => {
              setSearchTerm("");
              setCurrentPage(1);
            },
            children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4 mr-2" }),
              " Reset filters"
            ]
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm overflow-hidden bg-white", children: [
      selectedIds.size > 0 && /* @__PURE__ */ jsxs("div", { className: "px-6 py-3 bg-on-surface text-white flex items-center justify-between animate-in slide-in-from-top-2 duration-300", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold tracking-tight text-white/90", children: [
            selectedIds.size,
            " members selected"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-white/20" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "ghost",
                onClick: handleBulkVerify,
                className: "h-10 px-6 text-micro font-bold tracking-tight text-white hover:bg-white/10 active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(UserCheck, { className: "w-4 h-4 mr-2 text-primary" }),
                  " Verify"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(Button, { variant: "ghost", className: "h-9 px-4 text-micro font-bold tracking-tight text-white hover:bg-white/10", children: [
              /* @__PURE__ */ jsx(Globe2, { className: "w-4 h-4 mr-2 text-primary" }),
              " Assign"
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "ghost",
                onClick: handleBulkDelete,
                className: "h-10 px-6 text-micro font-bold tracking-tight text-red-400 hover:bg-red-500/10 active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                  " Purge"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setSelectedIds(/* @__PURE__ */ new Set()), className: "h-8 w-8 p-0 text-muted-foreground/80 hover:text-white", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/30 border-b border-border/40", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 w-10", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                className: "rounded border-border/40 text-on-surface focus:ring-on-surface/20",
                checked: selectedIds.size === paginatedMembers.length && paginatedMembers.length > 0,
                onChange: handleToggleSelectAll
              }
            ) }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", className: "flex items-center gap-2 text-micro font-bold text-muted-foreground/80 tracking-tight group hover:bg-transparent p-0 h-auto", children: [
              "Member details ",
              /* @__PURE__ */ jsx(ArrowUpDown, { className: "w-3 h-3 group-hover:text-on-surface transition-colors" })
            ] }) }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Contact info" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Location details" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/40", children: isLoading ? Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsxs("tr", { className: "animate-pulse", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-muted/10 shrink-0" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 flex-1", children: [
                /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/10 w-3/4" }),
                /* @__PURE__ */ jsx("div", { className: "h-3 bg-muted/10 w-1/2" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/20 w-full rounded" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/20 w-full rounded" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "h-6 bg-muted/20 w-16 rounded" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-right", children: /* @__PURE__ */ jsx("div", { className: "h-8 w-8 bg-muted/20 ml-auto rounded" }) })
          ] }, i)) : paginatedMembers.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-20", children: members.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center max-w-sm mx-auto", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-sm bg-muted/30 flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Users, { className: "w-8 h-8 text-muted-foreground/40" }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-on-surface tracking-tight", children: "No members yet" }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1 font-medium", children: "Create your first member record to get started." }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "primary",
                size: "lg",
                className: "mt-6 rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
                onClick: handleAddMember,
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
                  "Add first member"
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center max-w-sm mx-auto", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-sm bg-accent/10 flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(AlertCircle, { className: "w-8 h-8 text-accent" }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-on-surface tracking-tight", children: "No results found" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground/80 font-medium mt-2 leading-relaxed", children: [
              `We couldn't find any members matching "`,
              searchTerm,
              '". Try adjusting your filters or search terms.'
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "default",
                onClick: () => {
                  setSearchTerm("");
                  setCurrentPage(1);
                },
                className: "mt-6 h-11 px-10 rounded-sm text-micro tracking-tight font-bold border-border/40 transition-all active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4 mr-2" }),
                  " Clear filters"
                ]
              }
            )
          ] }) }) }) : paginatedMembers.map((member) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition-all group", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                className: "rounded border-border/40 text-on-surface focus:ring-on-surface/20",
                checked: selectedIds.has(member.id),
                onChange: () => handleToggleSelect(member.id)
              }
            ) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-muted/30 text-on-surface/80 flex items-center justify-center font-bold text-xs rounded-sm shadow-sm overflow-hidden shrink-0 border border-border/60 transition-transform group-hover:scale-105", children: member.avatarUrl ? /* @__PURE__ */ jsx("img", { src: member.avatarUrl, alt: member.name, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : member.name.split(" ").map((n) => n[0]).join("") }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-on-surface leading-tight group-hover:text-destructive transition-colors", children: member.name }),
                /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mt-1", children: /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: [
                  "ID: ",
                  member.id.substring(0, 8)
                ] }) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-on-surface/80 font-medium", children: [
                /* @__PURE__ */ jsx(Mail, { className: "w-3 h-3 text-muted-foreground/40" }),
                " ",
                member.email
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-on-surface/80 font-medium", children: [
                /* @__PURE__ */ jsx(Phone, { className: "w-3 h-3 text-muted-foreground/40" }),
                " ",
                member.phone
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface", children: member.region }),
              /* @__PURE__ */ jsx("p", { className: "text-micro font-medium text-muted-foreground/80 tracking-tight mt-0.5", children: member.constituency })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("span", { className: cn(
              "px-3 py-1 text-micro font-bold tracking-tight rounded-full border inline-flex items-center gap-1.5",
              member.status === "Active" ? "bg-primary/10 text-primary border-primary/20" : member.status === "Pending" ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"
            ), children: [
              /* @__PURE__ */ jsx("div", { className: cn(
                "w-1 h-1 rounded-full",
                member.status === "Active" ? "bg-primary" : member.status === "Pending" ? "bg-accent" : "bg-destructive"
              ) }),
              member.status
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "w-10 h-10 text-muted-foreground/80 hover:text-on-surface hover:bg-stone-50 hover:shadow-sm transition-all active:scale-95",
                  title: "Audit History",
                  onClick: () => handleViewAudit(member),
                  children: /* @__PURE__ */ jsx(History, { className: "w-5 h-5" })
                }
              ),
              member.status === "Pending" && adminService.can("VERIFY_MEMBER", "MEMBERS") && /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "w-10 h-10 text-accent hover:text-primary hover:bg-primary/10 transition-all active:scale-95",
                  title: "Quick Verify",
                  onClick: () => handleVerify(member.id, member.name),
                  children: /* @__PURE__ */ jsx(UserCheck, { className: "w-5 h-5" })
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "w-10 h-10 text-muted-foreground/80 hover:text-on-surface hover:bg-stone-50 hover:shadow-sm transition-all active:scale-95",
                  title: "View Digital Identity",
                  onClick: () => setSelectedMember(member),
                  children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5" })
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "w-10 h-10 text-muted-foreground/80 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95",
                  title: "Administrative Controls",
                  onClick: () => toast({ title: "Admin controls", description: `Opening secure vault for ${member.name}...` }),
                  children: /* @__PURE__ */ jsx(MoreHorizontal, { className: "w-5 h-5" })
                }
              )
            ] }) })
          ] }, member.id)) })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "px-6 py-5 border-t border-border/40 bg-muted/5 flex flex-col md:flex-row items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "min-w-[140px]", children: filteredMembers.length > 0 ? /* @__PURE__ */ jsxs("p", { className: "text-micro font-medium text-muted-foreground/80", children: [
            "Showing ",
            startIndex + 1,
            "–",
            Math.min(startIndex + itemsPerPage, filteredMembers.length),
            " of ",
            filteredMembers.length,
            " records"
          ] }) : /* @__PURE__ */ jsx("p", { className: "text-micro font-medium text-muted-foreground/80", children: "No records found" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                className: "h-11 px-8 text-micro font-bold tracking-tight rounded-sm border-border/40 disabled:opacity-30 transition-all hover:bg-stone-50 active:scale-95",
                disabled: currentPage === 1,
                onClick: handlePrevPage,
                children: "Previous"
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => /* @__PURE__ */ jsx("div", { className: cn("w-1.5 h-1.5 rounded-full", currentPage === i + 1 ? "bg-on-surface" : "bg-border/40") }, i)) }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                className: "h-11 px-8 text-micro font-bold tracking-tight rounded-sm border-border/40 disabled:opacity-30 transition-all hover:bg-stone-50 active:scale-95",
                disabled: currentPage >= totalPages || totalPages === 0,
                onClick: handleNextPage,
                children: "Next"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    isAdding && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300", children: /* @__PURE__ */ jsx(
      RegistrationForm,
      {
        onClose: () => setIsAdding(false),
        onSuccess: handleAddSuccess
      }
    ) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!selectedMember, onOpenChange: (open) => !open && setSelectedMember(null), children: /* @__PURE__ */ jsx(DialogContent, { className: "max-w-[95vw] sm:max-w-[500px] md:max-w-[600px] p-0 border-none bg-transparent shadow-none [&>button]:hidden", children: selectedMember && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxs("div", { ref: cardRef, children: [
        /* @__PURE__ */ jsx(
          MembershipCard,
          {
            userName: selectedMember.name,
            userRegNo: selectedMember.id,
            gender: selectedMember.gender,
            country: selectedMember.country,
            region: selectedMember.region,
            constituency: selectedMember.constituency,
            chapter: selectedMember.chapter,
            status: selectedMember.status === "Active" ? "Active member" : selectedMember.status,
            joinedDate: selectedMember.joined,
            initials: selectedMember.name.split(" ").map((n) => n[0]).join(""),
            avatarUrl: selectedMember.avatarUrl
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "absolute -top-12 right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white",
            onClick: () => setSelectedMember(null),
            children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            onClick: handlePrint,
            className: "h-14 bg-white hover:bg-muted/10 border border-border/60 text-on-surface font-bold tracking-tight text-micro shadow-lg rounded-none transition-all active:scale-95",
            children: [
              /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[18px] mr-2", children: "print" }),
              "Print card"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            onClick: handleDownload,
            className: "h-14 flex-1 rounded-sm text-micro font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            children: [
              /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[18px] mr-2", children: "download" }),
              "Download PDF"
            ]
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Dialog, { open: isAuditModalOpen, onOpenChange: setIsAuditModalOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl border-none rounded-none p-0 overflow-hidden bg-white", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 bg-on-surface text-white relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-accent to-primary" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-white/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Lock, { className: "w-5 h-5 text-accent" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold tracking-tight font-meta", children: "Audit history" }),
            /* @__PURE__ */ jsxs("p", { className: "text-micro font-medium text-muted-foreground/80 mt-1", children: [
              "Full chain of custody for ",
              auditTargetMember
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-8 space-y-6 max-h-[60vh] overflow-y-auto", children: !viewingAuditLogs || viewingAuditLogs.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-12 text-center text-muted-foreground/80 text-xs font-bold tracking-tight", children: "No audit records found for this resource." }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: viewingAuditLogs.map((log) => /* @__PURE__ */ jsx("div", { className: "border border-border/40 p-5 group hover:border-accent transition-all", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-muted/30 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-muted-foreground/80" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-muted-foreground/80", children: new Date(log.timestamp).toLocaleString() }),
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-on-surface mt-1 tracking-tight", children: log.action }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground/80 font-medium mt-1", children: [
              "Processed by: ",
              log.adminName
            ] }),
            log.details && /* @__PURE__ */ jsx("div", { className: "mt-3 p-3 bg-muted/30 text-micro font-mono text-on-surface/80 break-all border-l-2 border-border/60", children: JSON.stringify(log.details, null, 2) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: cn(
          "px-2 py-0.5 text-[8px] font-bold tracking-tight border",
          log.status === "Success" ? "bg-primary/10 text-primary border-primary/20" : "bg-accent/10 text-accent border-accent/20"
        ), children: log.status })
      ] }) }, log.id)) }) }),
      /* @__PURE__ */ jsx("div", { className: "p-6 border-t border-border/40 bg-stone-50/50 flex justify-end", children: /* @__PURE__ */ jsx(
        Button,
        {
          onClick: () => setIsAuditModalOpen(false),
          className: "bg-on-surface text-white text-micro font-bold tracking-tight rounded-sm h-11 px-8 shadow-md transition-all active:scale-95",
          children: "Close history"
        }
      ) })
    ] }) })
  ] });
}
export {
  MembersList as default
};
