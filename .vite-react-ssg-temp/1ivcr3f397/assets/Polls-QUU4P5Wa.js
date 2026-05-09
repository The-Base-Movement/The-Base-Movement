import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { C as Card, d as CardContent, S as SEO, b as BrandLine, B as Button, a as adminService } from "../main.mjs";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import { Clock, CheckCircle2, ArrowRight, Users, BarChart3, Vote, Lock } from "lucide-react";
import { toast } from "sonner";
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
function OpinionPollCard({ poll, voting, showResults, isLoggedIn, handleVote, toggleResults }) {
  const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
  const getRankColor = (optionId) => {
    const rank = sortedOptions.findIndex((o) => o.id === optionId);
    if (rank === 0) return "rgba(0, 107, 60, 0.1)";
    if (rank === 1) return "rgba(212, 160, 23, 0.1)";
    if (rank === 2) return "rgba(245, 158, 11, 0.1)";
    return "rgba(206, 17, 38, 0.05)";
  };
  const days = Math.max(0, Math.ceil((new Date(poll.endDate).getTime() - (/* @__PURE__ */ new Date()).getTime()) / (1e3 * 60 * 60 * 24)));
  return /* @__PURE__ */ jsx(Card, { className: "border border-stone-200 rounded-none shadow-sm overflow-hidden hover:border-[var(--brand-green)]/30 transition-all", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-[var(--brand-green)] bg-[var(--brand-green)]/5 px-2 py-1 rounded-none tracking-tight shrink-0 mb-0", children: poll.category }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5 text-stone-400" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight mb-0", children: poll.status === "Active" ? "Ends in:" : "Ended" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-stone-700 mb-0", children: poll.status === "Active" ? `${days} Day${days !== 1 ? "s" : ""}` : "Closed" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-stone-900 mb-0 leading-tight", children: poll.question })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: poll.options.map((option) => {
      const percentage = Math.round(option.votes / poll.totalVotes * 100);
      const isSelected = poll.userSelection === option.id;
      const displayResults = poll.voted || showResults;
      return /* @__PURE__ */ jsx("div", { className: "relative group", children: displayResults ? /* @__PURE__ */ jsx("div", { className: "space-y-1", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-sm font-bold px-4 py-3 bg-stone-50 border border-stone-100 relative z-10 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          isSelected && /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-[var(--brand-green)]" }),
          /* @__PURE__ */ jsx("span", { className: `text-sm font-medium ${isSelected ? "text-[var(--brand-green)]" : "text-stone-600"}`, children: option.label })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-stone-400 text-micro font-bold tracking-tight", children: [
          percentage,
          "%"
        ] }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-0 -z-10 transition-all duration-1000 ease-out",
            style: {
              width: `${percentage}%`,
              backgroundColor: getRankColor(option.id)
            }
          }
        )
      ] }) }) : /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            if (isLoggedIn) {
              handleVote(poll.id, option.id);
            } else {
              toast.error("Voting is reserved for verified movement members. Join The Base to participate!");
              window.location.href = "/login";
            }
          },
          disabled: voting === poll.id,
          className: "w-full text-left px-5 py-4 border border-stone-200 hover:border-[var(--brand-green)] hover:bg-stone-50 transition-all rounded-none flex justify-between items-center group/btn",
          children: [
            /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-stone-700", children: [
              option.label,
              !isLoggedIn && /* @__PURE__ */ jsx("span", { className: "block text-micro font-bold text-stone-400 mt-1 uppercase tracking-tight", children: "Members only" })
            ] }),
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all text-[var(--brand-green)]" })
          ]
        }
      ) }, option.id);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-6 border-t border-stone-100 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-micro font-bold text-stone-400 tracking-tight mb-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
          poll.totalVotes.toLocaleString(),
          " Votes"
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => toggleResults(poll.id),
            className: `flex items-center gap-1.5 transition-colors ${showResults ? "text-[var(--brand-green)]" : "hover:text-[var(--brand-green)]"}`,
            children: [
              /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4" }),
              showResults ? "Hide Results" : "Live Results"
            ]
          }
        )
      ] }),
      poll.voted && /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-emerald-600 flex items-center gap-1 tracking-tight mb-0", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5" }),
        "Vote recorded"
      ] })
    ] })
  ] }) });
}
function Polls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(null);
  const [showResults, setShowResults] = useState({});
  const [isLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  useEffect(() => {
    async function loadPolls() {
      try {
        const data = await adminService.getPolls();
        setPolls(data);
      } catch (err) {
        console.error("Failed to load polls:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPolls();
  }, []);
  const toggleResults = (pollId) => {
    setShowResults((prev) => ({ ...prev, [pollId]: !prev[pollId] }));
  };
  const handleVote = async (pollId, optionId) => {
    setVoting(pollId);
    const success = await adminService.voteInPoll(pollId, optionId);
    if (success) {
      setPolls((prev) => prev.map((p) => {
        if (p.id === pollId) {
          return {
            ...p,
            voted: true,
            userSelection: optionId,
            totalVotes: p.totalVotes + 1,
            options: p.options.map((o) => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
          };
        }
        return p;
      }));
      toast.success("Your vote has been officially recorded. Thank you for your engagement!");
    } else {
      toast.error("Failed to submit vote. Please try again.");
    }
    setVoting(null);
  };
  const activePolls = polls.filter((p) => p.status === "Active");
  const closedPolls = polls.filter((p) => p.status === "Closed");
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-stone-50/50 pb-20", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Citizen Feedback",
        description: "Your voice shapes the movement. Participate in our regular polls to help prioritize the plan and regional interventions.",
        canonical: "/polls"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-stone-200", children: /* @__PURE__ */ jsxs("div", { className: "py-24 px-4 md:px-8 max-w-7xl mx-auto", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, {}),
      /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-5xl md:text-7xl font-meta font-bold tracking-tighter mb-8 text-stone-900 flex items-center gap-6", children: [
          /* @__PURE__ */ jsx(Vote, { className: "w-12 h-12 text-primary" }),
          "Feedback Hub"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, {}),
        /* @__PURE__ */ jsx("p", { className: "text-stone-500 max-w-3xl text-base md:text-lg mt-8 mb-0 leading-relaxed font-medium", children: "Your voice shapes the movement. Participate in our regular polls to help prioritize the plan and regional interventions." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("main", { className: "max-w-7xl mx-auto px-4 md:px-8 mt-16", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-12 items-start", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-6", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-primary" }),
          /* @__PURE__ */ jsx("h2", { className: "text-base font-bold text-stone-900 tracking-tight mb-0", children: "Active feedback" })
        ] }),
        loading ? /* @__PURE__ */ jsx("div", { className: "space-y-6", children: [1, 2].map((i) => /* @__PURE__ */ jsx("div", { className: "h-64 bg-white border border-stone-200 animate-pulse rounded-none" }, i)) }) : activePolls.length === 0 ? /* @__PURE__ */ jsx("div", { className: "bg-white border border-stone-200 p-12 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-stone-400 font-bold tracking-tight mb-0", children: "No active polls at this time." }) }) : activePolls.map((poll) => /* @__PURE__ */ jsx(
          OpinionPollCard,
          {
            poll,
            voting,
            showResults: !!showResults[poll.id],
            isLoggedIn,
            handleVote,
            toggleResults
          },
          poll.id
        ))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-8 sticky top-24", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-charcoal-dark p-8 rounded-none text-white relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10", children: /* @__PURE__ */ jsx(Vote, { className: "w-24 h-24 text-[var(--brand-green)]" }) }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
            /* @__PURE__ */ jsx("p", { className: "text-warm-gold text-micro font-bold tracking-tight mb-4", children: "Movement voice" }),
            /* @__PURE__ */ jsx("p", { className: "text-stone-300 mb-6 leading-relaxed", children: "Poll results are presented to the National Steering Committee every month to influence movement strategy." }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-white/5 p-4 border border-white/10", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-white/40 tracking-tight mb-1", children: "Total votes" }),
                /* @__PURE__ */ jsx("h3", { className: "text-white mb-0", children: polls.reduce((acc, p) => acc + p.totalVotes, 0).toLocaleString() })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white/5 p-4 border border-white/10", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-white/40 tracking-tight mb-1", children: "Active polls" }),
                /* @__PURE__ */ jsx("h3", { className: "text-white mb-0", children: activePolls.length })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-stone-200 p-8 rounded-none", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-8", children: [
            /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4 text-stone-400" }),
            /* @__PURE__ */ jsx("h2", { className: "text-base font-bold text-stone-900 tracking-tight mb-0", children: "Closed polls" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-6", children: closedPolls.map((poll) => /* @__PURE__ */ jsxs("div", { className: "group pb-6 border-b border-stone-50 last:border-0 last:pb-0", children: [
            /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center mb-2", children: /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold text-red-500 bg-red-500/5 px-2 py-1 rounded-none tracking-tight mb-0", children: [
              poll.category,
              " • Closed"
            ] }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-stone-800 leading-snug group-hover:text-[var(--brand-green)] transition-colors mb-0", children: poll.question }),
            showResults[poll.id] && /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300", children: (() => {
              const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
              const getRankColor = (optionId) => {
                const rank = sortedOptions.findIndex((o) => o.id === optionId);
                if (rank === 0) return "rgba(0, 107, 60, 0.1)";
                if (rank === 1) return "rgba(212, 160, 23, 0.1)";
                if (rank === 2) return "rgba(245, 158, 11, 0.1)";
                return "rgba(206, 17, 38, 0.05)";
              };
              return poll.options.map((option) => {
                const percentage = Math.round(option.votes / poll.totalVotes * 100);
                return /* @__PURE__ */ jsx("div", { className: "space-y-1", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center px-3 py-2 bg-stone-50 border border-stone-100 relative z-10 overflow-hidden", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-stone-600 truncate mr-2", children: option.label }),
                  /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-stone-400 shrink-0 tracking-tight", children: [
                    percentage,
                    "%"
                  ] }),
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "absolute inset-0 -z-10",
                      style: {
                        width: `${percentage}%`,
                        backgroundColor: getRankColor(option.id)
                      }
                    }
                  )
                ] }) }, option.id);
              });
            })() }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-4", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-tiny font-bold text-stone-400 mb-0 tracking-tight", children: [
                poll.totalVotes.toLocaleString(),
                " responses"
              ] }),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "link",
                  onClick: () => toggleResults(poll.id),
                  className: "text-brand-green p-0 h-auto",
                  children: [
                    showResults[poll.id] ? "Hide Results" : "Final Results",
                    " ",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" })
                  ]
                }
              )
            ] })
          ] }, poll.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-primary p-8 rounded-none text-white shadow-xl shadow-primary/20", children: [
          /* @__PURE__ */ jsx("h4", { className: "tracking-tight mb-4 text-white", children: "Suggest a poll" }),
          /* @__PURE__ */ jsx("p", { className: "text-white/80 leading-relaxed mb-6 font-medium text-xs", children: "Have a question you think the movement needs to answer? Submit your proposal for a new opinion poll." }),
          /* @__PURE__ */ jsx(Button, { className: "w-full bg-white text-primary hover:bg-stone-50 rounded-none tracking-tight font-bold", children: "Submit proposal" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Polls as default
};
