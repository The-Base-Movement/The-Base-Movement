import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Truck, CreditCard, Smartphone, ShieldCheck, Globe } from "lucide-react";
import { S as SEO, B as Button, s as supabase, a as adminService } from "../main.mjs";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import { u as useStore } from "./useStore-Ck4WjQDU.js";
import { toast } from "sonner";
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
function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [isDiaspora, setIsDiaspora] = useState(false);
  const [dbCountries, setDbCountries] = useState([]);
  const [dbRegions, setDbRegions] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Ghana",
    otherCountry: "",
    region: "Greater Accra",
    stateProvince: "",
    postalCode: ""
  });
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const [cList, rList] = await Promise.all([
          adminService.getCountries(),
          adminService.getRegions()
        ]);
        if (session?.user?.id) {
          const points = await adminService.getMemberPoints(session.user.id);
          if (isMounted) setUserPoints(points);
        }
        if (isMounted) {
          setDbCountries(cList);
          setDbRegions(rList);
          const ghana = cList.find((c) => c.name.toLowerCase() === "ghana");
          if (ghana) {
            setFormData((prev) => ({ ...prev, country: ghana.name }));
          }
        }
      } catch (err) {
        console.error("Failed to load checkout data:", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "country") {
      const selected = dbCountries.find((c) => c.name === value);
      setIsDiaspora(selected ? selected.is_diaspora : value.toLowerCase() !== "ghana");
    }
    setFormData({ ...formData, [name]: value });
  };
  const subtotal = cart.reduce((sum, item) => {
    const price = typeof item.price === "string" ? parseFloat(item.price.replace(/[^0-9.]/g, "")) : item.price;
    return sum + price * item.quantity;
  }, 0);
  const shipping = cart.length > 0 ? 25 : 0;
  const pointsValue = Math.floor(userPoints / 100);
  const appliedPointsValue = usePoints ? Math.min(pointsValue, subtotal) : 0;
  const total = subtotal + shipping - appliedPointsValue;
  const pointsToRedeem = appliedPointsValue * 100;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Your shopping bag is empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: order, error: orderError } = await supabase.from("store_orders").insert({
        customer_id: session?.user?.id || null,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        shipping_address: formData.address,
        city: formData.city,
        country: formData.country,
        region_or_state: isDiaspora ? formData.stateProvince : formData.region,
        payment_method: paymentMethod,
        subtotal,
        shipping_fee: shipping,
        total_amount: total,
        points_redeemed: usePoints ? pointsToRedeem : 0,
        points_value_ghs: appliedPointsValue,
        status: "Pending"
      }).select("id").single();
      if (orderError) throw orderError;
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: typeof item.price === "string" ? parseFloat(item.price.replace(/[^0-9.]/g, "")) : item.price
      }));
      const { error: itemsError } = await supabase.from("store_order_items").insert(orderItems);
      if (itemsError) throw itemsError;
      if (usePoints && session?.user?.id) {
        await supabase.from("member_points").insert({
          user_id: session.user.id,
          points: -pointsToRedeem,
          reason: `Store Redemption: Order #${order.id.substring(0, 8)}`,
          reference_id: order.id
        });
      }
      toast.success("Order placed successfully! Check your email for details.");
      clearCart();
      const path = window.location.pathname.includes("/dashboard") ? "/dashboard/store/summary" : "/store/summary";
      navigate(path, { state: { orderId: order.id } });
    } catch (err) {
      console.error("Checkout failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to process checkout. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-off-white min-h-screen", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Secure Checkout",
        description: "Finalize your order and equip yourself for the movement.",
        canonical: "/store/checkout",
        noindex: true
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-6 md:px-12 py-12", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, {}),
      /* @__PURE__ */ jsxs("header", { className: "mb-12", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: window.location.pathname.includes("/dashboard") ? "/dashboard/store/cart" : "/store/cart",
            className: "inline-flex items-center gap-2 text-stone-500 hover:text-[var(--brand-green)] transition-colors mb-4 group",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 group-hover:-translate-x-1 transition-transform" }),
              /* @__PURE__ */ jsx("span", { className: "font-meta text-micro font-bold tracking-tight", children: "Back to bag" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("h1", { className: "font-h1 text-2xl sm:text-h2 text-stone-900 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-8 h-8 text-[var(--brand-green)] shrink-0" }),
          /* @__PURE__ */ jsx("span", { children: "Secure Checkout" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "grid lg:grid-cols-12 gap-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-8 space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 p-8 rounded-sm shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-[var(--brand-green)]/10 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Truck, { className: "w-5 h-5 text-[var(--brand-green)]" }) }),
              /* @__PURE__ */ jsx("h2", { className: "font-h3 text-xl text-stone-900", children: "1. Delivery Information" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-micro font-bold text-stone-900 tracking-tight mb-2", children: "Full name" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    name: "fullName",
                    required: true,
                    value: formData.fullName,
                    onChange: handleChange,
                    className: "w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm",
                    placeholder: "Enter your full name"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-micro font-bold text-stone-900 tracking-tight mb-2", children: "Email address" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    name: "email",
                    required: true,
                    value: formData.email,
                    onChange: handleChange,
                    className: "w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm",
                    placeholder: "email@example.com"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-micro font-bold text-stone-900 tracking-tight mb-2", children: "Phone number" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "tel",
                    name: "phone",
                    required: true,
                    value: formData.phone,
                    onChange: handleChange,
                    className: "w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm",
                    placeholder: "+233 00 000 0000"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-micro font-bold text-stone-900 tracking-tight mb-2", children: "Shipping address" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    name: "address",
                    required: true,
                    value: formData.address,
                    onChange: handleChange,
                    className: "w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm",
                    placeholder: "House Number, Street Name"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-micro font-bold text-stone-900 tracking-tight mb-2", children: "Country" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    name: "country",
                    value: formData.country,
                    onChange: handleChange,
                    className: "w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm appearance-none",
                    children: [
                      dbCountries.map((c) => /* @__PURE__ */ jsx("option", { value: c.name, children: c.name }, c.name)),
                      dbCountries.length === 0 && /* @__PURE__ */ jsx("option", { value: "Ghana", children: "Ghana" })
                    ]
                  }
                )
              ] }),
              isDiaspora ? /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-micro font-bold text-stone-900 tracking-tight mb-2", children: "State / Province" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    name: "stateProvince",
                    value: formData.stateProvince,
                    onChange: handleChange,
                    className: "w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm",
                    placeholder: "State or Province"
                  }
                )
              ] }) : /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-micro font-bold text-stone-900 tracking-tight mb-2", children: "Region" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    name: "region",
                    value: formData.region,
                    onChange: handleChange,
                    className: "w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm appearance-none",
                    children: [
                      dbRegions.map((r) => /* @__PURE__ */ jsx("option", { value: r.name, children: r.name }, r.id)),
                      dbRegions.length === 0 && /* @__PURE__ */ jsx("option", { value: "Greater Accra", children: "Greater Accra" })
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 p-8 rounded-sm shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-[var(--brand-green)]/10 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(CreditCard, { className: "w-5 h-5 text-[var(--brand-green)]" }) }),
              /* @__PURE__ */ jsx("h2", { className: "font-h3 text-xl text-stone-900", children: "2. Payment Method" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setPaymentMethod("momo"),
                  className: `flex items-center gap-4 p-6 border rounded-sm transition-all text-left ${paymentMethod === "momo" ? "border-[var(--brand-green)] bg-[var(--brand-green)]/5 ring-1 ring-[var(--brand-green)]" : "border-stone-200 hover:border-stone-300 bg-stone-50"}`,
                  children: [
                    /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === "momo" ? "bg-[var(--brand-green)] text-white" : "bg-stone-200 text-stone-500"}`, children: /* @__PURE__ */ jsx(Smartphone, { className: "w-6 h-6" }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-bold text-stone-900 text-sm", children: "Mobile money" }),
                      /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-500 tracking-tight", children: "MTN, Telecel, AT money" })
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setPaymentMethod("card"),
                  className: `flex items-center gap-4 p-6 border rounded-sm transition-all text-left ${paymentMethod === "card" ? "border-[var(--brand-green)] bg-[var(--brand-green)]/5 ring-1 ring-[var(--brand-green)]" : "border-stone-200 hover:border-stone-300 bg-stone-50"}`,
                  children: [
                    /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === "card" ? "bg-[var(--brand-green)] text-white" : "bg-stone-200 text-stone-500"}`, children: /* @__PURE__ */ jsx(CreditCard, { className: "w-6 h-6" }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-bold text-stone-900 text-sm", children: "Credit / debit card" }),
                      /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-500 tracking-tight", children: "Visa, Mastercard, AMEX" })
                    ] })
                  ]
                }
              )
            ] }),
            paymentMethod === "momo" && /* @__PURE__ */ jsxs("div", { className: "mt-8 p-6 bg-stone-50 border border-stone-100 rounded-sm", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-micro font-bold text-stone-900 tracking-tight mb-4", children: "Select network" }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-4", children: ["MTN", "Telecel", "AT Money"].map((network) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer group", children: [
                /* @__PURE__ */ jsx("input", { type: "radio", name: "network", className: "w-4 h-4 text-[var(--brand-green)] focus:ring-[var(--brand-green)]" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-stone-600 group-hover:text-stone-900 tracking-tight", children: network })
              ] }, network)) }),
              /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-micro font-bold text-stone-900 tracking-tight mb-2", children: "MoMo number" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "tel",
                    className: "w-full h-12 bg-white border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm",
                    placeholder: "Enter your mobile number"
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 p-8 rounded-sm shadow-sm sticky top-24", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-h3 text-xl text-stone-900 mb-6 pb-4 border-b border-stone-100", children: "Order Summary" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-4 mb-8", children: cart.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-stone-900 line-clamp-1", children: item.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-micro text-stone-500 tracking-tight", children: [
                "Qty: ",
                item.quantity,
                " | ",
                item.selectedSize
              ] })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-stone-900", children: [
              "GHS ",
              (item.quantity * (typeof item.price === "string" ? parseFloat(item.price.replace(/[^0-9.]/g, "")) : item.price)).toFixed(2)
            ] })
          ] }, `${item.id}-${item.selectedSize}-${item.selectedColor}`)) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-6 border-t border-stone-100 mb-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-stone-600 tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-stone-900", children: [
                "GHS ",
                subtotal.toFixed(2)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-stone-600 tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { children: "Shipping" }),
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-stone-900", children: [
                "GHS ",
                shipping.toFixed(2)
              ] })
            ] }),
            userPoints > 100 && /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-stone-50", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      id: "usePoints",
                      checked: usePoints,
                      onChange: (e) => setUsePoints(e.target.checked),
                      className: "w-4 h-4 rounded border-stone-300 text-[var(--brand-green)] focus:ring-[var(--brand-green)]"
                    }
                  ),
                  /* @__PURE__ */ jsx("label", { htmlFor: "usePoints", className: "text-micro font-bold text-stone-900 tracking-tight cursor-pointer", children: "Redeem Points" })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-[var(--brand-green)] tracking-tight", children: [
                  userPoints.toLocaleString(),
                  " Available"
                ] })
              ] }),
              usePoints && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-[var(--brand-green)] tracking-tight animate-in fade-in slide-in-from-top-1", children: [
                /* @__PURE__ */ jsx("span", { children: "Points Discount" }),
                /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
                  "- GHS ",
                  appliedPointsValue.toFixed(2)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-stone-200 flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("span", { className: "font-h3 text-lg text-stone-900", children: "Total" }),
              /* @__PURE__ */ jsxs("span", { className: "font-h3 text-xl text-[var(--brand-green)]", children: [
                "GHS ",
                total.toFixed(2)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              disabled: isSubmitting,
              variant: "primary",
              className: "w-full h-14 text-xs font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20",
              children: isSubmitting ? "Processing Order..." : "Complete Purchase"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-stone-500", children: [
              /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight", children: "Encrypted checkout" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-stone-500", children: [
              /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight", children: "Worldwide shipping" })
            ] })
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Checkout as default
};
