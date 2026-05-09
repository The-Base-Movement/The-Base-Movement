import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Upload, Edit2, Calendar, FileText, Plus, Search, Star, MoreVertical, Eye, Trash2, Clock } from "lucide-react";
import { a as adminService, t as useToast, B as Button, b as BrandLine, C as Card, d as CardContent, A as Label, I as Input, x as contentService, c as cn, D as DropdownMenu, n as DropdownMenuTrigger, o as DropdownMenuContent, r as DropdownMenuItem } from "../main.mjs";
import { T as Textarea } from "./textarea-samz4tOC.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DF-S1mCR.js";
import { S as Switch } from "./switch-DKWC-xh-.js";
import { B as Badge } from "./badge-JuJFKxOQ.js";
import { Editor } from "@tinymce/tinymce-react";
import { D as DeleteConfirmationModal } from "./DeleteConfirmationModal-Cn3j2Cup.js";
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
import "@radix-ui/react-select";
import "@radix-ui/react-switch";
import "./dialog-D9Fxht2W.js";
import "@radix-ui/react-dialog";
const CATEGORY_PLACEHOLDERS = {
  "Movement": "https://images.unsplash.com/photo-1540910419842-dfb322c98b3c?q=80&w=1200&auto=format&fit=crop",
  "Youth": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop",
  "Economy": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop",
  "Diaspora": "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=1200&auto=format&fit=crop",
  "Integrity": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop",
  "Community": "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop",
  "Impact": "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=1200&auto=format&fit=crop"
};
const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop";
function AdminBlogs() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(adminService.getCurrentUser());
  const canPublish = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "CHIEF_EDITOR" || currentUser?.role === "SENIOR_EDITOR";
  const [currentView, setCurrentView] = useState(() => {
    return sessionStorage.getItem("blogs_currentView") || "list";
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [editingPost, setEditPost] = useState(() => {
    const saved = sessionStorage.getItem("blogs_editingPost");
    return saved ? JSON.parse(saved) : null;
  });
  const [viewPost, setViewPost] = useState(() => {
    const saved = sessionStorage.getItem("blogs_viewPost");
    return saved ? JSON.parse(saved) : null;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast: toast$1 } = useToast();
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem("blogs_formData");
    if (saved) return JSON.parse(saved);
    return {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      authorId: "USR-001",
      category: "",
      imageUrl: "",
      readTime: "5 min read",
      isFeatured: false,
      publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "Draft",
      tags: [],
      seoTitle: "",
      metaDescription: "",
      authorName: "",
      authorRole: "",
      authorImage: "",
      authorBio: ""
    };
  });
  useEffect(() => {
    const initUser = async () => {
      const user = await adminService.initialize();
      setCurrentUser(user);
    };
    if (!currentUser) initUser();
  }, [currentUser]);
  useEffect(() => {
    sessionStorage.setItem("blogs_currentView", currentView);
  }, [currentView]);
  useEffect(() => {
    if (editingPost) sessionStorage.setItem("blogs_editingPost", JSON.stringify(editingPost));
    else sessionStorage.removeItem("blogs_editingPost");
  }, [editingPost]);
  useEffect(() => {
    if (viewPost) sessionStorage.setItem("blogs_viewPost", JSON.stringify(viewPost));
    else sessionStorage.removeItem("blogs_viewPost");
  }, [viewPost]);
  useEffect(() => {
    sessionStorage.setItem("blogs_formData", JSON.stringify(formData));
  }, [formData]);
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getBlogPosts();
      setPosts(data);
    } catch (error) {
      console.error("[SYSTEM] Failed to fetch posts:", error);
      toast$1({
        title: "FETCH ERROR",
        description: "Could not retrieve blog intelligence from vault.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast$1]);
  const handleEditPost = (post) => {
    if (post) {
      setEditPost(post);
      setFormData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        authorId: post.authorId,
        category: post.category,
        imageUrl: post.imageUrl || "",
        readTime: post.readTime,
        isFeatured: post.isFeatured,
        publishedAt: post.publishedAt,
        status: post.status,
        tags: post.tags,
        seoTitle: post.seoTitle ?? "",
        metaDescription: post.metaDescription ?? "",
        authorName: post.authorName ?? "",
        authorRole: post.authorRole ?? "",
        authorImage: post.authorImage ?? "",
        authorBio: post.authorBio ?? ""
      });
    } else {
      setEditPost(null);
      setFormData({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        authorId: "USR-001",
        category: "Movement",
        imageUrl: "",
        readTime: "5 min read",
        isFeatured: false,
        publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "Draft",
        tags: [],
        seoTitle: "",
        metaDescription: "",
        authorName: "",
        authorRole: "",
        authorImage: "",
        authorBio: ""
      });
    }
    setCurrentView("edit");
  };
  const handleViewPost = (post) => {
    setViewPost(post);
    setCurrentView("view");
  };
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  useEffect(() => {
    if (posts.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");
      if (editId) {
        const post = posts.find((p) => p.id === editId);
        if (post) {
          setTimeout(() => {
            handleEditPost(post);
            window.history.replaceState({}, "", window.location.pathname);
          }, 0);
        }
      }
    }
  }, [posts]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let success = false;
      if (editingPost) {
        success = await adminService.updateBlogPost(editingPost.id, formData);
      } else {
        const postData = { ...formData };
        if (!postData.slug) {
          postData.slug = postData.title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
        }
        success = await adminService.createBlogPost(postData);
      }
      if (success) {
        const actionLabel = formData.status === "Published" ? "Intelligence Authorized & Published" : formData.status === "Pending Verification" ? "Submitted for Strategic Verification" : "Intelligence Saved as Draft";
        toast.success(actionLabel, {
          description: `"${formData.title}" has been processed successfully.`
        });
        setCurrentView("list");
        fetchPosts();
      }
    } catch {
      toast.error("Operational Error", {
        description: "Failed to sync intelligence with the field database."
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleDelete = (post) => {
    setPostToDelete(post);
  };
  const handleConfirmedDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      const success = await contentService.deleteBlogPost(postToDelete.id);
      if (success) {
        toast.success(`"${postToDelete.title}" moved to trash`);
        setPostToDelete(null);
        fetchPosts();
        adminService.logAction("TRASH_BLOG", `BLOG/${postToDelete.title}`, "Success");
      } else {
        toast.error("Failed to move post to trash");
      }
    } catch {
      toast.error("An error occurred during deletion");
    } finally {
      setIsDeleting(false);
    }
  };
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  if (currentView === "edit") {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-on-surface/40 normal-case", children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", className: "p-0 h-auto hover:bg-transparent hover:text-on-surface text-sm font-medium normal-case", onClick: () => setCurrentView("list"), children: "Blog posts" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm text-on-surface/20", children: "/" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-on-surface normal-case", children: editingPost ? "Edit post" : "Create new post" })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-on-surface tracking-tight normal-case", children: editingPost ? "Edit post" : "Create new post" }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1 font-medium", children: "Fill in the details below to configure and publish your post." })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "grid grid-cols-1 lg:grid-cols-3 gap-8 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-8", children: [
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 bg-white shadow-sm overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border/40 bg-muted/5", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-xs normal-case", children: "Post details" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "p-8 space-y-8", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Article title" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    required: true,
                    id: "title",
                    value: formData.title ?? "",
                    onChange: (e) => setFormData({ ...formData, title: e.target.value }),
                    placeholder: "Enter article title...",
                    className: "rounded-sm border-border/40 h-11 text-sm font-medium"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "slug", className: "text-sm font-bold text-on-surface/80", children: "Article URL Slug" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "slug",
                    value: formData.slug ?? "",
                    onChange: (e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, "-") }),
                    placeholder: "article-url-slug",
                    className: "rounded-sm border-border/40 h-11 text-sm font-medium"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "excerpt", className: "text-sm font-bold text-on-surface/80", children: "Excerpt (Brief Summary)" }),
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    id: "excerpt",
                    required: true,
                    value: formData.excerpt ?? "",
                    onChange: (e) => setFormData({ ...formData, excerpt: e.target.value }),
                    placeholder: "Provide a strategic summary for the movement feed...",
                    className: "rounded-sm border-border/40 min-h-[100px] text-sm font-medium leading-relaxed"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 bg-white shadow-sm overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border/40 bg-muted/5", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-xs normal-case", children: "Content" }) }),
            /* @__PURE__ */ jsx(CardContent, { className: "p-0 border-0", children: /* @__PURE__ */ jsx("div", { className: "p-8", children: /* @__PURE__ */ jsx("div", { className: "rounded-sm border border-border/40 overflow-hidden shadow-inner bg-muted/5", children: /* @__PURE__ */ jsx(
              Editor,
              {
                apiKey: "ky4xtv1lrw74kgz3s89jm1m0tw6d1supmj4xpnbibfjk5qkz",
                value: formData.content ?? "",
                onEditorChange: (content) => setFormData({ ...formData, content }),
                init: {
                  height: 750,
                  menubar: false,
                  toolbar_sticky: true,
                  toolbar_sticky_offset: 100,
                  plugins: "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount",
                  toolbar: "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat",
                  content_style: 'body { font-family: "Public Sans", sans-serif; font-size:16px; color: #1c1917; line-height: 1.75; padding: 3rem; background: white; }',
                  skin: "oxide",
                  content_css: "default",
                  border_width: 0,
                  images_upload_handler: async (blobInfo) => {
                    const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type });
                    const url = await contentService.uploadImage(file, "editor-content");
                    if (!url) throw new Error("Upload failed");
                    return url;
                  }
                }
              }
            ) }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-8 sticky top-6", children: [
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 bg-white shadow-sm overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border/40 bg-muted/5", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-sm normal-case", children: "Publishing" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1 pr-4", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Featured post" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground/40 leading-tight", children: "Pin this post to the top of the insights feed." })
                ] }),
                /* @__PURE__ */ jsx(
                  Switch,
                  {
                    checked: formData.isFeatured,
                    onCheckedChange: (val) => setFormData({ ...formData, isFeatured: val })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-6 border-t border-border/40", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Publication Status" }),
                  !canPublish && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-micro font-bold text-amber-600 border-amber-200 bg-amber-50 rounded-sm", children: "Authorization Required" })
                ] }),
                /* @__PURE__ */ jsxs(
                  Select,
                  {
                    value: formData.status,
                    onValueChange: (val) => setFormData({ ...formData, status: val }),
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { className: "rounded-sm border-border/40 h-11 text-sm font-medium", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Status" }) }),
                      /* @__PURE__ */ jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsx(SelectItem, { value: "Draft", children: "Save as Draft" }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "Pending Verification", children: "Request Verification" }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "Published", disabled: !canPublish, children: "Authorize & Publish" })
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-micro font-medium text-muted-foreground/40 leading-tight", children: canPublish ? "Control the visibility of this intelligence across the movement's platforms." : "Submit this intelligence for review. Senior Editorial personnel will verify before deployment." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-6 border-t border-border/40", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Category" }),
                /* @__PURE__ */ jsxs(
                  Select,
                  {
                    value: formData.category,
                    onValueChange: (val) => setFormData({ ...formData, category: val }),
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { className: "rounded-sm border-border/40 h-11 text-sm font-medium", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a category" }) }),
                      /* @__PURE__ */ jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsx(SelectItem, { value: "Movement", children: "Movement" }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "Youth", children: "Youth" }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "Economy", children: "Economy" }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "Diaspora", children: "Diaspora" }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "Integrity", children: "Integrity" }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "Community", children: "Community" })
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-6 border-t border-border/40", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Featured image URL" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "file",
                        id: "blog-image-upload",
                        className: "hidden",
                        accept: "image/*",
                        onChange: async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await contentService.uploadImage(file, "blog-images");
                          if (url) {
                            setFormData({ ...formData, imageUrl: url });
                          }
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Label,
                      {
                        htmlFor: "blog-image-upload",
                        className: "text-micro font-bold text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1.5 transition-colors tracking-wide",
                        children: [
                          /* @__PURE__ */ jsx(Upload, { className: "w-3 h-3" }),
                          "Upload image"
                        ]
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: formData.imageUrl ?? "",
                    onChange: (e) => setFormData({ ...formData, imageUrl: e.target.value }),
                    placeholder: "https://example.com/image.jpg",
                    className: "rounded-sm border-border/40 h-11 text-sm"
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground/40", children: "Provide a direct URL or upload a file." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-6 border-t border-border/40", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Est. read time" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: formData.readTime ?? "",
                    onChange: (e) => setFormData({ ...formData, readTime: e.target.value }),
                    placeholder: "5 min read",
                    className: "rounded-sm border-border/40 h-11 text-sm"
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground/40", children: 'Suggested format: "5 min read"' })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 bg-white shadow-sm overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border/40 bg-muted/5", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-sm normal-case", children: "Author information" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "p-8 space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Author name" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: formData.authorName ?? "",
                    onChange: (e) => setFormData({ ...formData, authorName: e.target.value }),
                    placeholder: "e.g. John Doe",
                    className: "rounded-sm border-border/40 h-11 text-sm"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Author role" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: formData.authorRole ?? "",
                    onChange: (e) => setFormData({ ...formData, authorRole: e.target.value }),
                    placeholder: "e.g. Communications Director",
                    className: "rounded-sm border-border/40 h-11 text-sm"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Author image URL" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "file",
                        id: "author-image-upload",
                        className: "hidden",
                        accept: "image/*",
                        onChange: async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await contentService.uploadImage(file, "author-images");
                          if (url) {
                            setFormData({ ...formData, authorImage: url });
                          }
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Label,
                      {
                        htmlFor: "author-image-upload",
                        className: "text-micro font-bold text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1.5 transition-colors tracking-wide",
                        children: [
                          /* @__PURE__ */ jsx(Upload, { className: "w-3 h-3" }),
                          "Upload photo"
                        ]
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: formData.authorImage ?? "",
                    onChange: (e) => setFormData({ ...formData, authorImage: e.target.value }),
                    placeholder: "https://...",
                    className: "rounded-sm border-border/40 h-11 text-sm"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Author bio" }),
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    value: formData.authorBio ?? "",
                    onChange: (e) => setFormData({ ...formData, authorBio: e.target.value }),
                    placeholder: "Short professional bio...",
                    className: "rounded-sm border-border/40 min-h-[80px] text-sm leading-relaxed"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 bg-white shadow-sm overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border/40 bg-muted/5", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-sm normal-case", children: "SEO settings" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Meta title" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: formData.seoTitle ?? "",
                    onChange: (e) => setFormData({ ...formData, seoTitle: e.target.value }),
                    placeholder: "Title for search engines...",
                    className: "rounded-sm border-border/40 h-11 text-sm"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Keywords" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: formData.tags.join(", "),
                    onChange: (e) => setFormData({ ...formData, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }),
                    placeholder: "ghana, industry, jobs",
                    className: "rounded-sm border-border/40 h-11 text-sm"
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground/40", children: "Comma separated tags." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-sm font-bold text-on-surface/80", children: "Meta description" }),
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    value: formData.metaDescription ?? "",
                    onChange: (e) => setFormData({ ...formData, metaDescription: e.target.value }),
                    placeholder: "Brief description for search result snippets...",
                    className: "rounded-sm border-border/40 min-h-[80px] text-sm leading-relaxed"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 pt-4", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "submit",
                disabled: isLoading,
                variant: "primary",
                className: "w-full h-14 rounded-sm text-tiny font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.01] active:scale-95",
                children: isLoading ? "Processing..." : formData.status === "Published" ? "Authorize & Publish" : formData.status === "Pending Verification" ? "Submit for Verification" : "Save as draft"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: "default",
                onClick: () => setCurrentView("list"),
                className: "w-full h-12 rounded-sm text-micro font-bold tracking-tight text-muted-foreground/80 hover:text-red-500 border-border/40 hover:bg-red-50 transition-all shadow-sm active:scale-95",
                children: "Abort & Discard"
              }
            )
          ] })
        ] })
      ] })
    ] });
  }
  if (currentView === "view" && viewPost) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-muted-foreground/40 normal-case mb-2", children: [
            /* @__PURE__ */ jsx(Button, { variant: "ghost", className: "p-0 h-auto hover:bg-transparent hover:text-on-surface text-sm font-medium normal-case", onClick: () => setCurrentView("list"), children: "Blog posts" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground/20", children: "/" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-on-surface normal-case", children: "View post" })
          ] }),
          /* @__PURE__ */ jsx(BrandLine, {})
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: () => handleEditPost(viewPost),
            variant: "active-tab",
            className: "h-12 px-10 text-micro font-bold tracking-tight flex items-center gap-2 rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4 mr-2" }),
              " Edit post"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 bg-white overflow-hidden max-w-4xl mx-auto shadow-sm", children: [
        viewPost.imageUrl && /* @__PURE__ */ jsx("div", { className: "w-full h-[400px] relative", children: /* @__PURE__ */ jsx("img", { src: viewPost.imageUrl, alt: viewPost.title, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-10 md:p-16", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "bg-muted/5 text-on-surface/60 border-none px-3 py-1 text-xs font-semibold rounded-full", children: viewPost.category }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground/40", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold", children: new Date(viewPost.publishedAt).toLocaleDateString() })
            ] })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-4xl md:text-5xl font-bold text-on-surface tracking-tight leading-tight mb-6", children: viewPost.title }),
          /* @__PURE__ */ jsx("div", { className: "text-lg text-muted-foreground/40 font-medium leading-relaxed mb-10 border-l-4 border-border/40 pl-6 italic", children: viewPost.excerpt }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "prose prose-on-surface max-w-none prose-p:text-on-surface/60 prose-p:leading-relaxed prose-headings:text-on-surface prose-headings:font-bold",
              dangerouslySetInnerHTML: { __html: viewPost.content }
            }
          )
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "admin-page-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-8 h-8 text-on-surface" }),
          "Blog posts"
        ] }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 text-sm mt-1", children: "Draft and publish strategic articles for the movement feed." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: () => handleEditPost(),
          variant: "primary",
          size: "lg",
          className: "rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            " Create new post"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-12", children: [
      /* @__PURE__ */ jsxs("aside", { className: "lg:sticky lg:top-24 self-start space-y-8 order-2 lg:order-1", children: [
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden bg-white", children: [
          /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border/10 bg-muted/5", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-on-surface text-xs normal-case", children: "Intelligence filters" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 uppercase tracking-widest", children: "Search feed" }),
              /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 group-focus-within:text-on-surface transition-colors" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Keywords...",
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value),
                    className: "w-full h-10 pl-10 pr-4 bg-white border border-stone-200 rounded-sm text-xs font-bold focus:border-on-surface outline-none transition-all placeholder:text-stone-300"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-6 border-t border-stone-50", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 uppercase tracking-widest", children: "Status" }),
              /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-10 w-full bg-white border-stone-200 text-xs font-bold rounded-sm focus:ring-0 focus:border-on-surface", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Status" }) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Statuses" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Published", children: "Published" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Pending Verification", children: "Pending" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Draft", children: "Drafts" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-6 border-t border-stone-50", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-micro font-bold text-stone-500 uppercase tracking-widest", children: "Category" }),
              /* @__PURE__ */ jsxs(Select, { value: categoryFilter, onValueChange: setCategoryFilter, children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-10 w-full bg-white border-stone-200 text-xs font-bold rounded-sm focus:ring-0 focus:border-on-surface", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Category" }) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Categories" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Movement", children: "Movement" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Youth", children: "Youth" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Economy", children: "Economy" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Diaspora", children: "Diaspora" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Integrity", children: "Integrity" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "Community", children: "Community" })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/60 shadow-sm overflow-hidden bg-on-surface text-white p-6", children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-white/40 uppercase tracking-widest mb-4", children: "Content telemetry" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold", children: "Total Articles" }),
              /* @__PURE__ */ jsx("span", { className: "text-xl font-bold font-meta", children: posts.length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold", children: "Authorized" }),
              /* @__PURE__ */ jsx("span", { className: "text-xl font-bold font-meta text-primary", children: posts.filter((p) => p.status === "Published").length })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-3 order-1 lg:order-2", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8", children: isLoading ? Array(6).fill(0).map((_, i) => /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 animate-pulse bg-white", children: [
        /* @__PURE__ */ jsx("div", { className: "h-48 bg-muted/5" }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6 space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/5 w-3/4 rounded" }),
          /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted/5 w-1/2 rounded" })
        ] })
      ] }, i)) : filteredPosts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "col-span-full py-20 text-center bg-white border-2 border-dashed border-border/40 rounded-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-muted/5 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(FileText, { className: "w-8 h-8 text-muted-foreground/20" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-on-surface", children: "No posts found" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground/40 mt-1 max-w-xs mx-auto", children: "Try refining your search or create a new blog post to get started." }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "default",
            onClick: () => setSearchQuery(""),
            className: "mt-6 rounded-sm border-border/40 font-bold text-micro tracking-tight px-10 h-12 hover:bg-stone-50 transition-all shadow-sm active:scale-95",
            children: "Clear search"
          }
        )
      ] }) : filteredPosts.map((post) => /* @__PURE__ */ jsxs(Card, { className: "rounded-sm border-border/40 group hover:border-border/60 hover:shadow-md transition-all overflow-hidden bg-white flex flex-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "aspect-video relative overflow-hidden bg-muted/5", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: post.imageUrl || CATEGORY_PLACEHOLDERS[post.category] || DEFAULT_PLACEHOLDER,
              alt: post.title,
              className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700",
              decoding: "async",
              loading: "lazy"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute top-4 left-4", children: /* @__PURE__ */ jsx(Badge, { className: "bg-white/90 backdrop-blur-sm text-on-surface/80 text-micro font-bold tracking-tight rounded-full border-none shadow-sm px-3", children: post.category }) }),
          /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-12", children: /* @__PURE__ */ jsx(Badge, { className: cn(
            "backdrop-blur-sm text-micro font-bold tracking-tight rounded-full border-none shadow-sm px-3",
            post.status === "Published" ? "bg-brand-green text-white" : post.status === "Pending Verification" ? "bg-brand-gold text-on-surface" : "bg-amber-500/80 text-white"
          ), children: post.status }) }),
          post.isFeatured && /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-4", children: /* @__PURE__ */ jsx("div", { className: "w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow-lg", children: /* @__PURE__ */ jsx(Star, { className: "w-3.5 h-3.5 fill-white" }) }) })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "p-6 flex-1 flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3 gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-on-surface leading-tight group-hover:text-primary transition-colors line-clamp-2", children: post.title }),
            /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", className: "h-8 w-8 p-0 shrink-0 hover:bg-muted/5 rounded-full", children: /* @__PURE__ */ jsx(MoreVertical, { className: "w-4 h-4 text-muted-foreground/40" }) }) }),
              /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "rounded-sm border-border/40 shadow-xl p-2 w-48", children: [
                /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => handleEditPost(post), className: "rounded-sm text-sm font-medium gap-3 py-2.5", children: [
                  /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4 text-muted-foreground/40" }),
                  " Edit post"
                ] }),
                /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => handleViewPost(post), className: "rounded-sm text-sm font-medium gap-3 py-2.5", children: [
                  /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 text-muted-foreground/40" }),
                  " View post"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-px bg-border/40 my-1" }),
                /* @__PURE__ */ jsxs(DropdownMenuItem, { disabled: isDeleting, onClick: () => handleDelete(post), className: "rounded-sm text-sm font-medium gap-3 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10", children: [
                  /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                  " Delete post"
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/40 text-sm line-clamp-2 mb-6 font-medium leading-relaxed flex-1", children: post.excerpt }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-5 border-t border-border/40 mt-auto", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground/40", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-tiny font-semibold", children: new Date(post.publishedAt).toLocaleDateString() })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground/40", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-tiny font-semibold", children: post.readTime })
            ] })
          ] })
        ] })
      ] }, post.id)) }) })
    ] }),
    /* @__PURE__ */ jsx(
      DeleteConfirmationModal,
      {
        isOpen: !!postToDelete,
        onClose: () => setPostToDelete(null),
        onConfirm: handleConfirmedDelete,
        title: "Move to Trash",
        description: "This article will be moved to the trash vault. You can restore it within 30 days before it is permanently purged.",
        itemName: postToDelete?.title || "",
        isLoading: isDeleting,
        isPermanent: false
      }
    )
  ] });
}
export {
  AdminBlogs as default
};
