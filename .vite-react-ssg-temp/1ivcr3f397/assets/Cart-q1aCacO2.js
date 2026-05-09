import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
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
function Cart() {
  const { cart, removeFromCart, updateCartQuantity } = useStore();
  const subtotal = cart.reduce((sum, item) => {
    const price = typeof item.price === "string" ? parseFloat(item.price.replace(/[^0-9.]/g, "")) : item.price;
    return sum + price * item.quantity;
  }, 0);
  const shipping = cart.length > 0 ? 25 : 0;
  const total = subtotal + shipping;
  return /* @__PURE__ */ jsxs("div", { className: "bg-off-white min-h-screen", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Your Shopping Bag",
        description: "Review your items and proceed to secure checkout.",
        canonical: "/store/cart",
        noindex: true
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-6 md:px-12 py-12", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, {}),
      /* @__PURE__ */ jsxs("header", { className: "mb-12", children: [
        /* @__PURE__ */ jsxs("h1", { className: "font-h1 text-2xl sm:text-h2 text-stone-900 mb-2 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(ShoppingBag, { className: "w-8 h-8 text-[var(--brand-green)] shrink-0" }),
          /* @__PURE__ */ jsx("span", { children: "Your Shopping Bag" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-gray font-body-md", children: "Review your items and proceed to secure checkout." })
      ] }),
      cart.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-12 gap-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-8 space-y-4", children: [
          cart.map((item) => /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 p-6 rounded-sm shadow-sm flex flex-col md:flex-row gap-6 relative group", children: [
            /* @__PURE__ */ jsx("div", { className: "w-24 h-24 bg-stone-100 rounded-sm overflow-hidden shrink-0 flex items-center justify-center", children: item.image ? /* @__PURE__ */ jsx("img", { src: item.image, alt: item.name, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx(ShoppingBag, { className: "w-10 h-10 text-stone-300" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4", children: [
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: window.location.pathname.includes("/dashboard") ? `/dashboard/store/product/${item.slug}` : `/store/product/${item.slug}`,
                    className: "font-bold text-stone-900 text-sm sm:text-base leading-tight hover:text-[var(--brand-green)] transition-colors",
                    children: item.name
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-[var(--brand-green)] text-sm sm:text-base whitespace-nowrap shrink-0", children: typeof item.price === "string" && item.price.startsWith("GHS") ? item.price : `GHS ${parseFloat(String(item.price)).toFixed(2)}` })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4 text-micro font-bold text-stone-500 tracking-tight mb-4", children: [
                item.selectedSize && /* @__PURE__ */ jsxs("span", { children: [
                  "Size: ",
                  item.selectedSize
                ] }),
                item.selectedColor && /* @__PURE__ */ jsxs("span", { children: [
                  "Color: ",
                  item.selectedColor
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-auto", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center h-9 border border-stone-200 bg-white rounded-sm overflow-hidden", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => updateCartQuantity(item.id, Math.max(1, item.quantity - 1)),
                      className: "w-9 h-full flex items-center justify-center hover:bg-stone-50",
                      children: /* @__PURE__ */ jsx(Minus, { className: "w-3 h-3 text-stone-500" })
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "w-10 text-center text-xs font-bold text-stone-900", children: item.quantity }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => updateCartQuantity(item.id, item.quantity + 1),
                      className: "w-9 h-full flex items-center justify-center hover:bg-stone-50",
                      children: /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3 text-stone-500" })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => removeFromCart(item.id),
                    className: "flex items-center gap-2 text-stone-400 hover:text-[var(--brand-red)] transition-colors text-micro font-bold tracking-tight",
                    children: [
                      /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                      "Remove"
                    ]
                  }
                )
              ] })
            ] })
          ] }, `${item.id}-${item.selectedSize}-${item.selectedColor}`)),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/store",
              className: "inline-flex items-center gap-2 text-stone-500 hover:text-[var(--brand-green)] transition-colors mt-4 group",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 group-hover:-translate-x-1 transition-transform" }),
                /* @__PURE__ */ jsx("span", { className: "font-meta text-micro font-bold tracking-tight", children: "Continue shopping" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 p-8 rounded-sm shadow-sm sticky top-24", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-h3 text-xl text-stone-900 mb-6 pb-4 border-b border-stone-100", children: "Order Summary" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-stone-600 font-meta tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-stone-900", children: [
                "GHS ",
                subtotal.toFixed(2)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-stone-600 font-meta tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { children: "Shipping Estimate" }),
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-stone-900", children: [
                "GHS ",
                shipping.toFixed(2)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-stone-600 font-meta tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { children: "Taxes" }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-stone-900", children: "Calculated at checkout" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-stone-200 flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("span", { className: "font-h3 text-lg text-stone-900", children: "Total" }),
              /* @__PURE__ */ jsxs("span", { className: "font-h3 text-xl text-[var(--brand-green)]", children: [
                "GHS ",
                total.toFixed(2)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", className: "w-full h-14 text-xs font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20", children: /* @__PURE__ */ jsxs(Link, { to: window.location.pathname.includes("/dashboard") ? "/dashboard/store/checkout" : "/store/checkout", children: [
            "Proceed to Checkout",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-stone-500", children: [
              /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-sm", children: "verified_user" }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight", children: "100% Secure transaction" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-stone-500", children: [
              /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-sm", children: "local_shipping" }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight", children: "Free shipping over GHS 500" })
            ] })
          ] })
        ] }) })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 py-24 px-6 rounded-sm text-center shadow-sm max-w-2xl mx-auto", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(ShoppingBag, { className: "w-10 h-10 text-stone-300" }) }),
        /* @__PURE__ */ jsx("h2", { className: "font-h3 text-2xl text-stone-900 mb-2", children: "Your bag is empty" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-gray font-body-md mb-8", children: "Looks like you haven't added anything to your bag yet." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", className: "px-8 h-12 text-xs font-bold tracking-tight rounded-sm", children: /* @__PURE__ */ jsx(Link, { to: "/store", children: "Explore the Store" }) })
      ] })
    ] })
  ] });
}
export {
  Cart as default
};
