import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { u as useBranding, B as Button, S as SEO, a as adminService } from "../main.mjs";
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
function BlogPostCard({ post, baseUrl }) {
  const { settings } = useBranding();
  const formattedDate = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  return /* @__PURE__ */ jsxs(
    "article",
    {
      "aria-labelledby": `blog-post-title-${post.id}`,
      className: "bg-white border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow flex flex-col h-full",
      children: [
        /* @__PURE__ */ jsx("div", { className: "h-44 overflow-hidden bg-stone-100 relative", children: post.imageUrl ? /* @__PURE__ */ jsx(
          "img",
          {
            src: post.imageUrl,
            alt: post.title,
            className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700",
            decoding: "async",
            loading: "lazy"
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-charcoal-dark to-charcoal-dark/90 relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] pointer-events-none" }),
          /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "The Base", className: "w-12 h-12 opacity-20 mb-3 grayscale" }),
          /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-white/20 tracking-tight", children: "The Base Editorial" })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 flex flex-col flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-sm text-micro font-bold tracking-tight border transition-all duration-300 ${post.category === "Impact" ? "bg-brand-green/10 text-brand-green border-brand-green/20" : post.category === "Diaspora" ? "bg-purple-50 text-purple-700 border-purple-100" : post.category === "Digital Strategy" ? "bg-sky-50 text-sky-700 border-sky-100" : post.category === "Events" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-stone-50 text-stone-500 border-stone-100"}`, children: post.category }),
            /* @__PURE__ */ jsx("span", { className: "text-stone-300 opacity-50 text-xs", children: "|" }),
            /* @__PURE__ */ jsx("span", { className: "text-tiny text-slate-400 font-medium tracking-tight", children: formattedDate })
          ] }),
          /* @__PURE__ */ jsx(Link, { to: `${baseUrl}/${post.slug}`, children: /* @__PURE__ */ jsx(
            "h3",
            {
              id: `blog-post-title-${post.id}`,
              className: "text-sm font-bold text-charcoal-dark tracking-tight leading-tight mb-3 hover:text-brand-green transition-colors",
              children: post.title
            }
          ) }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-xs leading-relaxed mb-5 line-clamp-3", children: post.excerpt }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-slate-100 pt-4 mt-auto", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-tiny font-medium text-stone-400 tracking-tight", children: [
              post.authorName?.toUpperCase() === "ADMIN" ? "The Base Editorial" : post.authorName,
              " ",
              /* @__PURE__ */ jsx("span", { className: "mx-1 opacity-50", children: "|" }),
              " ",
              post.readTime
            ] }),
            /* @__PURE__ */ jsx(Button, { asChild: true, variant: "link", className: "p-0 h-auto text-brand-green", children: /* @__PURE__ */ jsxs(Link, { to: `${baseUrl}/${post.slug}`, className: "flex items-center gap-1", children: [
              "Read article",
              /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3 transition-transform group-hover:translate-x-1" })
            ] }) })
          ] })
        ] })
      ]
    }
  );
}
function Blog() {
  const { settings } = useBranding();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const baseUrl = isDashboard ? "/dashboard/blog" : "/blog";
  useEffect(() => {
    let isMounted = true;
    async function fetchPosts() {
      setLoading(true);
      try {
        const data = await adminService.getBlogPosts();
        if (isMounted) setPosts(data);
      } catch (err) {
        console.error("Failed to fetch blog posts:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPosts();
    return () => {
      isMounted = false;
    };
  }, []);
  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];
  const filtered = activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory);
  const featured = filtered[0];
  const rest = filtered.slice(1);
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface-warm font-body-md min-h-screen", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Updates & Insights",
        description: "Perspectives on governance, youth empowerment, diaspora engagement and the future of Ghana from within The Base Movement.",
        canonical: "/blog"
      }
    ),
    /* @__PURE__ */ jsx("section", { className: "bg-charcoal-dark text-white py-20 px-8 border-b-4 border-[var(--brand-green)]", children: /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto", children: [
      /* @__PURE__ */ jsx("p", { className: "font-meta text-warm-gold tracking-tight text-xs mb-3", children: "The Base Insights" }),
      /* @__PURE__ */ jsx("h1", { className: "font-meta font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-4 max-w-2xl", children: "Ideas, analysis & movement news" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-400 max-w-xl text-base", children: "Perspectives from within the movement on governance, youth empowerment, diaspora engagement and the future of Ghana." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-8 py-16", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center justify-center gap-3 mb-12", children: categories.map((cat) => /* @__PURE__ */ jsx(
        Button,
        {
          variant: activeCategory === cat ? "primary" : "ghost",
          size: "sm",
          onClick: () => setActiveCategory(cat),
          className: activeCategory === cat ? "shadow-md" : "text-slate-500 hover:border-brand-green hover:text-brand-green",
          children: cat
        },
        cat
      )) }),
      loading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-32 gap-4", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 text-brand-green animate-spin" }),
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-400", children: "Loading insights..." })
      ] }) : posts.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-32 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-400 tracking-tight", children: "No insights published yet." }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        featured && /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
          /* @__PURE__ */ jsx("p", { className: "font-meta text-xs text-warm-gold tracking-tight mb-6", children: "Featured" }),
          /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-0 bg-white border border-slate-200 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow", children: [
            /* @__PURE__ */ jsx("div", { className: "h-64 md:h-auto overflow-hidden bg-stone-100", children: featured.imageUrl ? /* @__PURE__ */ jsx(
              "img",
              {
                src: featured.imageUrl,
                alt: featured.title,
                className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700",
                decoding: "async",
                loading: "lazy"
              }
            ) : /* @__PURE__ */ jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-charcoal-dark to-charcoal-dark/90 relative", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] pointer-events-none" }),
              /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "The Base", className: "w-16 h-16 opacity-20 mb-4 grayscale" }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-white/20 tracking-tight", children: "The Base Editorial" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-10 flex flex-col justify-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-sm text-micro font-bold tracking-tight border transition-all duration-300 ${featured.category === "Impact" ? "bg-brand-green/10 text-brand-green border-brand-green/20" : featured.category === "Diaspora" ? "bg-purple-50 text-purple-700 border-purple-100" : featured.category === "Digital Strategy" ? "bg-sky-50 text-sky-700 border-sky-100" : featured.category === "Events" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-stone-50 text-stone-500 border-stone-100"}`, children: featured.category }),
                /* @__PURE__ */ jsx("span", { className: "mx-2 text-stone-300 opacity-50", children: "|" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-meta font-medium", children: featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "" })
              ] }),
              /* @__PURE__ */ jsx(Link, { to: `${baseUrl}/${featured.slug}`, children: /* @__PURE__ */ jsx("h2", { className: "text-xl md:text-2xl font-bold text-charcoal-dark tracking-tight leading-tight mb-4 hover:text-brand-green transition-colors", children: featured.title }) }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm leading-relaxed mb-6", children: featured.excerpt }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-micro font-medium text-stone-400 tracking-tight", children: [
                  featured.authorName?.toUpperCase() === "ADMIN" ? "The Base Editorial" : featured.authorName,
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "mx-2 opacity-50", children: "|" }),
                  " ",
                  featured.readTime
                ] }),
                /* @__PURE__ */ jsx(Button, { asChild: true, variant: "link", className: "p-0 h-auto text-brand-green", children: /* @__PURE__ */ jsxs(Link, { to: `${baseUrl}/${featured.slug}`, className: "flex items-center gap-2", children: [
                  "Read article",
                  /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 transition-transform group-hover:translate-x-1" })
                ] }) })
              ] })
            ] })
          ] })
        ] }),
        rest.length > 0 && /* @__PURE__ */ jsx("section", { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-12", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:w-2/3", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-stone-900 font-bold tracking-tight mb-6", children: "Latest articles" }),
            /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 gap-8", children: rest.map((post) => /* @__PURE__ */ jsx(
              BlogPostCard,
              {
                post,
                baseUrl
              },
              post.id
            )) })
          ] }),
          /* @__PURE__ */ jsxs("aside", { className: "lg:w-1/3 space-y-12", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-stone-900 font-bold tracking-tight mb-6", children: "Categories" }),
              /* @__PURE__ */ jsx("div", { className: "bg-white border border-slate-200 p-8 space-y-2", children: categories.filter((c) => c !== "All").map((cat) => /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setActiveCategory(cat),
                  className: "w-full flex items-center justify-between p-3 text-xs font-bold tracking-tight text-slate-600 hover:bg-slate-50 hover:text-brand-green transition-all group",
                  children: [
                    cat,
                    /* @__PURE__ */ jsxs("span", { className: "text-micro text-slate-300 font-meta group-hover:text-brand-green transition-colors", children: [
                      posts.filter((p) => p.category === cat).length,
                      " Posts"
                    ] })
                  ]
                },
                cat
              )) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-charcoal-dark p-8 border-l-4 border-warm-gold text-white", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-meta font-bold text-lg tracking-tight mb-4", children: "The Base Weekly" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed mb-6", children: "Get the movement's authoritative policy briefs and news delivered directly to your inbox every week." }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    placeholder: "Email Address",
                    className: "w-full bg-white/5 border border-white/10 p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-green transition-colors rounded-sm"
                  }
                ),
                /* @__PURE__ */ jsx(Button, { variant: "primary", className: "w-full h-12", children: "Subscribe" })
              ] })
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-20 py-16 px-12 bg-charcoal-dark text-white text-center border-l-4 border-brand-green", children: [
        /* @__PURE__ */ jsx("p", { className: "font-meta text-warm-gold tracking-tight text-xs mb-3", children: "Join the conversation" }),
        /* @__PURE__ */ jsx("h2", { className: "font-meta font-bold text-3xl tracking-tight mb-4", children: "Become a member. Shape the narrative." }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 max-w-md mx-auto mb-8 text-sm", children: "Registered members get early access to analysis, policy briefs and updates directly from our research desk." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "gold", size: "lg", className: "h-14 px-10", children: /* @__PURE__ */ jsxs(Link, { to: "/register", children: [
          "Join The Base",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Blog as default
};
