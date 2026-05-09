import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Share2, Plus, Star, ArrowRight, Filter, Search } from "lucide-react";
import { C as Card, B as Button, d as CardContent, S as SEO, b as BrandLine, c as cn, e as ShareModal, a as adminService } from "../main.mjs";
import { u as useStore } from "./useStore-Ck4WjQDU.js";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import { P as Pagination, a as PaginationContent, b as PaginationItem, c as PaginationPrevious, d as PaginationLink, e as PaginationNext } from "./pagination-6T6KqOsk.js";
import { S as Sheet, a as SheetTrigger, b as SheetContent, c as SheetHeader, d as SheetTitle } from "./sheet-Dt1-s5es.js";
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
import "@radix-ui/react-dialog";
function ProductCard({ product, onShare }) {
  const isComingSoon = product.status === "Coming Soon";
  const { isInWishlist, addToWishlist, removeFromWishlist, addToCart } = useStore();
  const isWishlisted = isInWishlist(product.id);
  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isComingSoon) return;
    addToCart({
      ...product,
      quantity: 1,
      selectedSize: product.sizes?.[0] || "",
      selectedColor: product.colors?.[0] || "",
      image: product.image || void 0
    });
    toast.success(`${product.name} added to your bag`, {
      description: "Default options selected. Change in bag if needed.",
      action: {
        label: "View Bag",
        onClick: () => window.location.href = window.location.pathname.includes("/dashboard") ? "/dashboard/store/cart" : "/store/cart"
      }
    });
  };
  return /* @__PURE__ */ jsx(
    motion.article,
    {
      "aria-labelledby": `product-name-${product.id}`,
      initial: { opacity: 0, y: 20 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.5 },
      className: "h-full",
      children: /* @__PURE__ */ jsxs(Card, { className: "group border border-stone-200 bg-white hover:shadow-2xl transition-all duration-500 rounded-sm overflow-hidden flex flex-col h-full relative", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative aspect-square overflow-hidden bg-stone-100", children: [
          /* @__PURE__ */ jsx(Link, { to: window.location.pathname.includes("/dashboard") ? `/dashboard/store/product/${product.slug}` : `/store/product/${product.slug}`, children: product.image ? /* @__PURE__ */ jsx(
            "img",
            {
              src: product.image,
              alt: product.name,
              className: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
              decoding: "async",
              loading: "lazy"
            }
          ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsx(ShoppingBag, { className: "w-16 h-16 text-stone-300 group-hover:scale-110 transition-transform duration-500" }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "absolute top-4 left-4 flex flex-col gap-2 z-10", children: [
            isComingSoon && /* @__PURE__ */ jsx("span", { className: "bg-stone-800 text-white text-tiny font-bold tracking-tight px-2.5 py-1 rounded-sm shadow-lg", children: "Coming soon" }),
            product.category && /* @__PURE__ */ jsx("span", { className: `text-tiny font-bold tracking-tight px-3 py-1.5 rounded-sm shadow-lg border backdrop-blur-sm transition-all duration-300 ${product.category === "Apparel" ? "bg-brand-green/20 text-brand-green border-brand-green/30" : product.category === "Accessories" ? "bg-brand-gold/20 text-[#92400e] border-brand-gold/40" : product.category === "Limited Edition" ? "bg-brand-red/20 text-brand-red border-brand-red/30" : "bg-white/90 text-stone-800 border-stone-200"}`, children: product.category })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: (e) => {
                  e.preventDefault();
                  if (isWishlisted) {
                    removeFromWishlist(product.id);
                  } else {
                    addToWishlist(product);
                  }
                },
                className: `w-10 h-10 bg-white shadow-md flex items-center justify-center transition-all duration-300 group/heart ${isWishlisted ? "text-[var(--brand-red)]" : "text-stone-400 hover:text-[var(--brand-red)]"}`,
                children: /* @__PURE__ */ jsx(Heart, { className: `w-5 h-5 transition-all ${isWishlisted ? "fill-brand-red text-[var(--brand-red)]" : "group-hover/heart:fill-brand-red group-hover/heart:text-[var(--brand-red)]"}` })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onShare?.(product);
                },
                className: "w-10 h-10 bg-white shadow-md flex items-center justify-center text-stone-400 hover:text-[var(--brand-green)] transition-all duration-300",
                children: /* @__PURE__ */ jsx(Share2, { className: "w-5 h-5" })
              }
            )
          ] }),
          !isComingSoon && /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent z-10", children: /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: handleQuickAdd,
              variant: "primary",
              className: "w-full h-10",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5 mr-2" }),
                " Quick Add"
              ]
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex flex-col flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mb-2", children: [
            /* @__PURE__ */ jsx(Star, { className: "w-3 h-3 fill-warm-gold text-warm-gold" }),
            /* @__PURE__ */ jsxs("span", { className: "text-tiny font-bold text-stone-500 tracking-tight uppercase", children: [
              "Rating ",
              product.rating || "4.8"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsx(Link, { to: window.location.pathname.includes("/dashboard") ? `/dashboard/store/product/${product.slug}` : `/store/product/${product.slug}`, children: /* @__PURE__ */ jsx(
            "h5",
            {
              id: `product-name-${product.id}`,
              className: "text-stone-900 group-hover:text-primary transition-colors line-clamp-2 mb-0 font-bold leading-tight text-sm uppercase tracking-tight",
              children: product.name
            }
          ) }) }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-gray mb-4 line-clamp-2 text-tiny leading-relaxed font-medium", children: product.description }),
          /* @__PURE__ */ jsxs("div", { className: "mt-auto pt-6 border-t border-stone-100 flex flex-col gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-stone-400 uppercase tracking-tight", children: "Investment" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xl font-bold text-primary font-meta", children: [
                "GH₵",
                product.price.toString().replace("GHS", "").replace("GH₵", "").trim()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  onClick: handleQuickAdd,
                  variant: "primary",
                  className: "h-10 text-tiny font-bold tracking-tight uppercase shadow-lg shadow-primary/10",
                  children: "Buy now"
                }
              ),
              /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", className: "h-10 text-tiny font-bold tracking-tight uppercase border-stone-200", children: /* @__PURE__ */ jsxs(Link, { to: window.location.pathname.includes("/dashboard") ? `/dashboard/store/product/${product.slug}` : `/store/product/${product.slug}`, className: "flex items-center", children: [
                "View Gear ",
                /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5 ml-2" })
              ] }) })
            ] })
          ] })
        ] })
      ] })
    }
  );
}
const categories = ["All", "Apparel", "Accessories", "Stationery", "Limited Edition"];
function Store() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState({ title: "", url: "" });
  const { wishlist, cart } = useStore();
  const cartCount = cart.length;
  const wishlistCount = wishlist.length;
  const handleShare = (product) => {
    setShareData({
      title: `Check out the ${product.name} at The Base Movement Supplies!`,
      url: window.location.origin + "/store/product/" + product.slug
    });
    setIsShareModalOpen(true);
  };
  const itemsPerPage = 12;
  useEffect(() => {
    let isMounted = true;
    async function fetchProducts() {
      setLoading(true);
      try {
        const data = await adminService.getStoreProducts();
        if (isMounted) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const FilterSection = ({ isMobile = false }) => /* @__PURE__ */ jsxs("div", { className: cn("space-y-8", isMobile && "pb-20"), children: [
    /* @__PURE__ */ jsxs("div", { className: cn("bg-white p-6 shadow-sm", !isMobile && "border border-stone-200"), children: [
      /* @__PURE__ */ jsx("h3", { className: "text-tiny font-bold text-stone-400 normal-case tracking-tight mb-6", children: "Store Filters" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold tracking-tight text-stone-500", children: "Search Supplies" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search products...",
                value: searchQuery,
                onChange: (e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                },
                className: "w-full h-11 pl-10 pr-4 bg-stone-50 border border-stone-200 rounded-none text-xs focus:ring-1 focus:ring-brand-green outline-none transition-all font-bold tracking-tight"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold tracking-tight text-stone-500", children: "Categories" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: categories.map((category) => /* @__PURE__ */ jsxs(
            Button,
            {
              variant: activeCategory === category ? "active-tab" : "default",
              onClick: () => {
                setActiveCategory(category);
                setCurrentPage(1);
              },
              className: cn(
                "w-full h-12 flex items-center justify-between px-4 text-tiny font-bold tracking-tight border rounded-none transition-all shadow-sm active:scale-95",
                activeCategory === category ? "" : "text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50"
              ),
              children: [
                category,
                activeCategory === category && /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-[hsl(var(--active-tab-text))] rounded-full" })
              ]
            },
            category
          )) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-on-surface p-8 text-white overflow-hidden relative rounded-sm shadow-xl", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-24 h-24 bg-primary/20 -mr-12 -mt-12 blur-2xl" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-accent text-micro font-bold tracking-tight uppercase", children: "Movement Impact" }),
        /* @__PURE__ */ jsx("h4", { className: "text-white text-lg font-meta font-bold tracking-tight leading-snug m-0", children: "Every purchase builds the base" }),
        /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/60 font-bold tracking-tight leading-relaxed m-0", children: "All profits are reinvested into grassroots organizing and community infrastructure across Ghana's 16 regions." })
      ] })
    ] })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-stone-50/50 pb-20", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Movement Supplies",
        description: "Equip yourself with official movement gear. Every purchase directly funds our grassroots organizing and civic education programs.",
        canonical: "/store"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-stone-200", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 md:px-8 py-16", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, {}),
      /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6 flex items-center gap-4", children: [
          /* @__PURE__ */ jsx(ShoppingBag, { className: "w-10 h-10 text-brand-green" }),
          "Movement Supplies"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, {}),
        /* @__PURE__ */ jsx("p", { className: "text-stone-500 max-w-2xl mt-6 leading-relaxed font-medium text-sm md:text-base", children: "Equip yourself with official movement gear. Every purchase directly funds our grassroots organizing and civic education programs." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "max-w-7xl mx-auto px-4 md:px-8 mt-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 w-full md:w-auto", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", className: "flex-1 md:flex-none relative group border-stone-200 hover:border-brand-red h-12 text-tiny font-bold tracking-tight rounded-none !overflow-visible overflow-visible", children: /* @__PURE__ */ jsxs(Link, { to: window.location.pathname.includes("/dashboard") ? "/dashboard/store/wishlist" : "/store/wishlist", children: [
            /* @__PURE__ */ jsx(Heart, { className: "w-4 h-4 mr-2 text-stone-500 group-hover:text-brand-red transition-all" }),
            "Wishlist",
            wishlistCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-2 -right-2 bg-brand-red text-white text-micro font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm z-30", children: wishlistCount })
          ] }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", className: "flex-1 md:flex-none relative group border-stone-200 hover:border-brand-green h-12 text-tiny font-bold tracking-tight rounded-none !overflow-visible overflow-visible", children: /* @__PURE__ */ jsxs(Link, { to: window.location.pathname.includes("/dashboard") ? "/dashboard/store/cart" : "/store/cart", children: [
            /* @__PURE__ */ jsx(ShoppingBag, { className: "w-4 h-4 mr-2 text-stone-500 group-hover:text-brand-green transition-all" }),
            "Bag",
            cartCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-2 -right-2 bg-brand-green text-white text-micro font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm z-30", children: cartCount })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "lg:hidden flex gap-4", children: /* @__PURE__ */ jsxs(Sheet, { children: [
          /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "default", className: "flex-1 h-12 gap-2 font-bold tracking-tight text-xs border-stone-200 rounded-none shadow-sm active:scale-95 hover:text-brand-green hover:bg-stone-50", children: [
            /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4" }),
            "Filter Supplies"
          ] }) }),
          /* @__PURE__ */ jsxs(SheetContent, { side: "left", className: "w-[300px] p-0 border-r-0", children: [
            /* @__PURE__ */ jsx(SheetHeader, { className: "p-6 border-b border-stone-100", children: /* @__PURE__ */ jsx(SheetTitle, { className: "font-meta font-bold tracking-tight text-lg", children: "Categories" }) }),
            /* @__PURE__ */ jsx("div", { className: "overflow-y-auto h-full p-6", children: /* @__PURE__ */ jsx(FilterSection, { isMobile: true }) })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-12", children: [
        /* @__PURE__ */ jsx("aside", { className: "hidden lg:block lg:w-[320px] shrink-0 lg:sticky lg:top-8 lg:self-start", children: /* @__PURE__ */ jsx(FilterSection, {}) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8", children: loading ? Array.from({ length: 9 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "aspect-[3/4] bg-stone-100 animate-pulse rounded-none" }, i)) : paginatedProducts.length > 0 ? paginatedProducts.map((product) => /* @__PURE__ */ jsx(ProductCard, { product, onShare: handleShare }, product.id)) : /* @__PURE__ */ jsxs("div", { className: "col-span-full py-24 text-center bg-white border border-stone-200 rounded-none", children: [
            /* @__PURE__ */ jsx(ShoppingBag, { className: "w-16 h-16 text-stone-100 mx-auto mb-4" }),
            /* @__PURE__ */ jsx("h3", { className: "text-stone-400 font-bold tracking-tight", children: "No products found." })
          ] }) }),
          totalPages > 1 && /* @__PURE__ */ jsx("div", { className: "mt-16 pt-12 border-t border-stone-100", children: /* @__PURE__ */ jsx(Pagination, { children: /* @__PURE__ */ jsxs(PaginationContent, { children: [
            /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsx(
              PaginationPrevious,
              {
                onClick: () => setCurrentPage((prev) => Math.max(1, prev - 1)),
                className: cn("cursor-pointer", currentPage === 1 && "opacity-30 pointer-events-none")
              }
            ) }),
            Array.from({ length: totalPages }).map((_, i) => /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsx(
              PaginationLink,
              {
                isActive: currentPage === i + 1,
                onClick: () => setCurrentPage(i + 1),
                className: "cursor-pointer font-bold tracking-tight",
                children: i + 1
              }
            ) }, i)),
            /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsx(
              PaginationNext,
              {
                onClick: () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)),
                className: cn("cursor-pointer", currentPage === totalPages && "opacity-30 pointer-events-none")
              }
            ) })
          ] }) }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "max-w-[1280px] mx-auto px-8 mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 py-16 border-t border-stone-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-emerald-50 rounded-none flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-brand-green", children: "local_shipping" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-stone-900 font-bold tracking-tight mb-2", children: "Nationwide Delivery" }),
          /* @__PURE__ */ jsx("p", { className: "text-tiny text-stone-500 font-bold tracking-tight leading-relaxed", children: "Prompt shipping to all 16 regions of Ghana and international hubs." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-amber-50 rounded-none flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-warm-gold", children: "verified_user" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-stone-900 font-bold tracking-tight mb-2", children: "Secure Payment" }),
          /* @__PURE__ */ jsx("p", { className: "text-tiny text-stone-500 font-bold tracking-tight leading-relaxed", children: "MoMo and Card payments protected by strategic encryption protocols." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-5", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-red-50 rounded-none flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-brand-red", children: "volunteer_activism" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-stone-900 font-bold tracking-tight mb-2", children: "Strategic Impact" }),
          /* @__PURE__ */ jsx("p", { className: "text-tiny text-stone-500 font-bold tracking-tight leading-relaxed", children: "100% of profits fund grassroots mobilization and regional empowerment." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      ShareModal,
      {
        isOpen: isShareModalOpen,
        onClose: () => setIsShareModalOpen(false),
        title: shareData.title,
        url: shareData.url
      }
    )
  ] });
}
export {
  Store as default
};
