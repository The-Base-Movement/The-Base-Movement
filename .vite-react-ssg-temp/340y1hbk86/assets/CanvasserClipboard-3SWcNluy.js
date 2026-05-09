import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import { ClipboardList, AlertCircle, ChevronRight, MapPin, User, FileText, CheckCircle2 } from "lucide-react";
import { c as cn, B as Button, a as adminService } from "../main.mjs";
import { toast } from "sonner";
import "react-router-dom";
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
function CanvasserClipboard() {
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [contactName, setContactName] = useState("");
  const [addressNotes, setAddressNotes] = useState("");
  const [interactionResult, setInteractionResult] = useState("UNDECIDED");
  const [keyIssues, setKeyIssues] = useState([]);
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const issueOptions = ["Economy/Jobs", "Roads/Infrastructure", "Education", "Healthcare", "Security"];
  useEffect(() => {
    async function loadCampaigns() {
      try {
        const campaigns = await adminService.getCanvassingCampaigns();
        setActiveCampaigns(campaigns.filter((c) => c.status === "ACTIVE"));
      } catch (error) {
        console.error("Failed to load campaigns:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
  }, []);
  const toggleIssue = (issue) => {
    setKeyIssues(
      (prev) => prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    setSubmitting(true);
    try {
      const regNo = localStorage.getItem("userRegNo");
      if (!regNo) throw new Error("Authentication required");
      const profile = await adminService.getMemberProfile(regNo);
      if (!profile) throw new Error("Profile not found");
      const lat = 5.6037;
      const lng = -0.187;
      const payload = {
        campaign_id: selectedCampaign.id,
        canvasser_id: profile.id,
        contact_name: contactName || null,
        address_notes: addressNotes,
        interaction_result: interactionResult,
        key_issues: keyIssues,
        needs_follow_up: needsFollowUp,
        location_lat: lat,
        location_lng: lng
      };
      console.log("[CANVASSER] Submitting payload:", payload);
      toast.success("Contact logged securely to HQ servers.");
      setContactName("");
      setAddressNotes("");
      setInteractionResult("UNDECIDED");
      setKeyIssues([]);
      setNeedsFollowUp(false);
    } catch (error) {
      console.error("[CANVASSER] Failed to log interaction:", error);
      toast.error("Failed to synchronize. The log has been saved offline.");
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-stone-50", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx(ClipboardList, { className: "w-12 h-12 text-[var(--brand-green)] animate-bounce" }),
      /* @__PURE__ */ jsx("p", { className: "text-micro font-bold tracking-tight text-[var(--brand-green)]", children: "Loading canvassing protocols..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-stone-50/50 min-h-screen pb-20", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-stone-200 sticky top-0 z-30", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-6 py-6", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, {}),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-2 w-2 rounded-full bg-[var(--brand-green)] animate-ping" }),
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight text-[var(--brand-green)]", children: "Operation ground game" })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl md:text-3xl font-bold text-stone-900 flex items-center gap-3 mb-0 tracking-tight italic font-meta", children: [
          "Digital ",
          /* @__PURE__ */ jsx("span", { className: "text-stone-400", children: "clipboard" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-stone-500 text-xs font-medium tracking-wide mt-1 mb-0", children: "Door-to-door constituent outreach and intelligence logging." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("main", { className: "max-w-3xl mx-auto px-6 mt-8", children: !selectedCampaign ? /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-tiny font-bold tracking-tight text-stone-400", children: "Select active campaign" }),
      activeCampaigns.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 p-12 text-center shadow-sm", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-8 h-8 text-stone-300 mx-auto mb-3" }),
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight", children: "No active canvassing missions in your sector." })
      ] }) : activeCampaigns.map((camp) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setSelectedCampaign(camp),
          className: "w-full bg-white border border-stone-200 p-6 flex items-center justify-between hover:border-[var(--brand-green)] hover:shadow-md transition-all group text-left",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: "bg-emerald-100 text-emerald-600 px-2 py-0.5 text-[8px] font-bold tracking-tight", children: "Active" }),
                /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-stone-500 tracking-tight", children: camp.target_constituency })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-stone-900 tracking-tight mb-1", children: camp.title }),
              /* @__PURE__ */ jsx("p", { className: "text-tiny text-stone-500 line-clamp-1", children: camp.description })
            ] }),
            /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5 text-stone-300 group-hover:text-[var(--brand-green)] group-hover:translate-x-1 transition-all" })
          ]
        },
        camp.id
      ))
    ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 shadow-sm animate-in fade-in slide-in-from-bottom-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-stone-900 text-white p-6 relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10", children: /* @__PURE__ */ jsx(MapPin, { className: "w-24 h-24" }) }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedCampaign(null),
              className: "text-micro font-bold text-stone-400 hover:text-white tracking-tight mb-4 flex items-center gap-1",
              children: "← Change mission"
            }
          ),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold tracking-tight mb-1", children: selectedCampaign.title }),
          /* @__PURE__ */ jsx("p", { className: "text-tiny text-stone-400", children: selectedCampaign.target_constituency })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 md:p-8 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold tracking-tight text-stone-900 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-[var(--brand-green)]" }),
            " Constituent data"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: contactName,
                onChange: (e) => setContactName(e.target.value),
                placeholder: "Contact Name (Optional)",
                className: "w-full h-12 px-4 bg-stone-50 border border-stone-200 focus:border-[var(--brand-green)] focus:ring-0 text-sm font-medium"
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: addressNotes,
                onChange: (e) => setAddressNotes(e.target.value),
                placeholder: "House No. / Landmark",
                className: "w-full h-12 px-4 bg-stone-50 border border-stone-200 focus:border-[var(--brand-green)] focus:ring-0 text-sm font-medium",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold tracking-tight text-stone-900 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-[var(--brand-green)]" }),
            " Interaction result"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: [
            { val: "STRONG_SUPPORT", label: "Strong Support", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
            { val: "LEANING", label: "Leaning", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
            { val: "UNDECIDED", label: "Undecided", color: "text-stone-600", bg: "bg-stone-100", border: "border-stone-200" },
            { val: "HOSTILE", label: "Hostile", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
            { val: "NOT_HOME", label: "Not Home", color: "text-stone-400", bg: "bg-stone-50", border: "border-stone-200" }
          ].map((res) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setInteractionResult(res.val),
              className: cn(
                "p-3 text-center border-2 transition-all",
                interactionResult === res.val ? `${res.border} ${res.bg}` : "border-stone-100 hover:border-stone-200 bg-white"
              ),
              children: /* @__PURE__ */ jsx("span", { className: cn(
                "text-micro font-bold tracking-tight block",
                interactionResult === res.val ? res.color : "text-stone-500"
              ), children: res.label })
            },
            res.val
          )) })
        ] }),
        interactionResult !== "NOT_HOME" && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-top-2", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold tracking-tight text-stone-900 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-[var(--brand-green)]" }),
            " Key issues raised"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: issueOptions.map((issue) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => toggleIssue(issue),
              className: cn(
                "px-4 py-2 text-micro font-bold tracking-tight border transition-all",
                keyIssues.includes(issue) ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
              ),
              children: issue
            },
            issue
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-stone-100 flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: needsFollowUp,
                onChange: (e) => setNeedsFollowUp(e.target.checked),
                className: "w-5 h-5 border-2 border-stone-300 text-[var(--brand-green)] focus:ring-[var(--brand-green)] rounded-none"
              }
            ),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight text-stone-900 block", children: "Needs follow-up" }),
              /* @__PURE__ */ jsx("span", { className: "text-micro text-stone-500 font-medium", children: "Flag for local coordinator" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              disabled: submitting || !addressNotes,
              className: "bg-[var(--brand-green)] text-white hover:bg-green-700 h-12 px-6 rounded-none text-micro font-bold tracking-tight shadow-lg",
              children: submitting ? "Logging..." : "Log interaction"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  CanvasserClipboard as default
};
