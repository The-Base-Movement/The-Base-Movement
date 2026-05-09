import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Globe, User, Shield, Megaphone, Lock, MousePointer2, History, ChevronRight, Loader2, Camera, Users, Mail, Palette, FileText, Upload, Image, Twitter, Building2, Smartphone, Search } from "lucide-react";
import { b as BrandLine, B as Button, c as cn, C as Card, j as CardHeader, v as CardTitle, w as CardDescription, d as CardContent, A as Label, I as Input, a as adminService, E as authService, s as supabase } from "../main.mjs";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription } from "./dialog-D9Fxht2W.js";
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
import "@radix-ui/react-dialog";
function AdminSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };
  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "roles", label: "Admin Roles", icon: Shield },
    { id: "system", label: "Preferences", icon: Globe },
    { id: "movement", label: "Movement Info", icon: Megaphone },
    { id: "security", label: "Security", icon: Lock },
    { id: "buttons", label: "Buttons", icon: MousePointer2 },
    { id: "audit", label: "Audit Log", icon: History }
  ];
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState("All Status");
  const [auditResourceFilter, setAuditResourceFilter] = useState("All Resources");
  const [auditLogs, setAuditLogs] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mfaFactors, setMfaFactors] = useState([]);
  const [showMfaDialog, setShowMfaDialog] = useState(false);
  const [mfaStep, setMfaStep] = useState("qr");
  const [mfaEnrollData, setMfaEnrollData] = useState(null);
  const [mfaCode, setMfaCode] = useState("");
  const [interfaceDensity, setInterfaceDensity] = useState(
    localStorage.getItem("admin_interface_density") || "Comfortable"
  );
  const [siteSettings, setSiteSettings] = useState({});
  const fileInputRef = useRef(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    avatarUrl: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  useEffect(() => {
    const fetchData = async () => {
      const user = authService.getUser();
      if (user) {
        const data = await adminService.getAdminData(user.id);
        setAdminData(data);
        setProfileForm({
          fullName: data?.name || user.user_metadata?.full_name || "",
          email: data?.email || user.email || "",
          phone: data?.phone || user.user_metadata?.phone || "",
          avatarUrl: user.user_metadata?.avatar_url || ""
        });
      }
      try {
        const logs = await adminService.getSystemAuditLogs();
        setAuditLogs(logs);
        const settings = await adminService.getSiteSettings();
        setSiteSettings({
          button_primary_text_color: "0 0% 100%",
          button_gold_text_color: "220 15% 15%",
          button_destructive_text_color: "0 0% 100%",
          ...settings
        });
      } catch (err) {
        console.error("[SETTINGS] Failed to synchronize audit telemetry:", err);
        toast.error("Failed to synchronize administrative audit logs");
      }
    };
    fetchData();
  }, []);
  const handleBrandingUpload = async (key, file) => {
    setIsSaving(true);
    const toastId = toast.loading(`Uploading ${key} to movement vault...`);
    try {
      const fileName = `${key}-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await adminService.uploadBrandingAsset(fileName, file);
      if (error) throw error;
      const publicUrl = adminService.getBrandingAssetUrl(fileName);
      await adminService.updateSiteSetting(key, publicUrl);
      setSiteSettings((prev) => ({ ...prev, [key]: publicUrl }));
      window.dispatchEvent(new CustomEvent("site_settings_updated"));
      toast.success(`${key} synchronized successfully`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to synchronize ${key}`, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };
  useEffect(() => {
    const fetchMfa = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data) {
        setMfaFactors(data.all || []);
      }
    };
    fetchMfa();
  }, []);
  const handleStartMfaEnroll = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp"
      });
      if (error) throw error;
      setMfaEnrollData({
        id: data.id,
        qr: data.totp.qr_code
      });
      setMfaStep("qr");
      setShowMfaDialog(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start MFA enrollment");
    }
  };
  const handleVerifyMfa = async () => {
    if (!mfaEnrollData || !mfaCode) return;
    setIsSaving(true);
    try {
      const auth = supabase.auth;
      const challenge = await auth.mfa.challenge({ factorId: mfaEnrollData.id });
      if (challenge.error) throw challenge.error;
      const verify = await auth.mfa.verify({
        factorId: mfaEnrollData.id,
        challengeId: challenge.data.id,
        code: mfaCode
      });
      if (verify.error) throw verify.error;
      toast.success("MFA successfully enabled!");
      setShowMfaDialog(false);
      const { data } = await auth.mfa.listFactors();
      setMfaFactors(data?.all || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "MFA verification failed");
    } finally {
      setIsSaving(false);
    }
  };
  const handleUnenrollMfa = async (factorId) => {
    if (!confirm("Are you sure you want to disable MFA? This will reduce your account security.")) return;
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success("MFA disabled");
      const { data } = await supabase.auth.mfa.listFactors();
      setMfaFactors(data?.all || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disable MFA");
    }
  };
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }
    setIsUploading(true);
    const toastId = toast.loading("Uploading avatar...");
    try {
      const user = authService.getUser();
      if (!user) throw new Error("Not authenticated");
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error } = await adminService.uploadAvatar(fileName, file);
      if (error) throw error;
      const publicUrl = adminService.getAvatarPublicUrl(fileName);
      setProfileForm((prev) => ({ ...prev, avatarUrl: publicUrl }));
      toast.success("Avatar uploaded. Remember to save your profile changes.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = log.action.toLowerCase().includes(auditSearch.toLowerCase()) || log.resource.toLowerCase().includes(auditSearch.toLowerCase()) || log.adminName.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesStatus = auditFilter === "All Status" || log.status === auditFilter;
    const matchesResource = auditResourceFilter === "All Resources" || log.resource.includes(auditResourceFilter);
    return matchesSearch && matchesStatus && matchesResource;
  });
  const handleSaveProfile = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Syncing profile changes...");
    try {
      const user = authService.getUser();
      if (!user) throw new Error("Not authenticated");
      await authService.updateProfile({
        full_name: profileForm.fullName,
        avatar_url: profileForm.avatarUrl,
        phone: profileForm.phone
      });
      const { error: dbError } = await adminService.updatePublicUserProfile(user.id, {
        full_name: profileForm.fullName,
        avatar_url: profileForm.avatarUrl,
        phone_number: profileForm.phone
      });
      if (dbError) throw dbError;
      const updatedData = await adminService.getAdminData(user.id);
      if (updatedData) {
        setAdminData(updatedData);
        setProfileForm((prev) => ({
          ...prev,
          fullName: updatedData.name,
          phone: updatedData.phone || "",
          avatarUrl: updatedData.avatarUrl || ""
        }));
      }
      toast.success("Profile updated successfully", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };
  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsSaving(true);
    try {
      await authService.updatePassword(passwordForm.newPassword);
      toast.success("Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };
  const handleExportLogs = () => {
    if (auditLogs.length === 0) {
      toast.error("No administrative logs available for export");
      return;
    }
    const toastId = toast.loading("Preparing movement audit report...");
    try {
      const logsToExport = auditLogs;
      const headers = ["Timestamp", "Officer", "Action", "Resource", "Status", "Technical Details"];
      const rows = logsToExport.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.adminName,
        log.action,
        log.resource,
        log.status,
        log.details ? JSON.stringify(log.details).replace(/"/g, '""') : "N/A"
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => {
          const content = String(cell ?? "");
          return `"${content.replace(/"/g, '""')}"`;
        }).join(","))
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      link.setAttribute("href", url);
      link.setAttribute("download", `base_audit_report_${timestamp}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      toast.success("Movement audit report exported successfully", { id: toastId });
    } catch (error) {
      console.error("[SETTINGS] Critical export failure:", error);
      toast.error("Failed to generate audit report", { id: toastId });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
        /* @__PURE__ */ jsx(Globe, { className: "w-8 h-8 text-on-surface" }),
        "System settings"
      ] }),
      /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Manage your administrative identity and platform configuration." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-12", children: [
      /* @__PURE__ */ jsx("div", { className: "w-full lg:w-64 space-y-1 lg:sticky lg:top-24 self-start", children: tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return /* @__PURE__ */ jsxs(
          Button,
          {
            variant: isActive ? "active-tab" : "ghost",
            onClick: () => setActiveTab(tab.id),
            className: cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-sm text-micro font-bold tracking-tight transition-all group h-12 active:scale-95",
              !isActive && "text-stone-400 hover:text-white hover:bg-white/5"
            ),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(tab.icon, { className: cn("w-4 h-4", isActive ? "text-[hsl(var(--active-tab-text))]" : "text-stone-300 group-hover:text-white/60") }),
                tab.label
              ] }),
              isActive && /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5 text-[hsl(var(--active-tab-text))]/60" })
            ]
          },
          tab.id
        );
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        activeTab === "profile" && /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-stone-100 bg-stone-50/20", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-stone-900", children: "Profile" }),
            /* @__PURE__ */ jsx(CardDescription, { className: "text-tiny font-medium text-stone-400 mt-1", children: "Manage your public and internal administrative identity." })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-8", children: /* @__PURE__ */ jsxs("div", { className: "space-y-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                /* @__PURE__ */ jsxs("div", { className: "w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200 overflow-hidden relative", children: [
                  isUploading && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/60 flex items-center justify-center z-10", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 text-stone-900 animate-spin" }) }),
                  profileForm.avatarUrl ? /* @__PURE__ */ jsx("img", { src: profileForm.avatarUrl, alt: "Avatar", className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx("span", { className: "text-stone-400 font-bold text-sm", children: profileForm.fullName.split(" ").map((n) => n[0]).join("") || "HQ" })
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    ref: fileInputRef,
                    onChange: handleFileChange,
                    accept: "image/*",
                    className: "hidden"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleAvatarClick,
                    disabled: isUploading,
                    className: "absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full z-20",
                    children: /* @__PURE__ */ jsx(Camera, { className: "w-4 h-4" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-stone-900", children: "Profile Image" }),
                /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-medium mt-1", children: "PNG, JPG up to 2MB" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Full name" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: profileForm.fullName,
                    onChange: (e) => setProfileForm({ ...profileForm, fullName: e.target.value }),
                    className: "h-10 rounded-sm border-stone-200 bg-white focus:ring-[var(--brand-red)]/10 focus:border-[var(--brand-red)] transition-all text-xs font-medium"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Email address" }),
                /* @__PURE__ */ jsx(Input, { value: profileForm.email, disabled: true, className: "h-10 rounded-sm border-stone-100 bg-stone-50 text-stone-400 text-xs font-medium cursor-not-allowed" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Administrative role" }),
                /* @__PURE__ */ jsx("div", { className: "h-10 px-3 flex items-center rounded-sm border border-stone-100 bg-stone-50 text-stone-400 text-micro font-bold normal-case", children: adminData?.role === "SUPER_ADMIN" ? "Super Admin" : adminData?.role === "REGIONAL_DIRECTOR" ? "Regional Director" : adminData?.role === "CONSTITUENCY_LEAD" ? "Constituency Lead" : adminData?.role || (adminData ? "Standard Staff" : "HQ Officer") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Phone number" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: profileForm.phone,
                    onChange: (e) => setProfileForm({ ...profileForm, phone: e.target.value }),
                    placeholder: "+233 XX XXX XXXX",
                    className: "h-10 rounded-sm border-stone-200 bg-white focus:ring-[var(--brand-red)]/10 focus:border-[var(--brand-red)] transition-all text-xs font-medium"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-6 flex justify-end border-t border-stone-100", children: /* @__PURE__ */ jsx(
              Button,
              {
                variant: "active-tab",
                size: "lg",
                onClick: handleSaveProfile,
                disabled: isSaving,
                className: "rounded-sm text-micro font-bold tracking-tight px-8 h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95",
                children: isSaving ? "Syncing..." : "Synchronize Profile"
              }
            ) })
          ] }) })
        ] }),
        activeTab === "roles" && /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-stone-100 bg-stone-50/20", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-stone-900", children: "Administrative Roles" }),
            /* @__PURE__ */ jsx(CardDescription, { className: "text-tiny font-medium text-stone-400 mt-1", children: "Summary of active permission tiers across the movement infrastructure." })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
            /* @__PURE__ */ jsx("div", { className: "divide-y divide-stone-50", children: [
              { role: "Super Admin", desc: "Full system sovereignty and configuration rights.", count: 2, icon: Shield, color: "text-[var(--brand-red)]" },
              { role: "Regional Admin", desc: "Operational oversight within assigned regional boundaries.", count: 16, icon: Globe, color: "text-stone-900" },
              { role: "Chapter Lead", desc: "Local verification and mobilization management.", count: 124, icon: Users, color: "text-stone-900" },
              { role: "Audit View", desc: "Read-only access to financial and telemetry streams.", count: 4, icon: History, color: "text-stone-500" }
            ].map((item) => /* @__PURE__ */ jsxs("div", { className: "p-6 flex items-center justify-between hover:bg-stone-50/50 transition-colors", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: cn("w-10 h-10 rounded-sm bg-stone-100 flex items-center justify-center", item.color), children: /* @__PURE__ */ jsx(item.icon, { className: "w-5 h-5" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-stone-900", children: item.role }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-medium mt-0.5", children: item.desc })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "px-3 py-1 bg-stone-50 border border-stone-100 rounded-full text-micro font-bold text-stone-400 normal-case", children: [
                item.count,
                " active"
              ] })
            ] }, item.role)) }),
            /* @__PURE__ */ jsx("div", { className: "p-8 bg-stone-50/50 border-t border-stone-100 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-medium italic", children: "Role assignments are managed by System Administrators only." }) })
          ] })
        ] }),
        activeTab === "system" && /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-stone-100 bg-stone-50/20", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-stone-900", children: "Preferences" }),
            /* @__PURE__ */ jsx(CardDescription, { className: "text-tiny font-medium text-stone-400 mt-1", children: "Configure your personal interface and notification behavior." })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-8 space-y-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 normal-case", children: "Interface density" }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-4", children: ["Comfortable", "Compact", "High Density"].map((mode) => /* @__PURE__ */ jsx(
                Button,
                {
                  variant: mode === interfaceDensity ? "primary" : "outline",
                  onClick: () => {
                    setInterfaceDensity(mode);
                    localStorage.setItem("admin_interface_density", mode);
                    toast.success(`Density set to ${mode}`);
                    window.dispatchEvent(new Event("admin_density_changed"));
                  },
                  className: cn(
                    "p-4 rounded-sm border text-micro font-bold tracking-tight transition-all text-center h-12 active:scale-95",
                    mode === interfaceDensity ? "shadow-lg shadow-brand-green/20" : "border-stone-200/20 text-stone-400 hover:border-white/20 hover:bg-white/5"
                  ),
                  children: mode
                },
                mode
              )) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-px bg-stone-100" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 normal-case", children: "Notifications" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [
                { id: "reg", label: "New Member Registrations", desc: "Real-time alerts for regional growth" },
                { id: "sec", label: "Security Login Alerts", desc: "Notify on new device recognition" },
                { id: "audit", label: "Critical Audit Events", desc: "Alert on system modification" }
              ].map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 rounded-sm border border-stone-100 bg-stone-50/50", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-stone-900", children: item.label }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-medium", children: item.desc })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "w-10 h-5 bg-emerald-500 rounded-full flex items-center justify-end px-1 cursor-pointer", children: /* @__PURE__ */ jsx("div", { className: "w-3 h-3 bg-white rounded-full shadow-sm" }) })
              ] }, item.id)) })
            ] })
          ] })
        ] }),
        activeTab === "movement" && /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white", children: [
            /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-stone-100 bg-stone-50/20", children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-stone-900", children: "Authoritative Communications" }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-tiny font-medium text-stone-400 mt-1", children: "Configure the movement's primary contact points and newsletter dispatch parameters." })
            ] }),
            /* @__PURE__ */ jsx(CardContent, { className: "p-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl space-y-10", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Primary contact email" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        value: siteSettings.primary_email || "",
                        onChange: (e) => setSiteSettings({ ...siteSettings, primary_email: e.target.value }),
                        className: "pl-10 h-11 rounded-sm border-stone-200 text-xs font-medium"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 italic", children: "Used for contact forms and general inquiries." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Newsletter dispatch email" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(Megaphone, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        value: siteSettings.newsletter_email || "",
                        onChange: (e) => setSiteSettings({ ...siteSettings, newsletter_email: e.target.value }),
                        className: "pl-10 h-11 rounded-sm border-stone-200 text-xs font-medium"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 italic", children: "Authoritative sender for all movement broadcasts." })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-6 pt-6 border-t border-stone-100", children: [
                /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold text-stone-900 tracking-tight flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Palette, { className: "w-4 h-4 text-primary" }),
                  "Movement Palette Control"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
                  { key: "primary_color", label: "Primary Brand (Green)", desc: "HSL value for the dominant identity color." },
                  { key: "accent_color", label: "Accent Highlight (Gold)", desc: "HSL value for secondary emphasis." },
                  { key: "destructive_color", label: "Destructive/Alert (Red)", desc: "HSL value for high-urgency elements." },
                  { key: "muted_foreground_color", label: "Muted Text (General)", desc: "HSL value for secondary labels/hints." },
                  { key: "on_surface_muted_color", label: "Muted Text (Dark)", desc: "HSL value for text on dark backgrounds." }
                ].map((color) => /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: color.label }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: "w-11 h-11 rounded-sm border border-stone-200 shrink-0",
                        style: { backgroundColor: `hsl(${siteSettings[color.key]})` }
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        value: siteSettings[color.key] || "",
                        onChange: (e) => setSiteSettings({ ...siteSettings, [color.key]: e.target.value }),
                        className: "h-11 rounded-sm border-stone-200 text-xs font-medium font-mono",
                        placeholder: "0 0% 0%"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 italic leading-tight", children: color.desc })
                ] }, color.key)) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-6 pt-6 border-t border-stone-100", children: [
                /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold text-stone-900 tracking-tight flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-primary" }),
                  "Tactical Typography Orchestration"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
                      /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Global font scale" }),
                      /* @__PURE__ */ jsxs("span", { className: "text-micro font-mono font-bold text-primary", children: [
                        (siteSettings.font_scale_global || 1).toFixed(2),
                        "x"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "range",
                        min: "0.8",
                        max: "1.5",
                        step: "0.05",
                        value: siteSettings.font_scale_global || 1,
                        onChange: (e) => setSiteSettings({ ...siteSettings, font_scale_global: parseFloat(e.target.value) }),
                        className: "w-full h-1.5 bg-stone-100 rounded-sm appearance-none cursor-pointer accent-primary"
                      }
                    ),
                    /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 italic leading-tight", children: "Adjusts the base font size for all paragraphs and body text." })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
                      /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Heading emphasis scale" }),
                      /* @__PURE__ */ jsxs("span", { className: "text-micro font-mono font-bold text-primary", children: [
                        (siteSettings.font_scale_headings || 1).toFixed(2),
                        "x"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "range",
                        min: "0.8",
                        max: "2.0",
                        step: "0.05",
                        value: siteSettings.font_scale_headings || 1,
                        onChange: (e) => setSiteSettings({ ...siteSettings, font_scale_headings: parseFloat(e.target.value) }),
                        className: "w-full h-1.5 bg-stone-100 rounded-sm appearance-none cursor-pointer accent-primary"
                      }
                    ),
                    /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 italic leading-tight", children: "Specifically scales H1-H6 headings for high-impact visibility." })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "pt-6 flex justify-end border-t border-stone-100", children: /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "active-tab",
                  size: "lg",
                  onClick: async () => {
                    setIsSaving(true);
                    const toastId = toast.loading("Syncing movement configurations...");
                    try {
                      const settingsToUpdate = [
                        { key: "primary_email", value: siteSettings.primary_email },
                        { key: "newsletter_email", value: siteSettings.newsletter_email },
                        { key: "primary_color", value: siteSettings.primary_color },
                        { key: "accent_color", value: siteSettings.accent_color },
                        { key: "destructive_color", value: siteSettings.destructive_color },
                        { key: "registration_form_ghana_url", value: siteSettings.registration_form_ghana_url },
                        { key: "registration_form_diaspora_url", value: siteSettings.registration_form_diaspora_url },
                        { key: "font_scale_global", value: siteSettings.font_scale_global },
                        { key: "font_scale_headings", value: siteSettings.font_scale_headings },
                        { key: "muted_foreground_color", value: siteSettings.muted_foreground_color },
                        { key: "on_surface_muted_color", value: siteSettings.on_surface_muted_color }
                      ];
                      await Promise.all(settingsToUpdate.map(
                        (s) => adminService.updateSiteSetting(s.key, s.value)
                      ));
                      window.dispatchEvent(new CustomEvent("site_settings_updated"));
                      toast.success("Movement configurations synchronized", { id: toastId });
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to update movement telemetry", { id: toastId });
                    } finally {
                      setIsSaving(false);
                    }
                  },
                  disabled: isSaving,
                  className: "rounded-sm text-micro font-bold tracking-tight px-10 h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95",
                  children: isSaving ? "Syncing..." : "Synchronize Configurations"
                }
              ) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white", children: [
            /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-stone-100 bg-stone-50/20", children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-stone-900", children: "Official Documentation" }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-tiny font-medium text-stone-400 mt-1", children: "Manage the movement's authoritative documents and registration forms." })
            ] }),
            /* @__PURE__ */ jsx(CardContent, { className: "p-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl space-y-12", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-sm border border-stone-100 bg-stone-50/30 group transition-all hover:border-brand-green/20", children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded bg-brand-green/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-brand-green" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-stone-900", children: "Ghana Membership Form (PDF)" }),
                    /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-medium", children: 'Linked to "Download Form" for Ghana-based platform users.' })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex-1 bg-white border border-stone-200 rounded-sm px-4 h-10 flex items-center overflow-hidden", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-mono text-stone-500 truncate", children: siteSettings.registration_form_ghana_url || "No form uploaded" }) }),
                  /* @__PURE__ */ jsxs("label", { className: "cursor-pointer bg-brand-green text-white px-6 h-10 rounded-sm text-micro font-bold capitalize tracking-tight flex items-center gap-2 hover:bg-brand-green/90 transition-all active:scale-95 shadow-lg shadow-brand-green/10", children: [
                    /* @__PURE__ */ jsx(Upload, { className: "w-3.5 h-3.5" }),
                    "Upload",
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "file",
                        className: "hidden",
                        accept: ".pdf",
                        onChange: (e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBrandingUpload("registration_form_ghana_url", file);
                        }
                      }
                    )
                  ] })
                ] }),
                !!siteSettings.registration_form_ghana_url && /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: siteSettings.registration_form_ghana_url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-micro font-bold text-brand-green hover:underline flex items-center gap-1.5",
                    children: [
                      /* @__PURE__ */ jsx(Globe, { className: "w-3 h-3" }),
                      "Verify Live Link"
                    ]
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-sm border border-stone-100 bg-stone-50/30 group transition-all hover:border-blue-600/20", children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded bg-blue-50 flex items-center justify-center", children: /* @__PURE__ */ jsx(Globe, { className: "w-5 h-5 text-blue-600" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-stone-900", children: "Diaspora Membership Form (PDF)" }),
                    /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-medium", children: 'Linked to "Download Form" for Diaspora platform users.' })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex-1 bg-white border border-stone-200 rounded-sm px-4 h-10 flex items-center overflow-hidden", children: /* @__PURE__ */ jsx("p", { className: "text-micro font-mono text-stone-500 truncate", children: siteSettings.registration_form_diaspora_url || "No form uploaded" }) }),
                  /* @__PURE__ */ jsxs("label", { className: "cursor-pointer bg-blue-600 text-white px-6 h-10 rounded-sm text-micro font-bold capitalize tracking-tight flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/10", children: [
                    /* @__PURE__ */ jsx(Upload, { className: "w-3.5 h-3.5" }),
                    "Upload",
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "file",
                        className: "hidden",
                        accept: ".pdf",
                        onChange: (e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBrandingUpload("registration_form_diaspora_url", file);
                        }
                      }
                    )
                  ] })
                ] }),
                !!siteSettings.registration_form_diaspora_url && /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: siteSettings.registration_form_diaspora_url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-micro font-bold text-blue-600 hover:underline flex items-center gap-1.5",
                    children: [
                      /* @__PURE__ */ jsx(Globe, { className: "w-3 h-3" }),
                      "Verify Live Link"
                    ]
                  }
                ) })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white", children: [
            /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-stone-100 bg-stone-50/20", children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-stone-900", children: "Brand Assets & Social" }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-tiny font-medium text-stone-400 mt-1", children: "Authorized social media touchpoints and movement links." })
            ] }),
            /* @__PURE__ */ jsx(CardContent, { className: "p-8", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
              { key: "logo_url", label: "Movement Logo", icon: Image, desc: "Authoritative brand identifier used across the platform." },
              { key: "favicon_url", label: "Site Favicon", icon: Globe, desc: "Browser tab and bookmark icon (32x32 recommended)." },
              { key: "og_image_url", label: "Open Graph Image", icon: Image, desc: "Shared visual when links are posted to social platforms." },
              { key: "twitter_card_url", label: "Twitter Card", icon: Twitter, desc: "Specific optimized visual for X/Twitter previews." },
              { key: "founder_image_url", label: "Founder Portrait", icon: User, desc: "Official portrait of the Movement Leader." },
              { key: "hero_bg_url", label: "Hero Background", icon: Image, desc: "Main landing page background visualization." },
              { key: "banner_image_url", label: "Base Banner", icon: Megaphone, desc: "Authoritative banner for movement messaging." },
              { key: "party_hq_image_url", label: "HQ Visualization", icon: Building2, desc: "Authoritative image of Movement Headquarters." }
            ].map((asset) => /* @__PURE__ */ jsxs("div", { className: "space-y-4 p-6 rounded-sm border border-stone-100 bg-stone-50/30 group transition-all hover:border-brand-green/20", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded bg-stone-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(asset.icon, { className: "w-4 h-4 text-stone-400" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-stone-900", children: asset.label }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-medium", children: asset.desc })
                ] })
              ] }) }),
              siteSettings[asset.key] ? /* @__PURE__ */ jsxs("div", { className: "relative aspect-video rounded-sm overflow-hidden border border-stone-200 bg-stone-100", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: siteSettings[asset.key],
                    alt: asset.label,
                    className: "w-full h-full object-contain"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: /* @__PURE__ */ jsxs("label", { className: "cursor-pointer bg-white text-stone-900 px-3 py-1.5 rounded-sm text-micro font-bold capitalize tracking-tight flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Upload, { className: "w-3 h-3" }),
                  "Replace Asset",
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "file",
                      className: "hidden",
                      accept: "image/*",
                      onChange: (e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBrandingUpload(asset.key, file);
                      }
                    }
                  )
                ] }) })
              ] }) : /* @__PURE__ */ jsxs("label", { className: "flex flex-col items-center justify-center aspect-video rounded-sm border-2 border-dashed border-stone-200 bg-stone-50/50 cursor-pointer hover:bg-stone-100 transition-all group-hover:border-brand-green/30", children: [
                /* @__PURE__ */ jsx(Upload, { className: "w-5 h-5 text-stone-300 mb-2" }),
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400", children: "UPLOAD ASSET" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    className: "hidden",
                    accept: "image/*",
                    onChange: (e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBrandingUpload(asset.key, file);
                    }
                  }
                )
              ] })
            ] }, asset.key)) }) })
          ] })
        ] }),
        activeTab === "buttons" && /* @__PURE__ */ jsx("div", { className: "space-y-8", children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-stone-100 bg-stone-50/20", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-stone-900", children: "Button Architecture" }),
            /* @__PURE__ */ jsx(CardDescription, { className: "text-tiny font-medium text-stone-400 mt-1", children: "Configure the movement's global interactive element parameters and visual feedback systems." })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-8 space-y-12", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-12", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
                    /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Global border radius" }),
                    /* @__PURE__ */ jsx("span", { className: "text-micro font-mono font-bold text-primary", children: siteSettings.button_border_radius || "0.125rem" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "grid grid-cols-5 gap-2", children: [
                    { label: "Square", value: "0px" },
                    { label: "XS", value: "0.125rem" },
                    { label: "SM", value: "0.25rem" },
                    { label: "MD", value: "0.5rem" },
                    { label: "Full", value: "9999px" }
                  ].map((radius) => /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: siteSettings.button_border_radius === radius.value ? "primary" : "default",
                      onClick: () => setSiteSettings({ ...siteSettings, button_border_radius: radius.value }),
                      className: "h-10 text-[10px] font-bold px-0 rounded-none",
                      children: radius.label
                    },
                    radius.value
                  )) }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 italic", children: "Defines the silhouette of all buttons across the mobilization platform." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-stone-100", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Visual Feedback Systems" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 rounded-sm border border-stone-100 bg-stone-50/50", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-stone-900", children: "Neon Glow Effects" }),
                      /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-medium", children: "Toggle administrative glow signatures on hover." })
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setSiteSettings({ ...siteSettings, button_neon_enabled: !siteSettings.button_neon_enabled }),
                        className: cn(
                          "w-10 h-5 rounded-full flex items-center px-1 transition-colors",
                          siteSettings.button_neon_enabled ? "bg-emerald-500 justify-end" : "bg-stone-200 justify-start"
                        ),
                        children: /* @__PURE__ */ jsx("div", { className: "w-3 h-3 bg-white rounded-full shadow-sm" })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-stone-100", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Typography Weight" }),
                  /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: [
                    { label: "Normal", value: "400" },
                    { label: "Bold", value: "700" },
                    { label: "Black", value: "900" }
                  ].map((weight) => /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: siteSettings.button_font_weight === weight.value ? "primary" : "default",
                      onClick: () => setSiteSettings({ ...siteSettings, button_font_weight: weight.value }),
                      className: "h-10 text-[10px] font-bold rounded-none",
                      children: weight.label
                    },
                    weight.value
                  )) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-stone-100", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Primary Button Text" }),
                  /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: [
                    { label: "Light Text", value: "0 0% 100%" },
                    { label: "Dark Text", value: "220 15% 15%" }
                  ].map((option) => /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: siteSettings.button_primary_text_color === option.value ? "primary" : "default",
                      onClick: () => setSiteSettings({ ...siteSettings, button_primary_text_color: option.value }),
                      className: "h-10 text-[10px] font-bold rounded-none",
                      children: option.label
                    },
                    option.value
                  )) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-stone-100", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Gold Button Text" }),
                  /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: [
                    { label: "Light Text", value: "0 0% 100%" },
                    { label: "Dark Text", value: "220 15% 15%" }
                  ].map((option) => /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: siteSettings.button_gold_text_color === option.value ? "primary" : "default",
                      onClick: () => setSiteSettings({ ...siteSettings, button_gold_text_color: option.value }),
                      className: "h-10 text-[10px] font-bold rounded-none",
                      children: option.label
                    },
                    option.value
                  )) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-stone-100", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Destructive Button Text" }),
                  /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-2", children: [
                    { label: "Light Text (Recommended)", value: "0 0% 100%" }
                  ].map((option) => /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: siteSettings.button_destructive_text_color === option.value ? "primary" : "default",
                      onClick: () => setSiteSettings({ ...siteSettings, button_destructive_text_color: option.value }),
                      className: "h-10 text-[10px] font-bold rounded-none",
                      children: option.label
                    },
                    option.value
                  )) }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 italic", children: "Forced to light text for mission-critical contrast requirements." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-stone-100", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Active Tab Background" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: "w-11 h-11 rounded-sm border border-stone-200 shrink-0",
                        style: { backgroundColor: `hsl(${siteSettings.button_active_tab_bg_color || siteSettings.primary_color})` }
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        value: siteSettings.button_active_tab_bg_color || "",
                        onChange: (e) => setSiteSettings({ ...siteSettings, button_active_tab_bg_color: e.target.value }),
                        className: "h-11 rounded-sm border-stone-200 text-xs font-medium font-mono",
                        placeholder: "0 0% 0%"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-stone-100", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Active Tab Text" }),
                  /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: [
                    { label: "Light Text", value: "0 0% 100%" },
                    { label: "Dark Text", value: "220 15% 15%" }
                  ].map((option) => /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: siteSettings.button_active_tab_text_color === option.value ? "primary" : "default",
                      onClick: () => setSiteSettings({ ...siteSettings, button_active_tab_text_color: option.value }),
                      className: "h-10 text-[10px] font-bold rounded-none",
                      children: option.label
                    },
                    option.value
                  )) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-8 bg-stone-50/50 p-8 rounded-sm border border-stone-100 relative", children: [
                /* @__PURE__ */ jsx("style", { children: `
                          .preview-gallery-container {
                            --button-radius: ${siteSettings.button_border_radius || "0.125rem"};
                            --button-font-weight: ${siteSettings.button_font_weight || "700"};
                            --primary-foreground: ${siteSettings.button_primary_text_color || "0 0% 100%"};
                            --accent-foreground: ${siteSettings.button_gold_text_color || "220 15% 15%"};
                            --destructive-foreground: ${siteSettings.button_destructive_text_color || "0 0% 100%"};
                            --active-tab-bg: ${siteSettings.button_active_tab_bg_color || siteSettings.primary_color};
                            --active-tab-text: ${siteSettings.button_active_tab_text_color || "0 0% 100%"};
                          }
                          .preview-gallery-container button {
                            border-radius: var(--button-radius) !important;
                            font-weight: var(--button-font-weight) !important;
                          }
                        ` }),
                /* @__PURE__ */ jsxs("div", { className: "preview-gallery-container space-y-8", children: [
                  /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-stone-900 tracking-tight flex items-center gap-2 mb-6", children: [
                    /* @__PURE__ */ jsx(Smartphone, { className: "w-4 h-4 text-primary" }),
                    "Component Preview Gallery (Unsaved)"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-stone-400 uppercase tracking-widest", children: "Primary / Action" }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
                        /* @__PURE__ */ jsx(Button, { variant: "primary", neon: siteSettings.button_neon_enabled, children: "Join Movement" }),
                        /* @__PURE__ */ jsx(Button, { variant: "primary", size: "sm", neon: siteSettings.button_neon_enabled, children: "Action" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-stone-400 uppercase tracking-widest", children: "Accent / Gold" }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
                        /* @__PURE__ */ jsx(Button, { variant: "gold", neon: siteSettings.button_neon_enabled, children: "Official Vision" }),
                        /* @__PURE__ */ jsx(Button, { variant: "gold", size: "sm", neon: siteSettings.button_neon_enabled, children: "Vision" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-stone-400 uppercase tracking-widest", children: "Active Tabs / Navigation" }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
                        /* @__PURE__ */ jsx(Button, { variant: "active-tab", neon: siteSettings.button_neon_enabled, children: "Active Tab" }),
                        /* @__PURE__ */ jsx(Button, { variant: "default", neon: siteSettings.button_neon_enabled, children: "Inactive Tab" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-stone-400 uppercase tracking-widest", children: "Outline / Ghost (Interactive)" }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
                        /* @__PURE__ */ jsx(Button, { variant: "outline", neon: siteSettings.button_neon_enabled, children: "Standard Outline" }),
                        /* @__PURE__ */ jsx(Button, { variant: "ghost", neon: siteSettings.button_neon_enabled, children: "Ghost Action" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-stone-400 uppercase tracking-widest", children: "Destructive / Alert" }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
                        /* @__PURE__ */ jsx(
                          Button,
                          {
                            variant: "destructive",
                            neon: siteSettings.button_neon_enabled,
                            children: "Solid Alert"
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          Button,
                          {
                            variant: "outline-destructive",
                            neon: siteSettings.button_neon_enabled,
                            children: "Outline Alert"
                          }
                        )
                      ] })
                    ] })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-8 flex justify-end border-t border-stone-100", children: /* @__PURE__ */ jsx(
              Button,
              {
                variant: "active-tab",
                size: "lg",
                onClick: async () => {
                  setIsSaving(true);
                  const toastId = toast.loading("Syncing button architecture...");
                  try {
                    const settingsToUpdate = [
                      { key: "button_border_radius", value: siteSettings.button_border_radius },
                      { key: "button_font_weight", value: siteSettings.button_font_weight },
                      { key: "button_neon_enabled", value: siteSettings.button_neon_enabled },
                      { key: "button_primary_text_color", value: siteSettings.button_primary_text_color },
                      { key: "button_gold_text_color", value: siteSettings.button_gold_text_color },
                      { key: "button_destructive_text_color", value: siteSettings.button_destructive_text_color },
                      { key: "button_active_tab_bg_color", value: siteSettings.button_active_tab_bg_color },
                      { key: "button_active_tab_text_color", value: siteSettings.button_active_tab_text_color }
                    ];
                    await Promise.all(settingsToUpdate.map(
                      (s) => adminService.updateSiteSetting(s.key, s.value)
                    ));
                    window.dispatchEvent(new CustomEvent("site_settings_updated"));
                    toast.success("Button architecture synchronized", { id: toastId });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to update button telemetry", { id: toastId });
                  } finally {
                    setIsSaving(false);
                  }
                },
                disabled: isSaving,
                className: "rounded-sm text-micro font-bold tracking-tight px-10 h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95",
                children: isSaving ? "Syncing..." : "Save Button Settings"
              }
            ) })
          ] })
        ] }) }),
        activeTab === "security" && /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white", children: [
            /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-stone-100 bg-stone-50/20", children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-stone-900", children: "Security Credentials" }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-tiny font-medium text-stone-400 mt-1", children: "Rotate your password regularly to maintain account integrity." })
            ] }),
            /* @__PURE__ */ jsx(CardContent, { className: "p-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "New password" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "password",
                      value: passwordForm.newPassword,
                      onChange: (e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value }),
                      className: "h-10 rounded-sm border-stone-200",
                      placeholder: "••••••••"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 normal-case", children: "Confirm new password" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "password",
                      value: passwordForm.confirmPassword,
                      onChange: (e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value }),
                      className: "h-10 rounded-sm border-stone-200",
                      placeholder: "••••••••"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "primary",
                  size: "lg",
                  onClick: handleUpdatePassword,
                  disabled: isSaving || !passwordForm.newPassword,
                  className: "w-full rounded-sm text-micro font-bold capitalize tracking-tight h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95",
                  children: isSaving ? "Hardening..." : "Harden Security Credentials"
                }
              )
            ] }) })
          ] }),
          /* @__PURE__ */ jsx(Card, { className: "rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white", children: /* @__PURE__ */ jsx(CardContent, { className: "p-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-6", children: [
            /* @__PURE__ */ jsx("div", { className: cn(
              "w-12 h-12 rounded-sm flex items-center justify-center border transition-all",
              mfaFactors.length > 0 ? "bg-emerald-50 border-emerald-100" : "bg-stone-50 border-stone-100"
            ), children: /* @__PURE__ */ jsx(Smartphone, { className: cn(
              "w-6 h-6",
              mfaFactors.length > 0 ? "text-emerald-500" : "text-stone-400"
            ) }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-stone-900", children: "Two-Factor Authentication" }),
                mfaFactors.length > 0 ? /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-micro font-bold text-emerald-600 tracking-tight", children: "Protected" }) : /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-micro font-bold text-amber-600 tracking-tight", children: "Not configured" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-tiny text-stone-400 font-medium mt-1 leading-relaxed", children: "Add an extra layer of security to your admin account by requiring a verification code from your mobile device." }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-3 mt-4", children: mfaFactors.length > 0 ? /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "outline-destructive",
                  onClick: () => handleUnenrollMfa(mfaFactors[0].id),
                  className: "h-10 px-6 rounded-sm transition-all active:scale-95",
                  children: "Disable protection"
                }
              ) : /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "default",
                  size: "sm",
                  onClick: handleStartMfaEnroll,
                  className: "h-10 px-6 text-micro font-bold capitalize tracking-tight border-stone-200 rounded-sm transition-all active:scale-95",
                  children: "Enable MFA Protection"
                }
              ) })
            ] })
          ] }) }) }),
          /* @__PURE__ */ jsx(Dialog, { open: showMfaDialog, onOpenChange: setShowMfaDialog, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md bg-white border-stone-200", children: [
            /* @__PURE__ */ jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsx(DialogTitle, { className: "text-base font-bold text-stone-900", children: "Configure Multi-Factor Authentication" }),
              /* @__PURE__ */ jsx(DialogDescription, { className: "text-xs text-stone-500 font-medium", children: "Follow these steps to secure your administrative account." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "py-6 space-y-6", children: [
              mfaStep === "qr" && mfaEnrollData && /* @__PURE__ */ jsxs("div", { className: "space-y-6 flex flex-col items-center", children: [
                /* @__PURE__ */ jsx("div", { className: "p-4 bg-stone-50 rounded-sm border border-stone-100", children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: mfaEnrollData?.qr,
                    alt: "MFA QR Code",
                    className: "w-48 h-48",
                    decoding: "async",
                    loading: "lazy"
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-center max-w-xs", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-stone-900", children: "Scan this QR Code" }),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 leading-relaxed font-medium", children: "Use Google Authenticator, Authy, or any TOTP app to scan the code above." })
                ] }),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "primary",
                    onClick: () => setMfaStep("verify"),
                    className: "w-full text-white font-bold capitalize tracking-tight text-micro h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95",
                    children: "I've scanned it, proceed"
                  }
                )
              ] }),
              mfaStep === "verify" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold tracking-tight text-stone-500", children: "Verification code" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      value: mfaCode,
                      onChange: (e) => setMfaCode(e.target.value),
                      placeholder: "000 000",
                      className: "h-12 text-center text-lg font-bold tracking-[0.5em] border-stone-200 rounded-sm",
                      maxLength: 6
                    }
                  ),
                  /* @__PURE__ */ jsx("p", { className: "text-micro text-stone-400 font-medium text-center", children: "Enter the 6-digit code shown in your authenticator app." })
                ] }),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "primary",
                    onClick: handleVerifyMfa,
                    disabled: isSaving || mfaCode.length < 6,
                    className: "w-full text-white font-bold capitalize tracking-tight text-micro h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95",
                    children: isSaving ? /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) : "Verify and Enable MFA"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    onClick: () => setMfaStep("qr"),
                    className: "w-full text-micro font-bold text-stone-400 capitalize tracking-tight hover:text-stone-600 h-auto p-2",
                    children: "Go back to QR code"
                  }
                )
              ] })
            ] })
          ] }) })
        ] }),
        activeTab === "audit" && /* @__PURE__ */ jsx("div", { className: "space-y-8", children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "p-8 border-b border-stone-100 bg-stone-50/20 flex flex-row items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-bold text-stone-900", children: "Audit Log" }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-tiny font-medium text-stone-400 mt-1", children: "Full traceability of administrative decisions and system modifications." })
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                size: "sm",
                className: "h-10 px-6 text-micro font-bold capitalize tracking-tight border-stone-200 rounded-sm hover:bg-stone-50 transition-all active:scale-95",
                onClick: handleExportLogs,
                children: "Export Audit report"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 p-6 bg-stone-50/50 border-b border-stone-100", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    placeholder: "Search by action or resource...",
                    value: auditSearch,
                    onChange: (e) => setAuditSearch(e.target.value),
                    className: "pl-9 h-9 text-tiny border-stone-200 bg-white rounded-sm focus:ring-0"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: auditFilter,
                  onChange: (e) => setAuditFilter(e.target.value),
                  className: "h-9 px-3 text-tiny font-bold text-stone-600 border border-stone-200 bg-white rounded-sm focus:ring-0 outline-none",
                  children: [
                    /* @__PURE__ */ jsx("option", { children: "All Status" }),
                    /* @__PURE__ */ jsx("option", { children: "Success" }),
                    /* @__PURE__ */ jsx("option", { children: "Warning" }),
                    /* @__PURE__ */ jsx("option", { children: "Failure" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: auditResourceFilter,
                  onChange: (e) => setAuditResourceFilter(e.target.value),
                  className: "h-9 px-3 text-tiny font-bold text-stone-600 border border-stone-200 bg-white rounded-sm focus:ring-0 outline-none",
                  children: [
                    /* @__PURE__ */ jsx("option", { children: "All Resources" }),
                    /* @__PURE__ */ jsx("option", { children: "MEMBERS" }),
                    /* @__PURE__ */ jsx("option", { children: "CHAPTERS" }),
                    /* @__PURE__ */ jsx("option", { children: "STORE" }),
                    /* @__PURE__ */ jsx("option", { children: "SYSTEM" }),
                    /* @__PURE__ */ jsx("option", { children: "BLOGS" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-stone-50/30 border-b border-stone-100", children: [
                /* @__PURE__ */ jsx("th", { className: "p-4 pl-8 text-micro font-bold tracking-tight text-stone-400", children: "Timestamp" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 text-micro font-bold tracking-tight text-stone-400", children: "Admin" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 text-micro font-bold tracking-tight text-stone-400", children: "Action" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 pr-8 text-right text-micro font-bold tracking-tight text-stone-400", children: "Status" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-stone-50", children: filteredLogs.length > 0 ? filteredLogs.slice(0, 15).map((log) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-stone-50/50 transition-colors", children: [
                /* @__PURE__ */ jsx("td", { className: "p-4 pl-8 text-micro font-medium text-stone-400", children: new Date(log.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-bold text-stone-900", children: log.adminName.split(" ")[0] }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-tiny font-medium text-stone-600 italic", children: log.action.toLowerCase() }),
                /* @__PURE__ */ jsx("td", { className: "p-4 pr-8 text-right", children: /* @__PURE__ */ jsx("div", { className: cn(
                  "w-1.5 h-1.5 rounded-full inline-block",
                  log.status === "Success" ? "bg-emerald-500" : log.status === "Warning" ? "bg-amber-500" : "bg-destructive"
                ) }) })
              ] }, log.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "p-20 text-center text-stone-400 text-xs italic", children: "No activity logs recorded." }) }) })
            ] }) })
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  AdminSettings as default
};
