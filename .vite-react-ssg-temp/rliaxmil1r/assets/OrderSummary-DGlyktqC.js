import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Loader2, ShoppingBag, Printer, Share2, ArrowRight } from "lucide-react";
import { u as useBranding, S as SEO, B as Button, a as adminService } from "../main.mjs";
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
function OrderSummary() {
  const { settings } = useBranding();
  const location = useLocation();
  const orderId = location.state?.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      const data = await adminService.getOrderById(orderId);
      setOrder(data);
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex items-center justify-center bg-off-white", children: [
      /* @__PURE__ */ jsx(SEO, { title: "Syncing Order...", noindex: true }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-10 h-10 text-[var(--brand-green)] animate-spin" }),
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-400", children: "Retrieving transaction data..." })
      ] })
    ] });
  }
  if (!order) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex items-center justify-center bg-off-white", children: [
      /* @__PURE__ */ jsx(SEO, { title: "Order Not Found", noindex: true }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full p-8 text-center bg-white border border-stone-200", children: [
        /* @__PURE__ */ jsx(ShoppingBag, { className: "w-12 h-12 text-stone-200 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold font-meta tracking-tight text-stone-900", children: "Order not found" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-stone-500 mt-2 mb-6 tracking-tight", children: "The requested order could not be synchronized with the vault." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, className: "w-full h-12 bg-stone-900 text-white rounded-none", children: /* @__PURE__ */ jsx(Link, { to: "/store", children: "Back to store" }) })
      ] })
    ] });
  }
  const date = new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const orderNumber = order.id.substring(0, 8).toUpperCase();
  return /* @__PURE__ */ jsxs("div", { className: "bg-off-white min-h-screen", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: `Order Confirmed #${orderNumber}`,
        noindex: true
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "max-w-[1280px] mx-auto px-6 md:px-12 py-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-brand-green p-10 text-center text-white relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none flex items-center justify-center rotate-12 scale-150", children: /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "", className: "w-64 h-64 object-contain", decoding: "async", loading: "lazy" }) }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-4 mb-6", children: [
              /* @__PURE__ */ jsx("div", { className: "w-14 h-14 bg-white rounded-none flex items-center justify-center shadow-lg p-2", children: /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "The Base", className: "w-10 h-10 object-contain", decoding: "async", loading: "lazy" }) }),
              /* @__PURE__ */ jsxs("div", { className: "text-left border-l border-white/20 pl-4", children: [
                /* @__PURE__ */ jsx("h2", { className: "font-h1 text-2xl tracking-tight leading-none", children: "The Base" }),
                /* @__PURE__ */ jsx("p", { className: "text-[8px] font-bold tracking-tight opacity-80", children: "Official store" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("h1", { className: "font-h1 text-h3 mb-1 tracking-tight", children: "Order confirmed" }),
            /* @__PURE__ */ jsx("p", { className: "font-meta text-micro opacity-90 tracking-tight", children: "Your support drives the movement forward" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
          /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-6 py-6 border-b border-stone-100 mb-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight mb-1", children: "Order identifier" }),
              /* @__PURE__ */ jsxs("p", { className: "font-bold text-stone-900 break-all sm:break-normal", children: [
                "#",
                orderNumber
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight mb-1 sm:text-right", children: "Date" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-stone-900 sm:text-right", children: date })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-8 mb-12 relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-10deg]", children: /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "", className: "w-80 h-80 object-contain", decoding: "async", loading: "lazy" }) }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-h3 text-xl text-stone-900 mb-6 tracking-tight", children: "Items ordered" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-4", children: order.items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 bg-stone-50 px-4 rounded-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-white flex items-center justify-center border border-stone-100 shrink-0", children: /* @__PURE__ */ jsx(ShoppingBag, { className: "w-6 h-6 text-stone-300" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-stone-900 text-sm leading-tight tracking-tight", children: item.product_name || "Official gear" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-stone-400 tracking-tight mt-1", children: [
                      "Quantity: ",
                      item.quantity
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "font-bold text-stone-900 text-sm whitespace-nowrap", children: [
                  "GHS ",
                  Number(item.price_at_purchase * item.quantity).toFixed(2)
                ] })
              ] }, item.id)) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-stone-900 p-8 rounded-sm text-white mb-10", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-meta tracking-tight opacity-60", children: [
              /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "GHS ",
                Number(order.subtotal).toFixed(2)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-meta tracking-tight opacity-60", children: [
              /* @__PURE__ */ jsx("span", { children: "Shipping" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "GHS ",
                Number(order.shipping_fee).toFixed(2)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "font-h3 text-lg tracking-tight", children: [
                "Total paid via ",
                order.payment_method?.toUpperCase()
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "font-h3 text-2xl text-brand-green whitespace-nowrap", children: [
                "GHS ",
                Number(order.total_amount).toFixed(2)
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 p-6 border border-stone-100 rounded-sm bg-white shadow-sm", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-brand-green/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-brand-green", children: "mail" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-stone-900 text-sm mb-1 tracking-tight", children: "Confirmation sent" }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-stone-500 leading-relaxed font-medium", children: [
                  "A detailed receipt and tracking information has been sent to ",
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-stone-900", children: order.email }),
                  "."
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [
              /* @__PURE__ */ jsxs(Button, { variant: "default", className: "flex-1 h-12 border-stone-200 text-stone-600 hover:bg-brand-gold hover:text-stone-900 hover:border-brand-gold text-micro font-bold tracking-tight rounded-sm transition-all duration-300", children: [
                /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4 mr-2" }),
                " Print invoice"
              ] }),
              /* @__PURE__ */ jsxs(Button, { variant: "default", className: "flex-1 h-12 border-stone-200 text-stone-600 hover:bg-brand-gold hover:text-stone-900 hover:border-brand-gold text-micro font-bold tracking-tight rounded-sm transition-all duration-300", children: [
                /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4 mr-2" }),
                " Share support"
              ] })
            ] }),
            /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", className: "w-full h-14 text-xs font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20", children: /* @__PURE__ */ jsxs(Link, { to: "/dashboard", children: [
              "Back to dashboard",
              /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
            ] }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-xs text-stone-400 font-meta tracking-tight flex items-center justify-center flex-wrap gap-1", children: [
        "Problems with your order? ",
        /* @__PURE__ */ jsx(Link, { to: "/contact", className: "text-brand-green font-bold hover:underline whitespace-nowrap", children: "Contact support" })
      ] }) })
    ] }) })
  ] });
}
export {
  OrderSummary as default
};
