import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, X, Search, User, Check, Image, Upload, Save } from "lucide-react";
import { B as Breadcrumbs } from "./Breadcrumbs-BDuKn6SH.js";
import { b as BrandLine, C as Card, d as CardContent, B as Button, I as Input, A as Label, x as contentService, a as adminService } from "../main.mjs";
import { T as Textarea } from "./textarea-samz4tOC.js";
import { toast } from "sonner";
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
function AdminEditAuthor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    role: "",
    bio: "",
    imageUrl: ""
  });
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  useEffect(() => {
    const fetchAuthor = async (authorId) => {
      try {
        const author = await contentService.getAuthorById(authorId);
        if (author) {
          setFormData(author);
        } else {
          toast.error("Author not found");
          navigate("/admin/authors");
        }
      } catch (error) {
        console.error("Failed to fetch author:", error);
        toast.error("Error loading author data");
      } finally {
        setIsLoading(false);
      }
    };
    if (isEditing && id) {
      fetchAuthor(id);
    }
  }, [id, isEditing, navigate]);
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await contentService.uploadImage(file, "author-images");
      if (url) {
        setFormData({ ...formData, imageUrl: url });
        toast.success("Author image uploaded successfully");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred during upload");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };
  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  };
  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: !isEditing ? generateSlug(name) : formData.slug
    });
  };
  const handleMemberSearch = async (query) => {
    setMemberSearchQuery(query);
    if (query.length < 2) {
      setMemberSearchResults([]);
      return;
    }
    setIsSearchingMembers(true);
    try {
      const results = await adminService.searchMembers(query);
      setMemberSearchResults(results);
    } catch (error) {
      console.error("Member search error:", error);
    } finally {
      setIsSearchingMembers(false);
    }
  };
  const selectMember = (member) => {
    setSelectedMember(member);
    setFormData({
      ...formData,
      name: member.name,
      slug: generateSlug(member.name),
      imageUrl: member.avatarUrl || "",
      role: member.profession || ""
    });
    setMemberSearchQuery("");
    setMemberSearchResults([]);
    toast.success(`Personnel identified: ${member.name}. Profile pre-filled.`);
  };
  const clearMemberSelection = () => {
    setSelectedMember(null);
    setFormData({
      name: "",
      slug: "",
      role: "",
      bio: "",
      imageUrl: ""
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }
    setIsSaving(true);
    try {
      let success = false;
      if (isEditing && id) {
        success = await contentService.updateAuthor(id, formData);
        if (success) toast.success("Author profile updated successfully");
      } else {
        success = await contentService.createAuthor(formData);
        if (success) toast.success("New author created successfully");
      }
      if (success) {
        navigate("/admin/authors");
      } else {
        toast.error(isEditing ? "Failed to update author" : "Failed to create author");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-[60vh]", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container max-w-4xl animate-in fade-in duration-500", children: [
    /* @__PURE__ */ jsx(Breadcrumbs, { currentLabel: formData.name }),
    /* @__PURE__ */ jsx("div", { className: "flex-columns items-center", children: /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight text-on-surface font-meta mb-2", children: isEditing ? "Edit Editorial Profile" : "New Editorial Profile" }),
      /* @__PURE__ */ jsx(BrandLine, { className: "mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm", children: "Configure credentials and biographical information for the movement's content creators." })
    ] }) }),
    /* @__PURE__ */ jsx("form", { onSubmit: handleSubmit, children: /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden bg-white", children: [
      /* @__PURE__ */ jsxs(CardContent, { className: "p-8 space-y-8", children: [
        !isEditing && /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-top-4 duration-500", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border/10 pb-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-on-surface capitalize tracking-tight", children: "Personnel Search" }),
            selectedMember && /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                variant: "ghost",
                onClick: clearMemberSelection,
                className: "h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/5 text-micro font-bold capitalize tracking-tight",
                children: [
                  /* @__PURE__ */ jsx(X, { className: "w-3 h-3 mr-1" }),
                  " Reset selection"
                ]
              }
            )
          ] }),
          !selectedMember ? /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-muted-foreground/40" }) }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "text",
                placeholder: "Search by name or phone number to identify movement personnel...",
                className: "pl-10 h-12 border-border/60 focus-visible:ring-on-surface bg-muted/5 placeholder:italic",
                value: memberSearchQuery,
                onChange: (e) => handleMemberSearch(e.target.value)
              }
            ),
            isSearchingMembers && /* @__PURE__ */ jsx("div", { className: "absolute right-3 top-3.5", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin text-primary" }) }),
            memberSearchResults.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute z-50 w-full mt-2 bg-white border border-border/60 rounded-sm shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200", children: /* @__PURE__ */ jsx("div", { className: "max-h-60 overflow-y-auto", children: memberSearchResults.map((member) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => selectMember(member),
                className: "w-full flex items-center gap-3 p-4 hover:bg-muted/5 transition-colors text-left border-b border-border/5 last:border-0",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-muted/10 border border-border/10 flex items-center justify-center shrink-0 overflow-hidden", children: member.avatarUrl ? /* @__PURE__ */ jsx("img", { src: member.avatarUrl, alt: "", className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx(User, { className: "w-5 h-5 text-muted-foreground/40" }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-on-surface truncate", children: member.name }),
                    /* @__PURE__ */ jsxs("p", { className: "text-micro text-muted-foreground/60 truncate", children: [
                      member.id,
                      " • ",
                      member.region,
                      " • ",
                      member.profession
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-micro font-bold capitalize tracking-tight text-primary opacity-0 group-hover:opacity-100 transition-opacity", children: "Select" })
                ]
              },
              member.id
            )) }) })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 p-4 rounded-sm bg-brand-green/5 border border-brand-green/20 animate-in zoom-in-95 duration-300", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center overflow-hidden shrink-0", children: selectedMember.avatarUrl ? /* @__PURE__ */ jsx("img", { src: selectedMember.avatarUrl, alt: "", className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx(User, { className: "w-6 h-6 text-brand-green" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-on-surface flex items-center gap-2", children: [
                selectedMember.name,
                /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-micro capitalize font-bold tracking-tight", children: [
                  /* @__PURE__ */ jsx(Check, { className: "w-2 h-2" }),
                  " Identified"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-micro text-muted-foreground/80", children: [
                selectedMember.id,
                " • ",
                selectedMember.phone
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/40 italic", children: "Personnel data successfully mapped." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-on-surface capitalize tracking-tight border-b border-border/10 pb-2", children: "Identity & Role" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Full Name" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  placeholder: "e.g. Kwame Patriot",
                  value: formData.name || "",
                  onChange: handleNameChange,
                  className: "border-border/60 focus-visible:ring-on-surface",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Unique Slug" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  placeholder: "kwame-patriot",
                  value: formData.slug || "",
                  onChange: (e) => setFormData({ ...formData, slug: e.target.value }),
                  className: "border-border/60 focus-visible:ring-on-surface bg-muted/5",
                  required: true
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/80", children: "Used for URL generation. Must be unique." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Official Title / Role" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "e.g. Senior Regional Coordinator",
                value: formData.role || "",
                onChange: (e) => setFormData({ ...formData, role: e.target.value }),
                className: "border-border/60 focus-visible:ring-on-surface"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-on-surface capitalize tracking-tight border-b border-border/10 pb-2", children: "Profile Media" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "w-32 h-32 rounded-sm bg-muted/10 border-2 border-dashed border-border/40 flex items-center justify-center overflow-hidden shrink-0 relative group", children: [
              formData.imageUrl ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("img", { src: formData.imageUrl, alt: "Profile", className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-on-surface/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx(Image, { className: "w-6 h-6 text-white" }) })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center text-muted-foreground/40 p-4", children: [
                /* @__PURE__ */ jsx(Image, { className: "w-8 h-8 mx-auto mb-2 opacity-50" }),
                /* @__PURE__ */ jsx("span", { className: "text-micro capitalize tracking-tight font-bold", children: "No Image" })
              ] }),
              isUploading && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4 flex-1 w-full", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Image URL" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    placeholder: "https://...",
                    value: formData.imageUrl || "",
                    onChange: (e) => setFormData({ ...formData, imageUrl: e.target.value }),
                    className: "border-border/60 focus-visible:ring-on-surface"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "file",
                      id: "author-image-upload",
                      className: "hidden",
                      accept: "image/*",
                      onChange: handleImageUpload,
                      disabled: isUploading
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "label",
                    {
                      htmlFor: "author-image-upload",
                      className: "flex items-center gap-2 px-4 py-2 bg-muted/10 hover:bg-muted/20 text-on-surface/80 rounded-sm text-sm font-medium transition-colors cursor-pointer border border-border/60",
                      children: [
                        /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
                        isUploading ? "Uploading..." : "Upload Image"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground/80", children: "Recommended: Square ratio, at least 400x400px." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-on-surface capitalize tracking-tight border-b border-border/10 pb-2", children: "Biographical Information" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Professional Biography" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                placeholder: "Provide a comprehensive biography detailing the author's contributions to the movement...",
                value: formData.bio || "",
                onChange: (e) => setFormData({ ...formData, bio: e.target.value }),
                className: "min-h-[150px] border-border/60 focus-visible:ring-on-surface resize-y"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-t border-border/10 bg-muted/5 flex justify-end gap-3", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "default",
            onClick: () => navigate("/admin/authors"),
            className: "rounded-sm text-micro font-bold tracking-tight px-10 h-12 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            variant: "primary",
            disabled: isSaving,
            className: "px-10 h-12 rounded-sm shadow-lg shadow-brand-green/20 text-micro font-bold capitalize tracking-tight",
            children: isSaving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
              "Saving..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 mr-2" }),
              isEditing ? "Save Changes" : "Create Profile"
            ] })
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  AdminEditAuthor as default
};
