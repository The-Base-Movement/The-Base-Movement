import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useRef, useState, useCallback, useEffect } from "react";
import { Megaphone, ArrowLeft, Shield, MessageSquare, Smartphone, Mail, Loader2, Send } from "lucide-react";
import { a as adminService, b as BrandLine, B as Button, C as Card, j as CardHeader, v as CardTitle, d as CardContent, I as Input, c as cn } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DF-S1mCR.js";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
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
import "@radix-ui/react-select";
function NewBroadcast() {
  const navigate = useNavigate();
  const location = useLocation();
  const editorRef = useRef(null);
  const state = location.state;
  const initialTemplate = state?.template;
  const [isSending, setIsSending] = useState(false);
  const [fullRegions, setFullRegions] = useState([]);
  const [allConstituencies, setAllConstituencies] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [newBroadcast, setNewBroadcast] = useState({
    title: initialTemplate?.title || "",
    content: initialTemplate?.content || "",
    channel: "In-app",
    target_type: initialTemplate?.type || "ALL",
    target_value: "",
    priority: initialTemplate?.priority || "Normal",
    status: "Sent"
  });
  const MAX_CHARACTERS = 2e3;
  const fetchData = useCallback(async () => {
    try {
      const [regions, cData] = await Promise.all([
        adminService.getRegions(),
        adminService.getConstituencies()
      ]);
      setFullRegions(regions || []);
      setAllConstituencies(cData?.data || []);
    } catch (err) {
      console.error("[COMMUNICATION-HUB] operational metrics sync failure:", err);
      toast.error("Failed to synchronize mobilization operational metrics");
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleSend = async () => {
    const content = editorRef.current ? editorRef.current.getContent() : newBroadcast.content;
    if (!newBroadcast.title || !content || content === "<p></p>") {
      toast.error("Please fill in all required fields");
      return;
    }
    if (newBroadcast.target_type !== "ALL" && !newBroadcast.target_value) {
      toast.error("Please select a target region or constituency");
      return;
    }
    setIsSending(true);
    try {
      const adminId = localStorage.getItem("adminId") || "hq-system-admin";
      const payload = {
        ...newBroadcast,
        content,
        sender_id: adminId
      };
      const success = await adminService.sendBroadcast(payload);
      if (success) {
        toast.success("Broadcast deployed to the field successfully");
        navigate("/admin/broadcasts");
      } else {
        toast.error("Failed to deploy broadcast");
      }
    } catch (err) {
      console.error("[COMMUNICATION-HUB] Critical dispatch failure:", err);
      toast.error("Critical failure in mobilization dispatch");
    } finally {
      setIsSending(false);
    }
  };
  const getChannelIcon = (channel) => {
    switch (channel) {
      case "SMS":
        return /* @__PURE__ */ jsx(Smartphone, { className: "w-3 h-3" });
      case "Email":
        return /* @__PURE__ */ jsx(Mail, { className: "w-3 h-3" });
      case "Push":
        return /* @__PURE__ */ jsx(Megaphone, { className: "w-3 h-3" });
      default:
        return /* @__PURE__ */ jsx(MessageSquare, { className: "w-3 h-3" });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, {}),
      /* @__PURE__ */ jsxs("div", { className: "flex-columns items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
            /* @__PURE__ */ jsx(Megaphone, { className: "w-8 h-8 text-on-surface" }),
            "Send new broadcast"
          ] }),
          /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Deploying a movement-wide communication to the field." })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "default",
            onClick: () => navigate("/admin/broadcasts"),
            className: "rounded-sm text-micro font-bold tracking-tight h-11 px-8 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
              " Back to Intelligence"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 shadow-xl overflow-hidden bg-background group border-none md:border-solid", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 bg-on-surface text-white border-b border-white/5 relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Shield, { className: "w-5 h-5 text-brand-red" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-lg font-bold tracking-tight", children: "Deployment configuration" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-white/40 font-medium mt-0.5", children: "Define your target audience and broadcast priority." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "p-8 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Broadcast title" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "e.g. National registration wave",
              className: "rounded-sm border-border/40 h-12 text-sm font-bold placeholder:font-normal shadow-sm bg-muted/5 focus:bg-background transition-colors",
              value: newBroadcast.title,
              onChange: (e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Delivery channel" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: newBroadcast.channel,
                onValueChange: (v) => setNewBroadcast({ ...newBroadcast, channel: v }),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "rounded-sm border-border/40 h-12 text-micro font-bold normal-case shadow-sm bg-muted/5", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select channel" }) }),
                  /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-sm border-border/40", children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "In-app", className: "text-micro font-bold normal-case", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(MessageSquare, { className: "w-3.5 h-3.5" }),
                      " In-app message"
                    ] }) }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "Push", className: "text-micro font-bold normal-case", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Megaphone, { className: "w-3.5 h-3.5" }),
                      " Push notification"
                    ] }) }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "SMS", className: "text-micro font-bold normal-case", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Smartphone, { className: "w-3.5 h-3.5" }),
                      " SMS broadcast"
                    ] }) }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "Email", className: "text-micro font-bold normal-case", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Mail, { className: "w-3.5 h-3.5" }),
                      " Email dispatch"
                    ] }) })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Target segment" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: newBroadcast.target_type,
                onValueChange: (v) => {
                  setNewBroadcast({
                    ...newBroadcast,
                    target_type: v,
                    target_value: v === "ALL" ? "" : newBroadcast.target_value
                  });
                },
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "rounded-sm border-border/40 h-12 text-micro font-bold normal-case shadow-sm bg-muted/5", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select target" }) }),
                  /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-sm border-border/40", children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "ALL", className: "text-micro font-bold normal-case", children: "National (all)" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "REGION", className: "text-micro font-bold normal-case", children: "Regional" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "CONSTITUENCY", className: "text-micro font-bold normal-case", children: "Constituency" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Priority level" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: newBroadcast.priority,
                onValueChange: (v) => setNewBroadcast({ ...newBroadcast, priority: v }),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: cn(
                    "rounded-sm border-border/40 h-12 text-micro font-bold normal-case shadow-sm bg-muted/5",
                    newBroadcast.priority === "Urgent" ? "text-destructive border-destructive/20 bg-destructive/5" : ""
                  ), children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select priority" }) }),
                  /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-sm border-border/40", children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "Normal", className: "text-micro font-bold normal-case", children: "Normal" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "High", className: "text-micro font-bold normal-case text-orange-600", children: "High priority" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "Urgent", className: "text-micro font-bold normal-case text-destructive", children: "Urgent (Level Red)" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        newBroadcast.target_type !== "ALL" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Select region" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: fullRegions.find((r) => r.name === newBroadcast.target_value)?.name || "",
                onValueChange: (v) => {
                  const region = fullRegions.find((r) => r.name === v);
                  if (region) {
                    setSelectedRegionId(region.id);
                    setNewBroadcast({ ...newBroadcast, target_value: region.name });
                  }
                },
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "rounded-sm border-border/40 h-12 text-micro font-bold normal-case shadow-sm bg-muted/5", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select region" }) }),
                  /* @__PURE__ */ jsx(SelectContent, { className: "rounded-sm border-border/40", children: (fullRegions || []).map((r) => /* @__PURE__ */ jsx(SelectItem, { value: r.name, className: "text-micro font-bold normal-case", children: r.name }, `region-${r.id}`)) })
                ]
              }
            )
          ] }),
          newBroadcast.target_type === "CONSTITUENCY" && /* @__PURE__ */ jsxs("div", { className: "space-y-2 animate-in slide-in-from-top-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Select constituency" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                disabled: !selectedRegionId,
                onValueChange: (v) => {
                  if (v === "ALL_IN_REGION") {
                    const region = fullRegions.find((r) => r.id === selectedRegionId);
                    if (region) {
                      setNewBroadcast({
                        ...newBroadcast,
                        target_type: "REGION",
                        target_value: region.name
                      });
                      toast.info(`Elevated to Regional target: ${region.name}`);
                    }
                  } else {
                    setNewBroadcast({ ...newBroadcast, target_value: v });
                  }
                },
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "rounded-sm border-border/40 h-12 text-micro font-bold normal-case shadow-sm bg-muted/5", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: !selectedRegionId ? "Select region first" : "Select constituency" }) }),
                  /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-sm border-border/40", children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "ALL_IN_REGION", className: "text-micro font-bold normal-case italic text-muted-foreground/40", children: "All in Region" }),
                    (allConstituencies || []).filter((c) => c.region_id === selectedRegionId).map((c, idx) => /* @__PURE__ */ jsx(SelectItem, { value: c.name, className: "text-micro font-bold normal-case", children: c.name }, `const-${idx}-${c.name}`))
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("label", { className: "text-micro font-bold normal-case text-muted-foreground/40", children: "Broadcast message (Rich Content)" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: cn(
                "text-micro font-bold",
                newBroadcast.content.length > MAX_CHARACTERS * 0.9 ? "text-destructive" : "text-muted-foreground/40"
              ), children: [
                newBroadcast.content.length,
                " / ",
                MAX_CHARACTERS
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary animate-pulse" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "rounded-sm overflow-hidden border border-border/40 shadow-sm bg-muted/5", children: /* @__PURE__ */ jsx(
            Editor,
            {
              apiKey: "ky4xtv1lrw74kgz3s89jm1m0tw6d1supmj4xpnbibfjk5qkz",
              onInit: (_, editor) => editorRef.current = editor,
              initialValue: newBroadcast.content,
              init: {
                height: 400,
                menubar: false,
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "preview",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "code",
                  "help",
                  "wordcount"
                ],
                toolbar: "undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | link | help",
                content_style: 'body { font-family: "Public Sans", sans-serif; font-size:14px; color: hsl(var(--on-surface)); background-color: transparent; } p { margin-bottom: 1em; }',
                skin: "oxide",
                content_css: "default",
                placeholder: "Compose your administrative directive with rich formatting...",
                branding: false,
                statusbar: false
              },
              onEditorChange: (content) => {
                setNewBroadcast((prev) => ({ ...prev, content }));
              }
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-border/10 flex items-center justify-end gap-4", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "default",
              onClick: () => navigate("/admin/broadcasts"),
              className: "rounded-sm h-12 px-10 text-micro font-bold tracking-tight border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95",
              children: "Abort Transmission"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "primary",
              disabled: isSending,
              onClick: handleSend,
              className: "rounded-sm h-12 px-12 text-micro font-bold tracking-tight min-w-[200px] shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
              children: isSending ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                " Launching..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
                " Send Broadcast"
              ] })
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 p-4 rounded-sm bg-muted/5 border border-border/40 text-muted-foreground/80", children: [
      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-sm bg-background border border-border/40 flex items-center justify-center shrink-0", children: getChannelIcon(newBroadcast.channel) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold normal-case text-on-surface", children: "Broadcast preview" }),
        /* @__PURE__ */ jsxs("p", { className: "text-micro leading-relaxed", children: [
          "Sending to ",
          newBroadcast.target_type === "ALL" ? "all movement members" : `targeted ${newBroadcast.target_type.toLowerCase()} segments`,
          " via ",
          newBroadcast.channel,
          ". Estimated delivery to ~42,500 members. Rich content is supported on ",
          newBroadcast.channel === "SMS" ? "Smartphone links" : "this channel",
          "."
        ] })
      ] })
    ] })
  ] });
}
export {
  NewBroadcast as default
};
