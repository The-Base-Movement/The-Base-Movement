import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { XCircle, User, CheckCircle2, MapPin, Activity, ShieldCheck, Calendar, AlertTriangle } from "lucide-react";
import { u as useBranding, S as SEO, C as Card, d as CardContent, B as Button, j as CardHeader, s as supabase } from "../main.mjs";
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
function VerifyID() {
  const { settings } = useBranding();
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchMember = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase.from("users").select("full_name, id, region, constituency, type, created_at, avatar_url").eq("id", id).single();
        if (fetchError) throw fetchError;
        if (!data) {
          setError("Member not found in the national database.");
        } else {
          setMember(data);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("Verification failed. Invalid ID or system timeout.");
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [id]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "text-center space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 border-4 border-border/60 border-t-destructive rounded-full animate-spin mx-auto" }),
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-muted-foreground/80", children: "Verifying identity..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex items-center justify-center p-4 sm:p-6", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Member Verification",
        noindex: true
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-2", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-block p-3 bg-white shadow-xl rounded-[12px] border border-border/40", children: /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "Logo", className: "w-12 h-12 object-contain", decoding: "async", loading: "lazy" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold font-meta tracking-tight", children: "The Base Movement" }),
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "Official verification portal" })
      ] }),
      error ? /* @__PURE__ */ jsxs(Card, { className: "rounded-none border-border/60 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4", children: [
        /* @__PURE__ */ jsx("div", { className: "h-2 bg-destructive" }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-10 text-center space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsx(XCircle, { className: "w-10 h-10 text-destructive" }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold font-meta tracking-tight text-on-surface", children: "Verification failed" }),
            /* @__PURE__ */ jsx("p", { className: "text-stone-500 text-sm", children: error })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(Button, { className: "w-full h-12 bg-stone-950 text-white text-micro font-bold tracking-tight rounded-none", children: "Return to home" }) }) })
        ] })
      ] }) : member && /* @__PURE__ */ jsxs(Card, { className: "rounded-none border-border/60 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500", children: [
        /* @__PURE__ */ jsx("div", { className: "h-2 bg-primary" }),
        /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-border/40 bg-primary/5 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-24 h-24 bg-white p-1 rounded-full shadow-xl mx-auto mb-4 border-2 border-primary", children: /* @__PURE__ */ jsx("div", { className: "w-full h-full rounded-full overflow-hidden bg-stone-100", children: member.avatar_url ? /* @__PURE__ */ jsx("img", { src: member.avatar_url, alt: member.full_name, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-stone-300", children: /* @__PURE__ */ jsx(User, { className: "w-10 h-10" }) }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight text-primary", children: "Identity verified" })
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold font-meta tracking-tight text-on-surface", children: member.full_name }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight mt-1", children: member.id })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-8 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
                " Region"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface", children: member.region })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1 justify-end", children: [
                /* @__PURE__ */ jsx(Activity, { className: "w-3 h-3" }),
                " Status"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20", children: member.type })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3 h-3" }),
                " Constituency"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface", children: member.constituency })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1 justify-end", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3" }),
                " Member Since"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface", children: new Date(member.created_at).toLocaleDateString([], { month: "short", year: "numeric" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pt-6 border-t border-border/40", children: /* @__PURE__ */ jsxs("div", { className: "p-4 bg-background border border-border/40 flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-muted-foreground/80 mt-0.5" }),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-500 leading-relaxed font-bold tracking-tight", children: "This verification is for official use only. Access to this data is logged and monitored for security purposes." })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-[8px] font-bold tracking-tight text-muted-foreground/80", children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " The Base Movement | Security Vault V2.0"
      ] }) })
    ] })
  ] });
}
export {
  VerifyID as default
};
