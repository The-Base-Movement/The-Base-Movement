import { jsxs, jsx } from "react/jsx-runtime";
import { useRef } from "react";
import { u as useBranding, S as SEO, B as Button, c as cn } from "../main.mjs";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
function RegistrationFormPreview() {
  const { settings } = useBranding();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const platform = searchParams.get("platform") || "GHANA";
  const printRef = useRef(null);
  const handlePrint = () => {
    window.print();
  };
  const formUrl = platform === "DIASPORA" ? settings.registration_form_diaspora_url : settings.registration_form_ghana_url;
  const formTitle = platform === "DIASPORA" ? "Diaspora Membership Form" : "Ghana Membership Form";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-stone-100 py-12 px-4 print:p-0 print:bg-white", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Membership Form Preview",
        noindex: true
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "max-w-[210mm] mx-auto mb-8 flex items-center justify-between print:hidden", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          onClick: () => navigate(-1),
          className: "flex items-center gap-2 text-stone-600",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
            "Back to Registration"
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            onClick: handlePrint,
            className: "flex items-center gap-2 border-stone-200 text-stone-600 hover:text-brand-green hover:bg-stone-50 transition-all active:scale-95 shadow-sm",
            children: [
              /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
              "Print Form"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: formUrl,
            download: `The_Base_${platform}_Registration_Form.pdf`,
            className: "inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2",
            children: [
              /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
              "Download ",
              platform === "DIASPORA" ? "Diaspora" : "Ghana",
              " PDF"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: printRef,
        className: "max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none min-h-[297mm] p-[15mm] border border-stone-200 print:border-none font-body-md text-on-surface",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between border-b-4 border-brand-green pb-6 mb-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
              /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "The Base", className: "h-24 w-24 object-contain" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight leading-none mb-1", children: "The base — Membership" }),
                /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold tracking-tight text-brand-green leading-none mb-2", children: formTitle }),
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-muted-foreground/60", children: platform === "DIASPORA" ? "Ghanaian diaspora — Supporting the movement from abroad" : "Ghana first, jobs for the youth — A movement of the Ghanaian people" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-28 h-32 border-2 border-dashed border-stone-200 flex items-center justify-center text-center p-4", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-300 leading-tight", children: "Affix recent passport photo here" }) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/80 italic mb-8", children: "Please fill this form clearly using BLOCK LETTERS. Tick (✓) where applicable. Required fields are marked with an asterisk (*)." }),
          /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-brand-green text-white px-4 py-1.5 text-xs font-bold tracking-tight mb-4", children: "1. Membership platform" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-8 pl-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "I am registering as:*" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-8", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: cn("w-4 h-4 border-2 border-stone-300 flex items-center justify-center", platform === "GHANA" && "bg-brand-green border-brand-green"), children: platform === "GHANA" && /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-white" }) }),
                    /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold", children: "Ghana Resident" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: cn("w-4 h-4 border-2 border-stone-300 flex items-center justify-center", platform === "DIASPORA" && "bg-brand-green border-brand-green"), children: platform === "DIASPORA" && /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-white" }) }),
                    /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold", children: "Ghanaian in the Diaspora" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Country of residence (Diaspora only)" }),
                /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-brand-green text-white px-4 py-1.5 text-xs font-bold tracking-tight mb-4", children: "2. Personal information" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 pl-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Full name (As on Ghana card / passport)*" }),
                /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-12", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Date of birth (DD/MM/YYYY)*" }),
                  /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100 w-full" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Gender*" }),
                  /* @__PURE__ */ jsx("div", { className: "flex items-center gap-6", children: ["Male", "Female", "Other"].map((g) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-stone-300" }),
                    /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold", children: g })
                  ] }, g)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-12", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Age range*" }),
                  /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-y-2", children: ["16-25", "26-35", "36-45", "46-60", "60+"].map((r) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-stone-300" }),
                    /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold", children: r })
                  ] }, r)) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Number of children" }),
                  /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Ghana card / national ID number" }),
                /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-brand-green text-white px-4 py-1.5 text-xs font-bold tracking-tight mb-4", children: "3. Contact details" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 pl-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-12", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Phone number (With country code)*" }),
                  /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Email address" }),
                  /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Residential address*" }),
                /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-12", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Region*" }),
                  /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Constituency*" }),
                  /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Ghana Post GPS address (e.g. GA-123-4567)" }),
                /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-brand-green text-white px-4 py-1.5 text-xs font-bold tracking-tight mb-4", children: "4. Profession & education" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 pl-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-12", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Profession / skill" }),
                  /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Employment status" }),
                  /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-y-2", children: ["Employed", "Self-employed", "Student", "Unemployed", "Retired"].map((s) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-stone-300" }),
                    /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold", children: s })
                  ] }, s)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Highest level of education" }),
                /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-brand-green text-white px-4 py-1.5 text-xs font-bold tracking-tight mb-4", children: "5. Next of kin" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 pl-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-12", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Full name" }),
                  /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Relationship" }),
                  /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-12", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Phone contact" }),
                  /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-stone-500", children: "Address" }),
                  /* @__PURE__ */ jsx("div", { className: "h-8 border-b-2 border-stone-100" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-12", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-brand-green text-white px-4 py-1.5 text-xs font-bold tracking-tight mb-4", children: "6. Declaration & signature" }),
            /* @__PURE__ */ jsxs("div", { className: "pl-4 space-y-8", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-tiny leading-relaxed text-on-surface/80", children: [
                "I, the undersigned, declare that the information provided above is true and complete to the best of my knowledge. I agree to the values, aims, and code of conduct of ",
                /* @__PURE__ */ jsx("strong", { children: "The Base Movement" }),
                ". I consent to my data being processed for membership administration, in line with the movement's privacy policy."
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-12 items-end", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "h-12 border-b-2 border-stone-200" }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-center", children: "Signature of applicant*" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "h-12 border-b-2 border-stone-200" }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-center", children: "Date*" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "h-12 border-b-2 border-stone-200" }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-center", children: "Place*" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border-t-2 border-stone-100 pt-8 flex justify-between items-center opacity-40 grayscale", children: [
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight", children: "thebasemovement.com" }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight", children: "Submission: hand to chapter head, or upload at /register/upload" })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: `
        @media print {
          body { background: white; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:p-0 { padding: 0 !important; }
        }
      ` } })
  ] });
}
export {
  RegistrationFormPreview as default
};
