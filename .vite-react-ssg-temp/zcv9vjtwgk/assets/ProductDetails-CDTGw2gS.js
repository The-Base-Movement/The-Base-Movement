import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingBag, Star, Minus, Plus, Share2, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { S as SEO, c as cn, B as Button, e as ShareModal, a as adminService, l as logisticsService } from "../main.mjs";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import { u as useStore } from "./useStore-Ck4WjQDU.js";
import { toast } from "sonner";
import { motion } from "framer-motion";
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
function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [customizationText, setCustomizationText] = useState("");
  const [activeImage, setActiveImage] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { isInWishlist, addToWishlist, removeFromWishlist, addToCart, wishlist, cart } = useStore();
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("Greater Accra");
  const wishlistCount = wishlist.length;
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  useEffect(() => {
    let isMounted = true;
    const fetchProduct = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await adminService.getProductBySlug(slug);
        if (isMounted) {
          setProduct(data);
          if (data) {
            if (data.sizes && data.sizes.length > 0) setSelectedSize(data.sizes[0]);
            if (data.colors && data.colors.length > 0) setSelectedColor(data.colors[0]);
            if (data.image) setActiveImage(data.image);
            else if (data.gallery_images && data.gallery_images.length > 0) setActiveImage(data.gallery_images[0].url);
          }
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);
  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      ...product,
      quantity,
      selectedSize,
      selectedColor,
      image: product.image || void 0,
      customText: customizationText || void 0
    });
    toast.success(`${product.name} added to your bag`);
  };
  const checkRegionalAvailability = async () => {
    if (!product) return;
    setCheckingAvailability(true);
    try {
      const result = await logisticsService.getRegionalAvailability(product.id, selectedRegion);
      setAvailability(result);
    } catch (err) {
      console.error("Availability check failed:", err);
    } finally {
      setCheckingAvailability(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-off-white min-h-screen", children: /* @__PURE__ */ jsx("div", { className: "max-w-[1280px] mx-auto px-6 md:px-12 py-12", children: /* @__PURE__ */ jsxs("div", { className: "animate-pulse space-y-8", children: [
      /* @__PURE__ */ jsx("div", { className: "h-4 w-32 bg-stone-200" }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-12", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-square bg-stone-200 rounded-sm" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "h-8 w-64 bg-stone-200" }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-48 bg-stone-200" }),
          /* @__PURE__ */ jsx("div", { className: "h-24 w-full bg-stone-200" })
        ] })
      ] })
    ] }) }) });
  }
  if (!product) {
    return /* @__PURE__ */ jsxs("div", { className: "bg-off-white min-h-screen", children: [
      /* @__PURE__ */ jsx(
        SEO,
        {
          title: "Product Not Found",
          noindex: true
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-6 md:px-12 py-12 text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-stone-900 mb-4", children: "Product not found" }),
        /* @__PURE__ */ jsx(Link, { to: "/store", className: "text-brand-green font-bold hover:underline", children: "Back to store" })
      ] })
    ] });
  }
  const isComingSoon = product.status === "Coming Soon";
  const isWishlisted = product ? isInWishlist(product.id) : false;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": "The Base Movement"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://thebasemovement.com/store/product/${product.slug}`,
      "priceCurrency": "GHS",
      "price": product.price.replace(/[^0-9.]/g, ""),
      "availability": product.status === "In Stock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-off-white min-h-screen", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: product.name,
        description: product.description,
        ogImage: product.image || void 0,
        canonical: `/store/product/${product.slug}`,
        jsonLd: productSchema
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-6 md:px-12 py-12", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, {}),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: window.location.pathname.includes("/dashboard") ? "/dashboard/store" : "/store",
            className: "inline-flex items-center gap-2 text-stone-500 hover:text-brand-green transition-colors group",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 group-hover:-translate-x-1 transition-transform" }),
              /* @__PURE__ */ jsx("span", { className: "font-meta text-micro font-bold tracking-tight", children: "Back to store" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: window.location.pathname.includes("/dashboard") ? "/dashboard/store/wishlist" : "/store/wishlist",
              className: "relative group flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:border-brand-red transition-all rounded-sm bg-white shadow-sm",
              children: [
                /* @__PURE__ */ jsx(Heart, { className: "w-4 h-4 text-stone-500 group-hover:text-brand-red transition-all" }),
                /* @__PURE__ */ jsx("span", { className: "font-meta text-micro font-bold tracking-tight text-stone-600 group-hover:text-brand-red", children: "Wishlist" }),
                wishlistCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-2 -right-2 bg-brand-red text-white text-micro font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm", children: wishlistCount })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: window.location.pathname.includes("/dashboard") ? "/dashboard/store/cart" : "/store/cart",
              className: "relative group flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:border-brand-green transition-all rounded-sm bg-white shadow-sm",
              children: [
                /* @__PURE__ */ jsx(ShoppingBag, { className: "w-4 h-4 text-stone-500 group-hover:text-brand-green transition-all" }),
                /* @__PURE__ */ jsx("span", { className: "font-meta text-micro font-bold tracking-tight text-stone-600 group-hover:text-brand-green", children: "Bag" }),
                cartCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-2 -right-2 bg-brand-green text-white text-micro font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm", children: cartCount })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "aspect-square bg-stone-100 rounded-sm overflow-hidden border border-stone-200", children: /* @__PURE__ */ jsxs("div", { className: "w-full h-full flex items-center justify-center relative group", children: [
            activeImage ? /* @__PURE__ */ jsx("img", { src: activeImage, alt: product.name, className: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx(ShoppingBag, { className: "w-32 h-32 text-stone-300" }),
            isComingSoon && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-white font-bold tracking-tight text-lg border-2 border-white/40 px-8 py-3", children: "Coming soon" }) })
          ] }) }),
          product.gallery_images && product.gallery_images.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-4", children: product.gallery_images.map((img) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActiveImage(img.url),
              className: cn(
                "aspect-square bg-stone-100 border rounded-sm cursor-pointer transition-all overflow-hidden",
                activeImage === img.url ? "border-brand-green ring-2 ring-brand-green/20" : "border-stone-200 hover:border-stone-400"
              ),
              children: /* @__PURE__ */ jsx("img", { src: img.url, alt: img.alt_text || product.name, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" })
            },
            img.id
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block px-3 py-1 bg-brand-green/10 text-brand-green text-micro font-bold tracking-tight rounded-full mb-4", children: product.category }),
            /* @__PURE__ */ jsx("h1", { className: "font-h1 text-h2 text-stone-900 mb-4", children: product.name }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsx(Star, { className: `w-4 h-4 ${i <= (product.rating || 4.8) ? "fill-warm-gold text-warm-gold" : "text-stone-300"}` }, i)),
                /* @__PURE__ */ jsx("span", { className: "ml-2 text-sm font-bold text-stone-900", children: product.rating || "4.8" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-stone-300", children: "|" }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-stone-500", children: [
                product.reviews || 0,
                " Verified reviews"
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-brand-green", children: product.price })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-stone-600 font-body-md leading-relaxed mb-10", children: product.longDescription || product.description }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-8 mb-10", children: [
            product.colors && product.colors.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-stone-900 tracking-tight mb-4", children: [
                "Color: ",
                selectedColor
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-3", children: product.colors.map((color) => /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setSelectedColor(color),
                  className: `w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? "border-brand-green scale-110 shadow-md" : "border-transparent shadow-sm"}`,
                  style: { backgroundColor: color.toLowerCase() === "black" || color.toLowerCase() === "jet black" ? "#1a1a1a" : color.toLowerCase() === "green" || color.toLowerCase() === "movement green" ? "#006B3C" : "#f5f5f4" },
                  title: color
                },
                color
              )) })
            ] }),
            product.sizes && product.sizes.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-900 tracking-tight", children: "Select size" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setShowSizeGuide(true),
                    className: "text-micro font-bold text-brand-green tracking-tight hover:underline",
                    children: "Size guide"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: product.sizes.map((size) => /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setSelectedSize(size),
                  className: `min-w-[48px] h-12 flex items-center justify-center border text-xs font-bold transition-all rounded-sm ${selectedSize === size ? "bg-brand-green border-brand-green text-white shadow-md" : "bg-white border-stone-200 text-stone-600 hover:border-brand-green"}`,
                  children: size
                },
                size
              )) })
            ] }),
            product.customization_allowed && /* @__PURE__ */ jsxs("div", { className: "p-6 bg-stone-50 border-l-4 border-brand-green space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-900 tracking-tight", children: "Patriot customization" }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-brand-green bg-brand-green/10 px-2 py-0.5", children: "Free" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Enter your constituency or name...",
                    value: customizationText,
                    onChange: (e) => setCustomizationText(e.target.value.substring(0, 24)),
                    className: "w-full h-12 bg-white border border-stone-200 px-4 text-xs font-bold focus:border-brand-green outline-none transition-all rounded-sm placeholder:text-stone-300 placeholder:font-medium"
                  }
                ),
                /* @__PURE__ */ jsxs("span", { className: "absolute right-3 bottom-[-18px] text-[8px] font-bold text-stone-400", children: [
                  customizationText.length,
                  "/24 characters"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 bg-stone-50 border border-stone-200 rounded-sm space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-900 tracking-tight", children: "Regional fulfillment" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx("div", { className: cn("w-2 h-2 rounded-full animate-pulse", availability ? availability.available ? "bg-brand-green" : "bg-brand-red" : "bg-stone-300") }),
                  /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-stone-500", children: "Live status" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "select",
                  {
                    value: selectedRegion,
                    onChange: (e) => {
                      setSelectedRegion(e.target.value);
                      setAvailability(null);
                    },
                    className: "flex-1 h-10 bg-white border border-stone-200 px-3 text-micro font-bold tracking-tight outline-none focus:border-brand-green rounded-sm",
                    children: ["Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Volta", "Northern", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo", "Savannah", "North East", "Oti", "Western North"].map((r) => /* @__PURE__ */ jsx("option", { value: r, children: r }, r))
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    onClick: checkRegionalAvailability,
                    disabled: checkingAvailability,
                    className: "h-10 px-4 bg-stone-900 text-white text-micro font-bold tracking-tight rounded-sm hover:bg-brand-green transition-all",
                    children: checkingAvailability ? "Checking..." : "Check"
                  }
                )
              ] }),
              availability && /* @__PURE__ */ jsx(
                motion.p,
                {
                  initial: { opacity: 0, y: -5 },
                  animate: { opacity: 1, y: 0 },
                  className: cn(
                    "text-micro font-bold leading-relaxed",
                    availability.available ? "text-brand-green" : "text-brand-red"
                  ),
                  children: availability.message
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-8", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-900 tracking-tight mb-4", children: "Quantity" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center w-full h-12 border border-stone-200 bg-white rounded-sm overflow-hidden", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setQuantity(Math.max(1, quantity - 1)),
                      className: "flex-1 h-full flex items-center justify-center hover:bg-stone-50 transition-colors",
                      children: /* @__PURE__ */ jsx(Minus, { className: "w-4 h-4 text-stone-500" })
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "flex-1 text-center font-bold text-stone-900", children: quantity }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setQuantity(quantity + 1),
                      className: "flex-1 h-full flex items-center justify-center hover:bg-stone-50 transition-colors",
                      children: /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 text-stone-500" })
                    }
                  )
                ] })
              ] }),
              product.specifications && Object.keys(product.specifications).length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex-1 hidden md:block", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight mb-4", children: "Quick specs" }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: Object.entries(product.specifications).slice(0, 2).map(([key, value]) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-stone-400", children: key }),
                  /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-stone-900 truncate", children: value })
                ] }, key)) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-4 mb-12", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: handleAddToCart,
                disabled: isComingSoon,
                variant: isComingSoon ? "outline" : "primary",
                className: cn(
                  "flex-1 h-14 text-xs font-bold tracking-tight rounded-sm",
                  isComingSoon ? "bg-stone-100 text-stone-400 border-stone-200" : "shadow-lg shadow-brand-green/20"
                ),
                children: isComingSoon ? "Coming soon" : /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
                  /* @__PURE__ */ jsx(ShoppingBag, { className: "w-4 h-4" }),
                  "Add to bag"
                ] })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  if (product) {
                    if (isWishlisted) {
                      removeFromWishlist(product.id);
                    } else {
                      addToWishlist(product);
                    }
                  }
                },
                className: `w-14 h-14 border flex items-center justify-center transition-all rounded-sm ${isWishlisted ? "border-brand-red bg-brand-red/5 text-brand-red shadow-lg shadow-brand-red/10" : "border-stone-200 text-stone-400 hover:border-brand-red hover:text-brand-red"}`,
                children: /* @__PURE__ */ jsx(Heart, { className: `w-6 h-6 transition-all ${isWishlisted ? "fill-brand-red text-brand-red" : ""}` })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setIsShareModalOpen(true),
                className: "w-14 h-14 border border-stone-200 text-stone-400 hover:border-brand-green hover:text-brand-green transition-all rounded-sm flex items-center justify-center",
                children: /* @__PURE__ */ jsx(Share2, { className: "w-6 h-6" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 sm:gap-6 py-8 border-t border-stone-200", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-2", children: [
              /* @__PURE__ */ jsx(Truck, { className: "w-5 h-5 text-brand-green" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-900 tracking-tight leading-tight", children: "Fast delivery" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-stone-500 font-medium leading-tight", children: "2-3 Days" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-2 border-x border-stone-100 px-2", children: [
              /* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5 text-brand-green" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-900 tracking-tight leading-tight", children: "Secure pay" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-stone-500 font-medium leading-tight", children: "Verified" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center gap-2", children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5 text-brand-green" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-stone-900 tracking-tight leading-tight", children: "Easy returns" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-stone-500 font-medium leading-tight", children: "7-Day Policy" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-24 pt-24 border-t border-stone-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-brand-green tracking-tight mb-4 block", children: "Voice of the movement" }),
            /* @__PURE__ */ jsx("h2", { className: "font-h2 text-h3 text-stone-900", children: "Patriot reviews" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-stone-900", children: product.rating || "4.8" }),
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight", children: "Average patriot rating" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-px h-12 bg-stone-200" }),
            /* @__PURE__ */ jsx(Button, { variant: "primary", className: "h-12 text-micro font-bold tracking-tight px-8 rounded-none", children: "Write a review" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8", children: product.reviews_data && product.reviews_data.length > 0 ? product.reviews_data.map((review) => /* @__PURE__ */ jsxs("div", { className: "p-8 bg-white border border-stone-100 shadow-sm space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
            /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsx(Star, { className: `w-3 h-3 ${i <= review.rating ? "fill-warm-gold text-warm-gold" : "text-stone-200"}` }, i)) }),
            review.is_verified && /* @__PURE__ */ jsxs("span", { className: "text-[8px] font-bold text-brand-green tracking-tight bg-brand-green/5 px-2 py-1 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(ShieldCheck, { className: "w-2.5 h-2.5" }),
              " Verified patriot"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-stone-600 font-medium leading-relaxed italic", children: [
            '"',
            review.content,
            '"'
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-stone-50 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-stone-900 tracking-tight", children: review.patriot_name }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-stone-400", children: new Date(review.created_at).toLocaleDateString() })
          ] })
        ] }, review.id)) : /* @__PURE__ */ jsx("div", { className: "col-span-full py-16 bg-stone-50 text-center border border-dashed border-stone-200", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight", children: "Be the first patriot to review this gear." }) }) })
      ] }),
      product.specifications && Object.keys(product.specifications).length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-24 grid md:grid-cols-2 gap-16 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-h2 text-h3 text-stone-900", children: "Technical details" }),
          /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: Object.entries(product.specifications).map(([key, value]) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between py-4 border-b border-stone-100", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-stone-400 tracking-tight", children: key }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-stone-900", children: value })
          ] }, key)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[var(--brand-black)] p-12 text-white relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-h3 text-lg tracking-tight mb-6 relative z-10", children: "Movement quality standard" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-stone-400 leading-relaxed mb-8 relative z-10", children: "Every item in the movement catalog undergoes strict quality control. We ensure that all materials are ethically sourced and designed to withstand the rigors of field mobilization." }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-4 relative z-10", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-micro font-bold tracking-tight", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-brand-green" }),
              " Durable field-ready fabric"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-micro font-bold tracking-tight", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-brand-green" }),
              " Authentic movement branding"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-micro font-bold tracking-tight", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-brand-green" }),
              " Supporting local production"
            ] })
          ] }),
          /* @__PURE__ */ jsx(ShoppingBag, { className: "absolute -bottom-10 -right-10 w-48 h-48 text-white/5 -rotate-12" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-24", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-h2 text-h3 text-stone-900 mb-12", children: "You might also like" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsx("div", { className: "aspect-[4/5] bg-stone-100 rounded-sm animate-pulse" }, i)) })
      ] }),
      showSizeGuide && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-6", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-0 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300",
            onClick: () => setShowSizeGuide(false)
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative bg-white w-full max-w-lg shadow-2xl rounded-none overflow-hidden animate-in zoom-in-95 duration-300", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-brand-green p-6 text-white flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-h3 text-lg tracking-tight", children: "Apparel size guide" }),
              /* @__PURE__ */ jsx("p", { className: "text-micro opacity-80 tracking-tight", children: "All measurements in inches" })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setShowSizeGuide(false),
                className: "w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors",
                children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined", children: "close" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-8", children: [
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b-2 border-stone-100", children: [
                /* @__PURE__ */ jsx("th", { className: "py-4 text-micro font-bold text-stone-400 tracking-tight", children: "Size" }),
                /* @__PURE__ */ jsx("th", { className: "py-4 text-micro font-bold text-stone-400 tracking-tight text-center", children: "Chest" }),
                /* @__PURE__ */ jsx("th", { className: "py-4 text-micro font-bold text-stone-400 tracking-tight text-center", children: "Length" }),
                /* @__PURE__ */ jsx("th", { className: "py-4 text-micro font-bold text-stone-400 tracking-tight text-center", children: "Sleeve" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-stone-50", children: [
                { size: "S", chest: "36-38", length: "28", sleeve: "8.5" },
                { size: "M", chest: "38-40", length: "29", sleeve: "9" },
                { size: "L", chest: "42-44", length: "30", sleeve: "9.5" },
                { size: "XL", chest: "46-48", length: "31", sleeve: "10" },
                { size: "XXL", chest: "50-52", length: "32", sleeve: "10.5" }
              ].map((row) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-stone-50 transition-colors", children: [
                /* @__PURE__ */ jsx("td", { className: "py-4 font-bold text-stone-900 text-sm", children: row.size }),
                /* @__PURE__ */ jsx("td", { className: "py-4 text-stone-600 text-sm text-center", children: row.chest }),
                /* @__PURE__ */ jsx("td", { className: "py-4 text-stone-600 text-sm text-center", children: row.length }),
                /* @__PURE__ */ jsx("td", { className: "py-4 text-stone-600 text-sm text-center", children: row.sleeve })
              ] }, row.size)) })
            ] }) }),
            /* @__PURE__ */ jsx("p", { className: "mt-8 text-sm text-stone-400 leading-relaxed italic", children: "* Please note that these are approximate measurements. For a more relaxed fit, we recommend ordering one size up." }),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: () => setShowSizeGuide(false),
                className: "w-full mt-8 bg-stone-900 hover:bg-stone-800 text-white text-micro font-bold tracking-tight rounded-none h-12",
                children: "Close guide"
              }
            )
          ] })
        ] })
      ] }),
      product && /* @__PURE__ */ jsx(
        ShareModal,
        {
          isOpen: isShareModalOpen,
          onClose: () => setIsShareModalOpen(false),
          title: `Check out the ${product.name} at The Base Movement Store!`,
          url: window.location.href
        }
      )
    ] })
  ] });
}
export {
  ProductDetails as default
};
