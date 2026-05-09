import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import { Target, MessageSquare, Brain, Send } from "lucide-react";
import { c as cn, B as Button, a as adminService } from "../main.mjs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
function FeedbackHub() {
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState("Policy");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const getSimulatedSentiment = (text) => {
    const lower = text.toLowerCase();
    let score = 0;
    if (lower.includes("great") || lower.includes("support") || lower.includes("strong") || lower.includes("win")) score += 0.5;
    if (lower.includes("bad") || lower.includes("weak") || lower.includes("fail") || lower.includes("disappointed")) score -= 0.5;
    if (lower.includes("need") || lower.includes("should") || lower.includes("must")) score -= 0.2;
    return Math.max(-1, Math.min(1, score));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      const regNo = localStorage.getItem("userRegNo");
      if (!regNo) throw new Error("User not authenticated");
      const profile = await adminService.getMemberProfile(regNo);
      if (!profile) throw new Error("Profile not found");
      const score = getSimulatedSentiment(feedback);
      const label = score > 0.2 ? "Positive" : score < -0.2 ? "Negative" : "Neutral";
      const success = await adminService.submitMemberFeedback({
        user_id: profile.id,
        feedback_text: feedback,
        category,
        sentiment_score: score,
        sentiment_label: label,
        region: profile.region,
        constituency: profile.constituency
      });
      if (success) {
        toast.success("Your sentiment has been recorded. HQ appreciates your tactical insight.");
        navigate("/dashboard");
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("[FEEDBACK] Submission error:", error);
      toast.error("A secure connection could not be established.");
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-stone-50/50 min-h-screen pb-20", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-stone-200 sticky top-0 z-30", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-8 py-6", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, {}),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-2 w-2 rounded-full bg-[var(--brand-red)] animate-ping" }),
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-[var(--brand-red)] tracking-tight", children: "Direct line to HQ" })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl md:text-4xl font-bold text-stone-900 flex items-center gap-3 mb-0 tracking-tight italic font-meta", children: [
          "Feedback ",
          /* @__PURE__ */ jsx("span", { className: "text-stone-400", children: "hub" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-stone-500 text-sm font-medium tracking-wide mt-2 mb-0 max-w-xl", children: "Your ground-level intelligence powers our national strategy. Submit raw, unfiltered feedback directly to the movement's AI sentiment engine." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("main", { className: "max-w-4xl mx-auto px-8 mt-12", children: /* @__PURE__ */ jsx("div", { className: "bg-white border border-stone-200 shadow-sm p-8 md:p-12", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold text-stone-900 flex items-center gap-2 tracking-tight", children: [
          /* @__PURE__ */ jsx(Target, { className: "w-4 h-4 text-[var(--brand-red)]" }),
          " Strategic category"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: ["Policy", "Logistics", "Leadership", "Local Action"].map((cat) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setCategory(cat),
            className: cn(
              "p-4 text-center border-2 transition-all duration-300",
              category === cat ? "border-[var(--brand-red)] bg-red-50/50" : "border-stone-100 hover:border-stone-200 bg-stone-50"
            ),
            children: /* @__PURE__ */ jsx("span", { className: cn(
              "text-micro font-bold block tracking-tight",
              category === cat ? "text-[var(--brand-red)]" : "text-stone-500"
            ), children: cat })
          },
          cat
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-micro font-bold text-stone-900 flex items-center justify-between tracking-tight", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4 text-[var(--brand-red)]" }),
            " Raw intelligence report"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: cn(
            "text-micro text-stone-400",
            feedback.length > 500 ? "text-red-500 animate-pulse" : ""
          ), children: [
            feedback.length,
            "/500 chars"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: feedback,
              onChange: (e) => setFeedback(e.target.value.slice(0, 500)),
              placeholder: "Detail your observations, concerns, or tactical suggestions...",
              className: "w-full h-48 p-6 bg-stone-50 border border-stone-200 focus:border-[var(--brand-red)] focus:ring-0 text-stone-900 resize-none font-medium text-sm leading-relaxed",
              required: true
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "absolute bottom-4 right-4 flex items-center gap-2 text-micro font-bold text-stone-400 bg-white/80 px-2 py-1 tracking-tight", children: [
            /* @__PURE__ */ jsx(Brain, { className: "w-3 h-3 text-[var(--brand-red)]" }),
            " Secure channel"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-stone-100 flex justify-between items-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight max-w-[200px] leading-tight", children: "All transmissions are securely logged and analyzed by the National Steering Committee." }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "submit",
            disabled: submitting || !feedback.trim(),
            className: "bg-[var(--brand-red)] text-white hover:bg-red-700 h-14 px-8 rounded-none text-tiny font-bold tracking-tight shadow-xl group",
            children: [
              submitting ? "Transmitting..." : "Dispatch intelligence",
              !submitting && /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" })
            ]
          }
        )
      ] })
    ] }) }) })
  ] });
}
export {
  FeedbackHub as default
};
