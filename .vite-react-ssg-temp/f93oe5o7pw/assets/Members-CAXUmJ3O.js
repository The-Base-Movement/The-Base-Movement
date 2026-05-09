import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { c as cn, C as Card, d as CardContent, L as LoadingScreen, b as BrandLine, I as Input, B as Button, a as adminService } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DF-S1mCR.js";
import { User, MapPin, Globe, Users, Search, ArrowUpDown, Filter, X } from "lucide-react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle } from "./dialog-D9Fxht2W.js";
import "vite-react-ssg";
import "@tanstack/react-query";
import "react-helmet-async";
import "react-router-dom";
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
import "@radix-ui/react-select";
import "@radix-ui/react-dialog";
function Tabs({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Root,
    {
      "data-slot": "tabs",
      className: cn("flex flex-col gap-2", className),
      ...props
    }
  );
}
function TabsList({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.List,
    {
      "data-slot": "tabs-list",
      className: cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      ),
      ...props
    }
  );
}
function TabsTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Trigger,
    {
      "data-slot": "tabs-trigger",
      className: cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
function MemberProfileCard({ member, setSelectedMember }) {
  return /* @__PURE__ */ jsxs(
    "article",
    {
      "aria-labelledby": `member-name-${member.id}`,
      onClick: () => setSelectedMember(member),
      className: "group relative p-[1px] transition-all duration-500 hover:scale-[1.02] cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-primary/10",
      children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-destructive via-accent to-primary opacity-30 group-hover:opacity-100 transition-opacity duration-500" }),
        /* @__PURE__ */ jsx(Card, { className: "relative border-none shadow-none bg-white rounded-none overflow-hidden h-full", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-none bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors duration-500", children: /* @__PURE__ */ jsx(User, { className: "w-7 h-7 text-primary group-hover:text-white transition-colors duration-500" }) }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx(
                  "h3",
                  {
                    id: `member-name-${member.id}`,
                    className: "text-charcoal-dark truncate text-base font-bold tracking-tight",
                    children: member.name
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 tracking-tight mt-0.5 mb-0", children: member.profession })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-col items-end shrink-0", children: /* @__PURE__ */ jsx("span", { className: "text-[7px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-none tracking-tight", children: member.status === "Active" || member.status === "Approved" || !member.status ? "VERIFIED" : "PENDING" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-6 border-t border-slate-50 space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-500", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-primary" }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight truncate", children: member.platform === "GHANA" ? `${member.constituency}, ${member.region}` : member.country })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-500", children: [
              /* @__PURE__ */ jsx(Globe, { className: "w-3 h-3 text-accent" }),
              /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold tracking-tight", children: [
                member.platform,
                " platform"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx("button", { className: "w-full py-2.5 bg-slate-50 group-hover:bg-primary group-hover:text-white text-micro font-bold tracking-tight rounded-none transition-all", children: "View profile" }) })
        ] }) })
      ]
    }
  );
}
const diasporaCountries = [
  "United Kingdom",
  "United States",
  "Canada",
  "Germany",
  "France",
  "Australia",
  "South Africa",
  "United Arab Emirates",
  "Netherlands",
  "Italy"
];
const professions = [
  "Healthcare",
  "Education",
  "Finance",
  "Law",
  "Technology",
  "Agriculture",
  "Creative Arts",
  "Engineering",
  "Trade",
  "Research"
];
function Members() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ghanaRegions, setGhanaRegions] = useState([]);
  const [regionConstituencies, setRegionConstituencies] = useState({});
  const [search, setSearch] = useState("");
  const [activePlatform, setActivePlatform] = useState("GHANA");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedConstituency, setSelectedConstituency] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedProfession, setSelectedProfession] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedMember, setSelectedMember] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedMembers, fetchedRegions] = await Promise.all([
          adminService.getMembers(),
          adminService.getRegions()
        ]);
        const mappedMembers = fetchedMembers.map((m) => ({
          id: m.id || Math.random().toString(),
          name: m.name || "Unnamed Patriot",
          email: m.email || "",
          phone: m.phone || "",
          platform: m.type === "Standard" ? "GHANA" : "DIASPORA",
          region: m.region || "",
          constituency: m.constituency || "",
          country: m.country || "Ghana",
          profession: m.profession || "Patriot",
          avatarUrl: m.avatarUrl || void 0,
          status: m.status || "Pending",
          joined: m.joined || (/* @__PURE__ */ new Date()).toISOString(),
          type: m.type || "Standard"
        }));
        const regionsArr = [];
        const constMap = {};
        fetchedRegions.forEach((r) => {
          if (r.name) {
            regionsArr.push(r.name);
            constMap[r.name] = r.constituencies || [];
          }
        });
        setMembers(mappedMembers);
        setGhanaRegions(regionsArr);
        setRegionConstituencies(constMap);
      } catch (error) {
        console.error("[MEMBERS] Data sync failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const filteredMembers = useMemo(() => {
    const sourceData = members.length > 0 ? members : [];
    return sourceData.filter((member) => {
      const matchesPlatform = member.platform === activePlatform;
      const memberName = member.name || "";
      const matchesSearch = memberName.toLowerCase().includes(search.toLowerCase());
      const matchesProfession = selectedProfession === "all" || member.profession === selectedProfession;
      if (activePlatform === "GHANA") {
        const matchesRegion = selectedRegion === "all" || member.region === selectedRegion;
        const matchesConstituency = selectedConstituency === "all" || member.constituency === selectedConstituency;
        return matchesPlatform && matchesSearch && matchesRegion && matchesConstituency && matchesProfession;
      } else {
        const matchesCountry = selectedCountry === "all" || member.country === selectedCountry;
        return matchesPlatform && matchesSearch && matchesCountry && matchesProfession;
      }
    }).sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      if (sortOrder === "asc") return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });
  }, [members, activePlatform, search, selectedRegion, selectedConstituency, selectedCountry, selectedProfession, sortOrder]);
  const constituencies = useMemo(() => {
    if (selectedRegion === "all") return [];
    return regionConstituencies[selectedRegion] || [];
  }, [selectedRegion, regionConstituencies]);
  if (isLoading) return /* @__PURE__ */ jsx(LoadingScreen, {});
  return /* @__PURE__ */ jsxs("div", { className: "bg-stone-50/50 min-h-screen font-meta pb-20", children: [
    /* @__PURE__ */ jsxs("section", { className: "bg-on-surface py-20 px-8 relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-10", children: /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03]" }) }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-primary/10 border border-primary/20 rounded-sm flex items-center justify-center", children: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6 text-primary shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.3)]" }) }),
          /* @__PURE__ */ jsx("h1", { className: "text-white text-5xl md:text-7xl font-bold tracking-tighter m-0", children: "Movement Directory" })
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mb-8" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/60 max-w-xl mb-0 font-body-md leading-relaxed", children: "The Base movement is built by its people. Connect with brothers and sisters committed to Ghana's prosperity, both at home and in the diaspora." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-8 -mt-12 relative z-20", children: /* @__PURE__ */ jsx(Card, { className: "border-none shadow-[0_48px_96px_-16px_rgba(0,0,0,0.1)] overflow-hidden bg-white rounded-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 border-b border-border/40 bg-white space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-6 items-start lg:items-center", children: [
          /* @__PURE__ */ jsx(
            Tabs,
            {
              defaultValue: "GHANA",
              onValueChange: (val) => {
                setActivePlatform(val);
                setSelectedRegion("all");
                setSelectedConstituency("all");
                setSelectedCountry("all");
              },
              className: "w-full lg:w-auto",
              children: /* @__PURE__ */ jsxs(TabsList, { className: "bg-slate-50 p-1 h-12 w-full lg:w-auto", children: [
                /* @__PURE__ */ jsx(TabsTrigger, { value: "GHANA", className: "flex-1 lg:px-8 font-bold text-micro tracking-tight data-[state=active]:bg-white data-[state=active]:text-[var(--brand-green)] data-[state=active]:shadow-sm rounded-none", children: "Ghana" }),
                /* @__PURE__ */ jsx(TabsTrigger, { value: "DIASPORA", className: "flex-1 lg:px-8 font-bold text-micro tracking-tight data-[state=active]:bg-white data-[state=active]:text-[var(--brand-green)] data-[state=active]:shadow-sm rounded-none", children: "Diaspora" })
              ] })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 w-full relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Search by name or profession...",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                className: "pl-12 h-12 bg-slate-50 border-none font-medium placeholder:text-slate-300 rounded-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 w-full lg:w-auto bg-slate-50 p-1 rounded-none", children: /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setSortOrder((prev) => prev === "asc" ? "desc" : "asc"),
              className: "flex items-center gap-2 px-4 py-2 text-micro font-bold tracking-tight text-slate-500 hover:text-[var(--brand-green)] transition-colors",
              children: [
                /* @__PURE__ */ jsx(ArrowUpDown, { className: "w-3 h-3" }),
                "Sort ",
                sortOrder === "asc" ? "A-Z" : "Z-A"
              ]
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4 pt-4 border-t border-slate-50", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-400 mr-2", children: [
            /* @__PURE__ */ jsx(Filter, { className: "w-3 h-3" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight", children: "Filter by:" })
          ] }),
          activePlatform === "GHANA" ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(Select, { value: selectedRegion, onValueChange: (val) => {
              setSelectedRegion(val);
              setSelectedConstituency("all");
            }, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full sm:w-48 bg-white border-slate-200 text-micro font-bold tracking-tight rounded-none h-10", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All regions" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs font-bold", children: "All regions" }),
                ghanaRegions.map((r) => /* @__PURE__ */ jsx(SelectItem, { value: r, className: "text-xs font-bold", children: r }, r))
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Select, { value: selectedConstituency, onValueChange: setSelectedConstituency, disabled: selectedRegion === "all", children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full sm:w-56 bg-white border-slate-200 text-micro font-bold tracking-tight rounded-none h-10", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All constituencies" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs font-bold", children: "All constituencies" }),
                constituencies.map((c) => /* @__PURE__ */ jsx(SelectItem, { value: c, className: "text-xs font-bold", children: c }, c))
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxs(Select, { value: selectedCountry, onValueChange: setSelectedCountry, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full sm:w-56 bg-white border-slate-200 text-micro font-bold tracking-tight rounded-none h-10", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All countries" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs font-bold", children: "All countries" }),
              diasporaCountries.map((c) => /* @__PURE__ */ jsx(SelectItem, { value: c, className: "text-xs font-bold", children: c }, c))
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Select, { value: selectedProfession, onValueChange: setSelectedProfession, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full sm:w-56 bg-white border-slate-200 text-micro font-bold tracking-tight rounded-none h-10", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All professions" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs font-bold", children: "All professions" }),
              professions.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p, className: "text-xs font-bold", children: p }, p))
            ] })
          ] }),
          (search !== "" || selectedRegion !== "all" || selectedConstituency !== "all" || selectedCountry !== "all" || selectedProfession !== "all") && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                setSearch("");
                setSelectedRegion("all");
                setSelectedConstituency("all");
                setSelectedCountry("all");
                setSelectedProfession("all");
              },
              className: "flex items-center gap-2 px-4 py-2 text-micro font-bold tracking-tight text-red-500 hover:bg-red-50 rounded-none transition-all ml-auto",
              children: [
                /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }),
                "Clear filters"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-8", children: filteredMembers.length > 0 ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: filteredMembers.map((member) => /* @__PURE__ */ jsx(
        MemberProfileCard,
        {
          member,
          setSelectedMember
        },
        member.id
      )) }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-32 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-muted/30 rounded-sm flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Users, { className: "w-10 h-10 text-muted-foreground/20" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-on-surface font-meta font-bold tracking-tight", children: "No members found" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/60 max-w-sm mt-2 font-bold text-tiny tracking-tight", children: "We couldn't find any members matching your current filters. Try adjusting your search criteria." }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setSearch("");
              setSelectedRegion("all");
              setSelectedConstituency("all");
              setSelectedCountry("all");
              setSelectedProfession("all");
            },
            className: "mt-8 text-[var(--brand-green)] font-bold text-micro tracking-tight hover:underline",
            children: "Reset all filters"
          }
        )
      ] }) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!selectedMember, onOpenChange: (open) => !open && setSelectedMember(null), children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[450px] p-0 overflow-hidden border-none rounded-none bg-white", children: [
      /* @__PURE__ */ jsx(DialogHeader, { className: "p-0", children: /* @__PURE__ */ jsxs("div", { className: "bg-on-surface p-8 relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-20", children: /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03]" }) }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col items-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-24 h-24 rounded-sm bg-primary/10 border-4 border-primary/20 flex items-center justify-center mb-4 shadow-xl", children: /* @__PURE__ */ jsx(User, { className: "w-12 h-12 text-primary" }) }),
          /* @__PURE__ */ jsx(DialogTitle, { className: "text-white mb-1 font-meta font-bold tracking-tight", children: selectedMember?.name }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-primary tracking-tight uppercase", children: selectedMember?.profession }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold bg-primary/20 text-primary px-3 py-1 rounded-sm tracking-tight", children: selectedMember?.status === "Active" || selectedMember?.status === "Approved" || !selectedMember?.status ? "VERIFIED" : "PENDING" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-1 bg-accent shadow-[0_-2px_10px_rgba(var(--brand-gold-rgb),0.5)]" })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 tracking-tight", children: "Platform" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Globe, { className: "w-3 h-3 text-primary" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-charcoal-dark mb-0", children: selectedMember?.platform })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 tracking-tight mb-0", children: "Joined date" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Users, { className: "w-3 h-3 text-accent" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-charcoal-dark mb-0", children: "Oct 2024" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 tracking-tight", children: "Location" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-slate-50 p-3 rounded-none border border-slate-100", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 text-primary" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-charcoal-dark mb-0", children: selectedMember?.platform === "GHANA" ? `${selectedMember?.constituency}, ${selectedMember?.region} Region` : `${selectedMember?.country}` })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-slate-400 tracking-tight", children: "Member bio" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600 leading-relaxed font-medium", children: "Committed to the growth and prosperity of Ghana. Active participant in community development projects and movement initiatives." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-slate-100 flex gap-4", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "primary",
              className: "flex-1 py-6 text-micro shadow-lg shadow-primary/20",
              children: "Send message"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              onClick: () => setSelectedMember(null),
              className: "flex-1 py-6 text-micro",
              children: "Close"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Members as default
};
