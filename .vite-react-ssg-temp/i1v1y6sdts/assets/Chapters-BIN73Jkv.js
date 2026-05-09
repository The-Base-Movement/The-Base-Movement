import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { c as cn, B as Button, h as useChapters, S as SEO, b as BrandLine, I as Input, a as adminService } from "../main.mjs";
import { toast } from "sonner";
import { MapPin, ShieldCheck, Users, Zap, ArrowRight, Filter, Plus, Building2, Send, Search, Globe } from "lucide-react";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { P as Pagination, a as PaginationContent, b as PaginationItem, c as PaginationPrevious, d as PaginationLink, e as PaginationNext } from "./pagination-6T6KqOsk.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-D9Fxht2W.js";
import { T as Textarea } from "./textarea-samz4tOC.js";
import { S as Sheet, a as SheetTrigger, b as SheetContent, c as SheetHeader, d as SheetTitle } from "./sheet-Dt1-s5es.js";
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
import "@radix-ui/react-dialog";
function ChapterCard({ chapter, requestSent, countryFlags: countryFlags2, handleJoinRequest }) {
  const isRequestPending = requestSent[chapter.id];
  const isActive = chapter.status === "Active" || chapter.status === "Member";
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.5 },
      className: "h-full",
      children: /* @__PURE__ */ jsxs(
        Link,
        {
          to: `/dashboard/chapters/${chapter.id}`,
          className: "group relative bg-white border border-stone-200 rounded-none overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col h-full",
          children: [
            /* @__PURE__ */ jsx("div", { className: "h-1.5 w-full bg-stone-100 relative overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)] opacity-80 group-hover:opacity-100 transition-opacity" }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-8 flex-1 flex flex-col", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-14 h-14 bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-300 group-hover:text-[var(--brand-green)] group-hover:border-[var(--brand-green)]/20 group-hover:bg-[var(--brand-green)]/5 transition-all duration-500", children: chapter.country === "Ghana" ? /* @__PURE__ */ jsx(MapPin, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx("span", { className: "text-2xl filter grayscale group-hover:grayscale-0 transition-all duration-500", children: countryFlags2[chapter.country] || "🌍" }) }),
                  isActive && /* @__PURE__ */ jsx("div", { className: "absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3 h-3 text-white" }) })
                ] }),
                /* @__PURE__ */ jsx("div", { className: cn(
                  "px-3 py-1 text-micro font-bold tracking-tight normal-case",
                  isRequestPending ? "bg-amber-50 text-amber-600 border border-amber-100" : isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-stone-50 text-stone-400 border border-stone-100"
                ), children: isRequestPending ? "Request Pending" : chapter.status || "Verified Hub" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 mb-8", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-stone-900 group-hover:text-[var(--brand-green)] transition-colors text-xl font-bold tracking-tight font-meta leading-tight normal-case", children: chapter.name }),
                /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 text-stone-400", children: /* @__PURE__ */ jsxs("p", { className: "text-tiny font-bold tracking-tight normal-case", children: [
                  chapter.city_or_region,
                  " • ",
                  chapter.country
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 py-6 border-y border-stone-50 mt-auto", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 normal-case tracking-tight mb-1", children: "Active members" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Users, { className: "w-3.5 h-3.5 text-[var(--brand-green)]" }),
                    /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-stone-900 font-meta tracking-tight", children: chapter.member_count })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 normal-case tracking-tight mb-1", children: "Status" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Zap, { className: "w-3.5 h-3.5 text-warm-gold" }),
                    /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-stone-900 normal-case tracking-tight", children: "Active Hub" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-8", children: chapter.status === "Join Chapter" && !isRequestPending ? /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "primary",
                  onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleJoinRequest(e, chapter.id);
                  },
                  className: "w-full h-14 transition-all duration-300 flex items-center justify-center gap-3 text-tiny font-bold tracking-tight normal-case rounded-none",
                  children: [
                    "Join Chapter ",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 transition-transform group-hover:translate-x-1" })
                  ]
                }
              ) : /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "default",
                  className: cn(
                    "w-full h-14 border transition-all duration-500 flex items-center justify-center gap-3 text-tiny font-bold tracking-tight normal-case rounded-none active:scale-95 shadow-sm",
                    isRequestPending ? "border-amber-200 bg-amber-50 text-amber-600 cursor-default" : "border-stone-100 text-stone-400 hover:border-brand-green/20 hover:text-brand-green hover:bg-stone-50"
                  ),
                  children: [
                    isRequestPending ? "Request Sent" : "View Details",
                    !isRequestPending && /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 transition-transform group-hover:translate-x-1" })
                  ]
                }
              ) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--brand-green)]/0 to-transparent group-hover:via-[var(--brand-green)]/20 transition-all duration-700" })
          ]
        }
      )
    }
  );
}
const countryFlags = {
  "Germany": "🇩🇪",
  "United Kingdom": "🇬🇧",
  "Australia": "🇦🇺",
  "United States": "🇺🇸",
  "Austria": "🇦🇹",
  "Belgium": "🇧🇪",
  "Brazil": "🇧🇷",
  "Burkina Faso": "🇧🇫",
  "Cameroon": "🇨🇲",
  "Canada": "🇨🇦",
  "China": "🇨🇳",
  "Czech Republic": "🇨🇿",
  "Denmark": "🇩🇰",
  "Egypt": "🇪🇬",
  "Finland": "🇫🇮",
  "France": "🇫🇷",
  "India": "🇮🇳",
  "Ireland": "🇮🇪",
  "Israel": "🇮🇱",
  "Italy": "🇮🇹",
  "Ivory Coast": "🇨🇮",
  "Japan": "🇯🇵",
  "Kenya": "🇰🇪",
  "Kuwait": "🇰🇼",
  "Luxembourg": "🇱🇺",
  "Malaysia": "🇲🇾",
  "Mexico": "🇲🇽",
  "Morocco": "🇲🇦",
  "Netherlands": "🇳🇱",
  "New Zealand": "🇳🇿",
  "Nigeria": "🇳🇬",
  "Norway": "🇳🇴",
  "Poland": "🇵🇱",
  "Portugal": "🇵🇹",
  "Qatar": "🇶🇦",
  "Russia": "🇷🇺",
  "Saudi Arabia": "🇸🇦",
  "Senegal": "🇸🇳",
  "Singapore": "🇸🇬",
  "South Africa": "🇿🇦",
  "South Korea": "🇰🇷",
  "Spain": "🇪🇸",
  "Sweden": "🇸🇪",
  "Switzerland": "🇨🇭",
  "Tanzania": "🇹🇿",
  "Thailand": "🇹🇭",
  "Togo": "🇹🇬",
  "Turkey": "🇹🇷",
  "United Arab Emirates": "🇦🇪"
};
function Chapters() {
  const { chapters } = useChapters();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ghana");
  const [requestSent, setRequestSent] = useState({});
  const ghanaChapters = chapters.filter((c) => c.country === "Ghana");
  const diasporaChapters = chapters.filter((c) => c.country !== "Ghana");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [chapterLocation, setChapterLocation] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const handleJoinRequest = (e, chapterId) => {
    e.preventDefault();
    e.stopPropagation();
    setRequestSent((prev) => ({ ...prev, [chapterId]: true }));
  };
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await adminService.submitChapterApplication({
        proposed_chapter_name: chapterLocation,
        region: "National",
        constituency: "To be assigned",
        vision_statement: chapterDescription,
        experience_summary: "Submitted via Chapter Request Hub"
      });
      if (success) {
        setSubmissionSuccess(true);
        setTimeout(() => {
          setIsRequestModalOpen(false);
          setSubmissionSuccess(false);
          setChapterLocation("");
          setChapterDescription("");
        }, 500);
      } else {
        toast.error("Failed to submit chapter request. Please try again.");
      }
    } catch (error) {
      console.error("[CHAPTERS] Submission failed:", error);
      toast.error("Strategic communication link failed.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const filteredChapters = (activeTab === "ghana" ? ghanaChapters : diasporaChapters).filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.city_or_region.toLowerCase().includes(searchTerm.toLowerCase()) || c.country.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const itemsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredChapters.length / itemsPerPage);
  const paginatedChapters = filteredChapters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  useState(() => {
    setCurrentPage(1);
  });
  const FilterSection = ({ isMobile = false }) => /* @__PURE__ */ jsxs("div", { className: cn("space-y-8", isMobile && "pb-20"), children: [
    /* @__PURE__ */ jsxs("div", { className: cn("bg-white p-6 shadow-sm", !isMobile && "border border-stone-200"), children: [
      /* @__PURE__ */ jsx("h3", { className: "text-tiny font-bold text-stone-400 normal-case tracking-tight mb-6", children: "Chapter Filters" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold tracking-tight text-stone-500", children: "Search Chapters" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "City, region, country...",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "w-full h-11 pl-10 pr-4 bg-stone-50 border border-stone-200 rounded-none text-xs focus:ring-1 focus:ring-brand-green outline-none transition-all font-bold tracking-tight"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold tracking-tight text-stone-500", children: "Region Selection" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: activeTab === "ghana" ? "active-tab" : "default",
                onClick: () => setActiveTab("ghana"),
                className: cn(
                  "w-full h-12 justify-between px-4 text-tiny font-bold tracking-tight border rounded-none transition-all shadow-sm active:scale-95",
                  activeTab === "ghana" ? "" : "text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50"
                ),
                children: [
                  "Ghana Regional",
                  /* @__PURE__ */ jsx(Building2, { className: cn("w-4 h-4", activeTab === "ghana" ? "text-[hsl(var(--active-tab-text))]" : "text-stone-300") })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: activeTab === "diaspora" ? "active-tab" : "default",
                onClick: () => setActiveTab("diaspora"),
                className: cn(
                  "w-full h-12 justify-between px-4 text-tiny font-bold tracking-tight border rounded-none transition-all shadow-sm active:scale-95",
                  activeTab === "diaspora" ? "" : "text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50"
                ),
                children: [
                  "Global Diaspora",
                  /* @__PURE__ */ jsx(Globe, { className: cn("w-4 h-4", activeTab === "diaspora" ? "text-[hsl(var(--active-tab-text))]" : "text-stone-300") })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-stone-100", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "primary",
              onClick: () => setIsRequestModalOpen(true),
              className: "w-full font-bold tracking-tight text-tiny h-12 px-6 rounded-none shadow-sm normal-case transition-all duration-300",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
                " Request a Chapter"
              ]
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-bold tracking-tight mt-3 text-center italic", children: "Don't see your region? Propose a new hub." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-charcoal-dark p-6 text-white overflow-hidden relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-24 h-24 bg-[var(--brand-green)]/10 -mr-12 -mt-12 blur-2xl" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[var(--brand-green)] text-micro font-bold tracking-tight normal-case", children: "Global Network" }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-meta font-bold tracking-tight mt-1", children: chapters.length }),
          /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-bold tracking-tight", children: "Active Chapters" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-px bg-white/10" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-warm-gold text-micro font-bold tracking-tight normal-case", children: "Global Presence" }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-meta font-bold tracking-tight mt-1", children: new Set(chapters.map((c) => c.country)).size }),
          /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-bold tracking-tight", children: "Active Countries" })
        ] })
      ] })
    ] })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-stone-50/50 pb-20", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Movement Chapters",
        description: "Connect with your local community. Organize, mobilize, and build the Ghana we deserve through our global network of regional hubs.",
        canonical: "/chapters"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-stone-200", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, {}),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-on-surface mb-4 font-meta", children: "Movement Chapters" }),
        /* @__PURE__ */ jsx(BrandLine, {}),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground/80 max-w-2xl mt-4 leading-relaxed font-bold tracking-tight font-body-md", children: [
          "Connect with your local community. Organize, mobilize, and build the Ghana we deserve through our global network of ",
          chapters.length,
          "+ regional hubs."
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 sm:px-6 lg:px-8 mt-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:hidden mb-8 flex gap-4", children: [
        /* @__PURE__ */ jsxs(Sheet, { children: [
          /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "default", className: "flex-1 h-12 gap-2 font-bold tracking-tight text-xs border-stone-200 shadow-sm active:scale-95", children: [
            /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4" }),
            "Filter & Search"
          ] }) }),
          /* @__PURE__ */ jsxs(SheetContent, { side: "left", className: "w-[300px] p-0 border-r-0", children: [
            /* @__PURE__ */ jsx(SheetHeader, { className: "p-6 border-b border-stone-100", children: /* @__PURE__ */ jsx(SheetTitle, { className: "font-meta font-bold tracking-tight text-lg", children: "Filters" }) }),
            /* @__PURE__ */ jsx("div", { className: "overflow-y-auto h-full p-6", children: /* @__PURE__ */ jsx(FilterSection, { isMobile: true }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "primary",
            onClick: () => setIsRequestModalOpen(true),
            className: "flex-1 font-bold text-xs h-12 rounded-none",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              " Request"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-12", children: [
        /* @__PURE__ */ jsx("aside", { className: "hidden lg:block lg:w-[320px] shrink-0 lg:sticky lg:top-8 lg:self-start", children: /* @__PURE__ */ jsx(FilterSection, {}) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6", children: paginatedChapters.map((chapter) => /* @__PURE__ */ jsx(
            ChapterCard,
            {
              chapter,
              requestSent,
              countryFlags,
              handleJoinRequest
            },
            chapter.id
          )) }),
          totalPages > 1 && /* @__PURE__ */ jsx("div", { className: "mt-12 pt-12 border-t border-stone-100", children: /* @__PURE__ */ jsx(Pagination, { children: /* @__PURE__ */ jsxs(PaginationContent, { children: [
            /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsx(
              PaginationPrevious,
              {
                onClick: () => setCurrentPage((prev) => Math.max(1, prev - 1)),
                className: cn("cursor-pointer", currentPage === 1 && "opacity-30 pointer-events-none")
              }
            ) }),
            Array.from({ length: totalPages }).map((_, i) => /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsx(
              PaginationLink,
              {
                isActive: currentPage === i + 1,
                onClick: () => setCurrentPage(i + 1),
                className: "cursor-pointer font-bold tracking-tight",
                children: i + 1
              }
            ) }, i)),
            /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsx(
              PaginationNext,
              {
                onClick: () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)),
                className: cn("cursor-pointer", currentPage === totalPages && "opacity-30 pointer-events-none")
              }
            ) })
          ] }) }) }),
          filteredChapters.length === 0 && /* @__PURE__ */ jsxs("div", { className: "py-20 text-center border-2 border-dashed border-stone-200", children: [
            /* @__PURE__ */ jsx(Building2, { className: "w-12 h-12 text-stone-200 mx-auto mb-4" }),
            /* @__PURE__ */ jsx("p", { className: "text-stone-400 font-bold tracking-tight", children: "No strategic hubs found matching your query." }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                onClick: () => setSearchTerm(""),
                className: "mt-4 text-brand-green font-bold text-xs",
                children: "Clear search parameters"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-20 border-l-4 border-primary pl-8 py-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-lg leading-relaxed italic max-w-2xl font-body-md", children: '"Our strength lies in our unity across borders. Together, we build the foundations of a new Ghana. Every chapter is a pillar of our collective destiny."' }),
            /* @__PURE__ */ jsx("div", { className: "mt-6 h-1 w-24 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: isRequestModalOpen, onOpenChange: setIsRequestModalOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[500px] border-none rounded-none p-0 overflow-hidden bg-white", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { className: "p-8 bg-charcoal-dark text-white relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsx(Building2, { className: "w-5 h-5 text-[var(--brand-green)]" }),
          /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl font-bold tracking-tight font-meta normal-case", children: "Request a chapter" })
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { className: "text-stone-400 text-xs font-bold tracking-tight", children: "Propose a new chapter for your region. Requests are reviewed by the National Executive Committee for strategic alignment and leadership verification." })
      ] }),
      submissionSuccess ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center flex flex-col items-center justify-center space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-emerald-50 rounded-none flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx(Send, { className: "w-8 h-8 text-[var(--brand-green)]" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-stone-900", children: "Request Submitted Successfully" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-stone-500 max-w-xs mx-auto", children: [
          "Your proposal for the ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-[var(--brand-green)]", children: chapterLocation }),
          " chapter has been logged. Our regional coordinators will contact you shortly."
        ] })
      ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmitRequest, className: "p-8 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-micro font-bold text-stone-400 tracking-tight", children: "Chapter location / country" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                required: true,
                placeholder: "e.g. Kumasi, Ashanti Region or London, UK",
                value: chapterLocation,
                onChange: (e) => setChapterLocation(e.target.value),
                className: "pl-10 h-12 bg-stone-50 border-stone-200 rounded-none focus:ring-brand-green font-medium text-sm"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-micro font-bold text-stone-400 tracking-tight", children: "Why start a chapter here?" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              required: true,
              placeholder: "Describe the local interest and your vision for organizing this hub...",
              value: chapterDescription,
              onChange: (e) => setChapterDescription(e.target.value),
              className: "min-h-[120px] bg-stone-50 border-stone-200 rounded-none focus:ring-brand-green font-medium text-sm p-4"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(DialogFooter, { className: "pt-4", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "default",
              onClick: () => setIsRequestModalOpen(false),
              className: "flex items-center gap-2 text-stone-400 hover:text-[var(--brand-red)] transition-colors text-micro font-bold tracking-tight rounded-none",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              variant: "primary",
              disabled: isSubmitting,
              className: "h-12 font-bold text-micro tracking-tight rounded-none min-w-[140px]",
              children: isSubmitting ? "Processing..." : "Submit Request"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Chapters as default
};
