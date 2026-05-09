import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle, UserPlus, Search, Filter, Loader2, ArrowRight, ChevronLeft, ChevronRight, CheckCircle2, Cpu, Fingerprint, XCircle, UserCheck, Eye, Database, X, EyeOff, Lock, FileText, History } from "lucide-react";
import { b as BrandLine, B as Button, C as Card, j as CardHeader, I as Input, d as CardContent, c as cn, v as CardTitle, a as adminService } from "../main.mjs";
import { toast } from "sonner";
import { R as RegistrationForm } from "./RegistrationForm-DA4whMaN.js";
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
const statusColor = (status) => {
  if (status === "In Review") return "bg-accent/10 text-accent border-accent/20";
  if (status === "Processing") return "bg-muted/30 text-on-surface/80 border-border/60";
  if (status === "Flagged") return "bg-destructive/10 text-destructive border-destructive/20";
  if (status === "Approved") return "bg-primary/10 text-primary border-primary/20";
  if (status === "Rejected") return "bg-destructive/20 text-destructive border-destructive/30";
  return "";
};
function MemberVerification() {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPhotoFull, setShowPhotoFull] = useState(false);
  const [viewingVaultRecord, setViewingVaultRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  useEffect(() => {
    async function loadVerifications() {
      setLoading(true);
      try {
        const data = await adminService.getPendingVerifications();
        setMembers(data);
      } finally {
        setLoading(false);
      }
    }
    loadVerifications();
  }, []);
  const PAGE_SIZE = 10;
  const STATUS_OPTIONS = [
    "All",
    "In Review",
    "Processing",
    "Flagged",
    "Approved",
    "Rejected"
  ];
  const pendingCount = members.filter((m) => m.status === "In Review" || m.status === "Processing").length;
  const handleNewRegistration = (data) => {
    const newMember = {
      id: data.registrationNumber,
      name: data.fullName,
      region: data.region || data.country,
      constituency: data.constituency || data.chapter || "-",
      platform: data.platform,
      country: data.country,
      phone: `${data.countryCode} ${data.contactNumber}`,
      gender: data.gender,
      ageRange: data.ageRange,
      profession: data.profession,
      educationLevel: data.educationLevel,
      emergencyName: data.emergencyContactName,
      emergencyRelationship: data.emergencyRelationship,
      emergencyPhone: data.emergencyNumber,
      submitted: "Just now",
      status: "In Review",
      photoUrl: data.photoUrl
    };
    setMembers((prev) => [newMember, ...prev]);
    setSelectedMember(newMember);
    setShowRegForm(false);
    setAiResult(null);
  };
  const handleAiScan = async () => {
    if (!selectedMember) return;
    setAiAnalyzing(true);
    setAiResult(null);
    try {
      const result = await adminService.verifyMemberID(selectedMember.id);
      setAiResult(result);
      if (result.flagged) {
        toast.warning(`AI Alert: Low confidence score (${result.confidence}%). Please review carefully.`);
      } else {
        toast.success(`AI Scan Complete: High identity match confidence.`);
      }
    } catch (err) {
      console.error("[AI-ASSISTANT] Scan failed:", err);
      toast.error("AI Assistant unavailable.");
    } finally {
      setAiAnalyzing(false);
    }
  };
  const handleVerdict = async (approve) => {
    if (!selectedMember) return;
    const newStatus = approve ? "Approved" : "Rejected";
    setMembers(
      (prev) => prev.map((m) => m.id === selectedMember.id ? { ...m, status: newStatus } : m)
    );
    setSelectedMember((prev) => prev ? { ...prev, status: newStatus } : null);
    try {
      await adminService.verifyMember(selectedMember.id, approve, void 0, selectedMember.chapter);
      toast.success(`Member "${selectedMember.name}" has been ${newStatus.toLowerCase()}.`);
    } catch (error) {
      console.error("[VERIFICATION] Action failed:", error);
      toast.error("Failed to update verification status.");
    }
  };
  const filtered = members.filter(
    (m) => (statusFilter === "All" || m.status === statusFilter) && ((m.name?.toLowerCase() || "").includes(search.toLowerCase()) || (m.id?.toLowerCase() || "").includes(search.toLowerCase()) || (m.region?.toLowerCase() || "").includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const handleSearch = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };
  const handleFilter = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { className: "w-8 h-8 text-on-surface" }),
          "Member verification"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Review and approve new member registrations for movement security." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        pendingCount > 0 && /* @__PURE__ */ jsxs("div", { className: "hidden md:flex px-4 py-2 bg-accent/5 border border-accent/20 items-center gap-2 rounded-sm shadow-sm", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 text-accent" }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-accent tracking-tight block uppercase", children: "Pending" }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-on-surface tracking-tight", children: [
              pendingCount,
              " review",
              pendingCount !== 1 ? "s" : ""
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            size: "lg",
            className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            onClick: () => setShowRegForm(true),
            children: [
              /* @__PURE__ */ jsx(UserPlus, { className: "w-4 h-4 mr-2" }),
              " Add Member"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-columns items-start", style: { "--column-gap": "2rem" }, children: [
      /* @__PURE__ */ jsx("div", { className: "min-w-0 flex-[2] flow", style: { "--flow-space": "1.5rem" }, children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-sm overflow-hidden bg-white", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-6 border-b border-border/40 bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-sm", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: search,
                onChange: (e) => handleSearch(e.target.value),
                placeholder: "Search by name, ID, region...",
                className: "pl-9 h-9 text-xs rounded-sm border-border/60 shadow-sm focus:ring-on-surface/20"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Filter, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: statusFilter,
                onChange: (e) => handleFilter(e.target.value),
                className: "h-9 pl-9 pr-8 text-micro font-bold rounded-sm border border-border/60 bg-white text-on-surface/80 focus:outline-none focus:border-on-surface appearance-none cursor-pointer transition-colors shadow-sm normal-case",
                children: STATUS_OPTIONS.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s === "All" ? "All statuses" : s }, s))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: loading ? /* @__PURE__ */ jsxs("div", { className: "py-24 flex flex-col items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 text-on-surface animate-spin" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 normal-case", children: "Fetching member identity files..." })
        ] }) : filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-12 text-center text-muted-foreground/40 text-xs font-bold normal-case", children: "No registrations match your search." }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-border/40", children: paginated.map((member) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all",
              selectedMember?.id === member.id ? "bg-on-surface text-white shadow-lg" : "hover:bg-muted/10"
            ),
            onClick: () => {
              setSelectedMember(member);
              setAiResult(null);
            },
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: cn(
                  "w-12 h-12 overflow-hidden flex items-center justify-center font-bold text-xs shadow-inner shrink-0 rounded-sm",
                  selectedMember?.id === member.id ? "bg-white/10" : "bg-muted/10"
                ), children: member.photoUrl ? /* @__PURE__ */ jsx("img", { src: member.photoUrl, alt: member.name, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx("span", { className: selectedMember?.id === member.id ? "text-white" : "text-muted-foreground/40", children: member.name.split(" ").map((n) => n[0]).join("") }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: cn(
                    "text-sm font-bold tracking-tight leading-none",
                    selectedMember?.id === member.id ? "text-white" : "text-on-surface"
                  ), children: member.name }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight opacity-60", children: member.id }),
                    /* @__PURE__ */ jsx("span", { className: "w-1 h-1 bg-current opacity-20 rounded-full" }),
                    /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight opacity-60", children: member.submitted })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right hidden sm:block", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight", children: member.region }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold opacity-60 tracking-tight", children: member.constituency })
                ] }),
                /* @__PURE__ */ jsx("div", { className: cn(
                  "px-3 py-1 text-micro font-bold tracking-tight border rounded",
                  selectedMember?.id === member.id ? "bg-white/10 text-white border-white/20" : statusColor(member.status)
                ), children: member.status }),
                /* @__PURE__ */ jsx(ArrowRight, { className: cn(
                  "w-4 h-4 transition-transform",
                  selectedMember?.id === member.id ? "translate-x-1 opacity-100" : "opacity-20"
                ) })
              ] })
            ]
          },
          member.id
        )) }) }),
        totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 border-t border-border/10 bg-muted/5 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold tracking-tight text-muted-foreground/40", children: [
            "Showing ",
            (safePage - 1) * PAGE_SIZE + 1,
            "–",
            Math.min(safePage * PAGE_SIZE, filtered.length),
            " of ",
            filtered.length
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                size: "icon",
                onClick: () => setCurrentPage((p) => Math.max(1, p - 1)),
                disabled: safePage === 1,
                className: "w-8 h-8 flex items-center justify-center border border-border/40 text-on-surface/80 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-sm",
                children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-3.5 h-3.5" })
              }
            ),
            Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => /* @__PURE__ */ jsx(
              Button,
              {
                variant: page === safePage ? "primary" : "default",
                onClick: () => setCurrentPage(page),
                className: cn(
                  "w-8 h-8 flex items-center justify-center text-micro font-bold transition-all rounded-sm active:scale-95",
                  page === safePage ? "shadow-sm shadow-brand-green/20" : "border-border/40 text-on-surface/80 hover:bg-stone-50"
                ),
                children: page
              },
              page
            )),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                size: "icon",
                onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
                disabled: safePage === totalPages,
                className: "w-8 h-8 flex items-center justify-center border border-border/40 text-on-surface/80 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-sm",
                children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" })
              }
            )
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex-1", children: selectedMember ? /* @__PURE__ */ jsxs("div", { className: "flow sticky top-8", style: { "--flow-space": "1rem" }, children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-on-surface bg-on-surface text-white shadow-2xl overflow-hidden relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-5", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-32 h-32 rotate-12" }) }),
          /* @__PURE__ */ jsx(CardHeader, { className: "p-6 border-b border-white/10 relative z-10", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-white/60 tracking-tight", children: [
                "Reviewing · ",
                selectedMember.id
              ] }),
              /* @__PURE__ */ jsx(CardTitle, { className: "text-xl font-bold tracking-tight mt-1 leading-tight", children: selectedMember.name }),
              /* @__PURE__ */ jsx("div", { className: cn(
                "inline-flex mt-2 px-2 py-0.5 text-tiny font-bold tracking-tight border rounded",
                selectedMember.status === "Approved" && "bg-primary/20 text-primary border-primary/30",
                selectedMember.status === "Rejected" && "bg-destructive/20 text-destructive border-destructive/30",
                (selectedMember.status === "In Review" || selectedMember.status === "Processing") && "bg-accent/20 text-accent border-accent/30",
                selectedMember.status === "Flagged" && "bg-destructive/20 text-destructive border-destructive/30"
              ), children: selectedMember.status })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "w-14 h-16 bg-white/5 flex-shrink-0 overflow-hidden border border-white/10 hover:opacity-80 transition-opacity rounded-sm",
                onClick: () => selectedMember.photoUrl && setShowPhotoFull(true),
                title: selectedMember.photoUrl ? "View photo" : "No photo uploaded",
                children: selectedMember.photoUrl ? /* @__PURE__ */ jsx("img", { src: selectedMember.photoUrl, alt: selectedMember.name, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-xs text-white/60 font-bold italic", children: "No photo" })
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-5 relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4", children: [
              { label: "Platform", value: selectedMember.platform },
              { label: "Country", value: selectedMember.country },
              { label: "Gender", value: selectedMember.gender },
              { label: "Age Range", value: selectedMember.ageRange },
              { label: "Region", value: selectedMember.region },
              { label: "Constituency", value: selectedMember.constituency },
              { label: "Profession", value: selectedMember.profession },
              { label: "Education", value: selectedMember.educationLevel }
            ].map(({ label, value }) => /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-white/60 tracking-tight", children: label }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold tracking-tight text-white leading-tight", children: value || "-" })
            ] }, label)) }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-white/10 pt-4 space-y-1", children: [
              /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-white/60 tracking-tight", children: "Phone" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-white", children: selectedMember.phone || "-" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-white/10 pt-4 space-y-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-white/60 tracking-tight mb-2", children: "Emergency contact" }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: [
                { label: "Name", value: selectedMember.emergencyName },
                { label: "Relation", value: selectedMember.emergencyRelationship }
              ].map(({ label, value }) => /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-white/40 tracking-tight", children: label }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold tracking-tight text-white", children: value || "-" })
              ] }, label)) }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-white mt-1", children: selectedMember.emergencyPhone || "-" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-white/10 pt-4 space-y-2", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold tracking-tight text-white/60", children: "Verification steps" }),
              [
                { label: "Form submitted", done: true },
                { label: "Photo uploaded", done: !!selectedMember.photoUrl },
                { label: "Regional chapter approval", done: selectedMember.status === "Approved" }
              ].map(({ label, done }) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-2.5 bg-white/5 border border-white/5 rounded-sm", children: [
                done ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5 text-primary shrink-0" }) : /* @__PURE__ */ jsx("div", { className: "w-3.5 h-3.5 rounded-full border border-muted-foreground/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("div", { className: "w-1 h-1 bg-muted-foreground/20" }) }),
                /* @__PURE__ */ jsx("span", { className: cn(
                  "text-xs font-bold tracking-tight",
                  done ? "text-white" : "text-muted-foreground/40"
                ), children: label })
              ] }, label))
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-white/10 pt-4 space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold tracking-tight text-white/60", children: "Security assistant" }),
                aiResult && /* @__PURE__ */ jsxs("span", { className: cn(
                  "text-tiny font-bold px-1.5 py-0.5 tracking-tight rounded",
                  aiResult.flagged ? "bg-destructive text-white" : "bg-primary text-white"
                ), children: [
                  aiResult.confidence,
                  "% match"
                ] })
              ] }),
              !aiResult && !aiAnalyzing && /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "primary",
                  size: "sm",
                  onClick: handleAiScan,
                  className: "w-full h-11 text-white text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.01] active:scale-95",
                  children: [
                    /* @__PURE__ */ jsx(Cpu, { className: "w-4 h-4 mr-2" }),
                    " Execute Identity Scan"
                  ]
                }
              ),
              aiAnalyzing && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-white/5 border border-white/10 flex flex-col items-center gap-3 animate-pulse rounded-sm", children: [
                /* @__PURE__ */ jsx(Fingerprint, { className: "w-6 h-6 text-accent animate-bounce" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-muted-foreground/40 tracking-tight", children: "Analyzing identity..." })
              ] }),
              aiResult && /* @__PURE__ */ jsxs("div", { className: cn(
                "p-4 border rounded-sm",
                aiResult.flagged ? "bg-destructive/10 border-destructive/20" : "bg-primary/10 border-primary/20"
              ), children: [
                /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: aiResult.matches.map((m) => /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold tracking-tight text-white/60 bg-white/5 px-2 py-1 rounded", children: m }, m)) }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-white/40 mt-3 italic tracking-tight", children: "* Neural scan of official records completed." })
              ] })
            ] }),
            (selectedMember.status === "In Review" || selectedMember.status === "Processing" || selectedMember.status === "Flagged") && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "destructive",
                  onClick: () => handleVerdict(false),
                  className: "h-11 transition-all text-micro font-bold tracking-tight rounded-sm active:scale-95 shadow-lg shadow-brand-red/20",
                  children: [
                    /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 mr-2" }),
                    " Reject Entry"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "primary",
                  onClick: () => handleVerdict(true),
                  className: "h-11 text-white text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.01] active:scale-95",
                  children: [
                    /* @__PURE__ */ jsx(UserCheck, { className: "w-4 h-4 mr-2" }),
                    " Approve Admission"
                  ]
                }
              )
            ] }),
            selectedMember.status === "Approved" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 text-primary text-micro font-bold tracking-tight rounded-sm", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4" }),
              " Member approved"
            ] }),
            selectedMember.status === "Rejected" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-micro font-bold tracking-tight rounded-sm", children: [
              /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4" }),
              " Registration rejected"
            ] })
          ] })
        ] }),
        selectedMember.photoUrl && /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/40 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 space-y-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "gold",
              className: "w-full h-11 text-micro font-bold tracking-tight rounded-sm transition-all shadow-sm active:scale-95",
              onClick: () => setShowPhotoFull(true),
              children: [
                /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 mr-2" }),
                " Inspect Biometric Data"
              ]
            }
          ),
          (selectedMember.status === "Approved" || selectedMember.status === "Rejected") && /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "gold",
              className: "w-full h-11 text-micro font-bold tracking-tight rounded-sm transition-all shadow-sm active:scale-95",
              onClick: () => setViewingVaultRecord(selectedMember),
              children: [
                /* @__PURE__ */ jsx(Database, { className: "w-4 h-4 mr-2" }),
                " Open Audit Vault"
              ]
            }
          )
        ] }) })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "h-[400px] border-2 border-dashed border-border/40 rounded-sm flex flex-col items-center justify-center text-muted-foreground/40 gap-4 bg-white/50", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "w-12 h-12 opacity-20" }),
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight", children: "Select a file to review" })
      ] }) })
    ] }),
    showRegForm && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] bg-on-surface/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto", children: /* @__PURE__ */ jsx(
      RegistrationForm,
      {
        onClose: () => setShowRegForm(false),
        onSuccess: () => setShowRegForm(false),
        onSubmitData: handleNewRegistration
      }
    ) }),
    showPhotoFull && selectedMember?.photoUrl && /* @__PURE__ */ jsxs(
      "div",
      {
        className: "fixed inset-0 z-[110] bg-on-surface/90 flex items-center justify-center p-8",
        onClick: () => setShowPhotoFull(false),
        children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "absolute top-6 right-6 text-white/60 hover:text-white transition-colors",
              onClick: () => setShowPhotoFull(false),
              children: /* @__PURE__ */ jsx(X, { className: "w-8 h-8" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", onClick: (e) => e.stopPropagation(), children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: selectedMember.photoUrl,
                alt: selectedMember.name,
                className: "max-h-[80vh] max-w-full object-contain shadow-2xl",
                decoding: "async",
                loading: "lazy"
              }
            ),
            /* @__PURE__ */ jsxs("p", { className: "text-white/60 text-micro font-bold tracking-tight", children: [
              selectedMember.name,
              " · ",
              selectedMember.id
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "text-white/40 hover:text-white/80 transition-colors",
                onClick: () => setShowPhotoFull(false),
                children: /* @__PURE__ */ jsx(EyeOff, { className: "w-5 h-5" })
              }
            )
          ] })
        ]
      }
    ),
    viewingVaultRecord && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[120] bg-on-surface/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto", children: /* @__PURE__ */ jsxs(Card, { className: "max-w-4xl w-full rounded-sm border-0 shadow-2xl overflow-hidden bg-white", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "bg-on-surface text-white p-8 border-b border-white/10 relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-6 opacity-10", children: /* @__PURE__ */ jsx(Lock, { className: "w-24 h-24 rotate-12" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start relative z-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-white/60 tracking-tight", children: "Secure vault record" }),
              /* @__PURE__ */ jsx("div", { className: cn(
                "px-2 py-0.5 text-[8px] font-bold tracking-tight border border-white/20 rounded",
                viewingVaultRecord.status === "Approved" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
              ), children: viewingVaultRecord.status })
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold font-meta tracking-tighter leading-none pt-2", children: viewingVaultRecord.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-white/60 text-xs font-bold tracking-tight", children: [
              "Permanent record ID: ",
              viewingVaultRecord.id
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "default",
              onClick: () => setViewingVaultRecord(null),
              className: "p-2 hover:bg-white/10 text-white/60 transition-colors",
              children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "p-8", children: /* @__PURE__ */ jsxs("div", { className: "flex-columns items-start", style: { "--column-gap": "3rem" }, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-[1.5] flow", style: { "--flow-space": "2rem" }, children: [
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold tracking-tight text-on-surface/40 border-b border-border/40 pb-2 mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5" }),
              " Identity metadata"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-columns items-start", style: { "--column-gap": "2rem" }, children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-y-4 gap-x-8", children: [
              { label: "Full name", value: viewingVaultRecord.name },
              { label: "Platform", value: viewingVaultRecord.platform },
              { label: "Country", value: viewingVaultRecord.country },
              { label: "Region", value: viewingVaultRecord.region },
              { label: "Constituency", value: viewingVaultRecord.constituency },
              { label: "Profession", value: viewingVaultRecord.profession },
              { label: "Education", value: viewingVaultRecord.educationLevel },
              { label: "Gender", value: viewingVaultRecord.gender },
              { label: "Age range", value: viewingVaultRecord.ageRange }
            ].map((f) => /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-on-surface/60 tracking-tight", children: f.label }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold tracking-tight text-on-surface", children: f.value || "-" })
            ] }, f.label)) }) })
          ] }),
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold tracking-tight text-on-surface/60 border-b border-border/40 pb-2 mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(History, { className: "w-3.5 h-3.5" }),
              " Audit history"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-white border-l-2 border-on-surface shadow-sm rounded-r-xl", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold tracking-tight text-on-surface", children: "Registration submitted" }),
                  /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface-muted", children: viewingVaultRecord.submitted })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-muted mt-1 tracking-tight", children: "System generated entry upon form completion." })
              ] }),
              viewingVaultRecord.status === "Approved" && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-white border-l-2 border-primary shadow-sm rounded-r-xl", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold tracking-tight text-primary", children: "Verification approved" }),
                  /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface-muted", children: "Just now" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-muted mt-1 tracking-tight", children: "Administrator: National HQ" })
              ] }),
              viewingVaultRecord.status === "Rejected" && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-white border-l-2 border-destructive shadow-sm rounded-r-xl", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold tracking-tight text-destructive", children: "Verification rejected" }),
                  /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface-muted", children: "Just now" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-muted mt-1 tracking-tight", children: "Administrator: National HQ" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flow", style: { "--flow-space": "2rem" }, children: [
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold tracking-tight text-muted-foreground/40 border-b border-border/40 pb-2 mb-4", children: "Captured credentials" }),
            /* @__PURE__ */ jsxs("div", { className: "aspect-[3/4] bg-muted/30 overflow-hidden shadow-inner border border-border/60 relative group rounded-sm", children: [
              viewingVaultRecord.photoUrl ? /* @__PURE__ */ jsx("img", { src: viewingVaultRecord.photoUrl, alt: "Vault Record", className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-2", children: [
                /* @__PURE__ */ jsx(EyeOff, { className: "w-8 h-8 opacity-20" }),
                /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold tracking-tight", children: "No biometric data" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-on-surface/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none", children: /* @__PURE__ */ jsx(Database, { className: "text-white w-12 h-12 opacity-50" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 bg-muted/30 border border-border/40 rounded-sm", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold tracking-tight text-on-surface-muted mb-2 italic", children: "Legal disclaimer" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-on-surface-muted leading-relaxed font-medium italic", children: "This record is persistently stored in the movement's secure audit vault. Metadata cannot be altered after verification completion." })
          ] })
        ] })
      ] }) })
    ] }) })
  ] });
}
export {
  MemberVerification as default
};
