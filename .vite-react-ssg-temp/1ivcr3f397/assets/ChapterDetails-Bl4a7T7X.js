import { jsx, jsxs } from "react/jsx-runtime";
import { useParams, Link } from "react-router-dom";
import { MapPin, Users, Share2, Globe, Calendar, ChevronRight, Mail, Phone, ShieldCheck } from "lucide-react";
import { h as useChapters, L as LoadingScreen, B as Button, e as ShareModal } from "../main.mjs";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import { useState } from "react";
import "vite-react-ssg";
import "@tanstack/react-query";
import "react-helmet-async";
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
function ChapterDetails() {
  const { id } = useParams();
  const { chapters, isLoading } = useChapters();
  const chapter = chapters.find((c) => c.id === id);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  if (isLoading) return /* @__PURE__ */ jsx(LoadingScreen, {});
  if (!chapter) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-stone-50", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-stone-900 mb-4", children: "Chapter not found" }),
      /* @__PURE__ */ jsx(Link, { to: "/dashboard/chapters", children: /* @__PURE__ */ jsx(Button, { variant: "default", className: "rounded-none", children: "Back to chapters" }) })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-stone-50/50 pb-20", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-stone-200 sticky top-0 z-30", children: /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-8 py-6", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx(Breadcrumbs, {}) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsx("span", { className: `px-3 py-0.5 rounded-none text-micro font-bold tracking-tight ${chapter.status === "Active" || chapter.status === "Member" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`, children: chapter.status }),
            /* @__PURE__ */ jsx("span", { className: "text-stone-300", children: "|" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-stone-400 tracking-tight", children: "Verified chapter" })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-stone-900 tracking-tighter font-meta", children: chapter.name }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mt-2 text-stone-500 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 text-[var(--brand-green)]" }),
              chapter.city_or_region,
              ", ",
              chapter.country
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-[var(--brand-green)]" }),
              chapter.member_count,
              " Active members"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "default",
              className: "border-stone-200 text-stone-600 rounded-none h-12 px-6",
              onClick: () => setIsShareModalOpen(true),
              children: [
                /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4 mr-2" }),
                " Share"
              ]
            }
          ),
          /* @__PURE__ */ jsx(Button, { className: "bg-[var(--brand-green)] hover:bg-[var(--brand-green)]/90 text-white font-bold tracking-tight text-xs h-12 px-8 rounded-none", children: "Join this chapter" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("main", { className: "max-w-[1280px] mx-auto px-8 mt-12", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-12", children: [
        /* @__PURE__ */ jsxs("section", { className: "bg-white border border-stone-200 rounded-none overflow-hidden flex flex-col", children: [
          /* @__PURE__ */ jsx("div", { className: "h-1.5 w-full bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]" }),
          /* @__PURE__ */ jsxs("div", { className: "p-10", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-stone-900 tracking-tight font-meta mb-6 flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Globe, { className: "w-5 h-5 text-[var(--brand-green)]" }),
              "About This Chapter"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "prose prose-stone max-w-none", children: [
              /* @__PURE__ */ jsx("p", { className: "text-stone-600 leading-relaxed italic border-l-4 border-warm-gold/30 pl-4 py-1", children: chapter.description }),
              /* @__PURE__ */ jsxs("p", { className: "text-stone-600 leading-relaxed mt-4", children: [
                "Whether you're looking to volunteer, stay informed about local policy discussions, or connect with fellow movement members, the ",
                chapter.name,
                " provides the platform for meaningful civic engagement and collective action within ",
                chapter.city_or_region,
                "."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mt-10", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-6 bg-stone-50 border border-stone-100 rounded-none", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-micro font-bold text-stone-400 tracking-tight mb-2", children: "Local focus" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-800", children: "Youth Empowerment & Civic Literacy" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-6 bg-stone-50 border border-stone-100 rounded-none", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-micro font-bold text-stone-400 tracking-tight mb-2", children: "Meeting schedule" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-800", children: "Every First Saturday of the Month" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-stone-900 tracking-tight font-meta flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 text-[var(--brand-green)]" }),
              "Recent Activities"
            ] }),
            /* @__PURE__ */ jsx("button", { className: "text-micro font-bold text-[var(--brand-green)] tracking-tight hover:underline", children: "View all" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [
            { title: "Regional Policy Townhall", date: "Oct 24, 2024", type: "Event" },
            { title: "Community Outreach Program", date: "Oct 12, 2024", type: "Action" },
            { title: "New Member Orientation", date: "Sep 28, 2024", type: "Onboarding" }
          ].map((activity, i) => /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 p-6 rounded-none flex items-center justify-between group hover:border-[var(--brand-green)] transition-colors", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "w-12 h-12 bg-stone-50 flex flex-col items-center justify-center text-stone-400 font-meta", children: [
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold", children: activity.date.split(" ")[0] }),
                /* @__PURE__ */ jsx("span", { className: "text-lg font-bold leading-none", children: activity.date.split(" ")[1].replace(",", "") })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-bold text-stone-900 group-hover:text-[var(--brand-green)] transition-colors", children: activity.title }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-stone-400 tracking-tight mt-1", children: activity.type })
              ] })
            ] }),
            /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5 text-stone-300 group-hover:text-[var(--brand-green)] transition-all" })
          ] }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 rounded-none overflow-hidden flex flex-col", children: [
          /* @__PURE__ */ jsx("div", { className: "h-1.5 w-full bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]" }),
          /* @__PURE__ */ jsxs("div", { className: "p-8", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold tracking-tight mb-6 border-b border-stone-100 pb-4 text-stone-900", children: "Chapter leadership" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-stone-100 rounded-none flex items-center justify-center text-stone-400", children: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-900", children: "Dr. Samuel Appiah" }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 tracking-tight", children: "Regional coordinator" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-stone-100 rounded-none flex items-center justify-center text-stone-400", children: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-900", children: "Sarah Mensah" }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 tracking-tight", children: "Chapter secretary" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-8 border-t border-stone-100 space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-stone-500 text-sm", children: [
                /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4 text-[var(--brand-green)]" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  chapter.city_or_region.toLowerCase(),
                  "@thebasemovement.com"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-stone-500 text-sm", children: [
                /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4 text-[var(--brand-green)]" }),
                /* @__PURE__ */ jsx("span", { children: "+233 (0) 50 123 4567" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-charcoal-dark p-8 rounded-none text-white relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-24 h-24 text-[var(--brand-green)]" }) }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-warm-gold text-micro font-bold tracking-tight mb-4", children: "Official verification" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-stone-300 mb-6", children: "This chapter is officially recognized and verified by The Base National Headquarters. All activities are coordinated with the central movement agenda." }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold border border-green-100 w-fit", children: [
              /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3.5 h-3.5" }),
              "Verified"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-stone-100 p-8 rounded-none border border-stone-200", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold tracking-tight mb-4 text-stone-900", children: "Support local" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-stone-500 leading-relaxed mb-6", children: [
            "Your donations to this specific chapter help fund local townhalls and community outreach programs in ",
            chapter.city_or_region,
            "."
          ] }),
          /* @__PURE__ */ jsx(Link, { to: "/dashboard/donate", children: /* @__PURE__ */ jsx(Button, { className: "w-full bg-[var(--brand-green)] hover:bg-[var(--brand-green)]/90 text-white rounded-none", children: "Donate to chapter" }) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      ShareModal,
      {
        isOpen: isShareModalOpen,
        onClose: () => setIsShareModalOpen(false),
        title: `Join ${chapter.name}`,
        url: window.location.href
      }
    )
  ] });
}
export {
  ChapterDetails as default
};
