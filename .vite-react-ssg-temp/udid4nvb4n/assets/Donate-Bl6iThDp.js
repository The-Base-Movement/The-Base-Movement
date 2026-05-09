import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, Globe, Shield, Heart, Check, ArrowRight, Phone, ArrowDownToLine, Search, Download, X } from "lucide-react";
import { a as adminService, S as SEO, b as BrandLine, c as cn, B as Button, C as Card, d as CardContent } from "../main.mjs";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import "vite-react-ssg";
import "@tanstack/react-query";
import "react-helmet-async";
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
function LiveContributionFeed() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const feedRef = useRef(null);
  useEffect(() => {
    async function fetchRecentDonations() {
      try {
        const data = await adminService.getPublicDonationFeed(15);
        setDonations(data);
      } catch (error) {
        console.error("[LIVE FEED] Initial fetch failed:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecentDonations();
    const subscription = adminService.subscribeToPublicDonations((newDonation) => {
      setDonations((prev) => {
        if (prev.some((d) => d.id === newDonation.id)) return prev;
        return [newDonation, ...prev.slice(0, 14)];
      });
      if (feedRef.current) {
        feedRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-16 bg-muted/20 animate-pulse rounded-sm border border-border/40" }, i)) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Activity, { className: "w-5 h-5 text-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface font-meta tracking-tight text-base normal-case", children: "Global Deployment Feed" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full", children: [
        /* @__PURE__ */ jsx(Globe, { className: "w-3 h-3 text-primary" }),
        /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-primary tracking-tight normal-case", children: "Live Uplink Active" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: feedRef,
        className: "space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar",
        children: [
          /* @__PURE__ */ jsx(AnimatePresence, { initial: false, children: donations.map((donation) => /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { opacity: 0, x: -20, height: 0 },
              animate: { opacity: 1, x: 0, height: "auto" },
              exit: { opacity: 0, x: 20, height: 0 },
              transition: { duration: 0.4, ease: "easeOut" },
              className: "group",
              children: /* @__PURE__ */ jsxs("div", { className: "p-5 bg-white/60 backdrop-blur-xl border border-border/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 rounded-sm relative overflow-hidden group/item", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-primary/10 -mr-16 -mt-16 blur-3xl group-hover/item:bg-primary/20 transition-all duration-700" }),
                /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-16 h-16 bg-accent/5 -ml-8 -mb-8 blur-2xl transition-all" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-white shadow-sm flex items-center justify-center rounded-sm border border-border/10 group-hover/item:scale-110 group-hover/item:border-primary/30 transition-all duration-500", children: donation.fullName !== "Anonymous Patriot" ? /* @__PURE__ */ jsx(Globe, { className: "w-6 h-6 text-primary/60 group-hover/item:text-primary transition-colors" }) : /* @__PURE__ */ jsx(Shield, { className: "w-6 h-6 text-accent/60 group-hover/item:text-accent transition-colors" }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface tracking-tight normal-case leading-tight", children: donation.fullName }),
                      /* @__PURE__ */ jsxs("p", { className: "text-micro text-muted-foreground/60 font-bold tracking-tight mt-1 normal-case", children: [
                        "Mobilizing ",
                        /* @__PURE__ */ jsx("span", { className: "text-primary font-meta", children: donation.campaignTitle || "Strategic Fund" })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsxs("p", { className: "text-base font-bold text-on-surface font-meta tracking-tight", children: [
                      "GH₵ ",
                      Number(donation.amount).toLocaleString()
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/40 font-bold tracking-tight normal-case mt-1 tabular-nums bg-muted/20 px-2 py-0.5 rounded-full inline-block", children: new Date(donation.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
                  ] })
                ] })
              ] })
            },
            donation.id
          )) }),
          donations.length === 0 && /* @__PURE__ */ jsxs("div", { className: "py-20 text-center border border-dashed border-border/40 rounded-sm", children: [
            /* @__PURE__ */ jsx(Heart, { className: "w-8 h-8 text-muted-foreground/20 mx-auto mb-4" }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 tracking-tight uppercase", children: "Awaiting mobilization uplink..." })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-6 border-t border-border/40 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 tracking-tight normal-case italic", children: "* Immutable strategic ledger. Redacted entries respect patriot privacy." }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "w-1 h-1 bg-primary rounded-full" }),
        /* @__PURE__ */ jsx("span", { className: "w-1 h-1 bg-primary/40 rounded-full" }),
        /* @__PURE__ */ jsx("span", { className: "w-1 h-1 bg-primary/20 rounded-full" })
      ] })
    ] })
  ] });
}
function Donate() {
  const [submitted, setSubmitted] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [contributions, setContributions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [pastCampaigns, setPastCampaigns] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({ totalMembers: 0, totalRaised: 0 });
  const [publicHistory, setPublicHistory] = useState([]);
  const [personalHistory, setPersonalHistory] = useState([]);
  const [spendingHistory, setSpendingHistory] = useState([]);
  const [historyTab, setHistoryTab] = useState("contributions");
  const [contributionFilter, setContributionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const handleDownload = () => {
    const dataToExport = contributionFilter === "all" ? publicHistory : personalHistory;
    const filteredData = dataToExport.filter(
      (item) => item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || item.amount.includes(searchQuery)
    );
    if (filteredData.length === 0) {
      toast.error("No verified data found for export.");
      return;
    }
    const headers = ["Date", "Contributor", "Campaign", "Amount", "Method", "Reference", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((item) => [
        item.date,
        `"${item.fullName}"`,
        `"${item.campaignTitle || "Strategic Fund"}"`,
        `"${item.amount}"`,
        item.method,
        item.reference,
        item.status
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `TheBase_Contributions_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Strategic ledger exported successfully.");
  };
  const [isLoggedIn] = useState(() => !!localStorage.getItem("userName"));
  const [formData, setFormData] = useState(() => {
    const storedName = localStorage.getItem("userName") || "";
    const storedPhone = localStorage.getItem("userPhone") || "";
    const storedMemberId = localStorage.getItem("userMemberId") || "";
    return {
      fullName: storedName,
      phone: storedPhone,
      amount: "",
      country: "GH",
      membershipNumber: storedMemberId,
      showOnDashboard: !!storedName,
      campaignId: ""
    };
  });
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setCountriesLoading(true);
      try {
        const [activeData, pastData, countriesData, publicHistoryData, statsData, ledgerData] = await Promise.all([
          adminService.getDonationCampaigns("Active"),
          adminService.getDonationCampaigns("Closed"),
          adminService.getCountries(),
          adminService.getPublicDonationFeed(20),
          adminService.getDonationStats(),
          adminService.getMobilizationLedger(20)
        ]);
        setCampaigns(activeData);
        setPastCampaigns(pastData);
        setCountries(countriesData);
        setPublicHistory(publicHistoryData.map((d) => ({
          ...d,
          date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          amount: `GHS ${Number(d.amount).toLocaleString()}`
        })));
        setSpendingHistory(ledgerData);
        setGlobalStats({
          totalMembers: statsData.totalContributions,
          totalRaised: statsData.approvedAmount
        });
        const savedPhone = localStorage.getItem("userPhone");
        if (savedPhone) {
          const personalData = await adminService.getMemberDonations(savedPhone);
          setPersonalHistory(personalData.map((d) => ({
            ...d,
            date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            amount: `GHS ${Number(d.amount).toLocaleString()}`
          })));
        }
        if (activeData.length > 0) {
          setFormData((prev) => {
            if (!prev.campaignId) {
              return { ...prev, campaignId: activeData[0].id };
            }
            return prev;
          });
        }
        const ghana = countriesData.find((c) => c.name.toLowerCase() === "ghana");
        if (ghana) {
          setFormData((prev) => ({ ...prev, country: ghana.name }));
        }
      } catch (err) {
        console.error("[DONATE] Data fetch failed:", err);
        toast.error("Tactical data synchronization failed.");
      } finally {
        setLoading(false);
        setCountriesLoading(false);
      }
    }
    fetchData();
    const subscription = adminService.subscribeToPublicDonations((newDonation) => {
      setPublicHistory((prev) => {
        if (prev.some((d) => d.id === newDonation.id)) return prev;
        const formatted = {
          ...newDonation,
          date: new Date(newDonation.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          amount: `GHS ${Number(newDonation.amount).toLocaleString()}`
        };
        return [formatted, ...prev].slice(0, 50);
      });
      setGlobalStats((prev) => ({
        totalMembers: prev.totalMembers + 1,
        totalRaised: prev.totalRaised + Number(newDonation.amount)
      }));
    });
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);
  useEffect(() => {
    async function fetchHistory() {
      if (!formData.phone) {
        setContributions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const historyData = await adminService.getMemberDonations(formData.phone);
      setContributions(historyData);
      setLoading(false);
    }
    const timer = setTimeout(fetchHistory, 500);
    return () => clearTimeout(timer);
  }, [formData.phone]);
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["payment-section", "donor-section", "link-section", "receipt-section"];
      const scrollPos = window.scrollY + 200;
      sections.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveStep(index + 1);
          }
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [hasScrolled, setHasScrolled] = useState(false);
  useEffect(() => {
    const checkScroll = () => {
      setHasScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await adminService.submitDonation({
      ...formData,
      paymentMethod: "MTN MoMo",
      // Default for now
      memberId: localStorage.getItem("userId")
      // If available
    });
    if (success) {
      setSubmitted(true);
      toast.success("Donation submitted for verification!");
    } else {
      toast.error("Failed to submit donation. Please check your details.");
    }
  };
  return /* @__PURE__ */ jsxs("main", { className: "bg-background font-body-md min-h-screen pb-24", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Support the Movement",
        description: "Your contributions for the growth and sustainability of The Base Movement. Join citizens in Ghana and across the diaspora working for a more productive future.",
        canonical: "/donate"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-stone-200", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 md:px-8 py-16", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, {}),
      /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6 flex items-center gap-4", children: [
          /* @__PURE__ */ jsx(Heart, { className: "w-10 h-10 text-brand-red" }),
          "Support the Movement"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, {}),
        /* @__PURE__ */ jsx("p", { className: "text-stone-500 max-w-2xl mt-6 leading-relaxed font-medium text-sm md:text-base", children: "Your contributions fuel the growth and sustainability of the movement. Join citizens across Ghana and the diaspora in building a more productive and transparent future." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-on-surface text-white relative overflow-hidden py-12", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--brand-green)_0%,_transparent_70%)]" }),
      /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 md:px-8 relative z-10", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--brand-green-full)]" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-white/90 tracking-tight", children: "Financial Mobilization Unit" })
          ] }),
          /* @__PURE__ */ jsxs("h2", { className: "text-3xl md:text-4xl font-meta font-bold tracking-tight mb-4", children: [
            "Total Mobilized: ",
            /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
              "GHS ",
              globalStats.totalRaised.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "max-w-md", children: [
            /* @__PURE__ */ jsx("div", { className: "h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 mb-2", children: /* @__PURE__ */ jsx(
              "div",
              {
                className: "h-full bg-primary shadow-[0_0_15px_rgba(var(--brand-green-rgb),0.5)] transition-all duration-1000",
                style: { width: "68%" }
              }
            ) }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-white/40 tracking-tight", children: "68% of quarterly tactical goal achieved" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white/5 p-6 border border-white/10 backdrop-blur-md rounded-sm", children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-white/40 tracking-tight mb-2", children: "Active Patriots" }),
            /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-white mb-0", children: globalStats.totalMembers.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white/5 p-6 border border-white/10 backdrop-blur-md rounded-sm", children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-white/40 tracking-tight mb-2", children: "Regions Covered" }),
            /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-white mb-0", children: "16/16" })
          ] })
        ] })
      ] }) })
    ] }),
    !submitted && /* @__PURE__ */ jsx("div", { className: cn(
      "sticky top-[72px] z-50 bg-white/95 backdrop-blur-md transition-all duration-300 border-b border-border/40 py-6 shadow-sm",
      hasScrolled ? "translate-y-0" : "translate-y-0"
    ), children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 md:px-8", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "flex-1 max-w-3xl relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-[14px] left-0 right-0 h-[2px] bg-stone-100 z-0" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-4 relative z-10", children: [
        { step: 1, label: "Capital Transfer", id: "payment-section", color: "bg-brand-red", text: "text-destructive-foreground" },
        { step: 2, label: "Profile Details", id: "donor-section", color: "bg-brand-gold", text: "text-accent-foreground" },
        { step: 3, label: "Patriot Link", id: "link-section", color: "bg-brand-green", text: "text-primary-foreground" },
        { step: 4, label: "Verification", id: "receipt-section", color: "bg-brand-green", text: "text-primary-foreground" }
      ].map((s) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center group cursor-pointer", onClick: () => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "center" }), children: [
        /* @__PURE__ */ jsx("div", { className: cn(
          "w-8 h-8 flex items-center justify-center text-micro font-bold transition-all border-2",
          activeStep === s.step ? `${s.color} border-transparent ${s.text} shadow-lg scale-110` : "bg-white border-stone-200 text-stone-400 group-hover:border-stone-400 group-hover:text-stone-600"
        ), children: s.step }),
        /* @__PURE__ */ jsx("span", { className: cn(
          "text-[9px] font-bold tracking-tight mt-3 transition-colors uppercase",
          activeStep === s.step ? "text-stone-900" : "text-stone-400"
        ), children: s.label })
      ] }, s.step)) })
    ] }) }) }) }),
    /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 md:px-8", children: submitted ? /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto bg-white border border-stone-200 rounded-none shadow-sm p-16 text-center mt-20", children: [
      /* @__PURE__ */ jsx("div", { className: "w-24 h-24 bg-brand-green/10 flex items-center justify-center mx-auto mb-8 rounded-full", children: /* @__PURE__ */ jsx(Check, { className: "w-12 h-12 text-brand-green" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-stone-900 mb-4 font-meta tracking-tight", children: "Deployment Authorized" }),
      /* @__PURE__ */ jsx("p", { className: "text-stone-500 mb-10 font-medium leading-relaxed max-w-md mx-auto", children: "Your contribution has been recorded in the mobilization ledger and is awaiting final audit verification." }),
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", size: "lg", className: "h-14 px-12", children: /* @__PURE__ */ jsx(Link, { to: "/", children: "Return to Command Center" }) })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxs("section", { className: "mt-20", children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-stone-900 tracking-tight font-meta", children: "Strategic Priorities" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-400 tracking-tight mt-2 uppercase", children: "Deploy capital to critical movement units." })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: loading ? Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "aspect-[4/5] bg-stone-100 animate-pulse rounded-none border border-stone-200" }, i)) : campaigns.map((c) => /* @__PURE__ */ jsxs(Card, { className: "rounded-none border-stone-200 shadow-sm flex flex-col group hover:shadow-xl transition-all duration-500 overflow-hidden bg-white", children: [
          /* @__PURE__ */ jsxs("div", { className: "aspect-[16/10] bg-stone-100 overflow-hidden relative", children: [
            c.imageUrl ? /* @__PURE__ */ jsx("img", { src: c.imageUrl, alt: c.title, className: "w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center bg-stone-50", children: /* @__PURE__ */ jsx(Activity, { className: "w-12 h-12 text-stone-200 group-hover:text-brand-green/30 transition-colors duration-500" }) }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-4", children: /* @__PURE__ */ jsx("span", { className: "bg-brand-green text-white text-[10px] font-bold tracking-tight px-3 py-1.5 shadow-xl uppercase", children: "Live Mobilization" }) })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-8 flex flex-col flex-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-stone-900 font-meta text-xl mb-3 group-hover:text-brand-green transition-colors tracking-tight", children: c.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-stone-500 mb-8 line-clamp-3 leading-relaxed font-medium", children: c.description }),
            /* @__PURE__ */ jsxs("div", { className: "mt-auto space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end mb-3", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-stone-400 tracking-tight uppercase", children: [
                    "Strength at ",
                    Math.round(c.raisedAmount / c.targetAmount * 100),
                    "%"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold font-meta text-stone-900", children: [
                    "GHS ",
                    c.raisedAmount.toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-2 w-full bg-stone-100 overflow-hidden rounded-full border border-stone-50", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "h-full bg-brand-green transition-all duration-1000 shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.3)]",
                    style: { width: `${Math.min(100, c.raisedAmount / c.targetAmount * 100)}%` }
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "default",
                  onClick: () => {
                    setFormData((prev) => ({ ...prev, campaignId: c.id }));
                    document.getElementById("donor-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  },
                  className: "w-full h-12 rounded-none text-tiny font-bold tracking-tight border-stone-200 hover:border-brand-green/40 hover:text-brand-green hover:bg-stone-50 transition-all shadow-sm active:scale-95",
                  children: [
                    "Direct Capital ",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
                  ]
                }
              )
            ] })
          ] })
        ] }, c.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch pt-20", children: [
        /* @__PURE__ */ jsxs("div", { id: "payment-section", className: "bg-stone-900 text-white p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col scroll-mt-[180px] rounded-none", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4", children: /* @__PURE__ */ jsx(Phone, { className: "w-32 h-32 text-brand-green" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-10", children: [
            /* @__PURE__ */ jsx("span", { className: "w-8 h-8 bg-brand-red text-white flex items-center justify-center font-meta font-bold text-xs", children: "01" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-white font-meta tracking-tight text-xl", children: "Capital Transfer" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-10 flex-1", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-white/30 font-meta mb-2 uppercase", children: "Account Holder" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-brand-green text-2xl tracking-tight leading-none font-meta", children: "Paul Kofi Agyekum" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-white/30 font-meta mb-2 uppercase", children: "MoMo Identifier" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold font-meta tracking-tight text-white text-2xl", children: "+233 538 873 569" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-8 pt-10 border-t border-white/10", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-white/30 font-meta mb-2 uppercase", children: "Network Hub" }),
                /* @__PURE__ */ jsx("p", { className: "text-white/90 font-bold font-meta text-base", children: "MTN Mobile Money" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-white/30 font-meta mb-2 uppercase", children: "Deployment Reference" }),
                /* @__PURE__ */ jsx("p", { className: "text-brand-gold font-bold font-meta text-base italic border-b border-brand-gold/30 pb-1", children: '"THE BASE"' })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-12 p-6 bg-white/5 border border-white/10 flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "text-brand-green mt-1", children: /* @__PURE__ */ jsx(Check, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-white/40 leading-relaxed font-bold tracking-tight", children: "Complete transfer protocol first, then capture receipt for verification." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { id: "donor-section", className: "bg-white border border-stone-200 shadow-sm p-8 md:p-10 flex flex-col scroll-mt-[180px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-10", children: [
            /* @__PURE__ */ jsx("span", { className: "w-8 h-8 bg-brand-gold text-[#92400e] flex items-center justify-center font-meta font-bold text-xs", children: "02" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-stone-900 font-meta tracking-tight text-xl", children: "Contributor Profile" })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, id: "donationForm", className: "space-y-8 flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { htmlFor: "fullName", className: "text-micro font-bold text-stone-400 font-meta tracking-tight uppercase", children: [
                "Identification ",
                /* @__PURE__ */ jsx("span", { className: "text-brand-red", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "fullName",
                  placeholder: "Legal full name",
                  required: true,
                  value: formData.fullName,
                  onChange: (e) => setFormData({ ...formData, fullName: e.target.value }),
                  onFocus: () => setActiveStep(2),
                  className: "w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-bold placeholder:text-stone-200"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { htmlFor: "phone", className: "text-micro font-bold text-stone-400 font-meta tracking-tight uppercase", children: [
                "Contact Line ",
                /* @__PURE__ */ jsx("span", { className: "text-brand-red", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "phone",
                  placeholder: "+233 XX XXX XXXX",
                  required: true,
                  value: formData.phone,
                  onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
                  onFocus: () => setActiveStep(2),
                  className: "w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-bold placeholder:text-stone-200"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxs("label", { htmlFor: "amount", className: "text-micro font-bold text-stone-400 font-meta tracking-tight uppercase", children: [
                  "Amount (GHS) ",
                  /* @__PURE__ */ jsx("span", { className: "text-brand-red", children: "*" })
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "amount",
                    type: "number",
                    placeholder: "0.00",
                    required: true,
                    value: formData.amount,
                    onChange: (e) => setFormData({ ...formData, amount: e.target.value }),
                    onFocus: () => setActiveStep(2),
                    className: "w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-bold font-meta placeholder:text-stone-200"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxs("label", { htmlFor: "country", className: "text-micro font-bold text-stone-400 font-meta tracking-tight uppercase", children: [
                  "Jurisdiction ",
                  /* @__PURE__ */ jsx("span", { className: "text-brand-red", children: "*" })
                ] }),
                /* @__PURE__ */ jsx(
                  "select",
                  {
                    id: "country",
                    required: true,
                    value: formData.country,
                    onChange: (e) => setFormData({ ...formData, country: e.target.value }),
                    onFocus: () => setActiveStep(2),
                    disabled: countriesLoading,
                    className: "w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-bold appearance-none disabled:opacity-50",
                    children: countriesLoading ? /* @__PURE__ */ jsx("option", { children: "Synchronizing..." }) : countries.length > 0 ? countries.map((c) => /* @__PURE__ */ jsx("option", { value: c.name, children: c.name }, c.id)) : /* @__PURE__ */ jsx("option", { value: "Ghana", children: "Ghana" })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { htmlFor: "campaign", className: "text-micro font-bold text-stone-400 font-meta tracking-tight uppercase", children: [
                "Target Cell ",
                /* @__PURE__ */ jsx("span", { className: "text-brand-red", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "select",
                {
                  id: "campaign",
                  required: true,
                  value: formData.campaignId,
                  onChange: (e) => setFormData({ ...formData, campaignId: e.target.value }),
                  onFocus: () => setActiveStep(2),
                  className: "w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-bold appearance-none",
                  children: campaigns.map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.title }, c.id))
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { id: "link-section", className: "bg-white border border-stone-200 shadow-sm p-8 md:p-10 flex flex-col scroll-mt-[180px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-10", children: [
            /* @__PURE__ */ jsx("span", { className: "w-8 h-8 bg-stone-900 text-white flex items-center justify-center font-meta font-bold text-xs", children: "03" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-stone-900 font-meta tracking-tight text-xl", children: isLoggedIn ? "Patriot Profile" : "Link Patriot" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-8 flex-1 flex flex-col", children: /* @__PURE__ */ jsxs("div", { className: "bg-stone-50 border border-stone-100 p-8 rounded-none space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Activity, { className: "w-5 h-5 text-brand-green" }),
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-stone-900 font-meta tracking-tight text-sm uppercase", children: isLoggedIn ? "Active Session" : "Movement ID" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-stone-500 font-medium leading-relaxed tracking-tight", children: isLoggedIn ? "Automatic recognition active. This deployment will be linked to your patriot profile." : "Enter your movement identification number to synchronize this capital with your profile." }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "membershipNumber", className: "text-micro font-bold text-stone-400 font-meta tracking-tight uppercase", children: "Movement ID" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "membershipNumber",
                  placeholder: "GH-2028-XXXXXX",
                  value: formData.membershipNumber,
                  onChange: (e) => setFormData({ ...formData, membershipNumber: e.target.value }),
                  onFocus: () => setActiveStep(3),
                  className: "w-full bg-white px-4 h-12 text-stone-900 text-sm border border-stone-200 focus:border-stone-900 outline-none transition-all font-bold shadow-sm"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-4 cursor-pointer group pt-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: formData.showOnDashboard,
                    onChange: (e) => setFormData({ ...formData, showOnDashboard: e.target.checked }),
                    onFocus: () => setActiveStep(3),
                    className: "peer h-5 w-5 cursor-pointer appearance-none border border-stone-300 rounded-none checked:bg-brand-green checked:border-brand-green transition-all"
                  }
                ),
                /* @__PURE__ */ jsx(Check, { className: "absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-stone-600 font-bold tracking-tight group-hover:text-stone-900 transition-colors", children: "Publish to personal dossier" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { id: "receipt-section", className: "bg-white border border-stone-200 shadow-sm p-8 md:p-10 flex flex-col scroll-mt-[180px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-10", children: [
            /* @__PURE__ */ jsx("span", { className: "w-8 h-8 bg-brand-green text-white flex items-center justify-center font-meta font-bold text-xs", children: "04" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-stone-900 font-meta tracking-tight text-xl", children: "Audit Trail" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-8 flex-1 flex flex-col", children: [
            /* @__PURE__ */ jsxs("div", { className: "border-2 border-dashed border-stone-200 bg-stone-50 p-12 text-center hover:bg-stone-100 hover:border-stone-400 transition-all group cursor-pointer relative flex-1 flex flex-col justify-center", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  form: "donationForm",
                  accept: ".jpg,.jpeg,.png,.pdf",
                  onFocus: () => setActiveStep(4),
                  className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10",
                  id: "receipt",
                  required: true
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-white shadow-sm border border-stone-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500", children: /* @__PURE__ */ jsx(ArrowDownToLine, { className: "w-6 h-6 text-stone-300 group-hover:text-brand-green transition-colors" }) }),
              /* @__PURE__ */ jsx("p", { className: "text-tiny text-stone-900 font-bold tracking-tight mb-1 uppercase font-meta", children: "Synchronize Receipt" }),
              /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-bold tracking-tight uppercase", children: "JPG, PNG, or PDF" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-stone-50 p-6 border border-stone-100", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
                /* @__PURE__ */ jsx(Globe, { className: "w-5 h-5 text-brand-green" }),
                /* @__PURE__ */ jsx("h4", { className: "font-bold text-stone-900 font-meta tracking-tight text-micro uppercase", children: "Global Diaspora Hub" })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-stone-500 leading-relaxed font-medium tracking-tight", children: [
                "Use deployment code ",
                /* @__PURE__ */ jsx("span", { className: "text-brand-green font-bold", children: "THEBASEM" }),
                " on TapTap for resource scaling bonus."
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "submit",
                form: "donationForm",
                variant: "primary",
                className: "w-full py-10 flex items-center justify-center gap-3 rounded-none shadow-xl shadow-brand-green/10 text-base",
                children: [
                  /* @__PURE__ */ jsx(Heart, { className: "w-5 h-5" }),
                  "Authorize Contribution"
                ]
              }
            )
          ] })
        ] })
      ] }),
      pastCampaigns.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-32", children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold text-stone-900 tracking-tight font-meta flex items-center gap-4", children: [
            /* @__PURE__ */ jsx(Check, { className: "w-8 h-8 text-brand-green" }),
            "Strategic Victories"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-400 tracking-tight mt-2 uppercase", children: "Historical proof of patriot mobilization success." })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", children: pastCampaigns.map((c) => /* @__PURE__ */ jsxs(Card, { className: "bg-white border border-stone-200 p-6 flex flex-col relative grayscale hover:grayscale-0 transition-all duration-700 opacity-75 hover:opacity-100 rounded-none", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-4 z-10", children: /* @__PURE__ */ jsxs("span", { className: "bg-stone-900 text-white text-[9px] font-bold tracking-tight px-3 py-1 shadow-xl flex items-center gap-1 uppercase", children: [
            /* @__PURE__ */ jsx(Check, { className: "w-3 h-3 text-brand-green" }),
            " 100% Secured"
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "aspect-square bg-stone-50 mb-6 overflow-hidden rounded-none border border-stone-100", children: c.imageUrl && /* @__PURE__ */ jsx("img", { src: c.imageUrl, alt: c.title, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) }),
          /* @__PURE__ */ jsx("h4", { className: "font-bold text-stone-900 font-meta text-sm mb-2 tracking-tight uppercase", children: c.title }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-stone-500 mb-8 line-clamp-2 leading-relaxed", children: c.description }),
          /* @__PURE__ */ jsxs("div", { className: "mt-auto pt-6 border-t border-stone-100 flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight uppercase", children: "Total Impact" }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-brand-green font-meta", children: [
                "GHS ",
                c.raisedAmount.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold text-stone-300 tracking-tight italic uppercase", children: "Decommissioned" })
          ] })
        ] }, c.id)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-32", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold text-stone-900 tracking-tight font-meta flex items-center gap-4", children: [
              /* @__PURE__ */ jsx(Activity, { className: "w-8 h-8 text-brand-green" }),
              "Capital Deployment History"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-400 tracking-tight mt-2 uppercase", children: "Live immutable record of member mobilization." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-8 py-4 bg-white border border-stone-200 text-center rounded-none shadow-sm min-w-[160px]", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight uppercase mb-1", children: "Movement Reserves" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-stone-900 tracking-tight font-meta", children: [
                "GHS ",
                globalStats.totalRaised.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "px-8 py-4 bg-brand-green/10 border border-brand-green/20 text-center rounded-none shadow-sm min-w-[160px]", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-brand-green tracking-tight uppercase mb-1", children: "Active Patriots" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-brand-green tracking-tight font-meta", children: globalStats.totalMembers })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-8 p-3 bg-stone-50 border border-stone-200 mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex bg-stone-100 p-1 rounded-none border border-stone-200 shadow-inner", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: historyTab === "contributions" ? "active-tab" : "ghost",
                onClick: () => setHistoryTab("contributions"),
                className: cn(
                  "px-10 h-12 text-tiny font-bold tracking-tight rounded-none transition-all",
                  historyTab === "contributions" ? "" : "text-stone-500 hover:text-stone-900"
                ),
                children: "Mobilization History"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: historyTab === "spending" ? "active-tab" : "ghost",
                onClick: () => setHistoryTab("spending"),
                className: cn(
                  "px-10 h-12 text-tiny font-bold tracking-tight rounded-none transition-all",
                  historyTab === "spending" ? "" : "text-stone-500 hover:text-stone-900"
                ),
                children: "Spending & Allocation"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-6 flex-1 justify-end", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-md", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Search mobilization ledger...",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  className: "w-full h-12 pl-12 pr-4 bg-white border border-stone-200 rounded-none text-sm font-bold tracking-tight focus:border-stone-900 outline-none transition-all placeholder:text-stone-300"
                }
              )
            ] }),
            historyTab === "contributions" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: contributionFilter === "all" ? "active-tab" : "default",
                  onClick: () => setContributionFilter("all"),
                  className: "px-6 h-12 text-[10px] font-bold tracking-tight rounded-none transition-all uppercase shadow-sm active:scale-95",
                  children: "All Records"
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: contributionFilter === "me" ? "active-tab" : "default",
                  onClick: () => setContributionFilter("me"),
                  className: "px-6 h-12 text-[10px] font-bold tracking-tight rounded-none transition-all uppercase shadow-sm active:scale-95",
                  children: "My Records"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-12", children: [
          /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsx(Card, { className: "rounded-none border-stone-200 shadow-sm overflow-hidden bg-white h-full", children: /* @__PURE__ */ jsx("div", { className: "p-8", children: /* @__PURE__ */ jsx(LiveContributionFeed, {}) }) }) }),
          /* @__PURE__ */ jsx("div", { className: "lg:col-span-3", children: /* @__PURE__ */ jsxs(Card, { className: "rounded-none border-stone-200 shadow-sm overflow-hidden bg-white h-full", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-8 border-b border-stone-100", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-stone-900 font-meta tracking-tight text-lg", children: "Tactical Deployment Ledger" }),
              /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: handleDownload, className: "text-tiny font-bold uppercase tracking-tight text-stone-500 hover:text-stone-900", children: [
                /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
                " Export CSV"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "hidden sm:block overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-stone-50 border-b border-stone-200", children: [
                /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-stone-400 tracking-tight uppercase", children: "Deployment details" }),
                /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-stone-400 tracking-tight uppercase", children: "Capital" }),
                /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-stone-400 tracking-tight uppercase", children: "Channel" }),
                /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-stone-400 tracking-tight uppercase", children: "Verification" }),
                /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-stone-400 tracking-tight uppercase text-right", children: "Audit" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-stone-100", children: loading ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-16 text-center text-stone-400 text-tiny font-bold tracking-tight italic uppercase", children: "Synchronizing tactical ledger..." }) }) : historyTab === "contributions" ? (() => {
                const data = contributionFilter === "all" ? publicHistory : personalHistory;
                const filtered = data.filter(
                  (item) => item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || item.amount.includes(searchQuery)
                );
                return filtered.length > 0 ? filtered.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-stone-50/50 transition-colors group", children: [
                  /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-900 tracking-tight mb-1", children: item.fullName }),
                    /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-brand-green tracking-tight uppercase", children: item.campaignTitle || "Strategic Strategic Fund" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-stone-400 font-medium mt-1 uppercase", children: item.date })
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-stone-900 font-meta", children: item.amount }) }),
                  /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-stone-500 uppercase", children: item.method }) }),
                  /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: cn(
                      "w-2 h-2 rounded-full",
                      item.status === "Verified" ? "bg-brand-green shadow-[0_0_8px_var(--brand-green-full)]" : "bg-brand-gold shadow-[0_0_8px_var(--brand-gold-full)]"
                    ) }),
                    /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-stone-700 uppercase", children: item.status })
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "p-6 text-right", children: /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-stone-300 font-mono", children: item.reference }) })
                ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-16 text-center text-stone-400 text-tiny font-bold tracking-tight italic uppercase", children: "No records found matching search." }) });
              })() : spendingHistory.length > 0 ? spendingHistory.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-stone-50/50 transition-colors group", children: [
                /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-900 tracking-tight mb-1", children: item.description }),
                  /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-brand-red tracking-tight uppercase", children: [
                    item.chapter,
                    " Hub • ",
                    item.category
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-stone-400 font-medium mt-1 uppercase", children: item.date })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-stone-900 font-meta", children: item.amount }) }),
                /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsx("span", { className: cn(
                  "text-micro font-bold px-2 py-1 rounded-sm uppercase",
                  item.type === "Expenditure" ? "bg-brand-red/10 text-brand-red" : "bg-brand-green/10 text-brand-green"
                ), children: item.type }) }),
                /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-brand-green" }),
                  /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-stone-700 uppercase", children: "Audited" })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-6 text-right", children: /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-stone-300 font-mono", children: item.id }) })
              ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-16 text-center text-stone-400 text-tiny font-bold tracking-tight italic uppercase", children: "No allocation records found." }) }) })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "sm:hidden divide-y divide-stone-100", children: (() => {
              const data = contributionFilter === "all" ? publicHistory : personalHistory;
              const filtered = data.filter(
                (item) => item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || item.amount.includes(searchQuery)
              );
              return filtered.length > 0 ? filtered.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "p-8 bg-white space-y-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-900 tracking-tight normal-case", children: item.fullName }),
                    /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-bold tracking-tight mt-1", children: item.date })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "px-3 py-1 text-micro font-bold tracking-tight rounded-none bg-brand-green/10 text-brand-green", children: "Verified" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight mb-1", children: "Capital deployment" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-stone-900 font-meta", children: item.amount })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight mb-1", children: "Channel" }),
                    /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-900 tracking-tight", children: item.method })
                  ] })
                ] })
              ] }, idx)) : /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-stone-400 text-tiny font-bold tracking-tight italic uppercase", children: "No records matching search." });
            })() }),
            /* @__PURE__ */ jsxs("div", { className: "p-8 bg-stone-50 border-t border-stone-100 flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight", children: "Live mobilization ledger" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setIsHistoryModalOpen(true),
                  className: "text-micro font-bold text-brand-green tracking-tight hover:text-stone-900 transition-all border-b border-brand-green/30 pb-1",
                  children: "Full operational audit"
                }
              )
            ] })
          ] }) })
        ] })
      ] }),
      isHistoryModalOpen && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-stone-900/60 backdrop-blur-md", onClick: () => setIsHistoryModalOpen(false) }),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-4xl bg-white border border-stone-200 shadow-2xl overflow-hidden rounded-none flex flex-col max-h-[85vh]", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-8 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx(Activity, { className: "w-6 h-6 text-brand-green shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.3)]" }),
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-stone-900 font-meta tracking-tight text-xl leading-none", children: "Capital Deployment Ledger" })
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => setIsHistoryModalOpen(false),
                className: "text-stone-300 hover:text-brand-red hover:bg-brand-red/5 transition-all",
                children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-0", children: publicHistory.length > 0 ? /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-stone-50 border-b border-stone-200", children: [
              /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-stone-400 tracking-tight uppercase", children: "Contributor" }),
              /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-stone-400 tracking-tight uppercase", children: "Capital" }),
              /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-stone-400 tracking-tight uppercase", children: "Cell" }),
              /* @__PURE__ */ jsx("th", { className: "p-6 text-micro font-bold text-stone-400 tracking-tight uppercase text-right", children: "Verification" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-stone-100", children: publicHistory.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-stone-50 transition-colors group", children: [
              /* @__PURE__ */ jsxs("td", { className: "p-6", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-900 tracking-tight", children: item.fullName }),
                /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-bold tracking-tight mt-1 uppercase", children: item.date })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-900 font-meta", children: item.amount }) }),
              /* @__PURE__ */ jsx("td", { className: "p-6", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-500 tracking-tight uppercase", children: item.campaignTitle || "Strategic Fund" }) }),
              /* @__PURE__ */ jsx("td", { className: "p-6 text-right", children: /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-2 px-3 py-1 text-micro font-bold tracking-tight rounded-none bg-brand-green/10 text-brand-green", children: "Verified" }) })
            ] }, idx)) })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "py-32 px-8 text-center bg-stone-50/50", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-white shadow-sm border border-stone-100 flex items-center justify-center mx-auto mb-8 rounded-none", children: /* @__PURE__ */ jsx(Activity, { className: "w-8 h-8 text-stone-200" }) }),
            /* @__PURE__ */ jsx("h4", { className: "text-xl font-bold text-stone-900 mb-3 font-meta tracking-tight uppercase", children: "Deployment records inactive" }),
            /* @__PURE__ */ jsx("p", { className: "text-tiny text-stone-400 max-w-sm mx-auto mb-8 font-bold tracking-tight leading-relaxed uppercase", children: "No capital deployment detected for this session. Support the movement cells to build a technically robust Ghana." })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "p-8 border-t border-stone-100 flex items-center justify-between bg-stone-50 sticky bottom-0 z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-micro font-bold text-stone-400 tracking-tight uppercase", children: [
              /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_var(--brand-green-full)]" }),
              contributions.length,
              " deployment records secured"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "default",
                  onClick: () => setIsHistoryModalOpen(false),
                  className: "px-6 h-12 border-stone-200 text-stone-400 font-bold text-micro tracking-tight rounded-none hover:text-brand-green hover:bg-stone-50 transition-all flex items-center gap-2 uppercase shadow-sm active:scale-95",
                  children: [
                    /* @__PURE__ */ jsx(ArrowDownToLine, { className: "w-4 h-4" }),
                    " Download Audit"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  onClick: () => {
                    setIsHistoryModalOpen(false);
                    document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  },
                  className: "px-8 h-12 bg-stone-900 text-white font-bold text-micro tracking-tight rounded-none hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-black/10 uppercase",
                  children: [
                    /* @__PURE__ */ jsx(Heart, { className: "w-4 h-4 text-brand-green" }),
                    " Contribute"
                  ]
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Donate as default
};
