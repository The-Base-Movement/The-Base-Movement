import { jsx, jsxs } from "react/jsx-runtime";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-D9Fxht2W.js";
import { c as cn, B as Button } from "../main.mjs";
import { Trash2, AlertTriangle, X } from "lucide-react";
function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  isPermanent = false
}) {
  return /* @__PURE__ */ jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: /* @__PURE__ */ jsx(DialogContent, { className: "sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl rounded-sm bg-white", children: /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: cn(
      "h-2 w-full",
      isPermanent ? "bg-destructive" : "bg-accent"
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "p-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: cn(
          "w-12 h-12 rounded-sm flex items-center justify-center shrink-0",
          isPermanent ? "bg-destructive/10" : "bg-accent/10"
        ), children: isPermanent ? /* @__PURE__ */ jsx(Trash2, { className: "w-6 h-6 text-destructive" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "w-6 h-6 text-accent" }) }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1", children: /* @__PURE__ */ jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl font-bold text-on-surface tracking-tight", children: title }),
          /* @__PURE__ */ jsx(DialogDescription, { className: "text-muted-foreground/60 text-sm font-medium leading-relaxed pt-1", children: description })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-muted/5 rounded-sm p-5 border border-border/40 mb-8", children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-on-surface/40 tracking-tight mb-2", children: "Target item" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-on-surface truncate tracking-tight", children: itemName })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "flex flex-col sm:flex-row gap-3 pt-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            onClick: onClose,
            disabled: isLoading,
            className: "flex-1 h-14 rounded-sm text-on-surface/60 font-bold tracking-tight text-micro hover:bg-muted/5 hover:text-on-surface transition-all",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            onClick: onConfirm,
            disabled: isLoading,
            className: cn(
              "flex-1 h-14 rounded-sm text-white font-bold tracking-tight text-micro shadow-2xl transition-all active:scale-[0.98] gap-3",
              isPermanent ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" : "bg-on-surface hover:bg-on-surface/90 shadow-on-surface/20"
            ),
            children: [
              isLoading ? /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }) : isPermanent ? /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }),
              isLoading ? "Processing..." : isPermanent ? "Permanently delete" : "Move to trash"
            ]
          }
        )
      ] })
    ] })
  ] }) }) });
}
export {
  DeleteConfirmationModal as D
};
