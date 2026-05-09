import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Newspaper, Loader2, ArrowRight, Mail, Download, ExternalLink, FileText, X } from "lucide-react";
import { S as SEO, B as Button, a as adminService } from "../main.mjs";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
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
function Press() {
  const [releases, setReleases] = useState([]);
  const [mediaKit, setMediaKit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRelease, setSelectedRelease] = useState(null);
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [prData, mkData] = await Promise.all([
          adminService.getPressReleases(),
          adminService.getMediaKitAssets()
        ]);
        setReleases(prData);
        setMediaKit(mkData);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  return /* @__PURE__ */ jsxs("main", { className: "bg-stone-50/50 min-h-screen pb-24", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Press Center",
        description: "Authoritative updates, media assets, and official statements from The Base Movement's communication desk.",
        canonical: "/press"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "bg-charcoal-dark text-white pt-24 pb-16 border-b-4 border-brand-green relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-8 relative z-10", children: [
        /* @__PURE__ */ jsx(Breadcrumbs, {}),
        /* @__PURE__ */ jsx("p", { className: "font-meta text-warm-gold tracking-tight text-xs mb-3 mt-6", children: "Media & communications" }),
        /* @__PURE__ */ jsxs("h1", { className: "font-meta font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-4", children: [
          "Press ",
          /* @__PURE__ */ jsx("span", { className: "text-brand-green", children: "center" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-300 max-w-2xl font-body-md", children: "Authoritative updates, media assets, and official statements from The Base Movement's communication desk." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "max-w-[1280px] mx-auto px-8 py-16", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-12", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-12", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-meta font-bold text-2xl tracking-tight mb-8 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Newspaper, { className: "w-6 h-6 text-brand-green" }),
          "Latest press releases"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-8", children: loading ? /* @__PURE__ */ jsxs("div", { className: "py-12 flex flex-col items-center justify-center gap-4 text-stone-300", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight", children: "Scanning dispatch desk..." })
        ] }) : releases.length > 0 ? releases.map((pr) => /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all group", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx("span", { className: "bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 text-micro font-bold tracking-tight rounded-sm", children: pr.category }),
            /* @__PURE__ */ jsx("span", { className: "text-tiny text-slate-400 font-medium tracking-tight", children: new Date(pr.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-charcoal-dark mb-4 group-hover:text-brand-green transition-colors", children: pr.title }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2", children: pr.excerpt }),
          /* @__PURE__ */ jsxs(Button, { variant: "link", className: "p-0 h-auto text-brand-green", onClick: () => setSelectedRelease(pr), children: [
            "View full release",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" })
          ] })
        ] }, pr.id)) : /* @__PURE__ */ jsxs("div", { className: "p-12 border-2 border-dashed border-slate-100 text-center", children: [
          /* @__PURE__ */ jsx(Newspaper, { className: "w-12 h-12 text-slate-200 mx-auto mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm font-bold tracking-tight", children: "No active dispatches found." })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-charcoal-dark p-8 border-l-4 border-warm-gold text-white", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-meta font-bold text-xl tracking-tight mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Mail, { className: "w-5 h-5 text-warm-gold" }),
            "Media inquiries"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed mb-6", children: "For interview requests, official commentary, or verified data inquiries, contact our communications team." }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-slate-500 mb-1", children: "General press" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold", children: "press@thebasemovement.org" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-slate-500 mb-1", children: "Global diaspora" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold", children: "diaspora.media@thebasemovement.org" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 border border-slate-100 shadow-sm", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-meta font-bold text-xl tracking-tight mb-4 flex items-center gap-2 text-charcoal-dark", children: [
            /* @__PURE__ */ jsx(Download, { className: "w-5 h-5 text-brand-green" }),
            "Media kit"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 leading-relaxed mb-6", children: "Download official brand assets, leadership bios, and movement backgrounders for editorial use." }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: mediaKit.length > 0 ? mediaKit.map((asset) => /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              className: "w-full justify-between text-slate-600 border-slate-100 hover:bg-slate-50",
              onClick: () => window.open(asset.fileUrl, "_blank"),
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  asset.fileType === "LOGO" ? /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
                  asset.title
                ] }),
                /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 opacity-50" })
              ]
            },
            asset.id
          )) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(Button, { disabled: true, variant: "ghost", className: "w-full justify-between text-slate-600 border-slate-100 opacity-50 cursor-not-allowed", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
                "Brand Guidelines"
              ] }),
              /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 opacity-50" })
            ] }),
            /* @__PURE__ */ jsxs(Button, { disabled: true, variant: "ghost", className: "w-full justify-between text-slate-600 border-slate-100 opacity-50 cursor-not-allowed", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" }),
                "High-Res Logos"
              ] }),
              /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 opacity-50" })
            ] })
          ] }) })
        ] })
      ] })
    ] }) }),
    selectedRelease && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-dark/60 backdrop-blur-sm animate-in fade-in duration-300", onClick: () => setSelectedRelease(null), children: /* @__PURE__ */ jsxs("div", { className: "bg-white w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 border-b border-slate-100 flex justify-between items-start bg-stone-50/50", children: [
        /* @__PURE__ */ jsxs("div", { className: "pr-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("span", { className: "bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 text-micro font-bold tracking-tight rounded-sm", children: selectedRelease.category }),
            /* @__PURE__ */ jsx("span", { className: "text-tiny text-slate-400 font-medium tracking-tight", children: new Date(selectedRelease.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) })
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-charcoal-dark tracking-tight leading-tight mb-0", children: selectedRelease.title })
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "w-8 h-8 p-0", onClick: () => setSelectedRelease(null), children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-8 max-h-[60vh] overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "prose prose-sm max-w-none text-slate-600 leading-relaxed space-y-4", children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold text-charcoal-dark", children: "ACCRA, GHANA — Official Statement" }),
        /* @__PURE__ */ jsx("p", { children: selectedRelease.excerpt }),
        /* @__PURE__ */ jsx("p", { children: '"The Base Movement remains committed to the principle of collective progress. This milestone/policy reflects our deep engagement with the grassroots and our vision for a sovereign, prosperous nation. We invite all citizens and members of the Diaspora to review the full implications of this development."' }),
        /* @__PURE__ */ jsx("p", { children: "For further information or to schedule an interview with movement leadership, please contact the communications desk at press@thebasemovement.org." })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "p-6 bg-stone-50 border-t border-slate-100 text-center", children: /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: () => setSelectedRelease(null), children: "Close Release" }) })
    ] }) })
  ] });
}
export {
  Press as default
};
