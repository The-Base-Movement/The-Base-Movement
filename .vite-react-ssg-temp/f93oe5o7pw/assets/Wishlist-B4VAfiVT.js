import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from "lucide-react";
import { S as SEO, B as Button } from "../main.mjs";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import { u as useStore } from "./useStore-Ck4WjQDU.js";
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
function Wishlist() {
  const { wishlist, cart, removeFromWishlist } = useStore();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  return /* @__PURE__ */ jsxs("div", { className: "bg-off-white min-h-screen", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "My Wishlist",
        description: "Curate your favorite movement gear and keep track of limited edition releases.",
        canonical: "/store/wishlist",
        noindex: true
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-6 md:px-12 py-12", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, {}),
      /* @__PURE__ */ jsx("header", { className: "mb-12 mt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: window.location.pathname.includes("/dashboard") ? "/dashboard/store" : "/store",
              className: "inline-flex items-center gap-2 text-stone-500 hover:text-brand-green transition-colors mb-6 group",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 group-hover:-translate-x-1 transition-transform" }),
                /* @__PURE__ */ jsx("span", { className: "font-meta text-micro font-bold tracking-tight", children: "Back to store" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("h1", { className: "text-stone-900 mb-2 flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Heart, { className: "w-8 h-8 text-brand-red fill-brand-red" }),
            "My Wishlist"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-gray max-w-xl", children: "Save your favorite items for later. Curate your movement gear and keep track of limited edition releases." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
          Link,
          {
            to: window.location.pathname.includes("/dashboard") ? "/dashboard/store/cart" : "/store/cart",
            className: "relative group flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:border-brand-green transition-all rounded-sm bg-white shadow-sm",
            children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "w-4 h-4 text-stone-500 group-hover:text-brand-green transition-all" }),
              /* @__PURE__ */ jsx("span", { className: "font-meta text-micro font-bold tracking-tight text-stone-600 group-hover:text-brand-green", children: "Bag" }),
              cartCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-2 -right-2 bg-brand-green text-white text-micro font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm", children: cartCount })
            ]
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsx("main", { children: wishlist.length > 0 ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: wishlist.map((item) => /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 rounded-none overflow-hidden hover:shadow-xl transition-all duration-500 group", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative aspect-square bg-stone-50 flex items-center justify-center overflow-hidden", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: item.image,
              alt: item.name,
              className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-700",
              decoding: "async",
              loading: "lazy"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => removeFromWishlist(item.id),
              className: "absolute top-4 right-4 w-10 h-10 bg-white shadow-md flex items-center justify-center hover:text-brand-red transition-colors",
              children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute top-4 left-4", children: /* @__PURE__ */ jsx("span", { className: "bg-white text-stone-800 text-micro font-bold tracking-tight px-2.5 py-1 rounded-none shadow-sm border border-stone-100", children: item.category }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-between items-start mb-2", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-stone-900 group-hover:text-brand-green transition-colors text-base tracking-tight", children: item.name }) }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-brand-green mb-4", children: item.price }),
          /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-stone-100 flex gap-3", children: [
            /* @__PURE__ */ jsxs(Button, { variant: "primary", className: "flex-1 rounded-none h-11 flex items-center gap-2 text-micro font-bold tracking-tight", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "w-3.5 h-3.5" }),
              "Add to Cart"
            ] }),
            /* @__PURE__ */ jsx(Button, { asChild: true, variant: "default", className: "flex-1 border-stone-200 hover:border-brand-green hover:text-brand-green text-micro font-bold tracking-tight rounded-none h-11", children: /* @__PURE__ */ jsx(Link, { to: window.location.pathname.includes("/dashboard") ? `/dashboard/store/product/${item.slug}` : `/store/product/${item.slug}`, children: "Details" }) })
          ] })
        ] })
      ] }, item.id)) }) : /* @__PURE__ */ jsxs("div", { className: "py-24 text-center bg-white border border-stone-200 rounded-none shadow-sm", children: [
        /* @__PURE__ */ jsx(Heart, { className: "w-16 h-16 text-stone-100 mx-auto mb-6" }),
        /* @__PURE__ */ jsx("h2", { className: "text-stone-400 mb-4 tracking-tight", children: "Your wishlist is empty" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-gray mb-10 max-w-sm mx-auto", children: "Start curating your movement collection. Explore our store and save items you'd love to own." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", className: "text-micro font-bold tracking-tight rounded-none px-12 h-12", children: /* @__PURE__ */ jsx(Link, { to: window.location.pathname.includes("/dashboard") ? "/dashboard/store" : "/store", children: "Explore Store" }) })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { className: "mt-24", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-stone-900 mb-12 tracking-tight", children: "You might also like" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsx("div", { className: "aspect-[3/4] bg-stone-100 rounded-none animate-pulse border border-stone-200" }, i)) })
      ] })
    ] })
  ] });
}
export {
  Wishlist as default
};
