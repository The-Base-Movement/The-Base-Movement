import { jsxs, jsx } from "react/jsx-runtime";
import React__default from "react";
import { useLocation, Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
const LABEL_OVERRIDES = {
  blog: "Insights",
  dashboard: "Dashboard",
  admin: "Admin",
  authors: "Authors",
  broadcasts: "Broadcasts",
  members: "Members",
  store: "Store",
  chapters: "Chapters",
  settings: "Settings",
  trash: "Trash Vault",
  "media-library": "Media Library",
  polls: "Polls",
  regions: "Regions",
  new: "New",
  edit: "Edit"
};
const SUPPORTED_PREFIXES = ["/dashboard", "/admin", "/blog", "/donate"];
function getRootContext(pathname) {
  if (pathname.startsWith("/admin")) return { label: "Admin", to: "/admin/dashboard" };
  if (pathname.startsWith("/dashboard")) return { label: "Dashboard", to: "/dashboard" };
  if (pathname.startsWith("/blog")) return { label: "Home", to: "/" };
  return { label: "Home", to: "/" };
}
const SKIP_SEGMENTS = /* @__PURE__ */ new Set(["dashboard", "admin"]);
function getLabel(value, post) {
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value];
  if (/^[0-9a-f-]{8,}$/i.test(value) || !isNaN(Number(value))) return "Details";
  return value.replace(/-/g, " ").split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function Breadcrumbs({ currentLabel } = {}) {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  if (!SUPPORTED_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;
  const root = getRootContext(location.pathname);
  return /* @__PURE__ */ jsxs("nav", { "aria-label": "Breadcrumb", className: "flex items-center gap-2 mb-8 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-stone-200/50 w-fit", children: [
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: root.to,
        className: "text-stone-400 hover:text-[var(--brand-green)] transition-colors flex items-center gap-1.5",
        children: [
          /* @__PURE__ */ jsx(Home, { className: "w-3.5 h-3.5" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold font-meta", children: root.label })
        ]
      }
    ),
    pathnames.map((value, index) => {
      if (SKIP_SEGMENTS.has(value)) return null;
      const last = index === pathnames.length - 1;
      if (!last && ["edit", "new"].includes(value)) return null;
      const to = `/${pathnames.slice(0, index + 1).join("/")}`;
      const label = last && currentLabel ? currentLabel : getLabel(value);
      return /* @__PURE__ */ jsxs(React__default.Fragment, { children: [
        /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3 text-stone-300" }),
        last ? /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-[var(--brand-green)] font-meta max-w-[200px] truncate", children: label }) : /* @__PURE__ */ jsx(
          Link,
          {
            to,
            className: "text-stone-400 hover:text-[var(--brand-green)] transition-colors text-xs font-semibold font-meta",
            children: label
          }
        )
      ] }, to);
    })
  ] });
}
export {
  Breadcrumbs as B
};
