import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { k as usePerformance, M as MembershipCard, a as adminService } from "../main.mjs";
import { toast } from "sonner";
import { S as Switch } from "./switch-DKWC-xh-.js";
import "vite-react-ssg";
import "@tanstack/react-query";
import "react-helmet-async";
import "react-router-dom";
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
import "@radix-ui/react-switch";
function ProfileSettings() {
  const { lowBandwidthMode, setLowBandwidthMode } = usePerformance();
  const [avatarUrl, setAvatarUrl] = useState(
    () => localStorage.getItem("userAvatar")
  );
  const [userPlatform] = useState(
    () => localStorage.getItem("userPlatform") || ""
  );
  const [userRegNo] = useState(
    () => localStorage.getItem("userRegNo") || ""
  );
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);
  const cardRef = useRef(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    countryCode: "+233",
    region: "",
    constituency: "",
    profession: "",
    bio: "",
    gender: "Male / 26 - 40",
    joinedDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    status: "Active Member",
    chapter: "The Base - Ghana Chapter",
    country: userPlatform === "GHANA" ? "Ghana" : ""
  });
  const [loading, setLoading] = useState(true);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [dbCountries, setDbCountries] = useState([]);
  const [dbRegions, setDbRegions] = useState([]);
  const [dbConstituencies, setDbConstituencies] = useState([]);
  useEffect(() => {
    async function loadProfile() {
      const [chapters, countries, regions] = await Promise.all([
        adminService.getChapters(),
        adminService.getCountries(),
        adminService.getRegions()
      ]);
      setAvailableChapters(chapters.map((c) => c.name));
      const uniqueCountries = Array.from(new Map(countries.map((c) => [c.name, c])).values());
      setDbCountries(uniqueCountries);
      setDbRegions(regions);
      const { data: conData } = await adminService.getConstituencies();
      const uniqueConstituencies = Array.from(
        new Map((conData || []).map((c) => [`${c.region_id}-${c.name}`, c])).values()
      );
      setDbConstituencies(uniqueConstituencies);
      const regNo = localStorage.getItem("userRegNo");
      if (!regNo) {
        setLoading(false);
        return;
      }
      const profile = await adminService.getMemberProfile(regNo);
      if (profile) {
        setForm({
          fullName: profile.name,
          email: profile.email || "",
          phone: profile.phone || "",
          countryCode: "+233",
          // Default, should ideally be derived from phone
          region: profile.region || "",
          constituency: profile.constituency || "",
          profession: "Member",
          bio: "",
          gender: profile.gender || "Male / 26 - 40",
          joinedDate: profile.joined,
          status: profile.status === "Active" ? "Active Member" : profile.status,
          chapter: profile.chapter || "The Base - Ghana Chapter",
          country: profile.country || (userPlatform === "GHANA" ? "Ghana" : "")
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [userPlatform]);
  const initials = form.fullName.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("");
  const previewRegNo = userRegNo || `TBM-${!form.country || form.country === "Ghana" ? "GH" : "DI"}-${(/* @__PURE__ */ new Date()).getFullYear().toString().slice(-2)}XXXX`;
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const result = reader.result?.toString() || null;
        setAvatarUrl(result);
        if (result) localStorage.setItem("userAvatar", result);
        window.dispatchEvent(new Event("storage"));
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleSave = async (e) => {
    e.preventDefault();
    const regNo = localStorage.getItem("userRegNo");
    if (!regNo) return;
    const dataURLtoBlob = (dataurl) => {
      const arr = dataurl.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    };
    setLoading(true);
    let finalAvatarUrl = avatarUrl;
    if (avatarUrl && avatarUrl.startsWith("data:")) {
      try {
        const blob = dataURLtoBlob(avatarUrl);
        const fileName = `${regNo}.jpg`;
        const { error: uploadError } = await adminService.uploadAvatar(fileName, blob);
        if (uploadError) throw uploadError;
        finalAvatarUrl = adminService.getAvatarPublicUrl(fileName);
      } catch (uploadErr) {
        console.error("[STORAGE] Avatar upload failed:", uploadErr);
        toast.error("Failed to upload profile photo");
      }
    }
    const success = await adminService.updateMemberProfile(regNo, {
      name: form.fullName,
      email: form.email,
      phone: form.phone,
      region: form.region,
      constituency: form.constituency,
      gender: form.gender,
      chapter: form.chapter,
      avatarUrl: finalAvatarUrl || void 0,
      profession: form.profession
    });
    setLoading(false);
    if (success) {
      toast.success("Official Profile Synchronized");
      setSaved(true);
      setTimeout(() => setSaved(false), 3e3);
    } else {
      toast.error("Failed to sync profile. Check your connection.");
    }
  };
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54]
        // Standard ID card size
      });
      pdf.addImage(imgData, "PNG", 0, 0, 85.6, 54);
      pdf.save(`THE-BASE-CARD-${previewRegNo || "MEMBER"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };
  const handlePrint = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });
      const imgData = canvas.toDataURL("image/png");
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) return;
      iframeDoc.write(`
        <html>
          <head>
            <title>THE BASE - Official Membership Card</title>
            <style>
              @page { 
                size: 85.6mm 53.98mm; 
                margin: 0; 
              }
              body { 
                margin: 0; 
                padding: 0;
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                background: #fff;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              img { 
                width: 85.6mm; 
                height: 53.98mm; 
                display: block; 
                image-rendering: -webkit-optimize-contrast;
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="setTimeout(() => { window.print(); }, 200);" />
          </body>
        </html>
      `);
      iframeDoc.close();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 6e4);
    } catch (error) {
      console.error("Error printing card:", error);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "w-full h-screen flex items-center justify-center bg-off-white", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-12 h-12 text-[var(--brand-green)] animate-spin" }),
      /* @__PURE__ */ jsx("p", { className: "font-meta text-stone-500 tracking-tight text-xs animate-pulse", children: "Syncing profile with HQ..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-full py-12", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-10 border-b border-divider-gold pb-6 px-4 md:px-10", children: [
      /* @__PURE__ */ jsx("p", { className: "font-meta text-warm-gold tracking-tight text-xs mb-1", children: "Account" }),
      /* @__PURE__ */ jsx("h2", { className: "font-meta font-bold text-3xl text-[var(--brand-green)] tracking-tight", children: "Profile Settings" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-gray text-sm mt-1", children: "Manage your identity, download your card and update your details." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-12 gap-12 items-start px-4 md:px-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "xl:col-span-5 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 p-2 shadow-2xl relative group", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-meta font-bold text-micro text-slate-400 tracking-tight mb-4 pl-2", children: "Membership card preview" }),
          /* @__PURE__ */ jsx("div", { ref: cardRef, children: /* @__PURE__ */ jsx(
            MembershipCard,
            {
              userName: form.fullName,
              avatarUrl,
              userRegNo: previewRegNo,
              initials,
              gender: form.gender,
              joinedDate: form.joinedDate,
              status: form.status,
              region: form.region,
              constituency: form.constituency,
              country: form.country,
              chapter: form.chapter,
              onPhotoClick: () => fileRef.current?.click()
            }
          ) }),
          /* @__PURE__ */ jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: handleAvatarChange })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 sm:gap-4", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handlePrint,
              className: "flex items-center justify-center gap-1 sm:gap-3 px-1 sm:px-6 py-4 bg-warm-gold text-charcoal-dark font-meta font-bold tracking-tight text-micro sm:text-micro hover:opacity-90 transition-all shadow-md leading-tight",
              children: [
                /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[16px] sm:text-[18px]", children: "print" }),
                "Print card"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleDownload,
              className: "flex items-center justify-center gap-1 sm:gap-3 px-1 sm:px-6 py-4 bg-white border border-slate-200 text-charcoal-dark font-meta font-bold tracking-tight text-micro sm:text-micro hover:bg-slate-50 transition-all shadow-sm leading-tight",
              children: [
                /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[16px] sm:text-[18px]", children: "download" }),
                "Download PDF"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 p-8 shadow-sm", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-meta font-bold text-micro text-slate-400 tracking-tight mb-4", children: "Membership verification" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-[var(--brand-green)] animate-pulse" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-charcoal-dark font-meta tracking-tight", children: "Status: Active & Verified" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-tiny sm:text-xs text-slate-500 mt-2 font-body-md leading-relaxed", children: "Your digital card is real-time verifiable. Use the QR code to present your credentials at official movement events." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 p-8 shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("h4", { className: "font-meta font-bold text-micro text-stone-400 flex items-center gap-2 tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[14px]", children: "how_to_vote" }),
              " Election readiness"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-orange-100 text-orange-600 text-[8px] font-bold tracking-tight", children: "Unverified" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-tiny text-stone-500 mb-4 leading-relaxed", children: "Verify your official voter registration to unlock the Patriot Ground Game badge. Your polling station data secures our election day logistics." }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Polling Station Code (e.g. C021001A)",
                className: "w-full border-b-2 border-stone-100 bg-stone-50 px-3 py-2 text-xs text-stone-900 font-bold focus:outline-none focus:border-[var(--brand-green)] transition-all"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "w-full py-2.5 bg-stone-900 text-white font-meta font-bold tracking-tight text-micro hover:bg-[var(--brand-green)] transition-colors",
                children: "Submit voter ID"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "xl:col-span-7", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-8", children: [
        /* @__PURE__ */ jsxs("section", { className: "bg-white border border-slate-200 p-6 md:p-10 shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-slate-100 pb-6 gap-2", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-meta font-bold text-xs sm:text-sm text-charcoal-dark flex items-center gap-3 tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { className: "w-6 h-6 bg-slate-100 flex items-center justify-center text-[14px] shrink-0", children: "01" }),
              "Personal information"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-slate-400 font-meta italic tracking-tight", children: "Official records" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-columns gap-x-12 gap-y-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: [
                "Full Name ",
                /* @__PURE__ */ jsx("span", { className: "text-[var(--brand-red)]", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  required: true,
                  value: form.fullName,
                  onChange: (e) => handleChange("fullName", e.target.value),
                  placeholder: "Full name as on official ID",
                  className: "w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Email address" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  value: form.email,
                  onChange: (e) => handleChange("email", e.target.value),
                  placeholder: "Email address (e.g. you@example.com)",
                  className: "w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Phone number" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: form.countryCode,
                      onChange: (e) => handleChange("countryCode", e.target.value),
                      className: "w-24 border-b-2 border-slate-100 bg-transparent py-3 pr-8 text-xs text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "+233", children: "+233 (GH)" }),
                        dbCountries.map((c) => /* @__PURE__ */ jsxs("option", { value: c.dialing_code, children: [
                          c.dialing_code,
                          " (",
                          c.name.slice(0, 2).toUpperCase(),
                          ")"
                        ] }, c.name))
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(ChevronDown, { className: "absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" })
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "tel",
                    value: form.phone,
                    onChange: (e) => handleChange("phone", e.target.value),
                    placeholder: "e.g. 24 123 4567",
                    className: "flex-1 border-b-2 border-slate-100 bg-transparent py-3 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Gender & age group" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: form.gender,
                    onChange: (e) => handleChange("gender", e.target.value),
                    className: "w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "Male / 18 - 25", children: "Male / 18 - 25" }),
                      /* @__PURE__ */ jsx("option", { value: "Male / 26 - 40", children: "Male / 26 - 40" }),
                      /* @__PURE__ */ jsx("option", { value: "Male / 41+", children: "Male / 41+" }),
                      /* @__PURE__ */ jsx("option", { value: "Female / 18 - 25", children: "Female / 18 - 25" }),
                      /* @__PURE__ */ jsx("option", { value: "Female / 26 - 40", children: "Female / 26 - 40" }),
                      /* @__PURE__ */ jsx("option", { value: "Female / 41+", children: "Female / 41+" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(ChevronDown, { className: "absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Profession" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  value: form.profession,
                  onChange: (e) => handleChange("profession", e.target.value),
                  placeholder: "E.g. Teacher, Engineer, Student",
                  className: "w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Assigned chapter" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: form.chapter,
                    onChange: (e) => handleChange("chapter", e.target.value),
                    className: "w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "Select Chapter" }),
                      availableChapters.map((name) => /* @__PURE__ */ jsx("option", { value: name, children: name }, name))
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(ChevronDown, { className: "absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" })
              ] })
            ] }),
            userPlatform === "GHANA" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Region" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: form.region,
                      onChange: (e) => {
                        const newRegion = e.target.value;
                        setForm((prev) => ({ ...prev, region: newRegion, constituency: "" }));
                      },
                      className: "w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Select Region" }),
                        dbRegions.map((reg) => /* @__PURE__ */ jsx("option", { value: reg.name, children: reg.name }, reg.id))
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(ChevronDown, { className: "absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Constituency" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: form.constituency,
                      disabled: !form.region,
                      onChange: (e) => handleChange("constituency", e.target.value),
                      className: "w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer disabled:opacity-50",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Select Constituency" }),
                        form.region && dbConstituencies.filter((c) => c.region_id === dbRegions.find((r) => r.name === form.region)?.id).map((con) => /* @__PURE__ */ jsx("option", { value: con.name, children: con.name }, con.name))
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(ChevronDown, { className: "absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" })
                ] })
              ] })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4 md:col-span-2 md:grid md:grid-cols-2 md:gap-8 md:space-y-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Country of residence" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: form.country,
                      onChange: (e) => {
                        const countryName = e.target.value;
                        const countryData = dbCountries.find((c) => c.name === countryName);
                        setForm((prev) => ({
                          ...prev,
                          country: countryName,
                          countryCode: countryData?.dialing_code || prev.countryCode,
                          region: countryName !== "Ghana" ? "" : prev.region,
                          constituency: countryName !== "Ghana" ? "" : prev.constituency
                        }));
                      },
                      className: "w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Select Country" }),
                        dbCountries.map((c) => /* @__PURE__ */ jsx("option", { value: c.name, children: c.name }, c.name))
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(ChevronDown, { className: "absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" })
                ] })
              ] }),
              form.country === "Ghana" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Region" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: form.region,
                        onChange: (e) => {
                          const newRegion = e.target.value;
                          setForm((prev) => ({ ...prev, region: newRegion, constituency: "" }));
                        },
                        className: "w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", children: "Select Region" }),
                          dbRegions.map((reg) => /* @__PURE__ */ jsx("option", { value: reg.name, children: reg.name }, reg.id))
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(ChevronDown, { className: "absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Constituency" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: form.constituency,
                        disabled: !form.region,
                        onChange: (e) => handleChange("constituency", e.target.value),
                        className: "w-full border-b-2 border-slate-100 bg-transparent px-0 py-3 pr-8 text-sm text-charcoal-dark font-bold tracking-tight focus:outline-none focus:border-[var(--brand-green)] transition-all appearance-none cursor-pointer disabled:opacity-50",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", children: "Select Constituency" }),
                          dbConstituencies.filter((c) => {
                            const regionId = dbRegions.find((r) => r.name === form.region)?.id;
                            return c.region_id === regionId;
                          }).map((con) => /* @__PURE__ */ jsx("option", { value: con.name, children: con.name }, con.name))
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(ChevronDown, { className: "absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-4 pt-4", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Short bio" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  rows: 4,
                  value: form.bio,
                  onChange: (e) => handleChange("bio", e.target.value),
                  placeholder: "A brief statement about your commitment to the Ghana First movement...",
                  className: "w-full border-2 border-slate-50 bg-slate-50/50 p-6 text-sm text-charcoal-dark font-medium focus:outline-none focus:border-[var(--brand-green)] transition-all resize-none leading-relaxed placeholder:text-slate-300 placeholder:font-medium placeholder:normal-case"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "bg-white border border-slate-200 p-6 md:p-10 shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-slate-100 pb-6 gap-2", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-meta font-bold text-xs sm:text-sm text-charcoal-dark flex items-center gap-3 tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { className: "w-6 h-6 bg-slate-100 flex items-center justify-center text-[14px] shrink-0", children: "02" }),
              "Performance preferences"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-slate-400 font-meta italic tracking-tight", children: "App experience" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-micro font-meta font-bold text-slate-400 block tracking-tight", children: "Low-bandwidth mode" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-body-md max-w-md", children: "Reduces data usage by hiding heavy background images and optimizing assets. Recommended for slow connections." })
            ] }),
            /* @__PURE__ */ jsx(
              Switch,
              {
                checked: lowBandwidthMode,
                onCheckedChange: setLowBandwidthMode
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-6 pt-4", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              className: "w-full sm:w-auto flex items-center justify-center gap-3 px-16 py-6 bg-[var(--brand-green)] text-white font-meta font-bold tracking-tight text-xs hover:opacity-95 active:scale-[0.98] transition-all shadow-2xl shadow-brand-green/20",
              children: [
                /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[18px]", children: "lock_reset" }),
                "Save changes"
              ]
            }
          ),
          saved && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-[var(--brand-green)] text-micro font-meta font-bold tracking-tight animate-in fade-in slide-in-from-left-2 duration-500", children: [
            /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[20px]", children: "verified" }),
            "Information synchronized"
          ] })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "mt-16 p-10 border-2 border-dashed border-red-100 bg-red-50/20", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h4", { className: "font-meta font-bold text-xs text-[var(--brand-red)] mb-2 flex items-center gap-2 tracking-tight", children: [
              /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[18px]", children: "warning" }),
              "Danger zone"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-xs text-slate-500 font-body-md max-w-md", children: "Deactivating your account will permanently delete all your contribution history and movement records. This action cannot be undone." })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "w-full lg:w-auto px-8 py-3.5 border-2 border-red-200 text-[var(--brand-red)] text-micro font-meta font-bold tracking-tight hover:bg-[var(--brand-red)] hover:text-white transition-all shadow-sm",
              children: "Deactivate membership"
            }
          )
        ] }) })
      ] }) })
    ] })
  ] });
}
export {
  ProfileSettings as default
};
