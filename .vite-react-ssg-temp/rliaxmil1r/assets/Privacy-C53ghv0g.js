import { jsxs, jsx } from "react/jsx-runtime";
import { Lock, Eye, Server } from "lucide-react";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import { S as SEO } from "../main.mjs";
import "react";
import "react-router-dom";
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
function Privacy() {
  return /* @__PURE__ */ jsxs("main", { className: "bg-surface-warm font-body-md min-h-screen pb-24", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Privacy Policy",
        description: "Our commitment to data sovereignty and the absolute protection of our members' digital footprint.",
        canonical: "/privacy"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "bg-charcoal-dark text-white pt-24 pb-16 border-b-4 border-brand-green relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-8 relative z-10", children: [
        /* @__PURE__ */ jsx(Breadcrumbs, {}),
        /* @__PURE__ */ jsx("p", { className: "font-meta text-warm-gold tracking-tight text-xs mb-3 mt-6", children: "Institutional Integrity" }),
        /* @__PURE__ */ jsxs("h1", { className: "font-meta font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-4", children: [
          "Privacy ",
          /* @__PURE__ */ jsx("span", { className: "text-brand-green", children: "policy" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-300 max-w-2xl font-body-md", children: "Our commitment to data sovereignty and the absolute protection of our members' digital footprint." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "max-w-[1280px] mx-auto px-8 py-16", children: /* @__PURE__ */ jsx("div", { className: "max-w-4xl", children: /* @__PURE__ */ jsxs("div", { className: "flow", style: { "--flow-space": "3rem" }, children: [
      /* @__PURE__ */ jsx("section", { className: "bg-white p-8 md:p-12 border border-slate-200 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-brand-green/10 rounded-none flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Lock, { className: "w-6 h-6 text-brand-green" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-charcoal-dark mb-4 font-meta tracking-tight", children: "Data protection" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-600 leading-relaxed text-sm md:text-base prose-standard", children: "The Base is committed to protecting your personal information. We collect only the data necessary for membership administration and movement coordination. All information is stored securely and accessed only by authorized personnel. We believe in data sovereignty and ensure that your information remains within the movement's secure infrastructure." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-white p-8 md:p-12 border border-slate-200 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-warm-gold/10 rounded-none flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Eye, { className: "w-6 h-6 text-warm-gold" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-charcoal-dark mb-4 font-meta tracking-tight", children: "Information we collect" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-600 leading-relaxed text-sm md:text-base prose-standard", children: "We collect your name, contact details, location, and platform preference to connect you with the appropriate chapter and keep you informed about movement activities. This data allows us to provide a tailored experience and ensures that our mobilization efforts are targeted and effective. Optional information helps us understand our membership demographics better." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-white p-8 md:p-12 border border-slate-200 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-charcoal-dark/10 rounded-none flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Server, { className: "w-6 h-6 text-charcoal-dark" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-charcoal-dark mb-4 font-meta tracking-tight", children: "Data storage & security" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-600 leading-relaxed text-sm md:text-base prose-standard", children: "Your data is stored on secure servers with industrial-grade encryption. We do not sell, rent, or share your personal information with third parties for marketing purposes. Your information is used solely for The Base membership administration, internal communication, and verified movement activities." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-charcoal-dark p-8 md:p-12 border-l-4 border-warm-gold text-white", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-meta font-bold text-xl tracking-tight mb-6", children: "Your institutional rights" }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-4", children: [
          "Request access to your personal data profile",
          "Request correction of inaccurate information",
          "Request deletion of your data (right to be forgotten)",
          "Opt out of non-essential communications at any time"
        ].map((right, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-warm-gold mt-2 shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-400", children: right })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 pt-8 border-t border-slate-200", children: [
        "Last updated: April 2026. If you have questions about this privacy agreement, please ",
        /* @__PURE__ */ jsx("a", { href: "/contact", className: "text-brand-green hover:underline", children: "contact our communications desk" }),
        "."
      ] })
    ] }) }) })
  ] });
}
export {
  Privacy as default
};
