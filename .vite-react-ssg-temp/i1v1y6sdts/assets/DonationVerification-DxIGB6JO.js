import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { DollarSign, Download, Loader2, Search, ShieldCheck, Clock, CheckCircle2, XCircle, Calendar, CreditCard, Eye, ArrowRight, Image } from "lucide-react";
import { t as useToast, a as adminService, b as BrandLine, B as Button, c as cn, C as Card, d as CardContent } from "../main.mjs";
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
function FinancialAudit() {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ totalContributions: 0, pendingCount: 0, approvedAmount: 0, flaggedCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isVerifying, setIsVerifying] = useState(null);
  const { toast } = useToast();
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const [data, statistics] = await Promise.all([
      adminService.getDonations(statusFilter),
      adminService.getDonationStats()
    ]);
    setDonations(data);
    setStats(statistics);
    setIsLoading(false);
  }, [statusFilter]);
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      if (!ignore) {
        void fetchData();
      }
    }, 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [fetchData]);
  const handleVerify = async (donationId, name, status) => {
    setIsVerifying(donationId);
    const success = await adminService.verifyDonation(donationId, status, `Verified by Admin via Command Center`);
    if (success) {
      toast({
        title: status === "Verified" ? "Contribution verified" : "Contribution flagged",
        description: `The transaction from ${name} has been processed.`,
        variant: status === "Verified" ? "default" : "destructive"
      });
      fetchData();
    } else {
      toast({
        title: "Verification failed",
        description: "An error occurred while updating the record.",
        variant: "destructive"
      });
    }
    setIsVerifying(null);
  };
  const filteredDonations = donations.filter(
    (d) => d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || d.campaignTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || d.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleExport = () => {
    try {
      const headers = ["Reference", "Date", "Donor Name", "Country", "Phone", "Campaign", "Method", "Amount (GH₵)", "Status"];
      const csvData = filteredDonations.map((d) => [
        d.reference.toUpperCase(),
        new Date(d.date).toLocaleDateString(),
        `"${d.fullName}"`,
        d.country,
        d.phone,
        `"${d.campaignTitle || "General fund"}"`,
        d.method,
        d.amount,
        d.status
      ]);
      const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `financial_ledger_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Export complete",
        description: `Successfully downloaded ${filteredDonations.length} transaction records.`
      });
    } catch {
      toast({
        title: "Export failed",
        description: "There was an error compiling the ledger data.",
        variant: "destructive"
      });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(DollarSign, { className: "w-8 h-8 text-on-surface" }),
          "Financial audit"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Reviewing contributions, transactions, and campaign funding." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            size: "lg",
            className: "rounded-sm text-micro font-bold tracking-tight px-10 h-12 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95",
            onClick: handleExport,
            disabled: filteredDonations.length === 0,
            children: [
              /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
              " Export Ledger"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            size: "lg",
            className: "rounded-sm text-micro font-bold tracking-tight px-10 h-12 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95",
            onClick: () => fetchData(),
            children: [
              /* @__PURE__ */ jsx(Loader2, { className: cn("w-4 h-4 mr-2", isLoading && "animate-spin") }),
              "Synchronize Data"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid-stats mb-12", style: { "--grid-min-width": "220px" }, children: [
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-muted-foreground/80 tracking-tight", children: "Total Contributions" }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl md:text-2xl font-bold text-on-surface", children: stats.totalContributions.toLocaleString() }),
        /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/60 mt-1", children: "All-time recorded volume" })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-muted-foreground/80 tracking-tight", children: "Pending Review" }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl md:text-2xl font-bold text-accent", children: stats.pendingCount.toLocaleString() }),
        /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-accent/70 mt-1", children: "Awaiting administrative clearance" })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-muted-foreground/80 tracking-tight", children: "Approved Amount" }),
        /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-bold text-primary", children: [
          "GH₵ ",
          stats.approvedAmount.toLocaleString()
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-primary/70 mt-1", children: "Total cleared funds" })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm bg-white", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-muted-foreground/80 tracking-tight", children: "Flagged Transactions" }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-destructive", children: stats.flaggedCount.toLocaleString() }),
        /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-destructive/70 mt-1", children: "Rejected or disputed records" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-columns items-start", style: { "--column-gap": "2rem" }, children: /* @__PURE__ */ jsxs("div", { className: "w-full flex-1 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/60 p-2 rounded-sm flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: ["Pending", "Verified", "Rejected", "All"].map((status) => /* @__PURE__ */ jsx(
          Button,
          {
            variant: statusFilter === status ? "primary" : "ghost",
            onClick: () => setStatusFilter(status),
            className: cn(
              "h-11 px-8 text-micro font-bold tracking-tight rounded-sm transition-all active:scale-95",
              statusFilter === status ? "shadow-lg shadow-brand-green/20" : "text-muted-foreground/60 hover:text-on-surface hover:bg-stone-50 border border-transparent hover:border-stone-100"
            ),
            children: status
          },
          status
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-xs", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Search by donor, campaign, or ref...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "w-full h-10 pl-9 pr-4 bg-transparent border-none text-micro font-bold normal-case placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: isLoading ? Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-32 bg-muted/5 rounded-sm animate-pulse border border-border/40" }, i)) : filteredDonations.length === 0 ? /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 p-20 text-center bg-muted/30 shadow-none", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "w-12 h-12 text-border/60 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm font-bold", children: statusFilter === "Pending" ? "No pending contributions found. All current transactions have been reviewed." : `No ${statusFilter.toLowerCase()} transactions found matching your criteria.` })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: filteredDonations.map((donation) => /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden bg-white", children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row items-stretch", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 lg:w-2/5 border-b lg:border-b-0 lg:border-r border-border/40 flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: cn(
            "w-10 h-10 shrink-0 flex items-center justify-center rounded-sm shadow-sm",
            donation.status === "Pending" ? "bg-accent/10 text-accent" : donation.status === "Verified" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          ), children: donation.status === "Pending" ? /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5" }) : donation.status === "Verified" ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface", children: donation.fullName }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/60 bg-border/40 px-2 py-0.5 rounded-full", children: donation.reference.toUpperCase() })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/80 font-medium line-clamp-1", children: donation.campaignTitle || "General fund" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-3", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-micro font-bold text-muted-foreground/80", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3" }),
                " ",
                new Date(donation.date).toLocaleDateString()
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-micro font-bold text-muted-foreground/80", children: [
                /* @__PURE__ */ jsx(CreditCard, { className: "w-3 h-3" }),
                " ",
                donation.method
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 lg:w-1/4 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border/40 bg-muted/5", children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 mb-1", children: "Transaction value" }),
          /* @__PURE__ */ jsxs("span", { className: "text-2xl font-bold font-meta text-on-surface tracking-tighter", children: [
            "GH₵ ",
            parseFloat(donation.amount).toLocaleString()
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-4", children: donation.receiptUrl ? /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "default",
              size: "sm",
              onClick: () => setSelectedReceipt(donation.receiptUrl || null),
              className: "h-11 px-8 text-micro font-bold tracking-tight text-on-surface/80 hover:text-accent hover:bg-stone-50 rounded-sm border-border/40 transition-all shadow-sm w-fit active:scale-95",
              children: [
                /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 mr-2" }),
                " Inspect Evidence"
              ]
            }
          ) : /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/60 flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3" }),
            " No receipt attached"
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6 lg:w-1/3 flex flex-col justify-center bg-white", children: donation.status === "Pending" ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60", children: "Audit action required" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                onClick: () => handleVerify(donation.id, donation.fullName, "Rejected"),
                disabled: isVerifying === donation.id,
                className: "flex-1 h-12 text-micro font-bold tracking-tight text-brand-red border-brand-red/20 hover:bg-brand-red/10 transition-all shadow-sm rounded-sm active:scale-95",
                children: "Flag for Audit"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "primary",
                onClick: () => handleVerify(donation.id, donation.fullName, "Verified"),
                disabled: isVerifying === donation.id,
                className: "flex-1 h-12 text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
                children: "Approve Record"
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 mb-1", children: "Audit status" }),
            /* @__PURE__ */ jsx("span", { className: cn(
              "px-2.5 py-1 rounded-md text-micro font-bold border",
              donation.status === "Verified" ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"
            ), children: donation.status })
          ] }),
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 text-border/60" })
        ] }) })
      ] }) }) }, donation.id)) }) })
    ] }) }),
    selectedReceipt && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/90 backdrop-blur-md animate-in fade-in duration-300", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl w-full bg-white relative overflow-hidden rounded-sm shadow-2xl", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-4 z-10", children: /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          onClick: () => setSelectedReceipt(null),
          className: "bg-black/50 text-white hover:bg-black rounded-sm",
          children: /* @__PURE__ */ jsx(XCircle, { className: "w-5 h-5" })
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-border/40 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-on-surface tracking-tight", children: "Transaction receipt" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 mt-1", children: "Financial audit vault" })
        ] }),
        /* @__PURE__ */ jsx(Image, { className: "w-6 h-6 text-border/60" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-8 bg-muted/5 flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: selectedReceipt,
          alt: "Transaction Receipt",
          className: "max-h-[60vh] object-contain shadow-md rounded-sm border border-border/60",
          decoding: "async",
          loading: "lazy"
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "p-6 flex justify-end bg-white border-t border-border/40", children: /* @__PURE__ */ jsx(
        Button,
        {
          variant: "primary",
          onClick: () => setSelectedReceipt(null),
          className: "h-14 px-12 text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          children: "Close viewer"
        }
      ) })
    ] }) })
  ] });
}
export {
  FinancialAudit as default
};
