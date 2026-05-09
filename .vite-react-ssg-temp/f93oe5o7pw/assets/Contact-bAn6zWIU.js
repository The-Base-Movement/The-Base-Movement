import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { u as useBranding, S as SEO, b as BrandLine, B as Button, a as adminService } from "../main.mjs";
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
function Contact() {
  const { settings } = useBranding();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    platform: "",
    message: ""
  });
  const contactEmail = settings.primary_email;
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await adminService.submitContactForm({
      name: formData.fullName,
      email: formData.email,
      subject: formData.platform ? `Platform: ${formData.platform}` : "General Inquiry",
      message: formData.message,
      metadata: {
        phone: formData.phone,
        platform: formData.platform
      }
    });
    if (success) {
      setSubmitted(true);
    }
  };
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  return /* @__PURE__ */ jsxs("main", { className: "bg-surface-warm font-body-md min-h-screen pb-24", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Get in Touch",
        description: "Have a question or want to get involved? Reach out to our team. We are a movement of ordinary citizens building an extraordinary nation.",
        canonical: "/contact"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "bg-charcoal-dark text-white pt-24 pb-16 relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 opacity-20 bg-hero-gradient" }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-8 relative z-10 text-center", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-white text-5xl md:text-7xl font-bold tracking-tighter mb-4", children: "Get in touch" }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mx-auto" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-300 max-w-2xl mx-auto font-body-md", children: "Have a question or want to get involved? Reach out to our team. We are a movement of ordinary citizens building an extraordinary nation." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "max-w-[1280px] mx-auto px-4 sm:px-8 mt-12 md:mt-16", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-charcoal-dark mb-4 font-meta tracking-tight", children: "Get in touch" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-600 mb-8 leading-relaxed text-sm md:text-base", children: "Whether you're in Ghana or the Diaspora, your voice matters to this movement. Let us know how you'd like to contribute." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4 md:space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 md:p-6 border border-slate-200 rounded-none civic-card-shadow flex items-start gap-4 transition-transform hover:-translate-y-1", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 md:w-12 md:h-12 bg-surface-warm flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Mail, { className: "w-5 h-5 md:w-6 md:h-6 text-[var(--brand-green)]" }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-slate-400 mb-1 font-meta", children: "Email" }),
              /* @__PURE__ */ jsx("p", { className: "text-charcoal-dark font-medium text-sm md:text-base truncate", children: contactEmail })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 md:p-6 border border-slate-200 rounded-none civic-card-shadow flex items-start gap-4 transition-transform hover:-translate-y-1", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 md:w-12 md:h-12 bg-surface-warm flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Phone, { className: "w-5 h-5 md:w-6 md:h-6 text-[var(--brand-green)]" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-slate-400 mb-1 font-meta", children: "Phone" }),
              /* @__PURE__ */ jsx("p", { className: "text-charcoal-dark font-medium text-sm md:text-base", children: "Contact via email for inquiries" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white p-5 md:p-6 border border-slate-200 rounded-none civic-card-shadow flex items-start gap-4 transition-transform hover:-translate-y-1", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 md:w-12 md:h-12 bg-surface-warm flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 md:w-6 md:h-6 text-[var(--brand-green)]" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-slate-400 mb-1 font-meta", children: "Location" }),
              /* @__PURE__ */ jsx("p", { className: "text-charcoal-dark font-medium text-sm md:text-base", children: "Ghana & Global Diaspora" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "overflow-hidden border border-slate-200 shadow-sm group bg-white", children: [
            /* @__PURE__ */ jsx("div", { className: "aspect-[16/9] overflow-hidden", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: "/branding/party-headquarters-image.webp",
                alt: "The Base Party Headquarters",
                className: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
                decoding: "async",
                loading: "lazy"
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 border-t border-slate-100", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-meta font-bold text-[var(--brand-green)] tracking-tight", children: "Official headquarters" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-2 font-body-md leading-relaxed", children: "Our central hub in Accra, serving as the heart of movement operations and community engagement." })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-3", children: /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 sm:p-8 md:p-12 border border-slate-200 rounded-none shadow-sm h-full", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-charcoal-dark mb-8 font-meta tracking-tight", children: "Send us a message" }),
        submitted ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 md:py-20", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-surface-warm flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(Send, { className: "w-10 h-10 text-[var(--brand-green)]" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-charcoal-dark mb-3 font-meta tracking-tight", children: "Message sent" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-600 text-sm md:text-base max-w-xs mx-auto", children: "Thank you for reaching out. Our team will get back to you shortly." })
        ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "fullName", className: "text-micro font-bold text-charcoal-dark font-meta tracking-tight", children: [
              "Full name ",
              /* @__PURE__ */ jsx("span", { className: "text-[var(--brand-red)]", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "fullName",
                type: "text",
                value: formData.fullName,
                onChange: handleChange,
                className: "w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "text-micro font-bold text-charcoal-dark font-meta tracking-tight", children: "Email address" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "email",
                  type: "email",
                  value: formData.email,
                  onChange: handleChange,
                  className: "w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "phone", className: "text-micro font-bold text-charcoal-dark font-meta tracking-tight", children: "Phone number" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "phone",
                  type: "text",
                  value: formData.phone,
                  onChange: handleChange,
                  className: "w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "platform", className: "text-micro font-bold text-charcoal-dark font-meta tracking-tight", children: "Your platform" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                id: "platform",
                value: formData.platform,
                onChange: handleChange,
                className: "w-full form-understate p-4 text-charcoal-dark appearance-none text-sm bg-slate-50/50",
                style: { backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right .7rem top 50%", backgroundSize: ".65rem auto" },
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Select your platform" }),
                  /* @__PURE__ */ jsx("option", { value: "GHANA", children: "Base Ghana" }),
                  /* @__PURE__ */ jsx("option", { value: "DIASPORA", children: "Base Diaspora" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("label", { htmlFor: "message", className: "text-micro font-bold text-charcoal-dark font-meta tracking-tight", children: [
              "Message ",
              /* @__PURE__ */ jsx("span", { className: "text-[var(--brand-red)]", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                id: "message",
                value: formData.message,
                onChange: handleChange,
                className: "w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "submit",
              variant: "primary",
              className: "w-full py-8 flex items-center justify-center gap-2",
              children: [
                /* @__PURE__ */ jsx(Send, { className: "w-5 h-5" }),
                " Send Message"
              ]
            }
          )
        ] })
      ] }) })
    ] }) })
  ] });
}
export {
  Contact as default
};
