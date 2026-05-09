import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link, Outlet } from "react-router-dom";
import { LayoutDashboard, FileText, Image, Trash2, Settings, Users, Shield, ShieldCheck, PenTool, Zap, MapPin, BarChart3, Brain, Trophy, Flag, Target, Vote, ShieldAlert, DollarSign, ShoppingBag, Megaphone, ChevronDown, LogOut, Menu, Search, Bell } from "lucide-react";
import { u as useBranding, a as adminService, c as cn, B as Button, D as DropdownMenu, n as DropdownMenuTrigger, o as DropdownMenuContent, p as DropdownMenuLabel, q as DropdownMenuSeparator, r as DropdownMenuItem } from "../main.mjs";
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
function AdminLayout({ children }) {
  const { settings } = useBranding();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [openGroups, setOpenGroups] = useState({
    "Core": true,
    "People": false,
    "Operations": false,
    "Finance": false,
    "Communications": false
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(adminService.getCurrentUser());
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  useEffect(() => {
    const applyDensity = () => {
      const density = localStorage.getItem("admin_interface_density") || "Comfortable";
      const root = document.documentElement;
      if (density === "Compact") {
        root.style.setProperty("--admin-padding", "1.5rem");
        root.style.setProperty("--admin-gap", "1rem");
        root.style.setProperty("--admin-font-scale", "0.95");
      } else if (density === "High Density") {
        root.style.setProperty("--admin-padding", "1rem");
        root.style.setProperty("--admin-gap", "0.75rem");
        root.style.setProperty("--admin-font-scale", "0.9");
      } else {
        root.style.setProperty("--admin-padding", "3rem");
        root.style.setProperty("--admin-gap", "2rem");
        root.style.setProperty("--admin-font-scale", "1");
      }
    };
    applyDensity();
    window.addEventListener("admin_density_changed", applyDensity);
    return () => window.removeEventListener("admin_density_changed", applyDensity);
  }, []);
  useEffect(() => {
    const init = async () => {
      const currentUser = await adminService.initialize();
      if (!currentUser) {
        navigate("/admin-login");
      } else {
        setUser(currentUser);
        const authUser = JSON.parse(localStorage.getItem("sb-yymncrshblmzeuomomnz-auth-token") || "{}")?.user;
        const fallbackAvatar = authUser?.user_metadata?.avatar_url || localStorage.getItem("userAvatar");
        setAvatarUrl(currentUser.avatarUrl || fallbackAvatar || null);
        try {
          const notes = await adminService.getNotifications();
          setUnreadCount(notes.filter((n) => !n.is_read).length);
        } catch (err) {
          console.error("Failed to fetch admin notifications:", err);
        }
      }
    };
    init();
  }, [navigate]);
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        setShowSearchResults(true);
        try {
          const results = await adminService.globalSearch(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const navGroups = [
    {
      label: "Core",
      icon: LayoutDashboard,
      items: [
        { to: "/admin/dashboard", icon: LayoutDashboard, label: "Overview" },
        { to: "/admin/blogs", icon: FileText, label: "Updates", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } },
        { to: "/admin/media", icon: Image, label: "Media Library", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } },
        { to: "/admin/trash", icon: Trash2, label: "Trash Vault", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } },
        { to: "/admin/settings", icon: Settings, label: "Settings", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } }
      ]
    },
    {
      label: "People",
      icon: Users,
      items: [
        { to: "/admin/members", icon: Users, label: "Verified", permission: { action: "VERIFY_MEMBER", resource: "MEMBERS" } },
        { to: "/admin/administrators", icon: Shield, label: "Administrators", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } },
        { to: "/admin/verification", icon: ShieldCheck, label: "Verifications", permission: { action: "VERIFY_MEMBER", resource: "MEMBERS" } },
        { to: "/admin/authors", icon: PenTool, label: "Authors", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } },
        { to: "/admin/leadership", icon: Zap, label: "Leadership", permission: { action: "MANAGE_CHAPTER", resource: "CHAPTERS" } },
        { to: "/admin/chapters", icon: MapPin, label: "Chapters", permission: { action: "MANAGE_CHAPTER", resource: "CHAPTERS" } },
        { to: "/admin/regions", icon: MapPin, label: "Regions", permission: { action: "MANAGE_CHAPTER", resource: "CHAPTERS" } }
      ]
    },
    {
      label: "Operations",
      icon: Target,
      items: [
        { to: "/admin/polls", icon: BarChart3, label: "Feedback", permission: { action: "MANAGE_POLLS", resource: "POLLS" } },
        { to: "/admin/sentiment-intelligence", icon: Brain, label: "Sentiment Analysis", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } },
        { to: "/admin/mobilization-metrics", icon: Trophy, label: "Mobilization", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } },
        { to: "/admin/roadmap", icon: Flag, label: "Roadmap", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } },
        { to: "/admin/directives", icon: Target, label: "Directives", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } },
        { to: "/admin/rally-command", icon: Target, label: "Events", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } },
        { to: "/admin/ground-game", icon: Vote, label: "Canvassing", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } },
        { to: "/admin/war-room", icon: ShieldAlert, label: "Alerts", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } }
      ]
    },
    {
      label: "Finance",
      icon: DollarSign,
      items: [
        { to: "/admin/donations", icon: DollarSign, label: "Financial Audit", permission: { action: "MANAGE_DONATIONS", resource: "DONATIONS" } },
        { to: "/admin/priorities", icon: Target, label: "Strategic Priorities", permission: { action: "MANAGE_DONATIONS", resource: "DONATIONS" } },
        { to: "/admin/store", icon: ShoppingBag, label: "Supplies", permission: { action: "MANAGE_INVENTORY", resource: "STORE" } },
        { to: "/admin/orders", icon: ShoppingBag, label: "Orders", permission: { action: "MANAGE_INVENTORY", resource: "STORE" } },
        { to: "/admin/logistics-intelligence", icon: BarChart3, label: "Logistics", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } }
      ]
    },
    {
      label: "Communications",
      icon: Megaphone,
      items: [
        { to: "/admin/broadcasts", icon: Megaphone, label: "Broadcasts", permission: { action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" } }
      ]
    }
  ];
  const filteredNavGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.permission) return true;
      return adminService.can(item.permission.action, item.permission.resource);
    })
  })).filter((group) => group.items.length > 0);
  const toggleGroup = (groupLabel) => {
    if (!isSidebarOpen) setIsSidebarOpen(true);
    setOpenGroups((prev) => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };
  const handleLogout = () => {
    navigate("/admin-login");
  };
  return /* @__PURE__ */ jsxs("div", { className: "h-screen bg-muted/30 font-meta text-on-surface flex overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        ),
        onClick: () => setIsSidebarOpen(false)
      }
    ),
    /* @__PURE__ */ jsx("aside", { className: cn(
      "fixed inset-y-0 left-0 z-50 flex flex-col bg-[hsl(var(--brand-green))] text-white transition-all duration-300 ease-in-out lg:relative lg:translate-x-0",
      isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:w-20 lg:translate-x-0"
    ), children: /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col", children: [
      /* @__PURE__ */ jsx("div", { className: cn(
        "h-24 flex items-center border-b border-white/5 overflow-hidden transition-all duration-300",
        isSidebarOpen ? "px-8" : "px-5"
      ), children: /* @__PURE__ */ jsxs(Link, { to: "/admin/dashboard", className: "flex items-center gap-4 shrink-0", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-white flex items-center justify-center shadow-2xl p-1.5 shrink-0", children: /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "The Base Logo", className: "w-full h-full object-contain", decoding: "async" }) }),
        /* @__PURE__ */ jsxs("div", { className: cn(
          "transition-all duration-300 origin-left",
          isSidebarOpen ? "opacity-100 scale-100" : "opacity-0 scale-0 w-0"
        ), children: [
          /* @__PURE__ */ jsx("p", { className: "text-white font-bold text-xl leading-none mb-0 tracking-tight", children: "The Base" }),
          /* @__PURE__ */ jsx("p", { className: "text-[var(--brand-gold)] text-micro font-bold tracking-tight mt-1.5 leading-none", children: "Admin Command Center" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("nav", { className: "flex-1 py-4 px-3 space-y-4 overflow-y-auto scrollbar-hide", children: [
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/",
            target: "_blank",
            rel: "noopener noreferrer",
            className: cn(
              "flex items-center gap-3 px-4 py-3 mb-8 mx-2 transition-all relative group bg-black/10 hover:bg-black/20 rounded-lg border border-white/10",
              isSidebarOpen ? "" : "justify-center px-0"
            ),
            children: [
              /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4 text-[var(--brand-gold)] group-hover:scale-110 transition-transform shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: cn(
                "text-micro font-bold tracking-tight transition-all duration-300 text-stone-100 group-hover:text-white",
                isSidebarOpen ? "opacity-100" : "opacity-0 w-0 hidden"
              ), children: "View live site" })
            ]
          }
        ),
        filteredNavGroups.map((group) => {
          const isOpen = openGroups[group.label];
          return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => toggleGroup(group.label),
                className: cn(
                  "w-full flex items-center justify-between px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 transition-colors group",
                  isSidebarOpen ? "" : "justify-center"
                ),
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx(group.icon, { className: "w-5 h-5 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { className: cn(
                      "text-xs font-bold tracking-tight whitespace-nowrap transition-all duration-300",
                      isSidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
                    ), children: group.label })
                  ] }),
                  isSidebarOpen && /* @__PURE__ */ jsx(ChevronDown, { className: cn(
                    "w-4 h-4 transition-transform duration-200",
                    isOpen ? "rotate-180" : ""
                  ) })
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: cn(
              "overflow-hidden transition-all duration-300 relative",
              isOpen && isSidebarOpen ? "max-h-[500px] opacity-100 mt-1 pb-2" : "max-h-0 opacity-0"
            ), children: [
              isSidebarOpen && /* @__PURE__ */ jsx("div", { className: "absolute left-[21px] top-0 bottom-4 w-px bg-white/20" }),
              group.items.map((item) => {
                const isActive = location.pathname === item.to;
                return /* @__PURE__ */ jsxs(
                  Link,
                  {
                    to: item.to,
                    className: cn(
                      "flex items-center gap-3 px-3 py-2.5 ml-8 transition-all relative group/item rounded-lg mr-4 mb-0.5",
                      isActive ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
                    ),
                    onClick: () => {
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    },
                    children: [
                      isSidebarOpen && /* @__PURE__ */ jsx("div", { className: "absolute left-[-16px] top-1/2 -translate-y-1/2 w-4 h-px bg-white/20" }),
                      /* @__PURE__ */ jsx("span", { className: cn(
                        "text-tiny font-bold tracking-tight whitespace-nowrap transition-all duration-300",
                        isSidebarOpen ? "opacity-100" : "opacity-0"
                      ), children: item.label }),
                      isActive && /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx("div", { className: "absolute left-[-42px] top-1/2 -translate-y-1/2 w-[4px] h-7 bg-[var(--brand-gold)] shadow-[0_0_20px_rgba(218,165,32,1)] z-10 rounded-r-full" }),
                        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/5 pointer-events-none rounded-lg" })
                      ] })
                    ]
                  },
                  item.to
                );
              })
            ] })
          ] }, group.label);
        })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-4 bg-black/20 border-t border-white/5", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleLogout,
          className: cn(
            "w-full flex items-center gap-4 px-4 py-4 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group overflow-hidden",
            isSidebarOpen ? "" : "justify-center"
          ),
          children: [
            /* @__PURE__ */ jsx(LogOut, { className: "w-5 h-5 group-hover:text-[var(--brand-gold)] shrink-0 transition-colors" }),
            /* @__PURE__ */ jsx("span", { className: cn(
              "text-tiny font-bold tracking-tight whitespace-nowrap transition-all duration-300",
              isSidebarOpen ? "opacity-100" : "opacity-0 w-0"
            ), children: "Sign out" })
          ]
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0 h-screen overflow-hidden", children: [
      /* @__PURE__ */ jsxs("header", { className: "h-14 bg-white border-b border-border/40 flex items-center justify-between px-6 sticky top-0 z-30 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 flex-1", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => setIsSidebarOpen(!isSidebarOpen),
              className: "h-9 w-9 text-muted-foreground/80 hover:bg-muted/30 hover:text-[var(--brand-green)] transition-all",
              children: /* @__PURE__ */ jsx(Menu, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full relative group hidden md:block", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80 group-focus-within:text-[var(--brand-green)] transition-colors z-10" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search command center...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                onFocus: () => searchQuery.length >= 2 && setShowSearchResults(true),
                className: "w-full h-9 pl-9 pr-4 bg-muted/30 border-transparent focus:bg-white focus:border-border/40 focus:ring-0 transition-all text-xs outline-none font-medium placeholder:text-muted-foreground/80 rounded-lg"
              }
            ),
            showSearchResults && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "fixed inset-0 z-40",
                  onClick: () => setShowSearchResults(false)
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "absolute top-full left-0 right-0 mt-2 bg-white border border-border/40 shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200", children: [
                /* @__PURE__ */ jsxs("div", { className: "p-2 border-b border-border/10 bg-muted/5 flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/60 tracking-tight px-2", children: "Global Search results" }),
                  isSearching && /* @__PURE__ */ jsx("div", { className: "w-3 h-3 border-2 border-[var(--brand-green)] border-t-transparent rounded-full animate-spin mr-2" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "max-h-[400px] overflow-y-auto py-2", children: searchResults.length > 0 ? searchResults.map((result) => /* @__PURE__ */ jsxs(
                  Link,
                  {
                    to: result.to,
                    onClick: () => {
                      setShowSearchResults(false);
                      setSearchQuery("");
                    },
                    className: "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                        result.type === "Member" && "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
                        result.type === "Article" && "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
                        result.type === "Chapter" && "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
                        result.type === "Product" && "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
                        result.type === "Broadcast" && "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
                        result.type === "Author" && "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                      ), children: [
                        result.type === "Member" && /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
                        result.type === "Article" && /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
                        result.type === "Chapter" && /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4" }),
                        result.type === "Product" && /* @__PURE__ */ jsx(ShoppingBag, { className: "w-4 h-4" }),
                        result.type === "Broadcast" && /* @__PURE__ */ jsx(Megaphone, { className: "w-4 h-4" }),
                        result.type === "Author" && /* @__PURE__ */ jsx(PenTool, { className: "w-4 h-4" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                        /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-on-surface truncate leading-none mb-1", children: result.title }),
                        result.subtitle && /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/60 truncate leading-none", children: result.subtitle })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: "text-micro font-bold tracking-tight text-muted-foreground/30 px-1.5 py-0.5 border border-border/10 rounded", children: result.type })
                    ]
                  },
                  `${result.type}-${result.id}`
                )) : !isSearching ? /* @__PURE__ */ jsx("div", { className: "py-8 px-4 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-muted-foreground/40 italic", children: [
                  'No mobilization records found for "',
                  searchQuery,
                  '"'
                ] }) }) : null }),
                /* @__PURE__ */ jsx("div", { className: "p-3 bg-muted/5 border-t border-border/10 flex items-center justify-center", children: /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-muted-foreground/40 tracking-tight", children: [
                  "Press ",
                  /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-white border border-border/40 rounded text-micro mx-1", children: "ESC" }),
                  " to dismiss"
                ] }) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "icon", className: "h-10 w-10 text-muted-foreground/80 hover:bg-stone-100 hover:text-[var(--brand-green)] transition-all relative group", children: [
            /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5 group-hover:rotate-12 transition-transform" }),
            unreadCount > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "absolute top-2 right-2 w-4 h-4 bg-[var(--brand-red)] rounded-full animate-ping opacity-75" }),
              /* @__PURE__ */ jsx("span", { className: "absolute top-2 right-2 min-w-[16px] h-4 px-1 bg-[var(--brand-red)] rounded-full border-2 border-white shadow-[0_0_8px_rgba(206,17,38,0.8)] flex items-center justify-center text-micro font-black text-white", children: unreadCount > 99 ? "99+" : unreadCount })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-border/40 mx-1" }),
          /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2 py-1 px-2 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer group", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-right hidden sm:block pt-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-on-surface leading-none", children: user?.name }),
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 mt-1 leading-none tracking-tight", children: user?.role === "FOUNDER" ? "Movement Founder" : user?.role === "ORGANIZER" ? "Strategic Organizer" : user?.role === "SUPER_ADMIN" ? "System Admin" : user?.role === "REGIONAL_DIRECTOR" ? "Regional Director" : user?.role === "CONSTITUENCY_LEAD" ? "Constituency Lead" : "Staff Verifier" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-[var(--brand-black)] text-white flex items-center justify-center font-bold text-micro rounded-full ring-2 ring-stone-100 group-hover:ring-[var(--brand-green)] transition-all overflow-hidden", children: avatarUrl ? /* @__PURE__ */ jsx("img", { src: avatarUrl, alt: user?.name || "", className: "w-full h-full object-cover", decoding: "async" }) : user?.name.split(" ").map((n) => n[0]).join("") || "HQ" })
            ] }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-56 mt-2", children: [
              /* @__PURE__ */ jsx(DropdownMenuLabel, { className: "font-normal", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-1", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold leading-none", children: user?.name }),
                /* @__PURE__ */ jsx("p", { className: "text-xs leading-none text-muted-foreground/80", children: user?.email })
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin/settings", className: "cursor-pointer w-full flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { children: "Administrative settings" })
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/admin/logs", className: "cursor-pointer w-full flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { children: "View audit logs" })
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: handleLogout,
                  className: "text-red-600 focus:text-red-600 cursor-pointer flex items-center gap-2",
                  children: [
                    /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
                    /* @__PURE__ */ jsx("span", { children: "Sign out" })
                  ]
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "main",
        {
          className: "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
          style: {
            padding: "var(--admin-padding, 2.5rem)",
            fontSize: `calc(1rem * var(--admin-font-scale, 1))`
          },
          children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto w-full", children: children || /* @__PURE__ */ jsx(Outlet, {}) })
        }
      )
    ] })
  ] });
}
export {
  AdminLayout as default
};
