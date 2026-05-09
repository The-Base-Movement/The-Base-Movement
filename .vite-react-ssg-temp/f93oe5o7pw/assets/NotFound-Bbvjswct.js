import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Search, Home, ArrowRight } from "lucide-react";
import { S as SEO, B as Button } from "../main.mjs";
import "vite-react-ssg";
import "@tanstack/react-query";
import "react-helmet-async";
import "react";
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
function NotFound() {
  return /* @__PURE__ */ jsxs("main", { className: "min-h-screen bg-stone-50/50 flex flex-col items-center justify-center p-6 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Page Not Found",
        noindex: true
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "absolute top-0 left-0 w-full h-1 flex", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 bg-brand-red" }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 bg-brand-gold" }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 bg-brand-green" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "absolute -top-24 -right-24 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl" }),
    /* @__PURE__ */ jsx("div", { className: "absolute -bottom-24 -left-24 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl" }),
    /* @__PURE__ */ jsxs("div", { className: "text-center relative z-10 max-w-lg mx-auto", children: [
      /* @__PURE__ */ jsx("div", { className: "w-24 h-24 bg-white border border-slate-100 shadow-xl flex items-center justify-center mx-auto mb-10 group hover:rotate-6 transition-transform duration-500", children: /* @__PURE__ */ jsx(Search, { className: "w-10 h-10 text-brand-green group-hover:scale-110 transition-transform" }) }),
      /* @__PURE__ */ jsx("p", { className: "font-meta text-brand-green tracking-tight text-xs font-bold mb-4", children: "Error 404" }),
      /* @__PURE__ */ jsxs("h1", { className: "font-meta font-bold text-4xl md:text-5xl tracking-tight leading-tight text-charcoal-dark mb-6", children: [
        "Path not found ",
        /* @__PURE__ */ jsx("span", { className: "text-brand-green", children: "." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm md:text-base leading-relaxed mb-10 px-4", children: "The coordinate you requested does not exist or has been archived within the movement's vault. Let's get you back to the front lines." }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4", children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", size: "lg", className: "h-14 px-10 w-full sm:w-auto", children: /* @__PURE__ */ jsxs(Link, { to: "/", children: [
          /* @__PURE__ */ jsx(Home, { className: "w-4 h-4 mr-2" }),
          "Return home"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", size: "lg", className: "h-14 px-10 w-full sm:w-auto border-slate-200", children: /* @__PURE__ */ jsxs(Link, { to: "/blog", children: [
          "Browse insights",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-20 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-300 tracking-tight mb-0", children: "Ghana first • Collective progress" }) })
  ] });
}
export {
  NotFound as default
};
