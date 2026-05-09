import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Building2, Factory, Construction, Landmark, Sprout, ArrowRight } from "lucide-react";
import { u as useBranding, S as SEO, b as BrandLine, B as Button } from "../main.mjs";
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
const agendaPillars = [
  {
    id: "education",
    number: "01",
    title: "Quality Education for Every Ghanaian",
    icon: GraduationCap,
    color: "hsl(var(--primary))",
    summary: "Ensure universal access to quality formal and informal education that produces informed, capable, and civically responsible Ghanaian citizens at every level of society.",
    objectives: [
      {
        title: "Universal Access",
        items: [
          "Fully fund free quality education covering tuition, materials and meals for every child.",
          "Build or rehabilitate at least one equipped school in every community of 500+.",
          "Introduce credible scholarships for deserving students from low-income households."
        ]
      },
      {
        title: "Curriculum & Civic Reform",
        items: [
          "Integrate critical thinking, financial literacy, entrepreneurship and civic responsibility into the national curriculum at every level.",
          "Launch community learning centres and adult literacy programmes to reach those who missed formal schooling."
        ]
      },
      {
        title: "Teacher Quality",
        items: [
          "Improve teacher conditions of service, making the profession well-compensated and respected.",
          "Invest in continuous professional development, especially in science, mathematics and technical education."
        ]
      }
    ]
  },
  {
    id: "government",
    number: "02",
    title: "Lean, Accountable Government",
    icon: Building2,
    color: "hsl(var(--destructive))",
    summary: "Build a right-sized, fiscally disciplined government where public office is a service to the nation, not a path to personal enrichment, and where every cedi of public money is accounted for.",
    objectives: [
      {
        title: "Right-Sizing Government",
        items: [
          "Audit all ministries and agencies within 90 days of assuming office and publish findings publicly.",
          "Reduce ministers to the constitutional minimum.",
          "Merge overlapping agencies to eliminate duplication."
        ]
      },
      {
        title: "Fiscal Discipline & Anti-Corruption",
        items: [
          "Enforce transparent, performance-linked public sector pay.",
          "Strengthen anti-corruption institutions.",
          "Mandate publicly accessible asset declarations for all political appointees.",
          "Prosecute all documented corruption regardless of party."
        ]
      }
    ]
  },
  {
    id: "industry",
    number: "03",
    title: "Industrialisation, Tourism & Agro-Processing",
    icon: Factory,
    color: "hsl(var(--accent))",
    summary: "Drive economic growth and mass employment through three powerful engines: building factories and industries across all 16 regions, developing Ghana into a world-class tourism destination, and transforming raw agricultural produce into high-value processed goods that keep wealth and jobs inside Ghana.",
    objectives: [
      {
        title: "Industrialisation Factories Across All 16 Regions",
        items: [
          "Establish manufacturing plants and processing facilities in all 16 regions, beginning with five regions in the first phase.",
          "Develop industrial zones with fiscal incentives including tax holidays and import duty waivers on machinery.",
          "Prioritise regions with the highest youth unemployment.",
          "Build a pharmaceutical manufacturing hub in Gomoa Okyereko to produce medicines locally for Ghana and for export across Africa."
        ]
      },
      {
        title: "Tourism Unlocking Ghana's Economic Potential",
        items: [
          "Transform Ghana's beaches, national parks, including Mole National Park, and heritage sites into world-class tourism destinations through targeted infrastructure investment.",
          "Develop the Volta Region as a dedicated creative economy and eco-tourism hub.",
          "Establish a landmark national monument to position Ghana on the global tourism map.",
          "Use tourism receipts to strengthen the Cedi and reduce pressure on foreign exchange."
        ]
      },
      {
        title: "Agro-Processing Keeping Value in Ghana",
        items: [
          "Build agro-processing hubs in key agricultural zones to process cassava into ethanol and starch, plantain stems into textile fibre and paper, coconut into oil and activated carbon, and yam into pharmaceutical-grade flour.",
          "Eliminate the export of raw agricultural commodities at low prices.",
          "Ensure that every harvest creates not just farm income but factory jobs, packaging jobs, and export revenue that stays inside Ghana."
        ]
      }
    ]
  },
  {
    id: "infrastructure",
    number: "04",
    title: "Quality Infrastructure From Cities to Villages",
    icon: Construction,
    color: "hsl(var(--primary))",
    summary: "Deliver world-class roads, energy, water, and digital infrastructure across Ghana, with deliberate priority given to rural and village communities that have been left behind.",
    objectives: [
      {
        title: "Rural Road Development",
        items: [
          "Develop a National Rural Roads Master Plan to fund construction and rehabilitation of all critical feeder roads.",
          "Ensure every farming community has an all-season road within two terms.",
          "Create a dedicated Rural Roads Maintenance Fund."
        ]
      },
      {
        title: "Urban & Housing",
        items: [
          "Invest in urban road networks, drainage and public transport.",
          "Develop an affordable housing programme with accessible financing for working families."
        ]
      },
      {
        title: "Energy & Digital",
        items: [
          "Achieve 100% household electrification within two terms.",
          "Extend broadband internet access to all districts, enabling a digital economy beyond the major cities."
        ]
      }
    ]
  },
  {
    id: "reform",
    number: "05",
    title: "Comprehensive Institutional Reform",
    icon: Landmark,
    color: "hsl(var(--destructive))",
    summary: "Restructure, streamline, and strengthen all public institutions so that government serves the people efficiently, transparently, and without unnecessary duplication or waste.",
    objectives: [
      {
        title: "Restructuring Institutions",
        items: [
          "Conduct a full functional review of all state institutions in year one.",
          "Merge overlapping ministries guided by service delivery, not politics.",
          "Establish a permanent independent Public Sector Reform Commission."
        ]
      },
      {
        title: "Judicial & Law Enforcement",
        items: [
          "Strengthen judicial independence and speed.",
          "Reform the Ghana Police Service with better training, welfare and accountability.",
          "Create independent oversight for all law enforcement."
        ]
      },
      {
        title: "Electoral & Democratic Reform",
        items: [
          "Strengthen the Electoral Commission's independence.",
          "Introduce campaign finance legislation to limit the influence of money in democratic processes."
        ]
      }
    ]
  },
  {
    id: "agriculture",
    number: "06",
    title: "Expertise-Led Agriculture Sector",
    icon: Sprout,
    color: "hsl(var(--accent))",
    summary: "Place qualified agricultural experts, scientists, and practitioners in charge of Ghana's food and farming sector, driving evidence-based policy, agro-processing, and genuine food security.",
    objectives: [
      {
        title: "Expert Leadership",
        items: [
          "Appoint Ministers and senior officials based on agricultural expertise, not political loyalty.",
          "Establish an independent Agricultural Advisory Council.",
          "Deploy trained extension officers to every district."
        ]
      },
      {
        title: "Agro-Processing & Value Addition",
        items: [
          "Build processing hubs in key agricultural zones to produce ethanol, starch, oils and derivatives locally.",
          "Develop a National Irrigation Programme for year-round productivity."
        ]
      },
      {
        title: "Farmer Welfare & Food Security",
        items: [
          "Introduce a Farmer Support Programme covering subsidised inputs, crop insurance, guaranteed minimum pricing and market access.",
          "Build strategic grain reserves and mechanise farming at scale in northern regions."
        ]
      }
    ]
  }
];
function OurAgenda() {
  const { settings } = useBranding();
  const [activeSection, setActiveSection] = useState("education");
  const [isLoggedIn] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("userName");
    }
    return false;
  });
  useEffect(() => {
    const handleScroll = () => {
      const sections = agendaPillars.map((p) => document.getElementById(p.id));
      const scrollPosition = window.scrollY + 200;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(agendaPillars[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return /* @__PURE__ */ jsxs("main", { className: "bg-surface-warm font-body-md min-h-screen pb-24", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "The Plan for Ghana",
        description: "The Six Aims of The Base. A detailed, actionable blueprint to build a stronger, more prosperous nation through patriotism, honesty, and discipline.",
        canonical: "/our-agenda"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "bg-charcoal-dark text-white pt-24 pb-16 relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 opacity-20 bg-hero-gradient" }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-8 relative z-10 text-center", children: [
        /* @__PURE__ */ jsx("h1", { className: "tracking-tighter mb-4", children: "The Plan" }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mx-auto" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-300 max-w-2xl mx-auto prose-standard", children: "The Six Aims of The Base. A detailed, actionable blueprint to build a stronger, more prosperous nation through patriotism, honesty, and discipline." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "max-w-[1280px] mx-auto px-8 mt-16", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-12", children: [
      /* @__PURE__ */ jsx("aside", { className: "lg:w-1/4 hidden lg:block", children: /* @__PURE__ */ jsxs("div", { className: "sticky top-20 space-y-4 font-meta", children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight mb-6", children: "Plan pillars" }),
        /* @__PURE__ */ jsx("nav", { "aria-label": "Agenda Pillars", className: "flex flex-col space-y-2", children: agendaPillars.map((pillar) => /* @__PURE__ */ jsxs(
          "a",
          {
            href: `#${pillar.id}`,
            className: `block py-2 text-sm transition-all ${activeSection === pillar.id ? "sticky-nav-active" : "text-slate-600 hover:text-primary border-l-3 border-transparent pl-4"}`,
            children: [
              pillar.number,
              ". ",
              pillar.title
            ]
          },
          pillar.id
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 overflow-hidden rounded-sm relative group", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: settings.founder_image_url || "/branding/founder-image.jpg",
              alt: "Dr. George Oti Bonsu The Base Movement Founder",
              className: "w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105",
              decoding: "async",
              loading: "lazy"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-white text-micro font-bold tracking-tight leading-tight mb-0", children: "Dr. George Oti Bonsu" }),
            /* @__PURE__ */ jsx("p", { className: "text-white/70 text-micro font-bold tracking-tight mt-0.5 mb-0", children: "Movement Founder" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "lg:w-3/4 flow", style: { "--flow-space": "4rem" }, children: [
        /* @__PURE__ */ jsxs("section", { "aria-labelledby": "agenda-intro-heading", className: "flex-columns items-stretch", style: { "--column-gap": "2rem" }, children: [
          /* @__PURE__ */ jsx("h2", { id: "agenda-intro-heading", className: "sr-only", children: "Agenda Definitions" }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 border border-slate-200 rounded-none shadow-sm flow", style: { "--flow-space": "1rem" }, children: [
            /* @__PURE__ */ jsx("h3", { className: "text-primary tracking-tight", children: "What is an Aim?" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-600 leading-relaxed text-sm prose-standard", children: 'An Aim is a broad, long-term statement of intent. It describes the desired end state or the overall direction a movement or organisation wishes to pursue. Aims are visionary in nature. They answer the question: "What kind of Ghana are we trying to build?" They are not time-bound or immediately measurable, but they provide the moral compass and purpose that guides all action.' })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 border border-slate-200 rounded-none shadow-sm flow", style: { "--flow-space": "1rem" }, children: [
            /* @__PURE__ */ jsx("h3", { className: "text-primary tracking-tight", children: "What is an Objective?" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-600 leading-relaxed text-sm prose-standard", children: `An Objective is a specific, actionable, and measurable step taken in pursuit of an Aim. Objectives answer the question: "Exactly what will we do and how?" They are concrete, time-oriented, and directly deliverable. Where an Aim sets the destination, an Objective maps the route. Every objective in this document is derived from one of THE BASE's six core Aims.` })
          ] })
        ] }),
        agendaPillars.map((pillar) => /* @__PURE__ */ jsxs(
          "section",
          {
            id: pillar.id,
            "aria-labelledby": `pillar-heading-${pillar.id}`,
            className: "pillar-card bg-white border border-slate-200 rounded-none p-8 md:p-12 shadow-sm border-l-4 scroll-mt-24",
            style: { borderLeftColor: pillar.color },
            children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-6 mb-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-12 h-12 shrink-0 flex items-center justify-center bg-surface-warm", style: { color: pillar.color }, children: /* @__PURE__ */ jsx(pillar.icon, { className: "w-6 h-6" }) }),
                  /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold tracking-tight mb-0", style: { color: pillar.color }, children: [
                    "Aim ",
                    pillar.number
                  ] })
                ] }),
                /* @__PURE__ */ jsx("h2", { id: `pillar-heading-${pillar.id}`, className: "mb-0", children: pillar.title })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-700 leading-relaxed font-medium mb-10 pb-10 border-b border-slate-100 prose-standard", children: pillar.summary }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight mb-0", children: "Objectives" }),
                pillar.objectives.map((obj, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-surface-warm p-6 rounded-none", children: [
                  /* @__PURE__ */ jsx("h3", { className: "mb-4", children: obj.title }),
                  /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: obj.items.map((item, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3 text-slate-600 text-sm leading-relaxed", children: [
                    /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 mt-2 bg-accent shrink-0 rounded-none" }),
                    /* @__PURE__ */ jsx("span", { children: item })
                  ] }, i)) })
                ] }, idx))
              ] })
            ]
          },
          pillar.id
        )),
        /* @__PURE__ */ jsxs("section", { "aria-labelledby": "covenant-heading", className: "bg-charcoal-dark text-white p-6 md:p-12 text-center mt-24", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-primary mx-auto mb-6 flex items-center justify-center", children: /* @__PURE__ */ jsx(Landmark, { className: "w-8 h-8 text-white" }) }),
          /* @__PURE__ */ jsx("h2", { id: "covenant-heading", className: "mb-6", children: "Our Covenant with Ghana" }),
          /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-4 text-slate-300 mb-8", children: [
            /* @__PURE__ */ jsx("p", { children: "These Aims define the Ghana we are building. These Objectives are the steps we will be held accountable to. Together, they form THE BASE's covenant with every Ghanaian who believes this country can, and must, do better." }),
            /* @__PURE__ */ jsx("p", { children: "We do not offer vague promises. We offer an honest, detailed, and actionable agenda rooted in the realities of ordinary Ghanaians and the potential of an extraordinary nation." }),
            /* @__PURE__ */ jsx("p", { className: "text-accent font-bold tracking-tight mt-4 mb-0", children: "Ghana First. Always." })
          ] }),
          isLoggedIn ? /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", size: "lg", children: /* @__PURE__ */ jsxs(Link, { to: "/dashboard/members", children: [
            "View Members ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2" })
          ] }) }) : /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", size: "lg", children: /* @__PURE__ */ jsxs(Link, { to: "/register", children: [
            "Join The Movement ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2" })
          ] }) })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  OurAgenda as default
};
