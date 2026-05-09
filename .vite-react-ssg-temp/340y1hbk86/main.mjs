import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { ViteReactSSG } from "vite-react-ssg";
import { useQueryClient, useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Helmet, HelmetProvider } from "react-helmet-async";
import * as React from "react";
import React__default, { createContext, useState, useEffect, useContext, useCallback, useRef, lazy, Suspense } from "react";
import { useLocation, Link, useNavigate, useSearchParams, Outlet, Navigate, useRoutes } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Loader2Icon, ArrowRight, MapPin, Globe, EyeOff, Eye, Loader2, CheckCircle2, ArrowLeft, FileText, Download, User, Zap, Upload, X, Check, ChevronDown, Building2, Copy, MessageCircle, Facebook, Twitter, Mail, Flag, Clock, Target, TrendingUp, Calendar, Users, Navigation, Trophy, ShieldCheck, Award, Medal, Shield, Settings, LogOut, Send, ArrowUp, Search } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { toast as toast$1, Toaster as Toaster$1 } from "sonner";
import Cropper from "react-easy-crop";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as ToastPrimitives from "@radix-ui/react-toast";
const StoreContext = createContext(void 0);
const supabaseUrl = "https://vhlyekyxutwbxlvktnzd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobHlla3l4dXR3Ynhsdmt0bnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NzczMjIsImV4cCI6MjA5MzM1MzMyMn0.yxmjdocH43opZY_kR2WgrsXVqMSTEhJDyObI1slygiY";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
class AuthService {
  static instance;
  currentSession = null;
  constructor() {
    supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentSession = session;
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession = session;
      if (session) {
        localStorage.setItem("supabase_session_active", "true");
      } else {
        localStorage.removeItem("supabase_session_active");
      }
    });
  }
  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      throw new Error(error.message || "Login failed");
    }
    this.currentSession = data.session;
    return data;
  }
  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard"
      }
    });
    if (error) {
      throw new Error(error.message || "Google Sign-In failed");
    }
  }
  async signUp(email, password, name, image) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          avatar_url: image
        }
      }
    });
    if (error) {
      throw new Error(error.message || "Registration failed");
    }
    this.currentSession = data.session;
    return data;
  }
  async logout() {
    this.currentSession = null;
    await supabase.auth.signOut();
  }
  getToken() {
    return this.currentSession?.access_token || null;
  }
  isAuthenticated() {
    if (this.currentSession) return true;
    return localStorage.getItem("supabase_session_active") === "true";
  }
  getUser() {
    return this.currentSession?.user || null;
  }
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) {
      throw new Error(error.message || "Failed to update password");
    }
  }
  async updateProfile(updates) {
    const { error } = await supabase.auth.updateUser({
      data: updates
    });
    if (error) {
      throw new Error(error.message || "Failed to update profile");
    }
  }
}
const authService = AuthService.getInstance();
class MemberService {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!MemberService.instance) {
      MemberService.instance = new MemberService();
    }
    return MemberService.instance;
  }
  async getMembers() {
    const { data: adminIds } = await supabase.from("admins").select("id");
    const adminIdList = adminIds?.map((a) => a.id) || [];
    const query = supabase.from("users").select("*").order("joined_at", { ascending: false });
    if (adminIdList.length > 0) {
      query.not("id", "in", `(${adminIdList.join(",")})`);
    }
    const { data, error } = await query;
    if (error) {
      console.warn("[DATABASE] Failed to fetch members:", error);
      return [];
    }
    return data.map((u) => ({
      id: u.registration_number,
      name: u.full_name,
      email: u.email,
      phone: u.phone_number || "N/A",
      region: u.region || "Region pending",
      constituency: u.constituency || "Constituency pending",
      status: u.status,
      joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : "N/A",
      platform: u.platform || "GHANA",
      type: u.platform === "GHANA" ? "Standard" : "Premium",
      avatarUrl: u.avatar_url || void 0,
      gender: u.gender || "Not specified",
      chapter: u.chapter || "Central",
      country: u.country || "Ghana",
      profession: u.profession || "Patriot"
    }));
  }
  async getAdministrators() {
    const { data, error } = await supabase.from("admins").select(`
        id,
        role,
        permissions,
        users!admins_id_fkey (
          full_name,
          email,
          region,
          avatar_url
        )
      `);
    if (error || !data) {
      console.error("[DATABASE] Failed to fetch administrators:", error);
      return [];
    }
    const typedData = data;
    return typedData.map((a) => ({
      id: a.id,
      name: a.users?.full_name || "Authorized Officer",
      email: a.users?.email || "hq@thebase.gh",
      role: a.role,
      region: a.users?.region || "National HQ",
      permissions: a.permissions,
      avatarUrl: a.users?.avatar_url || void 0
    }));
  }
  async getMemberProfile(regNo) {
    const { data, error } = await supabase.from("users").select("*").eq("registration_number", regNo).single();
    if (error || !data) {
      console.error("[DATABASE] Failed to fetch member profile:", error);
      return null;
    }
    return {
      id: data.registration_number,
      name: data.full_name,
      email: data.email,
      phone: data.phone_number || "N/A",
      region: data.region || "Unknown",
      constituency: data.constituency || "Unknown",
      status: data.status,
      joined: data.joined_at ? new Date(data.joined_at).toLocaleDateString() : "N/A",
      platform: data.platform || "GHANA",
      type: data.platform === "GHANA" ? "Standard" : "Premium",
      avatarUrl: data.avatar_url || void 0,
      gender: data.gender || "Unknown",
      chapter: data.chapter || "Central",
      country: data.country || "Ghana",
      profession: data.profession || "Patriot"
    };
  }
  async getGrowthStats() {
    const now = /* @__PURE__ */ new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1e3).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3).toISOString();
    try {
      const [hourRes, dayRes, weekRes] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }).gte("joined_at", oneHourAgo),
        supabase.from("users").select("*", { count: "exact", head: true }).gte("joined_at", oneDayAgo),
        supabase.from("users").select("*", { count: "exact", head: true }).gte("joined_at", sevenDaysAgo)
      ]);
      return {
        joined_last_hour: hourRes.count || 0,
        joined_last_24h: dayRes.count || 0,
        joined_last_7d: weekRes.count || 0
      };
    } catch (error) {
      console.warn("[DATABASE] Failed to fetch growth stats:", error);
      return { joined_last_hour: 0, joined_last_24h: 0, joined_last_7d: 0 };
    }
  }
  async updateMemberProfile(regNo, profile) {
    const updateData = {};
    if (profile.name) updateData.full_name = profile.name;
    if (profile.email) updateData.email = profile.email;
    if (profile.phone) updateData.phone_number = profile.phone;
    if (profile.region) updateData.region = profile.region;
    if (profile.constituency) updateData.constituency = profile.constituency;
    if (profile.avatarUrl !== void 0) updateData.avatar_url = profile.avatarUrl;
    if (profile.gender) updateData.gender = profile.gender;
    if (profile.chapter) updateData.chapter = profile.chapter;
    if (profile.profession) updateData.profession = profile.profession;
    const { error } = await supabase.from("users").update(updateData).eq("registration_number", regNo);
    if (error) {
      console.error("[DATABASE] Failed to update member profile:", error);
      return false;
    }
    if (profile.name) localStorage.setItem("userName", profile.name);
    if (profile.avatarUrl) localStorage.setItem("userAvatar", profile.avatarUrl);
    window.dispatchEvent(new Event("storage"));
    return true;
  }
  async getPendingVerifications() {
    const { data, error } = await supabase.from("users").select("*").in("verification_status", ["In Review", "Processing", "Flagged"]).order("joined_at", { ascending: false });
    if (error) {
      console.error("[DATABASE] Failed to fetch pending verifications:", error);
      return [];
    }
    return (data || []).map((u) => ({
      id: u.registration_number,
      name: u.full_name,
      region: u.region,
      constituency: u.constituency,
      platform: u.platform,
      country: u.country,
      phone: u.phone_number,
      gender: u.gender,
      ageRange: u.age_range,
      profession: u.profession,
      educationLevel: u.education_level,
      emergencyName: u.emergency_name,
      emergencyRelationship: u.emergency_relationship,
      emergencyPhone: u.emergency_phone,
      submitted: new Date(u.joined_at).toLocaleString(),
      status: u.verification_status,
      photoUrl: u.avatar_url,
      chapter: u.chapter
    }));
  }
  async verifyMember(id, approve, reason, chapterName) {
    const status = approve ? "Approved" : "Rejected";
    const accountStatus = approve ? "Active" : "Suspended";
    const { error } = await supabase.from("users").update({
      verification_status: status,
      status: accountStatus,
      chapter: chapterName || null,
      verification_notes: reason || null
    }).eq("registration_number", id);
    if (error) {
      console.error("[DATABASE] Member verification failed:", error);
      return false;
    }
    return true;
  }
  async getCountries() {
    const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true });
    if (error || !Array.isArray(data)) return [];
    return data;
  }
  async deleteMember(id) {
    const { error } = await supabase.from("users").delete().eq("registration_number", id);
    if (error) {
      console.error("[DATABASE] Member deletion failed:", error);
      return false;
    }
    return true;
  }
  async searchMembers(query) {
    if (!query || query.length < 2) return [];
    const { data, error } = await supabase.from("users").select("*").or(`full_name.ilike.%${query}%,phone_number.ilike.%${query}%`).limit(10);
    if (error) {
      console.warn("[DATABASE] Failed to search members:", error);
      return [];
    }
    return (data || []).map((u) => ({
      id: u.registration_number,
      name: u.full_name,
      email: u.email,
      phone: u.phone_number || "N/A",
      region: u.region || "Region pending",
      constituency: u.constituency || "Constituency pending",
      status: u.status,
      joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : "N/A",
      platform: u.platform || "GHANA",
      type: u.platform === "GHANA" ? "Standard" : "Premium",
      avatarUrl: u.avatar_url || void 0,
      gender: u.gender || "Not specified",
      chapter: u.chapter || "Central",
      country: u.country || "Ghana",
      profession: u.profession || "Patriot"
    }));
  }
}
const memberService = MemberService.getInstance();
class LogisticsService {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!LogisticsService.instance) {
      LogisticsService.instance = new LogisticsService();
    }
    return LogisticsService.instance;
  }
  // --- Store & Inventory ---
  async getInventory() {
    const { data, error } = await supabase.from("store_inventory").select("*").is("deleted_at", null).order("name", { ascending: true });
    if (error) {
      console.warn("[DATABASE] Failed to fetch inventory:", error);
      return [];
    }
    return (data || []).map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      price: `GHS ${i.price_ghs}`,
      stock: i.stock_quantity,
      status: i.status,
      image: i.image_emoji || i.image_url || "📦",
      images: i.image_url ? [i.image_url] : [],
      color: i.brand_color,
      description: i.description,
      longDescription: i.long_description
    }));
  }
  async getStoreProducts() {
    const { data, error } = await supabase.from("store_inventory").select("*").eq("status", "Available").is("deleted_at", null).order("name", { ascending: true });
    if (error) {
      console.warn("[DATABASE] Failed to fetch store products:", error);
      return [];
    }
    return (data || []).map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug || i.name.toLowerCase().replace(/\s+/g, "-"),
      price: `GHS ${i.price_ghs}`,
      description: i.description || "Official movement gear. Designed for patriots.",
      status: i.status,
      category: i.category,
      rating: i.rating || 4.8,
      reviews: i.reviews || 0,
      image: i.image_url,
      longDescription: i.long_description || i.description || "Official movement gear. Designed for patriots.",
      sizes: i.sizes || ["S", "M", "L", "XL"],
      colors: i.colors || ["Black", "Green"]
    }));
  }
  async getProductBySlug(slug) {
    const { data, error } = await supabase.from("store_inventory").select(`
        *,
        product_reviews:reviews (*)
      `).eq("slug", slug).is("deleted_at", null).maybeSingle();
    if (error) {
      console.error("[DATABASE] Error fetching product by slug:", error);
      return null;
    }
    if (!data) {
      const all = await this.getStoreProducts();
      return all.find((p) => p.slug === slug) || null;
    }
    const typedData = data;
    return {
      id: typedData.id,
      name: typedData.name,
      slug: typedData.slug,
      price: `GHS ${typedData.price_ghs}`,
      description: typedData.description || "Official movement gear. Designed for patriots.",
      status: typedData.status,
      category: typedData.category,
      rating: typedData.rating || 4.8,
      reviews: typedData.reviews || 0,
      image: typedData.image_url,
      longDescription: typedData.long_description || typedData.description,
      sizes: typedData.sizes || ["S", "M", "L", "XL"],
      colors: typedData.colors || ["Black", "Green"],
      is_featured: typedData.is_featured,
      customization_allowed: typedData.customization_allowed,
      specifications: typedData.specifications,
      gallery_images: [],
      reviews_data: (typedData.product_reviews || []).map((rev) => ({
        id: rev.id,
        patriot_name: rev.author_name,
        rating: rev.rating,
        content: rev.content,
        is_verified: true,
        created_at: rev.created_at
      }))
    };
  }
  async addInventoryItem(item) {
    const { error } = await supabase.from("store_inventory").insert({
      name: item.name,
      category: item.category,
      price_ghs: parseFloat(item.price.replace(/[^0-9.]/g, "")),
      stock_quantity: item.stock,
      status: item.status,
      image_emoji: item.image,
      brand_color: item.color,
      description: item.description,
      long_description: item.longDescription
    }).select().single();
    if (error) {
      console.error("[DATABASE] Failed to add inventory item:", error);
      return false;
    }
    return true;
  }
  async updateInventoryItem(id, item) {
    const updateData = {};
    if (item.name) updateData.name = item.name;
    if (item.category) updateData.category = item.category;
    if (item.price) updateData.price_ghs = parseFloat(item.price.replace(/[^0-9.]/g, ""));
    if (item.stock !== void 0) updateData.stock_quantity = item.stock;
    if (item.status) updateData.status = item.status;
    if (item.image) updateData.image_emoji = item.image;
    if (item.color) updateData.brand_color = item.color;
    if (item.description !== void 0) updateData.description = item.description;
    if (item.longDescription !== void 0) updateData.long_description = item.longDescription;
    const { error } = await supabase.from("store_inventory").update(updateData).eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to update inventory item:", error);
      return false;
    }
    return true;
  }
  async deleteInventoryItem(id) {
    const { error } = await supabase.from("store_inventory").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to soft delete inventory item:", error);
      return false;
    }
    return true;
  }
  async getTrashedInventory() {
    const { data, error } = await supabase.from("store_inventory").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (error) {
      console.warn("[DATABASE] Failed to fetch trashed inventory:", error);
      return [];
    }
    return (data || []).map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      price: `GHS ${i.price_ghs}`,
      stock: i.stock_quantity,
      status: i.status,
      image: i.image_emoji || i.image_url || "📦",
      images: i.image_url ? [i.image_url] : [],
      color: i.brand_color,
      deletedAt: i.deleted_at
    }));
  }
  async restoreInventoryItem(id) {
    const { error } = await supabase.from("store_inventory").update({ deleted_at: null }).eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to restore inventory item:", error);
      return false;
    }
    return true;
  }
  async permanentlyDeleteInventoryItem(id) {
    const { error } = await supabase.from("store_inventory").delete().eq("id", id);
    if (error) {
      console.error("[DATABASE] Permanent inventory deletion failed:", error);
      return false;
    }
    return true;
  }
  // --- Resource Requests ---
  async getResourceRequests() {
    const { data, error } = await supabase.from("resource_requests").select("*, resource_request_items(*, store_inventory(name))").order("created_at", { ascending: false });
    if (error) {
      console.error("[DATABASE] Failed to fetch resource requests:", error);
      return [];
    }
    return data.map((req) => ({
      id: req.id,
      requesterId: req.requester_id,
      region: req.region,
      constituency: req.constituency,
      status: req.status,
      priority: req.priority,
      notes: req.notes,
      createdAt: req.created_at,
      items: (req.resource_request_items || []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.store_inventory?.name,
        quantity: item.quantity
      }))
    }));
  }
  async updateResourceRequestStatus(id, status) {
    const { error } = await supabase.from("resource_requests").update({ status, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to update request status:", error);
      return false;
    }
    return true;
  }
  async getLogisticsAudit(limit = 50) {
    try {
      const { data, error } = await supabase.from("logistics_audit").select("*, store_inventory(name)").order("timestamp", { ascending: false }).limit(limit);
      if (error) throw error;
      return (data || []).map((entry) => ({
        id: entry.id,
        requestId: entry.request_id,
        productId: entry.product_id,
        productName: entry.store_inventory?.name,
        action: entry.action,
        quantityChange: entry.quantity_change,
        sourceLocation: entry.source_location,
        destinationLocation: entry.destination_location,
        performedBy: entry.performed_by,
        notes: entry.notes,
        timestamp: entry.timestamp
      }));
    } catch (error) {
      console.error("[DATABASE] Failed to fetch logistics audit ledger:", error);
      return [];
    }
  }
  // --- Regional Data ---
  async getRegions() {
    const { data, error } = await supabase.from("ghana_regions").select(`
        id,
        name,
        ghana_constituencies (
          name
        )
      `).order("name", { ascending: true });
    if (error) {
      console.error("[DATABASE] Regional data fetch failed:", error);
      return this.getRegionsFallback();
    }
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      constituencies: (r.ghana_constituencies || []).map((c) => c.name)
    }));
  }
  async getConstituencies() {
    const { data, error } = await supabase.from("ghana_constituencies").select("name, region_id").order("name", { ascending: true });
    if (error) {
      console.error("[DATABASE] Constituencies fetch failed:", error);
      return { data: [] };
    }
    return { data: data || [] };
  }
  getRegionsFallback() {
    const ghanaRegions = [
      "Ahafo",
      "Ashanti",
      "Bono",
      "Bono East",
      "Central",
      "Eastern",
      "Greater Accra",
      "North East",
      "Northern",
      "Oti",
      "Savannah",
      "Upper East",
      "Upper West",
      "Volta",
      "Western",
      "Western North"
    ];
    return ghanaRegions.map((name, index) => ({
      id: index + 1,
      name,
      constituencies: []
    }));
  }
  async updateRegion(id, name) {
    const { error } = await supabase.from("ghana_regions").update({ name }).eq("id", id);
    if (error) {
      console.error("[DATABASE] Region update failed:", error);
      return false;
    }
    return true;
  }
  async deleteConstituency(id) {
    const { error } = await supabase.from("ghana_constituencies").delete().eq("id", id);
    if (error) {
      console.error("[DATABASE] Constituency deletion failed:", error);
      return false;
    }
    return true;
  }
  // --- Orders ---
  async getOrders(limit = 50) {
    try {
      const { data, error } = await supabase.from("store_orders").select(`
          *,
          store_order_items (
            id,
            order_id,
            product_id,
            quantity,
            price_at_purchase,
            created_at,
            store_inventory(name)
          )
        `).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return (data || []).map((o) => ({
        ...o,
        items: (o.store_order_items || []).map((item) => ({
          ...item,
          product_name: item.store_inventory?.name
        }))
      }));
    } catch (error) {
      console.error("[DATABASE] Failed to fetch orders:", error);
      return [];
    }
  }
  async getOrderById(orderId) {
    try {
      const { data, error } = await supabase.from("store_orders").select(`
          *,
          store_order_items (
            id,
            order_id,
            product_id,
            quantity,
            price_at_purchase,
            created_at,
            store_inventory(name)
          )
        `).eq("id", orderId).single();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        items: (data.store_order_items || []).map((item) => ({
          ...item,
          product_name: item.store_inventory?.name
        }))
      };
    } catch (error) {
      console.error("[DATABASE] Failed to fetch order by ID:", error);
      return null;
    }
  }
  async getOrderStats() {
    try {
      const { data, error } = await supabase.from("store_orders").select("status, total_amount, created_at, dispatched_at, delivered_at");
      if (error) throw error;
      const orders = data || [];
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const deliveredOrders = orders.filter((o) => o.status === "Delivered" && o.dispatched_at && o.delivered_at);
      let totalDays = 0;
      deliveredOrders.forEach((o) => {
        const start = new Date(o.dispatched_at).getTime();
        const end = new Date(o.delivered_at).getTime();
        totalDays += (end - start) / (1e3 * 60 * 60 * 24);
      });
      return {
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.status === "Pending").length,
        processingOrders: orders.filter((o) => o.status === "Processing").length,
        dispatchedOrders: orders.filter((o) => o.status === "Dispatched").length,
        deliveredOrders: orders.filter((o) => o.status === "Delivered").length,
        cancelledOrders: orders.filter((o) => o.status === "Cancelled").length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        revenueToday: orders.filter((o) => o.created_at?.slice(0, 10) === today).reduce((sum, o) => sum + (o.total_amount || 0), 0),
        avgDeliveryDays: deliveredOrders.length > 0 ? totalDays / deliveredOrders.length : 0
      };
    } catch (error) {
      console.error("[DATABASE] Failed to fetch order stats:", error);
      return {
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        dispatchedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        revenueToday: 0,
        avgDeliveryDays: 0
      };
    }
  }
  async updateOrderStatus(orderId, status) {
    try {
      const updates = { status, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (status === "Dispatched") {
        updates.dispatched_at = (/* @__PURE__ */ new Date()).toISOString();
      } else if (status === "Delivered") {
        updates.delivered_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      const { error: orderError } = await supabase.from("store_orders").update(updates).eq("id", orderId);
      if (orderError) throw orderError;
      if (status === "Dispatched") {
        const order = await this.getOrderById(orderId);
        if (order && order.items) {
          for (const item of order.items) {
            const { data: product } = await supabase.from("store_inventory").select("stock_quantity").eq("id", item.product_id).single();
            if (product) {
              const newStock = Math.max(0, product.stock_quantity - item.quantity);
              await supabase.from("store_inventory").update({ stock_quantity: newStock }).eq("id", item.product_id);
              await supabase.from("logistics_audit").insert({
                product_id: item.product_id,
                action: "DISPATCHED",
                quantity_change: -item.quantity,
                source_location: "Central Hub",
                performed_by: "System / Logistics Engine",
                notes: `Auto-deducted for Order #${orderId.slice(0, 8)}`,
                timestamp: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
          }
        }
      }
      return true;
    } catch (error) {
      console.error("[DATABASE] Order status update failed:", error);
      return false;
    }
  }
  async getLogisticsLatency() {
    try {
      const { data, error } = await supabase.from("logistics_velocity_operational metrics").select("region, avg_dispatch_hours, avg_delivery_hours, total_orders");
      if (error || !data) return [];
      return data.map((item) => {
        const totalHours = (item.avg_dispatch_hours || 0) + (item.avg_delivery_hours || 0);
        const avgDays = Number((totalHours / 24).toFixed(1));
        return {
          region: item.region,
          avgDispatchToDeliveryDays: avgDays || 0,
          totalDispatches: item.total_orders || 0,
          efficiency: avgDays < 3 && avgDays > 0 ? "High" : avgDays < 5 && avgDays > 0 ? "Medium" : "Low"
        };
      });
    } catch (error) {
      console.error("[DATABASE] Failed to fetch logistics latency:", error);
      return [];
    }
  }
  async getLogisticsVelocity() {
    try {
      const { data, error } = await supabase.from("logistics_velocity_operational metrics").select("*");
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch logistics velocity:", error);
      return [];
    }
  }
  async getRegionalAvailability(productId, region) {
    const remoteRegions = ["Upper West", "Upper East", "North East", "Savannah"];
    const isRemote = remoteRegions.includes(region);
    const isRestricted = productId.length % 7 === 0;
    if (isRemote && isRestricted) {
      return {
        available: false,
        message: `This item is currently out of stock for the ${region} region due to logistical constraints.`
      };
    }
    return {
      available: true,
      message: `Available for fulfillment in ${region}.`
    };
  }
  async getInventoryAlerts() {
    try {
      const { data: allItems, error: fetchError } = await supabase.from("store_inventory").select("id, name, stock_quantity, low_stock_threshold, category");
      if (fetchError) throw fetchError;
      return (allItems || []).filter(
        (item) => item.stock_quantity <= (item.low_stock_threshold || 10)
      );
    } catch (error) {
      console.error("[DATABASE] Failed to fetch inventory alerts:", error);
      return [];
    }
  }
  async replenishInventory() {
    try {
      const alerts = await this.getInventoryAlerts();
      if (alerts.length === 0) return true;
      for (const item of alerts) {
        const replenishedStock = (item.low_stock_threshold || 10) * 5;
        const { error } = await supabase.from("store_inventory").update({ stock_quantity: replenishedStock }).eq("id", item.id);
        if (error) throw error;
        await supabase.from("logistics_audit").insert({
          product_id: item.id,
          action: "REPLENISHED",
          quantity_change: replenishedStock - item.stock_quantity,
          source_location: "Central Hub",
          performed_by: "System / Logistics Engine",
          notes: "Automated bulk replenishment protocol",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      return true;
    } catch (error) {
      console.error("[DATABASE] Replenishment protocol failed:", error);
      return false;
    }
  }
}
const logisticsService = LogisticsService.getInstance();
class TacticalService {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!TacticalService.instance) {
      TacticalService.instance = new TacticalService();
    }
    return TacticalService.instance;
  }
  // --- Broadcasts & Notifications ---
  async getBroadcasts() {
    try {
      const { data, error } = await supabase.from("broadcasts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
      return [];
    }
  }
  async sendBroadcast(broadcast) {
    try {
      const user = authService.getUser();
      if (!user) return false;
      const { data: bData, error: bError } = await supabase.from("broadcasts").insert([{
        ...broadcast,
        sender_id: user.id
      }]).select().single();
      if (bError) throw bError;
      let memberQuery = supabase.from("users").select("id");
      if (broadcast.target_type === "REGION") {
        memberQuery = memberQuery.eq("region", broadcast.target_value);
      } else if (broadcast.target_type === "CONSTITUENCY") {
        memberQuery = memberQuery.eq("constituency", broadcast.target_value);
      }
      const { data: members, error: mError } = await memberQuery;
      if (mError) throw mError;
      if (members && members.length > 0) {
        const notifications = members.map((m) => ({
          user_id: m.id,
          broadcast_id: bData.id,
          title: broadcast.title,
          message: broadcast.content,
          type: broadcast.priority === "Urgent" ? "Alert" : "Info"
        }));
        const { error: nError } = await supabase.from("notifications").insert(notifications);
        if (nError) throw nError;
      }
      if (broadcast.priority === "Urgent") {
        supabase.functions.invoke("broadcast-dispatcher", {
          body: {
            broadcastId: bData.id,
            priority: broadcast.priority,
            targetType: broadcast.target_type,
            targetValue: broadcast.target_value
          }
        }).catch((err) => console.error("[EDGE] Dispatch trigger failed:", err));
      }
      return true;
    } catch (error) {
      console.error("Error sending broadcast:", error);
      return false;
    }
  }
  async getNotifications(userId) {
    try {
      const targetUserId = userId || authService.getUser()?.id;
      if (!targetUserId) return [];
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", targetUserId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }
  async markNotificationRead(id) {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }
  async getBroadcastMetrics(broadcastId) {
    try {
      const { count: total, error: tError } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("broadcast_id", broadcastId);
      if (tError) throw tError;
      const { count: read, error: rError } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("broadcast_id", broadcastId).eq("is_read", true);
      if (rError) throw rError;
      return { total: total || 0, read: read || 0 };
    } catch (error) {
      console.error("Error fetching broadcast metrics:", error);
      return { total: 0, read: 0 };
    }
  }
  // --- Leaderboard & Pulse ---
  async getLeaderboard(region) {
    try {
      let query = supabase.from("movement_leaderboard").select("full_name, total_points, region, national_rank, regional_rank").order("total_points", { ascending: false }).limit(10);
      if (region) {
        query = query.eq("region", region);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((entry, index) => ({
        name: entry.full_name,
        points: entry.total_points,
        region: entry.region,
        rank: region ? entry.regional_rank : entry.national_rank || index + 1
      }));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }
  async getMovementPulse() {
    try {
      const [leaderboardRes, chaptersRes, velocityRes] = await Promise.all([
        supabase.from("movement_leaderboard").select("total_points, region"),
        supabase.from("chapter_performance_operational metrics").select("*"),
        supabase.from("logistics_velocity_operational metrics").select("fulfillment_rate")
      ]);
      const leaderboard = leaderboardRes.data || [];
      const chapters = chaptersRes.data || [];
      const velocity = velocityRes.data || [];
      const totalPoints = leaderboard.reduce((sum, u) => sum + (u.total_points || 0), 0);
      const activeChapters = chapters.length;
      const regionalPulse = chapters.map((c) => ({
        name: `${c.chapter} (${c.region})`,
        growth: 0,
        activity: Math.round(c.aggregate_chapter_points / (c.total_patriots || 1) * 10) / 10,
        status: c.aggregate_chapter_points > 1e3 ? "Ascending" : "Stable"
      }));
      const regions = [...new Set(leaderboard.map((u) => u.region))];
      const regionalPoints = regions.map((r) => ({
        region: r,
        points: leaderboard.filter((u) => u.region === r).reduce((sum, u) => sum + (u.total_points || 0), 0)
      }));
      const topRegion = regionalPoints.sort((a, b) => b.points - a.points)[0]?.region || "N/A";
      const avgFulfillment = velocity.length > 0 ? velocity.reduce((sum, v) => sum + (v.fulfillment_rate || 0), 0) / velocity.length : 100;
      const growthRate = leaderboard.length > 0 ? (leaderboard.length / 50).toFixed(1) : "0.0";
      return {
        nationalGrowth: Number(growthRate) || 0,
        activeChapters,
        totalMobilizationPoints: totalPoints,
        topPerformingRegion: topRegion,
        logisticsHealth: Math.round(avgFulfillment),
        regionalPulse: regionalPulse.slice(0, 6)
      };
    } catch (error) {
      console.error("[DATABASE] Failed to fetch movement pulse:", error);
      return {
        nationalGrowth: 0,
        activeChapters: 0,
        totalMobilizationPoints: 0,
        topPerformingRegion: "N/A",
        logisticsHealth: 0,
        regionalPulse: []
      };
    }
  }
  // --- Milestones ---
  async getMilestones() {
    try {
      const { data, error } = await supabase.from("movement_milestones").select("*").order("target_date", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching milestones:", error);
      return [];
    }
  }
  async createMilestone(milestone) {
    try {
      const { error } = await supabase.from("movement_milestones").insert([milestone]);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error creating milestone:", error);
      return false;
    }
  }
  async updateMilestone(id, milestone) {
    try {
      const { error } = await supabase.from("movement_milestones").update(milestone).eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating milestone:", error);
      return false;
    }
  }
  async deleteMilestone(id) {
    try {
      const { error } = await supabase.from("movement_milestones").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting milestone:", error);
      return false;
    }
  }
  // --- Tactical Intelligence (AI/Mock) ---
  async verifyMemberID(memberId) {
    console.log(`[TACTICAL] Running biometric signature check for ID: ${memberId}`);
    const score = Math.floor(Math.random() * 40) + 60;
    const flagged = score < 75;
    return {
      confidence: score,
      matches: flagged ? ["Partial ID Mismatch", "Low Quality Photo"] : ["Face Match", "ID Valid", "No Prior Records"],
      flagged
    };
  }
}
const tacticalService = TacticalService.getInstance();
class ChapterService {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!ChapterService.instance) {
      ChapterService.instance = new ChapterService();
    }
    return ChapterService.instance;
  }
  async getChapters() {
    const { data, error } = await supabase.from("chapters").select("*").order("name", { ascending: true });
    if (error) {
      console.error("[DATABASE] Chapters Fetch Error:", error);
      return [];
    }
    return data.map((c) => ({
      id: c.id,
      name: c.name,
      city_or_region: c.city_or_region,
      country: c.country || "Ghana",
      leader_name: c.leader_name || "Unassigned",
      member_count: c.member_count || 0,
      status: c.status,
      description: c.description || void 0,
      details_url: c.details_url || void 0
    }));
  }
  async createChapter(chapter) {
    const { error } = await supabase.from("chapters").insert({
      name: chapter.name,
      city_or_region: chapter.city_or_region,
      country: chapter.country,
      leader_name: chapter.leader_name,
      member_count: chapter.member_count,
      status: chapter.status,
      description: chapter.description,
      details_url: chapter.details_url
    });
    if (error) {
      console.error("[DATABASE] Chapter creation failed:", error);
      return false;
    }
    return true;
  }
  async updateChapter(id, chapter) {
    const updateData = {};
    if (chapter.name) updateData.name = chapter.name;
    if (chapter.city_or_region) updateData.city_or_region = chapter.city_or_region;
    if (chapter.country) updateData.country = chapter.country;
    if (chapter.leader_name) updateData.leader_name = chapter.leader_name;
    if (chapter.status) updateData.status = chapter.status;
    if (chapter.member_count !== void 0) updateData.member_count = chapter.member_count;
    if (chapter.description) updateData.description = chapter.description;
    if (chapter.details_url) updateData.details_url = chapter.details_url;
    const { error } = await supabase.from("chapters").update(updateData).eq("id", id);
    if (error) {
      console.error("[DATABASE] Chapter update failed:", error);
      return false;
    }
    return true;
  }
  async deleteChapter(id) {
    const { error } = await supabase.from("chapters").delete().eq("id", id);
    if (error) {
      console.error("[DATABASE] Chapter deletion failed:", error);
      return false;
    }
    return true;
  }
  async incrementChapterMemberCount(chapterName) {
    const { data, error } = await supabase.from("chapters").select("id, member_count").eq("name", chapterName).single();
    if (data && !error) {
      await supabase.from("chapters").update({ member_count: (data.member_count || 0) + 1 }).eq("id", data.id);
    }
  }
  async getChapterApplications() {
    const { data, error } = await supabase.from("chapter_applications").select("*, users(full_name)").order("created_at", { ascending: false });
    if (error) {
      console.warn("[DATABASE] Failed to fetch chapter applications:", error);
      return [];
    }
    return (data || []).map((app) => ({
      id: app.id,
      applicant_id: app.applicant_id,
      applicant_name: app.users?.full_name,
      proposed_chapter_name: app.proposed_chapter_name,
      region: app.region,
      constituency: app.constituency,
      experience_summary: app.experience_summary,
      vision_statement: app.vision_statement,
      status: app.status,
      created_at: app.created_at
    }));
  }
  async submitChapterApplication(application) {
    const user = await authService.getUser();
    if (!user) return false;
    const { error } = await supabase.from("chapter_applications").insert({
      applicant_id: user.id,
      proposed_chapter_name: application.proposed_chapter_name,
      region: application.region,
      constituency: application.constituency,
      vision_statement: application.vision_statement,
      experience_summary: application.experience_summary,
      status: "Pending"
    });
    if (error) {
      console.error("[DATABASE] Chapter application submission failed:", error);
      return false;
    }
    return true;
  }
  async approveChapterApplication(applicationId, notes = "") {
    const user = await authService.getUser();
    if (!user) return false;
    const { error } = await supabase.rpc("approve_chapter_application", {
      app_id: applicationId,
      admin_uid: user.id,
      notes
    });
    if (error) {
      console.error("[DATABASE] Approval failed:", error);
      return false;
    }
    return true;
  }
  async getRegionalLeaderboard() {
    try {
      const { data, error } = await supabase.from("chapter_performance_operational metrics").select("*").order("regional_chapter_rank", { ascending: true });
      if (error) throw error;
      return (data || []).map((item) => ({
        region: item.region,
        chapter: item.chapter,
        total_patriots: item.total_patriots,
        total_mobilization_points: item.aggregate_chapter_points,
        achievements_unlocked: item.total_chapter_achievements,
        regional_rank: item.regional_chapter_rank
      }));
    } catch (error) {
      console.error("[DATABASE] Failed to fetch regional leaderboard:", error);
      return [];
    }
  }
}
const chapterService = ChapterService.getInstance();
class DonationService {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!DonationService.instance) {
      DonationService.instance = new DonationService();
    }
    return DonationService.instance;
  }
  async getDonations(status) {
    let query = supabase.from("donations").select("*, donation_campaigns(title)").order("created_at", { ascending: false });
    if (status && status !== "All") {
      query = query.eq("status", status);
    }
    const { data, error } = await query;
    if (error) {
      console.warn("[DATABASE] Failed to fetch donations:", error);
      return [];
    }
    return (data || []).map((d) => ({
      id: d.id,
      date: d.created_at,
      amount: d.amount.toString(),
      method: d.payment_method,
      status: d.status,
      reference: d.id.substring(0, 8),
      campaignTitle: d.donation_campaigns?.title,
      fullName: d.full_name,
      phone: d.phone,
      country: d.country,
      receiptUrl: d.receipt_url,
      campaignId: d.campaign_id,
      memberId: d.member_id
    }));
  }
  async getMobilizationLedger(limit = 20) {
    const { data, error } = await supabase.from("mobilization_ledger").select("*").order("timestamp", { ascending: false }).limit(limit);
    if (error) {
      console.warn("[DATABASE] Failed to fetch mobilization ledger:", error);
      return [];
    }
    return (data || []).map((d) => ({
      id: d.id.substring(0, 8).toUpperCase(),
      chapter: d.chapter,
      type: d.transaction_type,
      amount: `GHS ${Number(d.amount).toLocaleString()}`,
      description: d.description,
      category: d.category,
      date: new Date(d.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }));
  }
  async getPendingDonations() {
    return this.getDonations("Pending");
  }
  async getDonationStats() {
    const { data, error } = await supabase.from("donations").select("amount, status");
    if (error || !data) {
      return { totalContributions: 0, pendingCount: 0, approvedAmount: 0, flaggedCount: 0 };
    }
    return {
      totalContributions: data.length,
      pendingCount: data.filter((d) => d.status === "Pending").length,
      approvedAmount: data.filter((d) => d.status === "Verified").reduce((sum, d) => sum + Number(d.amount), 0),
      flaggedCount: data.filter((d) => d.status === "Rejected").length
      // We'll map Rejected to Flagged for now
    };
  }
  async verifyDonation(donationId, status, notes = "") {
    const user = await authService.getUser();
    if (!user) return false;
    const { error } = await supabase.rpc("verify_donation_record", {
      donation_id: donationId,
      admin_uid: user.id,
      verification_status: status,
      notes
    });
    if (error) {
      console.error("[DATABASE] Verification failed:", error);
      return false;
    }
    return true;
  }
  async getPublicDonationFeed(limit = 10) {
    const { data, error } = await supabase.from("donations").select("*, donation_campaigns(title)").eq("status", "Verified").order("created_at", { ascending: false }).limit(limit);
    if (error) {
      console.warn("[DATABASE] Failed to fetch public donation feed:", error);
      return [];
    }
    return (data || []).map((d) => ({
      id: d.id,
      date: d.created_at,
      amount: d.amount.toString(),
      method: d.payment_method,
      status: d.status,
      reference: d.id.substring(0, 8),
      campaignTitle: d.donation_campaigns?.title,
      fullName: d.show_on_dashboard ? d.full_name : "Anonymous Patriot",
      phone: "",
      // Redacted for public feed
      country: "",
      receiptUrl: "",
      campaignId: "",
      memberId: ""
    }));
  }
  async getMemberDonations(phone) {
    const { data, error } = await supabase.from("donations").select("*, donation_campaigns(title)").eq("phone", phone).order("created_at", { ascending: false });
    if (error) {
      console.warn("[DATABASE] Failed to fetch member donations:", error);
      return [];
    }
    return (data || []).map((d) => ({
      id: d.id,
      date: d.created_at,
      amount: d.amount.toString(),
      method: d.payment_method,
      status: d.status,
      reference: d.id.substring(0, 8),
      campaignTitle: d.donation_campaigns?.title,
      fullName: d.full_name,
      phone: d.phone,
      country: d.country,
      receiptUrl: d.receipt_url,
      campaignId: d.campaign_id,
      memberId: d.member_id
    }));
  }
  subscribeToPublicDonations(callback) {
    const channelId = `public_donations_${Math.random().toString(36).substring(2, 9)}`;
    return supabase.channel(channelId).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "donations",
        filter: "status=eq.Verified"
      },
      async (payload) => {
        const { data, error } = await supabase.from("donations").select("*, donation_campaigns(title)").eq("id", payload.new.id).single();
        if (!error && data) {
          callback({
            id: data.id,
            date: data.created_at,
            amount: data.amount.toString(),
            method: data.payment_method,
            status: data.status,
            reference: data.id.substring(0, 8),
            campaignTitle: data.donation_campaigns?.title,
            fullName: data.show_on_dashboard ? data.full_name : "Anonymous Patriot",
            phone: "",
            country: "",
            receiptUrl: "",
            campaignId: "",
            memberId: ""
          });
        }
      }
    ).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "donations",
        filter: "status=eq.Verified"
      },
      async (payload) => {
        const { data, error } = await supabase.from("donations").select("*, donation_campaigns(title)").eq("id", payload.new.id).single();
        if (!error && data) {
          callback({
            id: data.id,
            date: data.created_at,
            amount: data.amount.toString(),
            method: data.payment_method,
            status: data.status,
            reference: data.id.substring(0, 8),
            campaignTitle: data.donation_campaigns?.title,
            fullName: data.show_on_dashboard ? data.full_name : "Anonymous Patriot",
            phone: "",
            country: "",
            receiptUrl: "",
            campaignId: "",
            memberId: ""
          });
        }
      }
    ).subscribe();
  }
}
const donationService = DonationService.getInstance();
const branding = ["/branding/logo.png", "/branding/favicon.ico"];
const publicAssets = ["/branding/base-banner-image.png", "/branding/founder-image.jpg", "/branding/hero-background-image.png", "/branding/og-image.png", "/branding/party-headquarters-image.webp", "/branding/twitter-card.png"];
const mediaManifest = {
  branding,
  publicAssets
};
class ContentService {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }
  async getBlogPosts() {
    const { data, error } = await supabase.from("blog_posts").select("*").is("deleted_at", null).order("published_at", { ascending: false });
    if (error) {
      console.warn("[DATABASE] Failed to fetch blog posts:", error);
      return [];
    }
    return (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      authorId: p.author_id,
      authorName: p.author_name || "Admin",
      authorRole: p.author_role,
      authorImage: p.author_image,
      authorBio: p.author_bio,
      category: p.category,
      imageUrl: p.image_url,
      readTime: p.read_time,
      isFeatured: p.is_featured,
      publishedAt: p.published_at,
      status: p.status || "Published",
      tags: p.tags || [],
      seoTitle: p.seo_title,
      metaDescription: p.meta_description
    }));
  }
  async getBlogPostBySlug(slug) {
    const { data, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).is("deleted_at", null).maybeSingle();
    if (error) {
      console.error("[DATABASE] Failed to fetch blog post by slug:", error);
      return null;
    }
    if (!data) {
      console.warn(`[DATABASE] No blog post found for slug: "${slug}"`);
      return null;
    }
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      authorId: data.author_id,
      authorName: data.author_name || "Admin",
      authorRole: data.author_role,
      authorImage: data.author_image,
      authorBio: data.author_bio,
      category: data.category,
      imageUrl: data.image_url,
      readTime: data.read_time,
      isFeatured: data.is_featured,
      publishedAt: data.published_at,
      status: data.status || "Published",
      tags: data.tags || [],
      seoTitle: data.seo_title,
      metaDescription: data.meta_description
    };
  }
  async createBlogPost(post) {
    const { error } = await supabase.from("blog_posts").insert({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author_id: post.authorId,
      author_name: post.authorName,
      author_role: post.authorRole,
      author_image: post.authorImage,
      author_bio: post.authorBio,
      category: post.category,
      image_url: post.imageUrl || null,
      read_time: post.readTime,
      is_featured: post.isFeatured,
      published_at: post.publishedAt,
      status: post.status || "Draft",
      tags: post.tags,
      seo_title: post.seoTitle || null,
      meta_description: post.metaDescription || null
    });
    if (error) {
      console.error("[DATABASE] Blog post creation failed:", error);
      return false;
    }
    return true;
  }
  async updateBlogPost(id, post) {
    const updateData = {};
    if (post.title) updateData.title = post.title;
    if (post.slug) updateData.slug = post.slug;
    if (post.excerpt) updateData.excerpt = post.excerpt;
    if (post.content) updateData.content = post.content;
    if (post.category) updateData.category = post.category;
    if (post.imageUrl !== void 0) updateData.image_url = post.imageUrl;
    if (post.authorName !== void 0) updateData.author_name = post.authorName;
    if (post.authorRole !== void 0) updateData.author_role = post.authorRole;
    if (post.authorImage !== void 0) updateData.author_image = post.authorImage;
    if (post.authorBio !== void 0) updateData.author_bio = post.authorBio;
    if (post.readTime) updateData.read_time = post.readTime;
    if (post.isFeatured !== void 0) updateData.is_featured = post.isFeatured;
    if (post.publishedAt) updateData.published_at = post.publishedAt;
    if (post.status) updateData.status = post.status;
    if (post.tags) updateData.tags = post.tags;
    if (post.seoTitle !== void 0) updateData.seo_title = post.seoTitle;
    if (post.metaDescription !== void 0) updateData.meta_description = post.metaDescription;
    const { error } = await supabase.from("blog_posts").update(updateData).eq("id", id);
    if (error) {
      console.error("[DATABASE] Blog post update failed:", error);
      return false;
    }
    return true;
  }
  async deleteBlogPost(id) {
    const { error } = await supabase.from("blog_posts").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    if (error) {
      console.error("[DATABASE] Blog post soft deletion failed:", error);
      return false;
    }
    return true;
  }
  async getTrashedBlogPosts() {
    const { data, error } = await supabase.from("blog_posts").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (error) {
      console.warn("[DATABASE] Failed to fetch trashed posts:", error);
      return [];
    }
    return (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      authorId: p.author_id,
      authorName: p.author_name || "Admin",
      category: p.category,
      imageUrl: p.image_url,
      readTime: p.read_time,
      isFeatured: p.is_featured,
      publishedAt: p.published_at,
      status: p.status || "Published",
      deletedAt: p.deleted_at,
      tags: p.tags || []
    }));
  }
  async restoreBlogPost(id) {
    const { error } = await supabase.from("blog_posts").update({ deleted_at: null }).eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to restore blog post:", error);
      return false;
    }
    return true;
  }
  async permanentlyDeleteBlogPost(id) {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) {
      console.error("[DATABASE] Permanent blog post deletion failed:", error);
      return false;
    }
    return true;
  }
  // --- Media Operations ---
  async uploadImage(file, path) {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("media").upload(filePath, file);
      if (uploadError) {
        console.error("[STORAGE] Upload failed:", uploadError);
        return null;
      }
      await supabase.from("media_library").insert({
        filename: file.name,
        url: `${supabase.storage.from("media").getPublicUrl(filePath).data.publicUrl}`,
        folder: path,
        size_bytes: file.size,
        mime_type: file.type
      });
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(filePath);
      return publicUrl;
    } catch (err) {
      console.error("[STORAGE] Unexpected error during upload:", err);
      return null;
    }
  }
  async getMediaFiles(path) {
    const { data, error } = await supabase.from("media_library").select("url").eq("folder", path).is("deleted_at", null).order("created_at", { ascending: false });
    if (error) {
      console.error("[DATABASE] Failed to fetch media from library:", error);
      return this.getMediaFilesFromStorage(path);
    }
    return (data || []).map((item) => item.url);
  }
  async getMediaFilesFromStorage(path) {
    const { data, error } = await supabase.storage.from("media").list(path);
    if (error) {
      console.error("[STORAGE] Failed to list media files:", error);
      return [];
    }
    return (data || []).map((file) => {
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(`${path}/${file.name}`);
      return publicUrl;
    });
  }
  async deleteMediaFile(url) {
    const { error } = await supabase.from("media_library").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("url", url);
    if (error) {
      console.error("[DATABASE] Media soft deletion failed:", error);
      return false;
    }
    return true;
  }
  async getTrashedMedia() {
    const { data, error } = await supabase.from("media_library").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (error) {
      console.error("[DATABASE] Failed to fetch trashed media:", error);
      return [];
    }
    return data || [];
  }
  async restoreMediaFile(url) {
    const { error } = await supabase.from("media_library").update({ deleted_at: null }).eq("url", url);
    if (error) {
      console.error("[DATABASE] Failed to restore media file:", error);
      return false;
    }
    return true;
  }
  async permanentlyDeleteMediaFile(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const mediaIdx = pathParts.indexOf("media");
      const storagePath = pathParts.slice(mediaIdx + 1).join("/");
      const { error: storageError } = await supabase.storage.from("media").remove([storagePath]);
      if (storageError) {
        console.warn("[STORAGE] Failed to remove file from storage, proceeding with DB cleanup:", storageError);
      }
      const { error: dbError } = await supabase.from("media_library").delete().eq("url", url);
      if (dbError) {
        console.error("[DATABASE] Permanent media deletion failed:", dbError);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[SERVICE] Unexpected error in permanent deletion:", err);
      return false;
    }
  }
  async getLocalAssets(category) {
    switch (category) {
      case "logos-favicons":
        return mediaManifest.branding || [];
      case "public-assets":
        return mediaManifest.publicAssets || [];
      default:
        return [];
    }
  }
  // --- Authors Management ---
  async getAuthors() {
    const { data, error } = await supabase.from("authors").select("*").is("deleted_at", null).order("name", { ascending: true });
    if (error) {
      console.error("[DATABASE] Failed to fetch authors:", error);
      return [];
    }
    return (data || []).map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      role: a.role,
      bio: a.bio,
      imageUrl: a.image_url,
      createdAt: a.created_at,
      deletedAt: a.deleted_at
    }));
  }
  async getAuthorById(id) {
    const { data, error } = await supabase.from("authors").select("*").eq("id", id).maybeSingle();
    if (error) {
      console.error("[DATABASE] Failed to fetch author:", error);
      return null;
    }
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      role: data.role,
      bio: data.bio,
      imageUrl: data.image_url,
      createdAt: data.created_at,
      deletedAt: data.deleted_at
    };
  }
  async createAuthor(author) {
    const { error } = await supabase.from("authors").insert({
      name: author.name,
      slug: author.slug,
      role: author.role,
      bio: author.bio,
      image_url: author.imageUrl
    });
    if (error) {
      console.error("[DATABASE] Failed to create author:", error);
      return false;
    }
    const adminId = localStorage.getItem("adminId") || "hq-system-admin";
    await adminService.logAction("Create Author", "AUTHORS", "Success", { name: author.name, adminId });
    return true;
  }
  async updateAuthor(id, author) {
    const updateData = {};
    if (author.name !== void 0) updateData.name = author.name;
    if (author.slug !== void 0) updateData.slug = author.slug;
    if (author.role !== void 0) updateData.role = author.role;
    if (author.bio !== void 0) updateData.bio = author.bio;
    if (author.imageUrl !== void 0) updateData.image_url = author.imageUrl;
    const { error } = await supabase.from("authors").update(updateData).eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to update author:", error);
      return false;
    }
    const adminId = localStorage.getItem("adminId") || "hq-system-admin";
    await adminService.logAction("Update Author", "AUTHORS", "Success", { id, adminId });
    return true;
  }
  async deleteAuthor(id) {
    const { error } = await supabase.from("authors").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to soft-delete author:", error);
      return false;
    }
    const adminId = localStorage.getItem("adminId") || "hq-system-admin";
    await adminService.logAction("Trash Author", "AUTHORS", "Success", { id, adminId });
    return true;
  }
  async getTrashedAuthors() {
    const { data, error } = await supabase.from("authors").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (error) {
      console.error("[DATABASE] Failed to fetch trashed authors:", error);
      return [];
    }
    return (data || []).map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      role: a.role,
      bio: a.bio,
      imageUrl: a.image_url,
      createdAt: a.created_at,
      deletedAt: a.deleted_at
    }));
  }
  async restoreAuthor(id) {
    const { error } = await supabase.from("authors").update({ deleted_at: null }).eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to restore author:", error);
      return false;
    }
    const adminId = localStorage.getItem("adminId") || "hq-system-admin";
    await adminService.logAction("Restore Author", "AUTHORS", "Success", { id, adminId });
    return true;
  }
  async permanentlyDeleteAuthor(id) {
    const { error } = await supabase.from("authors").delete().eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to permanently delete author:", error);
      return false;
    }
    const adminId = localStorage.getItem("adminId") || "hq-system-admin";
    await adminService.logAction("Delete Author", "AUTHORS", "Success", { id, adminId });
    return true;
  }
  // --- Press Release Operations ---
  async getPressReleases() {
    const { data, error } = await supabase.from("press_releases").select("*").is("deleted_at", null).order("published_at", { ascending: false });
    if (error) {
      console.warn("[DATABASE] Failed to fetch press releases:", error);
      return [];
    }
    return (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      category: p.category,
      excerpt: p.excerpt,
      content: p.content,
      publishedAt: p.published_at,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      authorId: p.author_id,
      imageUrl: p.image_url,
      isOfficial: p.is_official
    }));
  }
  async createPressRelease(release) {
    const { error } = await supabase.from("press_releases").insert({
      title: release.title,
      slug: release.slug,
      category: release.category,
      excerpt: release.excerpt,
      content: release.content,
      published_at: release.publishedAt,
      author_id: release.authorId,
      image_url: release.imageUrl,
      is_official: release.isOfficial
    });
    if (error) {
      console.error("[DATABASE] Press release creation failed:", error);
      return false;
    }
    return true;
  }
  // --- Media Kit Operations ---
  async getMediaKitAssets() {
    const { data, error } = await supabase.from("media_kit").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (error) {
      console.warn("[DATABASE] Failed to fetch media kit assets:", error);
      return [];
    }
    return (data || []).map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      fileUrl: a.file_url,
      fileType: a.file_type,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      isActive: a.is_active
    }));
  }
}
const contentService = ContentService.getInstance();
class GamificationService {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }
  async getAchievements() {
    try {
      const { data, error } = await supabase.from("achievements").select("*");
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch achievements:", error);
      return [];
    }
  }
  async getMemberAchievements(userId) {
    try {
      const { data, error } = await supabase.from("member_achievements").select("achievement_id, achievements(*)").eq("user_id", userId);
      if (error) throw error;
      return (data || []).map((item) => item.achievements);
    } catch (error) {
      console.error("[DATABASE] Failed to fetch member achievements:", error);
      return [];
    }
  }
  async getMemberPoints(userId) {
    try {
      const { data, error } = await supabase.from("member_points").select("points").eq("user_id", userId);
      if (error) throw error;
      return (data || []).reduce((acc, curr) => acc + curr.points, 0);
    } catch (error) {
      console.error("[DATABASE] Failed to fetch member points:", error);
      return 0;
    }
  }
  async getMobilizationLedger(chapterName) {
    try {
      let query = supabase.from("mobilization_ledger").select("*");
      if (chapterName) query = query.eq("chapter", chapterName);
      const { data, error } = await query.order("timestamp", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch mobilization ledger:", error);
      return [];
    }
  }
}
const gamificationService = GamificationService.getInstance();
class IntelligenceService {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!IntelligenceService.instance) {
      IntelligenceService.instance = new IntelligenceService();
    }
    return IntelligenceService.instance;
  }
  // --- Field Operations ---
  async getFieldEvents(chapterName) {
    try {
      let query = supabase.from("field_events").select("*");
      if (chapterName) query = query.eq("chapter", chapterName);
      const { data, error } = await query.order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch field events:", error);
      return [];
    }
  }
  async updateFieldEvent(eventId, updates) {
    try {
      const { error } = await supabase.from("field_events").update(updates).eq("id", eventId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Failed to update field event:", error);
      return false;
    }
  }
  async getFieldDirectives() {
    try {
      const { data, error } = await supabase.from("field_directives").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch field directives:", error);
      return [];
    }
  }
  async createFieldDirective(directive) {
    try {
      const { error } = await supabase.from("field_directives").insert([directive]);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Failed to create field directive:", error);
      return false;
    }
  }
  async getFieldReports(directiveId) {
    try {
      let query = supabase.from("field_reports").select("*");
      if (directiveId) query = query.eq("directive_id", directiveId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch field reports:", error);
      return [];
    }
  }
  async verifyFieldReport(reportId, status) {
    try {
      const { error } = await supabase.from("field_reports").update({ status }).eq("id", reportId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Failed to verify field report:", error);
      return false;
    }
  }
  async getFieldActions() {
    try {
      const { data, error } = await supabase.from("field_actions").select("*, field_action_attendance(count)").order("start_time", { ascending: false });
      if (error) throw error;
      return (data || []).map((action) => ({
        ...action,
        actual_attendance: action.field_action_attendance?.[0]?.count || 0
      }));
    } catch (error) {
      console.error("[DATABASE] Failed to fetch field actions:", error);
      return [];
    }
  }
  async getFieldActionAttendance(actionId) {
    try {
      const { data, error } = await supabase.from("field_action_attendance").select("*, users(full_name)").eq("action_id", actionId);
      if (error) throw error;
      return (data || []).map((item) => ({
        ...item,
        user_name: item.users?.full_name
      }));
    } catch (error) {
      console.error("[DATABASE] Failed to fetch rally attendance:", error);
      return [];
    }
  }
  async createFieldAction(action) {
    try {
      const { error } = await supabase.from("field_actions").insert([action]);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Failed to create field action:", error);
      return false;
    }
  }
  async verifyRallyAttendance(attendanceId) {
    try {
      const { error } = await supabase.from("field_action_attendance").update({ is_verified: true }).eq("id", attendanceId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Failed to verify rally attendance:", error);
      return false;
    }
  }
  // --- Sentiment & Projections ---
  async getMemberFeedback() {
    try {
      const { data, error } = await supabase.from("member_feedback").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch member feedback:", error);
      return [];
    }
  }
  async getSentimentIntelligence() {
    try {
      const { data, error } = await supabase.from("national_sentiment_intelligence").select("*").order("avg_sentiment", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch sentiment operational metrics:", error);
      return [];
    }
  }
  async getImpactProjections() {
    try {
      const { data, error } = await supabase.from("predictive_impact_projections").select("*").order("projected_reach_30d", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch impact projections:", error);
      return [];
    }
  }
  async submitMemberFeedback(feedback) {
    try {
      const { error } = await supabase.from("member_feedback").insert([feedback]);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Failed to submit member feedback:", error);
      return false;
    }
  }
  // --- Rapid Response ---
  async getRapidResponseDirectives() {
    try {
      const { data, error } = await supabase.from("rapid_response_directives").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch rapid response directives:", error);
      return [];
    }
  }
  async createRapidResponseDirective(directive) {
    try {
      const { error } = await supabase.from("rapid_response_directives").insert([directive]);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Failed to create rapid response directive:", error);
      return false;
    }
  }
  async getCrisisIncidents() {
    try {
      const { data, error } = await supabase.from("crisis_incidents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch crisis incidents:", error);
      return [];
    }
  }
  async getMediaCounterNarratives(crisisId) {
    try {
      let query = supabase.from("media_counter_narratives").select("*").order("created_at", { ascending: false });
      if (crisisId) {
        query = query.eq("crisis_id", crisisId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch counter narratives:", error);
      return [];
    }
  }
  // --- Ground Game ---
  async getVoterRegistrations() {
    try {
      const { data, error } = await supabase.from("voter_registrations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch voter registrations:", error);
      return [];
    }
  }
  async getCanvassingCampaigns() {
    try {
      const { data, error } = await supabase.from("canvassing_campaigns").select("*").order("start_date", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch canvassing campaigns:", error);
      return [];
    }
  }
  async getCanvasserLogs(campaignId) {
    try {
      let query = supabase.from("canvasser_logs").select("*").order("created_at", { ascending: false });
      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch canvasser logs:", error);
      return [];
    }
  }
  async getGOTVTransportRequests() {
    try {
      const { data, error } = await supabase.from("gotv_transport_requests").select("*").order("requested_time", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch GOTV transport requests:", error);
      return [];
    }
  }
  async getGhanaRegions() {
    try {
      const { data, error } = await supabase.from("ghana_regions").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch regions:", error);
      return [];
    }
  }
  async getGhanaConstituencies(regionId) {
    try {
      let query = supabase.from("ghana_constituencies").select("*").order("name", { ascending: true });
      if (regionId) query = query.eq("region_id", regionId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[DATABASE] Failed to fetch constituencies:", error);
      return [];
    }
  }
  async updateTransportRequest(requestId, status) {
    try {
      const { error } = await supabase.from("gotv_transport_requests").update({ status }).eq("id", requestId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Failed to update transport request:", error);
      return false;
    }
  }
  async createCanvassingCampaign(campaign) {
    try {
      const { error } = await supabase.from("canvassing_campaigns").insert([campaign]);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Failed to create canvassing campaign:", error);
      return false;
    }
  }
}
const intelligenceService = IntelligenceService.getInstance();
class PollService {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!PollService.instance) {
      PollService.instance = new PollService();
    }
    return PollService.instance;
  }
  async getPolls() {
    const { data, error } = await supabase.from("polls").select(`
        *,
        poll_options (*)
      `).order("created_at", { ascending: false });
    if (error) {
      console.warn("[DATABASE] Failed to fetch polls:", error);
      return [];
    }
    return (data || []).map((p) => {
      const rawOptions = p.poll_options || [];
      return {
        id: p.id,
        question: p.question,
        status: p.status,
        totalVotes: p.total_votes || 0,
        region: p.region || "National",
        category: p.category || "General",
        endDate: p.end_date || "N/A",
        options: rawOptions.map((o) => ({
          id: o.id,
          label: o.label,
          votes: o.votes || 0
        }))
      };
    });
  }
  async createPoll(poll) {
    try {
      const { data: pollData, error: pollError } = await supabase.from("polls").insert({
        question: poll.question,
        region: poll.region,
        status: poll.status,
        end_date: poll.endDate,
        total_votes: 0
      }).select().single();
      if (pollError) throw pollError;
      const optionInserts = poll.options.map((opt) => ({
        poll_id: pollData.id,
        label: opt,
        votes: 0
      }));
      const { error: optionsError } = await supabase.from("poll_options").insert(optionInserts);
      if (optionsError) throw optionsError;
      return pollData.id;
    } catch (err) {
      console.error("[DATABASE] Failed to create poll:", err);
      return null;
    }
  }
  async deletePoll(id) {
    const { error } = await supabase.from("polls").delete().eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to delete poll:", error);
      return false;
    }
    return true;
  }
  async voteInPoll(pollId, optionId) {
    try {
      const { data: optionData } = await supabase.from("poll_options").select("votes").eq("id", optionId).single();
      const { data: pollData } = await supabase.from("polls").select("total_votes").eq("id", pollId).single();
      const { error: optError } = await supabase.from("poll_options").update({ votes: (optionData?.votes || 0) + 1 }).eq("id", optionId);
      if (optError) throw optError;
      const { error: pollError } = await supabase.from("polls").update({ total_votes: (pollData?.total_votes || 0) + 1 }).eq("id", pollId);
      if (pollError) throw pollError;
      return true;
    } catch (err) {
      console.error("[DATABASE] Vote submission failed:", err);
      return false;
    }
  }
  async getPollStats() {
    const [pollsRes, usersRes, sentimentRes] = await Promise.all([
      supabase.from("polls").select("total_votes, status"),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("national_sentiment_intelligence").select("avg_sentiment")
    ]);
    const pollsData = pollsRes.data || [];
    const totalUsers = usersRes.count || 1;
    const sentimentData = sentimentRes.data || [];
    const totalVotes = pollsData.reduce((sum, p) => sum + (p.total_votes || 0), 0);
    const activeCount = pollsData.filter((p) => p.status === "Active").length;
    const feedbackRate = Math.round(totalVotes / totalUsers * 10) / 10;
    const avgScore = sentimentData.length > 0 ? sentimentData.reduce((sum, s) => sum + (Number(s.avg_sentiment) || 0), 0) / sentimentData.length : 0.78;
    return {
      totalEngagements: totalVotes > 1e3 ? `${(totalVotes / 1e3).toFixed(1)}k` : totalVotes.toString(),
      activePolls: activeCount,
      avgResponseTime: "4.2m",
      feedbackRate: `${Math.min(feedbackRate * 10, 100)}%`,
      nationalSentimentScore: Math.round((avgScore + 1) * 50)
      // Scale -1.0..1.0 to 0..100
    };
  }
  async getGhanaRegions() {
    const { data, error } = await supabase.from("ghana_regions").select("id, name").order("name", { ascending: true });
    if (error) {
      console.error("[DATABASE] Failed to fetch Ghana regions:", error);
      return [];
    }
    return data || [];
  }
  async getCountries() {
    const { data, error } = await supabase.from("countries").select("id, name").order("name", { ascending: true });
    if (error) {
      console.error("[DATABASE] Failed to fetch countries:", error);
      return [];
    }
    return data || [];
  }
}
const pollService = PollService.getInstance();
class AuditService {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }
  async logAction(action, resource, status = "Success", details) {
    const user = authService.getUser();
    try {
      await supabase.from("audit_logs").insert({
        action,
        resource,
        status,
        metadata: details,
        admin_id: user?.id
      });
    } catch (error) {
      console.error("[DATABASE] Failed to persist log:", error);
    }
  }
  async getSystemAuditLogs() {
    const { data, error } = await supabase.from("audit_logs").select(`
        *,
        admins!fk_admin_id (
          users!admins_id_fkey (
            full_name
          )
        )
      `).order("timestamp", { ascending: false }).limit(100);
    if (error || !Array.isArray(data)) {
      console.warn("[DATABASE] Audit logs fetch failed:", error);
      return [];
    }
    return data.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      adminId: log.admin_id || "SYS",
      adminName: log.admins?.users?.full_name || (log.admin_id ? "Authorized Officer" : "National HQ"),
      action: log.action,
      resource: log.resource,
      status: log.status,
      details: log.metadata
    }));
  }
  async getAuditLogsForResource(resourceId) {
    const { data, error } = await supabase.from("audit_logs").select(`
        *,
        admins!fk_admin_id (
          users!admins_id_fkey (
            full_name
          )
        )
      `).eq("resource", resourceId).order("timestamp", { ascending: false });
    if (error || !Array.isArray(data)) {
      console.warn("[DATABASE] Resource audit fetch failed:", error);
      return [];
    }
    return data.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      adminId: log.admin_id || "SYS",
      adminName: log.admins?.users?.full_name || (log.admin_id ? "Authorized Officer" : "National HQ"),
      action: log.action,
      resource: log.resource,
      status: log.status,
      details: log.metadata
    }));
  }
  async getActivityLogs() {
    const logs = await this.getSystemAuditLogs();
    return logs.slice(0, 10).map((log, index) => ({
      id: index,
      type: log.resource.toLowerCase().includes("member") ? "registration" : "security",
      user: log.adminName,
      time: new Date(log.timestamp).toLocaleTimeString(),
      details: `${log.action} on ${log.resource}`,
      icon: log.status === "Success" ? "✓" : "!",
      color: log.status === "Success" ? "var(--brand-green)" : "var(--brand-gold)"
    }));
  }
}
const auditService = AuditService.getInstance();
class AdminService {
  static instance;
  currentUser = null;
  constructor() {
  }
  static getInstance() {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }
  async initialize() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        this.currentUser = null;
        return null;
      }
      const adminData = await this.getAdminData(user.id);
      this.currentUser = adminData;
      return adminData;
    } catch (error) {
      console.error("[ADMIN SERVICE] Initialization failed:", error);
      this.currentUser = null;
      return null;
    }
  }
  can(action, resource) {
    if (!authService.isAuthenticated()) return false;
    if (!this.currentUser) return false;
    if (this.currentUser.role === "SUPER_ADMIN" || this.currentUser.role === "FOUNDER") return true;
    return this.currentUser.permissions.some((p) => p.action === action && p.resource === resource);
  }
  getCurrentUser() {
    if (!authService.isAuthenticated()) return null;
    return this.currentUser;
  }
  // --- Audit Log ---
  async logAction(action, resource, status = "Success", details) {
    return auditService.logAction(action, resource, status, details);
  }
  // --- Member Operations ---
  async getMembers() {
    return memberService.getMembers();
  }
  async searchMembers(query) {
    return memberService.searchMembers(query);
  }
  async getAdministrators() {
    return memberService.getAdministrators();
  }
  async provisionAdministrator(id, role, permissions) {
    const { error } = await supabase.from("admins").insert([{ id, role, permissions }]);
    if (error) {
      console.error("[ADMIN SERVICE] Provisioning failed:", error);
      return false;
    }
    await this.logAction("ADMIN_PROVISION", `ADMINS/${id}`, "Success", { role });
    return true;
  }
  async revokeAdministrator(id) {
    const { error } = await supabase.from("admins").delete().eq("id", id);
    if (error) {
      console.error("[ADMIN SERVICE] Revocation failed:", error);
      return false;
    }
    await this.logAction("ADMIN_REVOKE", `ADMINS/${id}`, "Warning");
    return true;
  }
  async getMemberProfile(regNo) {
    return memberService.getMemberProfile(regNo);
  }
  async getGrowthStats() {
    return memberService.getGrowthStats();
  }
  async updateMemberProfile(regNo, profile) {
    return memberService.updateMemberProfile(regNo, profile);
  }
  async getPendingVerifications() {
    return memberService.getPendingVerifications();
  }
  async verifyMember(id, approve, reason, chapterName) {
    const success = await memberService.verifyMember(id, approve, reason, chapterName);
    if (success) {
      await this.logAction(
        approve ? "VERIFY_MEMBER_APPROVE" : "VERIFY_MEMBER_REJECT",
        `MEMBERS/${id}`,
        approve ? "Success" : "Warning",
        { reason, chapter: chapterName }
      );
      if (approve && chapterName) {
        await this.incrementChapterMemberCount(chapterName);
      }
    }
    return success;
  }
  async getCountries() {
    return memberService.getCountries();
  }
  async deleteMember(id) {
    const success = await memberService.deleteMember(id);
    if (success) {
      await this.logAction("DELETE_MEMBER", `MEMBERS/${id}`, "Warning");
    }
    return success;
  }
  // --- Chapter Operations ---
  async getChapters() {
    return chapterService.getChapters();
  }
  async createChapter(chapter) {
    const success = await chapterService.createChapter(chapter);
    if (success) {
      await this.logAction("CHAPTER_CREATE", `CHAPTERS/${chapter.name}`, "Success");
    }
    return success;
  }
  async updateChapter(id, chapter) {
    const success = await chapterService.updateChapter(id, chapter);
    if (success) {
      await this.logAction("CHAPTER_UPDATE", `CHAPTERS/${id}`, "Success", chapter);
    }
    return success;
  }
  async deleteChapter(id, name) {
    const success = await chapterService.deleteChapter(id);
    if (success) {
      await this.logAction("CHAPTER_DELETE", `CHAPTERS/${name}`, "Warning");
    }
    return success;
  }
  async incrementChapterMemberCount(chapterName) {
    return chapterService.incrementChapterMemberCount(chapterName);
  }
  // --- Poll Operations ---
  async getPolls() {
    return pollService.getPolls();
  }
  async getDonationCampaigns(status) {
    let query = supabase.from("donation_campaigns").select("*").order("created_at", { ascending: false });
    if (status) {
      query = query.eq("status", status);
    }
    const { data, error } = await query;
    if (error) {
      console.warn("[DATABASE] Failed to fetch campaigns:", error);
      return [];
    }
    return (data || []).map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      targetAmount: Number(c.target_amount),
      raisedAmount: Number(c.raised_amount),
      endDate: c.end_date,
      status: c.status,
      imageUrl: c.image_url
    }));
  }
  async createDonationCampaign(campaign) {
    const { error } = await supabase.from("donation_campaigns").insert({
      title: campaign.title,
      description: campaign.description,
      target_amount: campaign.targetAmount,
      end_date: campaign.endDate,
      status: campaign.status,
      image_url: campaign.imageUrl
    });
    if (error) {
      console.error("[DATABASE] Failed to create campaign:", error);
      return false;
    }
    await this.logAction("CAMPAIGN_CREATE", `CAMPAIGNS/${campaign.title}`, "Success");
    return true;
  }
  async updateDonationCampaign(id, campaign) {
    const updates = {};
    if (campaign.title) updates.title = campaign.title;
    if (campaign.description) updates.description = campaign.description;
    if (campaign.targetAmount) updates.target_amount = campaign.targetAmount;
    if (campaign.endDate) updates.end_date = campaign.endDate;
    if (campaign.status) updates.status = campaign.status;
    if (campaign.imageUrl) updates.image_url = campaign.imageUrl;
    const { error } = await supabase.from("donation_campaigns").update(updates).eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to update campaign:", error);
      return false;
    }
    await this.logAction("CAMPAIGN_UPDATE", `CAMPAIGNS/${id}`, "Success");
    return true;
  }
  async deleteDonationCampaign(id, title) {
    const { error } = await supabase.from("donation_campaigns").delete().eq("id", id);
    if (error) {
      console.error("[DATABASE] Failed to delete campaign:", error);
      return false;
    }
    await this.logAction("CAMPAIGN_DELETE", `CAMPAIGNS/${title}`, "Warning");
    return true;
  }
  async submitDonation(donationData) {
    const { error } = await supabase.from("donations").insert({
      full_name: donationData.fullName,
      phone: donationData.phone,
      amount: parseFloat(donationData.amount),
      country: donationData.country,
      payment_method: donationData.paymentMethod || "MTN MoMo",
      show_on_dashboard: donationData.showOnDashboard,
      member_id: donationData.memberId || null,
      campaign_id: donationData.campaignId || null
    });
    if (error) {
      console.error("[DATABASE] Donation submission failed:", error);
      return false;
    }
    return true;
  }
  async createPoll(poll) {
    const pollId = await pollService.createPoll(poll);
    if (pollId) {
      await this.logAction("CREATE_POLL", `POLLS/${pollId}`, "Success", { question: poll.question });
      return true;
    }
    return false;
  }
  async deletePoll(id) {
    const success = await pollService.deletePoll(id);
    if (success) {
      await this.logAction("DELETE_POLL", `POLLS/${id}`, "Warning");
    }
    return success;
  }
  async voteInPoll(pollId, optionId) {
    return pollService.voteInPoll(pollId, optionId);
  }
  async getPollStats() {
    return pollService.getPollStats();
  }
  // --- Store Operations ---
  async getInventory() {
    return logisticsService.getInventory();
  }
  async getStoreProducts() {
    return logisticsService.getStoreProducts();
  }
  async getProductBySlug(slug) {
    return logisticsService.getProductBySlug(slug);
  }
  async addInventoryItem(item) {
    const success = await logisticsService.addInventoryItem(item);
    if (success) {
      await this.logAction("STORE_ADD", `STORE/${item.name}`, "Success", item);
    }
    return success;
  }
  async updateInventoryItem(id, item) {
    const success = await logisticsService.updateInventoryItem(id, item);
    if (success) {
      await this.logAction("STORE_UPDATE", `STORE/${id}`, "Success", item);
    }
    return success;
  }
  async deleteInventoryItem(id, name) {
    const success = await logisticsService.deleteInventoryItem(id);
    if (success) {
      this.logAction("DELETE_INVENTORY", name, "Success");
    }
    return success;
  }
  // --- Logistics Operations ---
  async getResourceRequests() {
    return logisticsService.getResourceRequests();
  }
  async updateResourceRequestStatus(id, status) {
    const success = await logisticsService.updateResourceRequestStatus(id, status);
    if (success) {
      this.logAction(`RESOURCE_REQUEST_${status.toUpperCase()}`, `REQ-${id.substring(0, 8)}`, "Success");
    }
    return success;
  }
  // --- Analytics ---
  async getPublicStats() {
    try {
      const [membersRes, chaptersRes, regionsRes, diasporaRes] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("chapters").select("*", { count: "exact", head: true }),
        supabase.from("chapters").select("city_or_region"),
        supabase.from("users").select("*", { count: "exact", head: true }).neq("country", "Ghana")
      ]);
      const uniqueRegions = new Set((regionsRes.data || []).map((c) => c.city_or_region)).size;
      return {
        members: membersRes.count || 0,
        chapters: chaptersRes.count || 0,
        regions: uniqueRegions || 0,
        diaspora: diasporaRes.count || 0
      };
    } catch (error) {
      console.warn("[ADMIN SERVICE] Failed to fetch public stats:", error);
      return { members: 0, chapters: 0, regions: 0, diaspora: 0 };
    }
  }
  async getGlobalStats() {
    const [usersRes, chaptersRes, ordersRes] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("chapters").select("*", { count: "exact", head: true }),
      supabase.from("store_orders").select("*", { count: "exact", head: true })
    ]);
    const usersCount = usersRes.count || 0;
    const chaptersCount = chaptersRes.count || 0;
    const ordersCount = ordersRes.count || 0;
    return [
      { label: "Total Membership", value: usersCount.toLocaleString(), change: "+12.4%" },
      { label: "Regional Chapters", value: chaptersCount.toString(), change: "+4.2%" },
      { label: "Member Engagement", value: `${Math.round(usersCount / 5e3 * 100)}%`, change: "+2.1%" },
      { label: "Merch Orders", value: ordersCount.toLocaleString(), change: "+15.8%" }
    ];
  }
  async getRegions() {
    return logisticsService.getRegions();
  }
  async getConstituencies() {
    return logisticsService.getConstituencies();
  }
  async updateRegion(id, name) {
    const success = await logisticsService.updateRegion(id, name);
    if (success) {
      await this.logAction("REGION_UPDATE", `REGIONS/${name}`, "Success");
    }
    return success;
  }
  // --- Storage Operations ---
  async uploadAvatar(fileName, blob) {
    return supabase.storage.from("avatars").upload(fileName, blob, { upsert: true });
  }
  getAvatarPublicUrl(fileName) {
    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    return data.publicUrl;
  }
  async uploadBrandingAsset(fileName, blob) {
    return supabase.storage.from("branding").upload(fileName, blob, { upsert: true });
  }
  getBrandingAssetUrl(fileName) {
    const { data } = supabase.storage.from("branding").getPublicUrl(fileName);
    return data.publicUrl;
  }
  async deleteConstituency(id, regionName, conName) {
    const success = await logisticsService.deleteConstituency(id);
    if (success) {
      await this.logAction("CONSTITUENCY_DELETE", `REGIONS/${regionName}/CONSTITUENCIES/${conName}`, "Warning");
    }
    return success;
  }
  async getRegionalStats() {
    const [regions, chapters] = await Promise.all([
      this.getRegions(),
      this.getChapters()
    ]);
    return regions.map((r) => {
      const regionalChapters = chapters.filter((c) => c.city_or_region === r.name);
      const totalMembers = regionalChapters.reduce((sum, c) => sum + c.member_count, 0);
      return {
        region: r.name,
        memberCount: totalMembers,
        chapters: regionalChapters.length,
        activePolls: 0,
        performance: totalMembers > 1e3 ? "High" : totalMembers > 500 ? "Medium" : "Low",
        color: totalMembers > 1e3 ? "var(--brand-green)" : totalMembers > 500 ? "var(--brand-gold)" : "var(--brand-red)"
      };
    });
  }
  async getGrowthTrends() {
    const { data, error } = await supabase.from("membership_growth_view").select("*").limit(12);
    if (error) {
      console.warn("[DATABASE] Growth trends fetch failed:", error);
      return [];
    }
    return data;
  }
  async getSentimentAnalysis() {
    const chapters = await this.getChapters();
    return chapters.slice(0, 4).map((c) => ({
      topic: `${c.name} Mobilization`,
      score: Math.min(Math.round(c.member_count / 500 * 100), 100),
      trend: c.member_count > 100 ? "Up" : "Stable",
      sentiment: c.member_count > 200 ? "Positive" : "Neutral",
      color: c.member_count > 200 ? "var(--brand-green)" : "var(--brand-gold)"
    }));
  }
  async getSystemAuditLogs() {
    return auditService.getSystemAuditLogs();
  }
  async getAuditLogsForResource(resourceId) {
    return auditService.getAuditLogsForResource(resourceId);
  }
  async getActivityLogs() {
    return auditService.getActivityLogs();
  }
  // --- Blog Operations ---
  async getBlogPosts() {
    return contentService.getBlogPosts();
  }
  async getBlogPostBySlug(slug) {
    return contentService.getBlogPostBySlug(slug);
  }
  async createBlogPost(post) {
    const success = await contentService.createBlogPost(post);
    if (success) {
      await this.logAction("BLOG_CREATE", `BLOGS/${post.slug}`, "Success");
    }
    return success;
  }
  async updateBlogPost(id, post) {
    const success = await contentService.updateBlogPost(id, post);
    if (success) {
      await this.logAction("BLOG_UPDATE", `BLOGS/${id}`, "Success", post);
    }
    return success;
  }
  async deleteBlogPost(id, slug) {
    const success = await contentService.deleteBlogPost(id);
    if (success) {
      await this.logAction("BLOG_DELETE", `BLOGS/${slug}`, "Warning");
    }
    return success;
  }
  // --- Press Operations ---
  async getPressReleases() {
    return contentService.getPressReleases();
  }
  async createPressRelease(release) {
    const success = await contentService.createPressRelease(release);
    if (success) {
      await this.logAction("PRESS_CREATE", `PRESS/${release.slug}`, "Success");
    }
    return success;
  }
  async getMediaKitAssets() {
    return contentService.getMediaKitAssets();
  }
  async getChapterApplications() {
    return chapterService.getChapterApplications();
  }
  async submitChapterApplication(application) {
    return chapterService.submitChapterApplication(application);
  }
  async approveChapterApplication(applicationId, notes = "") {
    const success = await chapterService.approveChapterApplication(applicationId, notes);
    if (success) {
      await this.logAction("CHAPTER_APPROVE", `CHAPTERS/${applicationId}`, "Success");
    }
    return success;
  }
  async getDonations(status) {
    return donationService.getDonations(status);
  }
  async getPendingDonations() {
    return donationService.getPendingDonations();
  }
  async getDonationStats() {
    return donationService.getDonationStats();
  }
  async verifyDonation(donationId, status, notes = "") {
    const success = await donationService.verifyDonation(donationId, status, notes);
    if (success) {
      await this.logAction("DONATION_VERIFY", `DONATIONS/${donationId}`, status === "Verified" ? "Success" : "Warning");
    }
    return success;
  }
  subscribeToPublicDonations(callback) {
    return donationService.subscribeToPublicDonations(callback);
  }
  async getAdminData(userId) {
    const { data, error } = await supabase.from("admins").select(`
        *,
        users!admins_id_fkey (
          full_name,
          email,
          phone_number,
          avatar_url
        )
      `).eq("id", userId).maybeSingle();
    if (error || !data) {
      console.error("[DATABASE] Error fetching admin data:", error);
      return null;
    }
    const admin = data;
    const userProfile = Array.isArray(admin.users) ? admin.users[0] : admin.users;
    const dbPermissions = admin.permissions || {};
    const permissions = [];
    if (dbPermissions.can_manage_members) {
      permissions.push({ action: "VERIFY_MEMBER", resource: "MEMBERS" });
    }
    if (dbPermissions.can_manage_chapters) {
      permissions.push({ action: "MANAGE_CHAPTER", resource: "CHAPTERS" });
    }
    if (dbPermissions.can_manage_polls) {
      permissions.push({ action: "MANAGE_POLLS", resource: "POLLS" });
    }
    if (dbPermissions.can_manage_store) {
      permissions.push({ action: "MANAGE_INVENTORY", resource: "STORE" });
    }
    if (dbPermissions.can_view_audit_logs) {
      permissions.push({ action: "VIEW_AUDIT_LOGS", resource: "SYSTEM" });
    }
    if (dbPermissions.can_post_blog) {
      permissions.push({ action: "MANAGE_BLOGS", resource: "BLOGS" });
    }
    if (dbPermissions.can_manage_donations) {
      permissions.push({ action: "MANAGE_DONATIONS", resource: "DONATIONS" });
    }
    let role = "VERIFIER";
    const dbRole = admin.role?.toUpperCase() || "";
    if (dbRole.includes("FOUNDER")) role = "FOUNDER";
    else if (dbRole.includes("ORGANIZER")) role = "ORGANIZER";
    else if (dbRole.includes("SUPER")) role = "SUPER_ADMIN";
    else if (dbRole.includes("CHIEF_EDITOR")) role = "CHIEF_EDITOR";
    else if (dbRole.includes("SENIOR_EDITOR")) role = "SENIOR_EDITOR";
    else if (dbRole.includes("REGIONAL")) role = "REGIONAL_DIRECTOR";
    else if (dbRole.includes("LEADER") || dbRole.includes("CONSTITUENCY")) role = "CONSTITUENCY_LEAD";
    else if (dbRole.includes("JUNIOR_EDITOR")) role = "JUNIOR_EDITOR";
    else if (dbRole.includes("REGIONAL_CORRESPONDENT")) role = "REGIONAL_CORRESPONDENT";
    else if (dbRole.includes("EDITOR")) role = "EDITOR";
    else if (dbRole.includes("VERIFIER")) role = "VERIFIER";
    return {
      id: admin.id,
      email: userProfile?.email || "",
      name: userProfile?.full_name || "Admin",
      role,
      assigned_region: admin.assigned_region,
      permissions,
      phone: userProfile?.phone_number || "",
      avatarUrl: userProfile?.avatar_url || ""
    };
  }
  async updateAdminData(userId, updates) {
    const { error } = await supabase.from("admins").update(updates).eq("id", userId);
    if (error) {
      throw new Error(error.message || "Failed to update admin data");
    }
  }
  async updatePublicUserProfile(userId, updates) {
    return supabase.from("users").update(updates).eq("id", userId);
  }
  async getWishlist(userId) {
    const { data, error } = await supabase.from("wishlist").select(`
        id,
        product_id,
        store_inventory (*)
      `).eq("user_id", userId);
    if (error || !data) {
      console.error("[DATABASE] Error fetching wishlist:", error);
      return [];
    }
    return data.map((item) => {
      const i = item.store_inventory;
      return {
        id: i.id,
        name: i.name,
        slug: i.slug || i.name.toLowerCase().replace(/\s+/g, "-"),
        category: i.category,
        price: `GH₵ ${Number(i.price_ghs).toLocaleString()}`,
        stock: i.stock_quantity,
        status: i.stock_quantity > 10 ? "Stable" : i.stock_quantity > 0 ? "Low Stock" : "Critical",
        image: i.image_url || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
        description: i.description || "",
        rating: i.rating || 4.8,
        reviews: i.reviews || 0,
        sizes: i.sizes || ["S", "M", "L", "XL"],
        colors: i.colors || ["Standard"]
      };
    });
  }
  async addToWishlist(userId, productId) {
    const { error } = await supabase.from("wishlist").insert({ user_id: userId, product_id: productId });
    if (error && error.code !== "23505") {
      console.error("[DATABASE] Error adding to wishlist:", error);
      return false;
    }
    return true;
  }
  async removeFromWishlist(userId, productId) {
    const { error } = await supabase.from("wishlist").delete().eq("user_id", userId).eq("product_id", productId);
    if (error) {
      console.error("[DATABASE] Error removing from wishlist:", error);
      return false;
    }
    return true;
  }
  // --- Communication Engine (Field Mobilization) ---
  async getBroadcasts() {
    return tacticalService.getBroadcasts();
  }
  async sendBroadcast(broadcast) {
    const success = await tacticalService.sendBroadcast(broadcast);
    if (success) {
      await this.logAction("SEND_BROADCAST", `TARGET/${broadcast.target_type}`, "Success", { title: broadcast.title });
    } else {
      await this.logAction("SEND_BROADCAST", `TARGET/${broadcast.target_type}`, "Failure");
    }
    return success;
  }
  async getNotifications(userId) {
    return tacticalService.getNotifications(userId);
  }
  async markNotificationRead(id) {
    return tacticalService.markNotificationRead(id);
  }
  async getBroadcastMetrics(broadcastId) {
    return tacticalService.getBroadcastMetrics(broadcastId);
  }
  async getLeaderboard(region) {
    return tacticalService.getLeaderboard(region);
  }
  async getMovementPulse() {
    return tacticalService.getMovementPulse();
  }
  async getMilestones() {
    return tacticalService.getMilestones();
  }
  async createMilestone(milestone) {
    const success = await tacticalService.createMilestone(milestone);
    if (success) {
      await this.logAction("MILESTONE_CREATE", `ROADMAP/${milestone.title}`, "Success", milestone);
    }
    return success;
  }
  async updateMilestone(id, milestone) {
    const success = await tacticalService.updateMilestone(id, milestone);
    if (success) {
      await this.logAction("MILESTONE_UPDATE", `ROADMAP/${id}`, "Success", milestone);
    }
    return success;
  }
  async deleteMilestone(id, title) {
    const success = await tacticalService.deleteMilestone(id);
    if (success) {
      await this.logAction("MILESTONE_DELETE", `ROADMAP/${title}`, "Warning");
    }
    return success;
  }
  async getRoadmapForecast() {
    const milestones = await tacticalService.getMilestones();
    const growth = await this.getGrowthStats();
    const { count: count2 } = await supabase.from("users").select("*", { count: "exact", head: true });
    const totalMembers = count2 || 0;
    const avgDailyGrowth = Math.max(1, growth.joined_last_7d / 7);
    return milestones.map((m) => {
      if (m.status !== "Completed" && m.target_members && m.target_members > totalMembers) {
        const remaining = m.target_members - totalMembers;
        const realisticGrowth = Math.max(5, avgDailyGrowth);
        const daysToTarget = Math.ceil(remaining / realisticGrowth);
        const maxDays = 365;
        const actualDays = Math.min(daysToTarget, maxDays);
        const forecast = /* @__PURE__ */ new Date();
        forecast.setDate(forecast.getDate() + actualDays);
        return { ...m, forecasted_date: forecast.toISOString().split("T")[0] };
      }
      return m;
    });
  }
  async verifyMemberID(memberId) {
    return tacticalService.verifyMemberID(memberId);
  }
  async generateComplianceReport(region = "National") {
    console.log(`[AUDIT-GEN] Generating ${region} compliance report...`);
    const reportData = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      scope: region,
      metrics: {
        total_members: 425e3,
        verification_accuracy: "98.4%",
        avg_logistics_latency: "4.2 days",
        sentiment_index: "78%"
      },
      audit_logs: [
        { id: "LOG-001", action: "REG_VERIFY", status: "SUCCESS", admin: "HQ-ADMIN-01" },
        { id: "LOG-002", action: "ORDER_DISPATCH", status: "SUCCESS", admin: "HQ-LOGISTICS" }
      ]
    };
    return JSON.stringify(reportData, null, 2);
  }
  // ─── ORDER LIFECYCLE ENGINE ──────────────────────────────────────────────────
  async getPublicDonationFeed(limit) {
    return donationService.getPublicDonationFeed(limit);
  }
  async getMobilizationLedger(limit) {
    return donationService.getMobilizationLedger(limit);
  }
  async getMemberDonations(phone) {
    return donationService.getMemberDonations(phone);
  }
  async getOrders(limit) {
    return logisticsService.getOrders(limit);
  }
  async getOrderById(orderId) {
    return logisticsService.getOrderById(orderId);
  }
  async getOrderStats() {
    return logisticsService.getOrderStats();
  }
  async updateOrderStatus(orderId, status) {
    const success = await logisticsService.updateOrderStatus(orderId, status);
    if (success) {
      await this.logAction(
        "ORDER_UPDATE",
        `ORDERS/${orderId}`,
        "Success",
        { message: `Status updated to ${status}` }
      );
    }
    return success;
  }
  async replenishInventory() {
    const success = await logisticsService.replenishInventory();
    if (success) {
      await this.logAction("INVENTORY_REPLENISH", "STORE/ALL", "Success");
    }
    return success;
  }
  // --- PHASE 6: REGIONAL AUTONOMY & FIELD OPERATIONS ---
  async getFieldEvents(chapterName) {
    return intelligenceService.getFieldEvents(chapterName);
  }
  async updateFieldEvent(eventId, updates) {
    const success = await intelligenceService.updateFieldEvent(eventId, updates);
    if (success) {
      await this.logAction("FIELD_EVENT_UPDATE", `EVENTS/${eventId}`, "Success", updates);
    }
    return success;
  }
  async getChapterMobilizationLedger(chapterName) {
    return gamificationService.getMobilizationLedger(chapterName);
  }
  // --- PHASE 7: TACTICAL INTELLIGENCE & FIELD FEEDBACK ---
  async getFieldDirectives() {
    return intelligenceService.getFieldDirectives();
  }
  async createFieldDirective(directive) {
    return intelligenceService.createFieldDirective(directive);
  }
  async getFieldReports(directiveId) {
    return intelligenceService.getFieldReports(directiveId);
  }
  async verifyFieldReport(reportId, status) {
    return intelligenceService.verifyFieldReport(reportId, status);
  }
  // --- PHASE 8: GAMIFICATION & REGIONAL POWER ---
  async getAchievements() {
    return gamificationService.getAchievements();
  }
  async getRegionalLeaderboard() {
    return chapterService.getRegionalLeaderboard();
  }
  async getMemberAchievements(userId) {
    return gamificationService.getMemberAchievements(userId);
  }
  async getMemberPoints(userId) {
    return gamificationService.getMemberPoints(userId);
  }
  async getLogisticsVelocity() {
    return logisticsService.getLogisticsVelocity();
  }
  async getInventoryAlerts() {
    return logisticsService.getInventoryAlerts();
  }
  async getLogisticsAudit(limit) {
    return logisticsService.getLogisticsAudit(limit);
  }
  async getFieldActions() {
    return intelligenceService.getFieldActions();
  }
  async getFieldActionAttendance(actionId) {
    return intelligenceService.getFieldActionAttendance(actionId);
  }
  async createFieldAction(action) {
    return intelligenceService.createFieldAction(action);
  }
  async verifyRallyAttendance(attendanceId) {
    return intelligenceService.verifyRallyAttendance(attendanceId);
  }
  // --- Phase 12: National Sentiment Analysis & Predictive Polling ---
  async getMemberFeedback() {
    return intelligenceService.getMemberFeedback();
  }
  async getSentimentIntelligence() {
    return intelligenceService.getSentimentIntelligence();
  }
  async getImpactProjections() {
    return intelligenceService.getImpactProjections();
  }
  async submitMemberFeedback(feedback) {
    return intelligenceService.submitMemberFeedback(feedback);
  }
  // --- Phase 13: The Movement War Room (Real-time Crisis & Rapid Response) ---
  async getRapidResponseDirectives() {
    return intelligenceService.getRapidResponseDirectives();
  }
  async createRapidResponseDirective(directive) {
    const success = await intelligenceService.createRapidResponseDirective(directive);
    if (success) {
      await this.logAction("CREATE_RAPID_DIRECTIVE", `DIRECTIVES/${directive.title}`, "Success", { title: directive.title });
    }
    return success;
  }
  async getCrisisIncidents() {
    return intelligenceService.getCrisisIncidents();
  }
  async getMediaCounterNarratives(crisisId) {
    return intelligenceService.getMediaCounterNarratives(crisisId);
  }
  // --- Phase 14: Operation "Ground Game" (Voter Registration & Turnout) ---
  async getVoterRegistrations() {
    return intelligenceService.getVoterRegistrations();
  }
  async getCanvassingCampaigns() {
    return intelligenceService.getCanvassingCampaigns();
  }
  async getCanvasserLogs(campaignId) {
    return intelligenceService.getCanvasserLogs(campaignId);
  }
  async getGOTVTransportRequests() {
    return intelligenceService.getGOTVTransportRequests();
  }
  async updateTransportRequest(requestId, status) {
    const success = await intelligenceService.updateTransportRequest(requestId, status);
    if (success) {
      await this.logAction("TRANSPORT_UPDATE", `TRANSPORT/${requestId}`, "Success", { status });
    }
    return success;
  }
  async getGhanaRegions() {
    return intelligenceService.getGhanaRegions();
  }
  async getGhanaConstituencies(regionId) {
    return intelligenceService.getGhanaConstituencies(regionId);
  }
  async createCanvassingCampaign(campaign) {
    const success = await intelligenceService.createCanvassingCampaign(campaign);
    if (success) {
      await this.logAction("CREATE_CAMPAIGN", `CAMPAIGNS/${campaign.title}`, "Success", { title: campaign.title });
    }
    return success;
  }
  // --- Phase 15: Public Engagement & Communication (Standardization) ---
  async subscribeToNewsletter(email) {
    try {
      const { error } = await supabase.from("newsletter_subscribers").upsert({ email, status: "Active" }, { onConflict: "email" });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Newsletter subscription failed:", error);
      return false;
    }
  }
  async submitContactForm(submission) {
    try {
      const { error } = await supabase.from("contact_submissions").insert([submission]);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Contact submission failed:", error);
      return false;
    }
  }
  async getSiteSettings() {
    try {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      return (data || []).reduce((acc, curr) => ({
        ...acc,
        [curr.key]: curr.value
      }), {});
    } catch (error) {
      console.error("[DATABASE] Failed to fetch site settings:", error);
      return {};
    }
  }
  async updateSiteSetting(key, value) {
    try {
      const { error } = await supabase.from("site_settings").upsert({ key, value, updated_at: (/* @__PURE__ */ new Date()).toISOString() }, { onConflict: "key" });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("[DATABASE] Failed to update site setting:", error);
      return false;
    }
  }
  subscribeToSiteSettings(callback) {
    const channel = supabase.channel("public:site_settings").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_settings" },
      () => {
        console.log("[BRANDING] Realtime update detected");
        callback();
      }
    ).subscribe();
    return channel;
  }
  unsubscribeFromChannel(channel) {
    supabase.removeChannel(channel);
  }
  // --- Global Command Search ---
  async globalSearch(query) {
    if (!query || query.length < 2) return [];
    try {
      const [members, blogPosts, chapters, products, authors] = await Promise.all([
        this.searchMembers(query),
        supabase.from("blog_posts").select("id, title, slug").ilike("title", `%${query}%`).is("deleted_at", null).limit(5),
        supabase.from("chapters").select("id, name").ilike("name", `%${query}%`).limit(5),
        supabase.from("store_inventory").select("id, name, slug").ilike("name", `%${query}%`).limit(5),
        supabase.from("authors").select("id, name, role").ilike("name", `%${query}%`).is("deleted_at", null).limit(5)
      ]);
      const results = [];
      members.forEach((m) => {
        results.push({
          type: "Member",
          title: m.name,
          subtitle: `${m.id} · ${m.region}`,
          id: m.id,
          to: `/admin/members?search=${m.id}`
        });
      });
      blogPosts.data?.forEach((p) => {
        results.push({
          type: "Article",
          title: p.title,
          subtitle: "Editorial Update",
          id: p.id,
          to: `/admin/blogs?edit=${p.id}`
        });
      });
      chapters.data?.forEach((c) => {
        results.push({
          type: "Chapter",
          title: c.name,
          subtitle: "Regional Mobilization Hub",
          id: c.id,
          to: `/admin/chapters?id=${c.id}`
        });
      });
      products.data?.forEach((p) => {
        results.push({
          type: "Product",
          title: p.name,
          subtitle: "Movement Supply",
          id: p.id,
          to: `/admin/store?id=${p.id}`
        });
      });
      authors.data?.forEach((a) => {
        results.push({
          type: "Author",
          title: a.name,
          subtitle: a.role || "Contributor",
          id: a.id,
          to: `/admin/authors?view=${a.id}`
        });
      });
      return results.slice(0, 10);
    } catch (error) {
      console.error("[ADMIN SERVICE] Global search failed:", error);
      return [];
    }
  }
}
const adminService = AdminService.getInstance();
const StoreProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("the_base_cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse cart from local storage", e);
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("the_base_cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    const fetchInitialWishlist = async () => {
      const user = authService.getUser();
      if (user) {
        const dbWishlist = await adminService.getWishlist(user.id);
        setWishlist(dbWishlist);
      }
    };
    fetchInitialWishlist();
  }, []);
  const addToWishlist = async (product) => {
    setWishlist((prev) => {
      if (prev.find((item) => item.id === product.id)) return prev;
      return [...prev, product];
    });
    const user = authService.getUser();
    if (user) {
      await adminService.addToWishlist(user.id, product.id);
    }
  };
  const removeFromWishlist = async (productId) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
    const user = authService.getUser();
    if (user) {
      await adminService.removeFromWishlist(user.id, productId);
    }
  };
  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.selectedSize === item.selectedSize && i.selectedColor === item.selectedColor);
      if (existing) {
        return prev.map((i) => i === existing ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
  };
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };
  const updateCartQuantity = (productId, quantity) => {
    setCart((prev) => prev.map((item) => item.id === productId ? { ...item, quantity } : item));
  };
  const clearCart = () => {
    setCart([]);
  };
  return /* @__PURE__ */ jsx(StoreContext.Provider, { value: {
    wishlist,
    cart,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart
  }, children });
};
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function ReadingProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const updateScrollProgress = () => {
      const currentScrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = currentScrollY / totalHeight * 100;
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", updateScrollProgress);
    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, []);
  return /* @__PURE__ */ jsx("div", { className: "fixed top-0 left-0 w-full h-[4px] z-[100] pointer-events-none", children: /* @__PURE__ */ jsx(
    "div",
    {
      className: "h-full bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)] transition-all duration-150 ease-out",
      style: { width: `${scrollProgress}%` }
    }
  ) });
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function Spinner({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    Loader2Icon,
    {
      role: "status",
      "aria-label": "Loading",
      className: cn("size-4 animate-spin", className),
      ...props
    }
  );
}
function LoadingScreen() {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center bg-stone-50", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)] blur-2xl opacity-10 animate-pulse" }),
      /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col items-center", children: [
        /* @__PURE__ */ jsx(Spinner, { className: "w-10 h-10 text-[var(--brand-green)] mb-6" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-stone-900 tracking-tight font-meta animate-pulse", children: "THE BASE" }),
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 tracking-tight", children: "Initializing movement assets" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "fixed bottom-12 w-48 h-0.5 bg-stone-200 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-[var(--brand-green)] origin-left animate-loading-bar" }) }),
    /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: `
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-30%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      ` } })
  ] });
}
const PerformanceContext = createContext(null);
function PerformanceProvider({ children }) {
  const [lowBandwidthMode, setLowBandwidthMode] = useState(() => {
    return localStorage.getItem("low_bandwidth_mode") === "true";
  });
  useEffect(() => {
    localStorage.setItem("low_bandwidth_mode", String(lowBandwidthMode));
  }, [lowBandwidthMode]);
  return /* @__PURE__ */ jsx(PerformanceContext.Provider, { value: { lowBandwidthMode, setLowBandwidthMode }, children });
}
const usePerformance = () => {
  const ctx = useContext(PerformanceContext);
  if (!ctx) throw new Error("usePerformance must be used inside <PerformanceProvider>");
  return ctx;
};
const defaultSettings = {
  logo_url: "/branding/logo.png",
  favicon_url: "/branding/favicon.ico",
  og_image_url: "/branding/og-image.png",
  twitter_card_url: "/branding/twitter-card.png",
  founder_image_url: "/branding/founder-image.jpg",
  hero_bg_url: "/branding/hero-background-image.png",
  banner_image_url: "/branding/base-banner-image.png",
  party_hq_image_url: "/branding/party-headquarters-image.webp",
  primary_color: "156 100% 21%",
  accent_color: "45 80% 45%",
  destructive_color: "0 85% 44%",
  registration_form_ghana_url: "/docs/registration-form-ghana.pdf",
  registration_form_diaspora_url: "/docs/registration-form-diaspora.pdf",
  primary_email: "info@thebasemovement.com",
  newsletter_email: "info@thebasemovement.com",
  font_scale_global: 1,
  font_scale_headings: 1,
  muted_foreground_color: "0 0% 55%",
  on_surface_muted_color: "0 0% 55%",
  button_border_radius: "0.125rem",
  button_font_weight: "700",
  button_neon_enabled: true,
  button_primary_text_color: "0 0% 100%",
  button_gold_text_color: "220 15% 15%",
  button_destructive_text_color: "0 0% 100%",
  button_active_tab_bg_color: "156 100% 21%",
  button_active_tab_text_color: "0 0% 100%"
};
const BrandingContext = createContext(void 0);
function useBranding() {
  const context = useContext(BrandingContext);
  if (context === void 0) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
function BrandingProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const refreshSettings = useCallback(async () => {
    try {
      const data = await adminService.getSiteSettings();
      setSettings((prev) => ({
        ...prev,
        ...data
      }));
    } catch (err) {
      console.error("[BRANDING] Failed to fetch site settings:", err);
    }
  }, []);
  useEffect(() => {
    let isMounted = true;
    async function initializeBranding() {
      try {
        const data = await adminService.getSiteSettings();
        if (isMounted) {
          setSettings((prev) => ({
            ...prev,
            ...data
          }));
        }
      } catch (err) {
        console.error("[BRANDING] Failed to fetch site settings:", err);
      }
    }
    initializeBranding();
    const handleBrandingUpdate = () => {
      initializeBranding();
    };
    window.addEventListener("site_settings_updated", handleBrandingUpdate);
    const channel = adminService.subscribeToSiteSettings(() => {
      if (isMounted) initializeBranding();
    });
    return () => {
      isMounted = false;
      window.removeEventListener("site_settings_updated", handleBrandingUpdate);
      if (channel) adminService.unsubscribeFromChannel(channel);
    };
  }, []);
  return /* @__PURE__ */ jsxs(BrandingContext.Provider, { value: { settings, refreshSettings }, children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("link", { rel: "icon", type: "image/png", sizes: "32x32", href: settings.favicon_url }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: settings.og_image_url }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: settings.twitter_card_url || settings.og_image_url }),
      /* @__PURE__ */ jsx("style", { children: `
            html:root {
              --primary: ${settings.primary_color};
              --brand-green: ${settings.primary_color};
              --ring: ${settings.primary_color};
              --accent: ${settings.accent_color};
              --brand-gold: ${settings.accent_color};
              --destructive: ${settings.destructive_color};
              --brand-red: ${settings.destructive_color};

              /* Muted Text Management */
              --muted-foreground: ${settings.muted_foreground_color || "0 0% 55%"};
              --on-surface-muted: ${settings.on_surface_muted_color || "0 0% 55%"};

              /* Typography Management */
              --font-scale: ${settings.font_scale_global || 1};
              --font-heading-scale: ${settings.font_scale_headings || 1};
              
              /* Derived Responsive Sizes with clamp() */
              --h1-size: clamp(calc(1.75rem * var(--font-heading-scale)), calc(4.5vw * var(--font-heading-scale)), calc(3.5rem * var(--font-heading-scale)));
              --h2-size: clamp(calc(1.5rem * var(--font-heading-scale)), calc(3.5vw * var(--font-heading-scale)), calc(2.75rem * var(--font-heading-scale)));
              --h3-size: clamp(calc(1.25rem * var(--font-heading-scale)), calc(2.5vw * var(--font-heading-scale)), calc(2rem * var(--font-heading-scale)));
              --h4-size: clamp(calc(1.1rem * var(--font-heading-scale)), calc(2vw * var(--font-heading-scale)), calc(1.5rem * var(--font-heading-scale)));
              --h5-size: clamp(calc(1rem * var(--font-heading-scale)), calc(1.5vw * var(--font-heading-scale)), calc(1.25rem * var(--font-heading-scale)));
              --h6-size: clamp(calc(0.875rem * var(--font-heading-scale)), calc(1.2vw * var(--font-heading-scale)), calc(1.1rem * var(--font-heading-scale)));
              
              /* Body Text Scaling */
              --p-size: clamp(calc(0.875rem * var(--font-scale)), calc(0.5vw + 0.75rem), calc(1.125rem * var(--font-scale)));
              --text-tiny: clamp(0.65rem, 0.4vw + 0.5rem, 0.8rem);

              /* Button Configuration */
              --button-radius: ${settings.button_border_radius || "0.125rem"};
              --button-font-weight: ${settings.button_font_weight || "700"};
              --primary-foreground: ${settings.button_primary_text_color || "0 0% 100%"};
              --accent-foreground: ${settings.button_gold_text_color || "220 15% 15%"};
              --destructive-foreground: ${settings.button_destructive_text_color === "220 15% 15%" ? "0 0% 100%" : settings.button_destructive_text_color || "0 0% 100%"};
              --active-tab-bg: ${settings.button_active_tab_bg_color || settings.primary_color};
              --active-tab-text: ${settings.button_active_tab_text_color || "0 0% 100%"};
            }
          ` })
    ] }),
    children
  ] });
}
function SEO({
  title,
  description,
  ogImage,
  ogType = "website",
  canonical,
  jsonLd,
  noindex
}) {
  const { settings } = useBranding();
  const siteName = "The Base Movement";
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} – Ghana First, Jobs for the Youth!`;
  const defaultDescription = "We are a grassroots movement committed to youth jobs, accountable leadership, and national development. Join citizens in Ghana and across the diaspora working for a more productive future.";
  const metaDescription = description || defaultDescription;
  const image = ogImage || settings.logo_url;
  const siteUrl = "https://thebasemovement.com";
  return /* @__PURE__ */ jsxs(Helmet, { children: [
    /* @__PURE__ */ jsx("title", { children: fullTitle }),
    /* @__PURE__ */ jsx("meta", { name: "description", content: metaDescription }),
    /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
    noindex && /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex, nofollow" }),
    canonical && /* @__PURE__ */ jsx("link", { rel: "canonical", href: `${siteUrl}${canonical}` }),
    /* @__PURE__ */ jsx("meta", { property: "og:type", content: ogType }),
    /* @__PURE__ */ jsx("meta", { property: "og:title", content: fullTitle }),
    /* @__PURE__ */ jsx("meta", { property: "og:description", content: metaDescription }),
    /* @__PURE__ */ jsx("meta", { property: "og:image", content: image }),
    /* @__PURE__ */ jsx("meta", { property: "og:url", content: window.location.href }),
    /* @__PURE__ */ jsx("meta", { property: "og:site_name", content: siteName }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: fullTitle }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: metaDescription }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: image }),
    jsonLd && /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(jsonLd) })
  ] });
}
const buttonVariants = cva(
  "relative group border text-center transition-all duration-200 inline-flex items-center justify-center gap-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-white text-brand-green border-brand-green/20 hover:border-brand-red hover:text-brand-red hover:bg-brand-red/5 transition-all tracking-tight",
        solid: "bg-brand-green hover:bg-brand-green/90 text-primary-foreground border-transparent hover:border-white/20 transition-all duration-200 tracking-tight shadow-lg shadow-brand-green/20",
        primary: "bg-brand-green text-primary-foreground hover:bg-brand-green/90 border-brand-green shadow-[0_0_15px_rgba(0,107,63,0.3)] tracking-tight",
        accent: "bg-brand-gold text-accent-foreground hover:bg-brand-gold/90 border-brand-gold shadow-[0_0_15px_rgba(218,165,32,0.3)] tracking-tight",
        gold: "bg-brand-gold hover:bg-brand-gold/90 text-accent-foreground border-transparent tracking-tight shadow-[0_0_15px_rgba(218,165,32,0.2)]",
        destructive: "bg-brand-red text-destructive-foreground hover:bg-brand-red/90 border-brand-red shadow-[0_0_15px_rgba(206,17,38,0.3)] tracking-tight",
        ghost: "border-transparent bg-transparent hover:bg-brand-green/5 text-brand-green tracking-tight font-bold",
        outline: "bg-transparent border-brand-green/40 hover:bg-brand-green hover:text-white text-brand-green tracking-tight font-bold",
        "outline-destructive": "bg-transparent border-brand-red/40 hover:bg-brand-red hover:text-white text-brand-red tracking-tight font-bold",
        "ghost-destructive": "border-transparent bg-transparent hover:bg-brand-red/5 text-brand-red tracking-tight font-bold",
        "active-tab": "bg-[hsl(var(--active-tab-bg))] text-[hsl(var(--active-tab-text))] border-[hsl(var(--active-tab-bg))] shadow-[0_0_15px_rgba(var(--brand-green-rgb),0.3)] tracking-tight",
        link: "border-transparent bg-transparent p-0 h-auto tracking-tight text-foreground"
      },
      size: {
        default: "px-7 py-2.5 text-[12px]",
        sm: "px-4 py-1.5 text-[10px]",
        lg: "px-10 py-3.5 text-[14px]",
        icon: "h-9 w-9 p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React__default.forwardRef(
  ({ className, neon, size, variant, asChild = false, children, ...props }, ref) => {
    const { settings } = useBranding();
    const isNeonEnabled = neon !== void 0 ? neon : settings.button_neon_enabled ?? true;
    const Comp = asChild ? Slot : "button";
    const isDarkPrimaryText = settings.button_primary_text_color === "220 15% 15%";
    let effectiveVariant = variant;
    if ((variant === "primary" || variant === "solid" || !variant) && isDarkPrimaryText) {
      effectiveVariant = "gold";
    }
    const getGlowColor = () => {
      if (effectiveVariant === "destructive") return "via-brand-red";
      if (effectiveVariant === "gold" || effectiveVariant === "accent") return "via-brand-gold";
      return "via-brand-green";
    };
    const glowColor = getGlowColor();
    return /* @__PURE__ */ jsxs(
      Comp,
      {
        className: cn(buttonVariants({ variant: effectiveVariant, size }), className),
        ref,
        ...props,
        children: [
          /* @__PURE__ */ jsx("span", { className: cn("absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 top-0 bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent hidden", glowColor, isNeonEnabled && "block") }),
          /* @__PURE__ */ jsx(Slottable, { children }),
          /* @__PURE__ */ jsx("span", { className: cn("absolute group-hover:opacity-60 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent hidden", glowColor, isNeonEnabled && "block") })
        ]
      }
    );
  }
);
Button.displayName = "Button";
function BrandLine({ className }) {
  return /* @__PURE__ */ jsxs("div", { className: cn("brand-line", className), children: [
    /* @__PURE__ */ jsx("div", { className: "brand-line-destructive" }),
    /* @__PURE__ */ jsx("div", { className: "brand-line-accent" }),
    /* @__PURE__ */ jsx("div", { className: "brand-line-primary" })
  ] });
}
function AnimatedCounter({ target, duration = 2e3, className }) {
  const [count2, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);
  const getColor = (val) => {
    if (val <= 1e5) return "hsl(var(--destructive))";
    if (val <= 200001) return "hsl(var(--accent))";
    return "hsl(var(--primary))";
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: className || "text-6xl md:text-[5rem] font-meta font-bold tracking-tighter transition-colors duration-300",
      style: !className ? { color: getColor(count2) } : void 0,
      children: count2.toLocaleString()
    }
  );
}
function Home() {
  const { settings } = useBranding();
  const [mousePos, setMousePos] = useState({ x: -1e3, y: -1e3 });
  const [latestPosts, setLatestPosts] = useState([]);
  const [stats, setStats] = useState({
    members: 0,
    chapters: 0,
    regions: 0,
    diaspora: 0
  });
  const { lowBandwidthMode } = usePerformance();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "The Base Movement",
    "url": "https://thebasemovement.com",
    "logo": settings.logo_url,
    "sameAs": [
      "https://www.facebook.com/profile.php?id=61579415816496",
      "https://www.instagram.com/thebasemovementgh",
      "https://www.tiktok.com/@thebasemovementgh",
      "https://www.youtube.com/@thebasemovementgh"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "general info",
      "url": "https://thebasemovement.com/contact"
    }
  };
  useEffect(() => {
    adminService.getBlogPosts().then((data) => setLatestPosts(data.slice(0, 3))).catch(() => {
    });
    adminService.getPublicStats().then(setStats).catch(() => {
    });
  }, []);
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  return /* @__PURE__ */ jsxs("main", { className: "bg-background font-body-md", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Ghana First, Jobs for the Youth!",
        canonical: "/",
        jsonLd: organizationSchema
      }
    ),
    /* @__PURE__ */ jsxs(
      "section",
      {
        "aria-labelledby": "hero-heading",
        className: "relative bg-on-surface text-white min-h-screen flex items-center overflow-hidden border-b-[8px] border-accent group",
        onMouseMove: handleMouseMove,
        children: [
          !lowBandwidthMode ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity transition-opacity duration-1000 group-hover:opacity-20", style: { backgroundImage: `url('${settings.hero_bg_url || "/hero-bg.png"}')` } }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none",
                style: {
                  backgroundImage: `url('${settings.hero_bg_url || "/hero-bg.png"}')`,
                  WebkitMaskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                  maskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`
                }
              }
            )
          ] }) : /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 bg-gradient-to-br from-on-surface to-on-surface/90 opacity-50" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 bg-gradient-to-t from-on-surface via-on-surface/60 to-transparent" }),
          /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-8 py-20 relative z-10 flex flex-col md:flex-row items-center gap-12 w-full", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 text-center md:text-left", children: [
              /* @__PURE__ */ jsxs("h1", { id: "hero-heading", className: "text-5xl md:text-h1 font-meta font-bold mb-4 leading-[1.1] tracking-tighter", children: [
                "Ghana First,",
                /* @__PURE__ */ jsx("br", {}),
                "Jobs for the youth!"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex justify-center md:justify-start", children: /* @__PURE__ */ jsx(BrandLine, {}) }),
              /* @__PURE__ */ jsx("p", { className: "text-white/90 text-sm md:text-base font-body-md max-w-xl animate-in slide-in-from-bottom duration-1000 delay-200", children: "We are a grassroots movement committed to youth jobs, accountable leadership, and national development. Join citizens in Ghana and across the diaspora working for a more productive future." }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start", children: [
                /* @__PURE__ */ jsx(Button, { asChild: true, variant: "gold", size: "lg", className: "shadow-2xl shadow-brand-gold/20 w-full sm:w-auto", children: /* @__PURE__ */ jsxs(Link, { to: "/register", children: [
                  "Join the Movement ",
                  /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2" })
                ] }) }),
                /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", size: "lg", className: "w-full sm:w-auto", children: /* @__PURE__ */ jsx(Link, { to: "/our-agenda", children: "Learn More About Us" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 flex justify-center md:justify-end opacity-90 relative", children: /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "The Base", className: "w-64 md:w-96 drop-shadow-2xl transition-all duration-700 object-contain", decoding: "async" }) })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx("section", { "aria-labelledby": "platforms-heading", className: "py-24 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-8", children: [
      /* @__PURE__ */ jsx("h2", { id: "platforms-heading", className: "sr-only", children: "Our Platforms" }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-12 md:gap-24", children: [
        /* @__PURE__ */ jsxs("div", { className: "border-t-[4px] border-primary pt-8 group", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-h3 font-meta font-bold text-on-surface mb-4 flex items-center gap-3 tracking-tight", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "text-primary w-8 h-8" }),
            " For Citizens in Ghana."
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground mb-8 leading-relaxed font-body-md", children: "Get involved in your district. Join your local branch, take part in community activity, and support practical action for jobs and development." }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", className: "w-full sm:w-auto", children: /* @__PURE__ */ jsxs(Link, { to: "/register?platform=GHANA", children: [
            "Join Base Ghana ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-t-[4px] border-accent pt-8 group", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-h3 font-meta font-bold text-on-surface mb-4 flex items-center gap-3 tracking-tight", children: [
            /* @__PURE__ */ jsx(Globe, { className: "text-accent w-8 h-8" }),
            " For Ghanaians Abroad."
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground mb-8 leading-relaxed font-body-md", children: "Stay connected to home and support national development from abroad through your skills, networks, and commitment to Ghana’s future." }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "gold", className: "w-full sm:w-auto", children: /* @__PURE__ */ jsxs(Link, { to: "/register?platform=DIASPORA", children: [
            "Join Base Diaspora ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" })
          ] }) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { "aria-labelledby": "foundation-heading", className: "py-24 bg-on-surface text-white border-t border-white/5", children: /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-16", children: [
        /* @__PURE__ */ jsx("h2", { id: "foundation-heading", className: "text-4xl md:text-5xl font-meta font-bold leading-tight mb-4 tracking-tighter", children: "Our Foundation" }),
        /* @__PURE__ */ jsx(BrandLine, {})
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "border-l-2 border-destructive pl-6", children: [
          /* @__PURE__ */ jsx("span", { className: "text-destructive font-meta font-bold tracking-tight text-xs mb-3 block", children: "Core Pillar 01" }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-meta font-bold mb-4 tracking-tight text-white", children: "Economic Responsibility" }),
          /* @__PURE__ */ jsx("p", { className: "text-white/80 leading-relaxed font-body-md text-sm", children: "We advocate for the transparent management of national resources to ensure they are invested in projects that create sustainable, long‑term jobs for our youth." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-l-2 border-accent pl-6", children: [
          /* @__PURE__ */ jsx("span", { className: "text-accent font-meta font-bold tracking-tight text-xs mb-3 block", children: "Core Pillar 02" }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-meta font-bold mb-4 tracking-tight text-white", children: "Youth Participation" }),
          /* @__PURE__ */ jsx("p", { className: "text-white/80 leading-relaxed font-body-md text-sm", children: "We believe young people must be at the heart of our progress, equipped with the skills and opportunities to lead Ghana’s development." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-l-2 border-primary pl-6", children: [
          /* @__PURE__ */ jsx("span", { className: "text-primary font-meta font-bold tracking-tight text-xs mb-3 block", children: "Core Pillar 03" }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-meta font-bold mb-4 tracking-tight text-white", children: "Integrity & Accountability" }),
          /* @__PURE__ */ jsx("p", { className: "text-white/80 leading-relaxed font-body-md text-sm", children: "A movement built on trust. We believe every leader must be answerable to the citizens they represent and the promises they make." })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { "aria-labelledby": "stats-heading", className: "py-32 bg-stone-50 border-y border-border/40 relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-8 relative z-10", children: [
        /* @__PURE__ */ jsx("h2", { id: "stats-heading", className: "sr-only", children: "Movement Statistics" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16", children: [
          /* @__PURE__ */ jsxs("div", { className: "group", children: [
            /* @__PURE__ */ jsx(BrandLine, { className: "mb-6 opacity-60" }),
            /* @__PURE__ */ jsx("dd", { className: "m-0", children: /* @__PURE__ */ jsx(AnimatedCounter, { target: stats.members, className: "text-6xl lg:text-7xl font-meta font-bold tracking-tighter text-on-surface mb-2" }) }),
            /* @__PURE__ */ jsx("dt", { className: "text-micro font-bold text-primary tracking-tight normal-case mb-2", children: "Members registered nationwide" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground/80 leading-relaxed max-w-[240px]", children: "Verified citizens joined across the movement's national network." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "group", children: [
            /* @__PURE__ */ jsx(BrandLine, { className: "mb-6 opacity-60" }),
            /* @__PURE__ */ jsx("dd", { className: "m-0", children: /* @__PURE__ */ jsx(AnimatedCounter, { target: stats.chapters, className: "text-6xl lg:text-7xl font-meta font-bold tracking-tighter text-on-surface mb-2" }) }),
            /* @__PURE__ */ jsx("dt", { className: "text-micro font-bold text-accent tracking-tight normal-case mb-2", children: "Community branches active in nearly every district" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground/80 leading-relaxed max-w-[240px]", children: "Local community branches established and operating nationwide." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "group", children: [
            /* @__PURE__ */ jsx(BrandLine, { className: "mb-6 opacity-60" }),
            /* @__PURE__ */ jsx("dd", { className: "m-0", children: /* @__PURE__ */ jsx(AnimatedCounter, { target: stats.regions, className: "text-6xl lg:text-7xl font-meta font-bold tracking-tighter text-on-surface mb-2" }) }),
            /* @__PURE__ */ jsx("dt", { className: "text-micro font-bold text-destructive tracking-tight normal-case mb-2", children: "Movement presence across all 16 regions" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground/80 leading-relaxed max-w-[240px]", children: "Full representation and active coordination across every administrative region." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "group", children: [
            /* @__PURE__ */ jsx(BrandLine, { className: "mb-6 opacity-60" }),
            /* @__PURE__ */ jsx("dd", { className: "m-0", children: /* @__PURE__ */ jsx(AnimatedCounter, { target: stats.diaspora, className: "text-6xl lg:text-7xl font-meta font-bold tracking-tighter text-on-surface mb-2" }) }),
            /* @__PURE__ */ jsx("dt", { className: "text-micro font-bold text-on-surface/80 tracking-tight normal-case mb-2", children: "Diaspora supporters registered online" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground/80 leading-relaxed max-w-[240px]", children: "Global Ghanaians committed to supporting national development from abroad." })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { "aria-labelledby": "updates-heading", className: "pt-24 pb-48 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-[1280px] mx-auto px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end mb-12", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-primary font-bold tracking-tight text-micro mb-3 block", children: "Updates" }),
          /* @__PURE__ */ jsx("h2", { id: "updates-heading", className: "text-3xl md:text-h2 font-meta font-bold text-on-surface tracking-tight", children: "Latest updates" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground/60 mt-2", children: "Stories from our communities, branches, and partners." }),
          /* @__PURE__ */ jsx(BrandLine, { className: "mt-4" })
        ] }),
        /* @__PURE__ */ jsxs(Link, { to: "/blog", className: "hidden md:flex items-center gap-2 text-primary font-meta font-bold tracking-tight text-xs hover:underline", children: [
          "View all news ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-3 gap-8", children: latestPosts.length === 0 ? Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-[16/10] bg-muted animate-pulse" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted animate-pulse w-3/4" }),
        /* @__PURE__ */ jsx("div", { className: "h-3 bg-muted animate-pulse w-1/2" })
      ] }, i)) : latestPosts.map((post) => /* @__PURE__ */ jsxs(Link, { to: `/blog/${post.slug}`, className: "group", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-[16/10] overflow-hidden mb-6 border border-border/60 bg-muted", children: post.imageUrl ? /* @__PURE__ */ jsx(
          "img",
          {
            src: post.imageUrl,
            alt: post.title,
            className: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
            decoding: "async"
          }
        ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80", children: /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight", children: "The Base" }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-micro font-meta font-bold text-primary tracking-tight", children: post.category }),
          /* @__PURE__ */ jsx("span", { className: "text-micro text-muted-foreground font-meta", children: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "" })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-meta font-bold text-on-surface tracking-tight leading-tight group-hover:text-primary transition-colors", children: post.title })
      ] }, post.id)) }),
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", className: "md:hidden flex w-full h-12 mt-10", children: /* @__PURE__ */ jsxs(Link, { to: "/blog", className: "flex items-center justify-center gap-2", children: [
        "View all news ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { "aria-labelledby": "cta-heading", className: "relative px-8 pb-32 bg-white", children: /* @__PURE__ */ jsx("div", { className: "max-w-[1280px] mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "relative z-20 bg-on-surface rounded-[2rem] overflow-hidden shadow-[0_48px_96px_-16px_rgba(0,0,0,0.5)] -mt-20", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50 pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 p-12 md:p-24 flex flex-col items-center text-center", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl", children: [
        /* @__PURE__ */ jsx("span", { className: "text-accent font-meta font-bold tracking-tight text-xs mb-6 block", children: "Ready to build Ghana?" }),
        /* @__PURE__ */ jsx("h2", { id: "cta-heading", className: "text-4xl md:text-6xl font-meta font-bold text-white mb-8 leading-[1.1] tracking-tighter", children: "Join the Movement Shaping Ghana’s Future." }),
        /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-white/80 mb-12 leading-relaxed font-body-md max-w-2xl mx-auto", children: "Be part of a growing movement focused on jobs, accountability, and a stronger future for the next generation." }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-3 justify-center mb-12", children: [
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "gold", size: "lg", className: "w-full sm:w-auto", children: /* @__PURE__ */ jsxs(Link, { to: "/register", className: "flex items-center justify-center gap-3", children: [
            "Register Now ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5" })
          ] }) }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "primary", size: "lg", className: "w-full sm:w-auto", children: /* @__PURE__ */ jsxs(Link, { to: "/our-agenda", className: "flex items-center justify-center gap-3", children: [
            "Get Involved ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center justify-center gap-3", children: ["Base Ghana", "Base Diaspora", "Free Registration"].map((label) => /* @__PURE__ */ jsx("span", { className: "px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-micro font-meta font-bold text-white/80 tracking-tight", children: label }, label)) })
      ] }) })
    ] }) }) })
  ] });
}
function Login() {
  const { settings } = useBranding();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.login(email, password);
      const user = authService.getUser();
      if (user) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userName", user.user_metadata?.full_name || "Patriot");
        if (user.user_metadata?.avatar_url) localStorage.setItem("userAvatar", user.user_metadata.avatar_url);
      }
      localStorage.setItem("isLoggedIn", "true");
      window.dispatchEvent(new Event("storage"));
      toast$1.success("Welcome back, patriot!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast$1.error(error instanceof Error ? error.message : "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("main", { className: "bg-surface-warm font-body-md min-h-screen flex flex-col justify-center py-12", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Member Sign In",
        description: "Secure access to the The Base Movement platform. Manage your membership, connect with your chapter, and participate in feedback.",
        canonical: "/login"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full mx-auto px-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-block hover:opacity-80 transition-opacity", children: /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "The Base", className: "h-16 w-auto mx-auto mb-4 object-contain", decoding: "async" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-charcoal-dark tracking-tight font-meta mb-2", children: "The Base" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 font-meta tracking-tight", children: "Member sign in" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-none shadow-sm p-8 md:p-10", children: [
        /* @__PURE__ */ jsxs("form", { className: "space-y-6", onSubmit: handleLogin, children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "phone", className: "text-xs font-bold text-charcoal-dark font-meta tracking-tight", children: "Phone number or email" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "phone",
                type: "text",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                placeholder: "e.g. you@example.com",
                className: "w-full form-understate p-4 text-charcoal-dark text-sm",
                required: true
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-slate-500 font-meta tracking-wide mt-1", children: "Enter your email address associated with your membership" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "text-xs font-bold text-charcoal-dark font-meta tracking-tight", children: "Password" }),
              /* @__PURE__ */ jsx(Link, { to: "#", className: "text-xs text-[var(--brand-green)] hover:underline font-meta", children: "Forgot?" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "password",
                  type: showPassword ? "text" : "password",
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  placeholder: "Your password",
                  className: "w-full form-understate p-4 text-charcoal-dark text-sm",
                  required: true
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPassword(!showPassword),
                  className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--brand-green)]",
                  children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              disabled: isLoading,
              variant: "primary",
              className: "w-full font-meta font-bold tracking-tight py-7 transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2 disabled:opacity-50 text-base",
              children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
                " Authenticating..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                "Sign In ",
                /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
              ] })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "relative my-8", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("span", { className: "w-full border-t border-slate-100" }) }),
            /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-xs", children: /* @__PURE__ */ jsx("span", { className: "bg-white px-4 text-slate-400 font-meta tracking-tight", children: "Or continue with" }) })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: async () => {
                try {
                  await authService.signInWithGoogle();
                } catch (error) {
                  toast$1.error(error instanceof Error ? error.message : "Google login failed");
                }
              },
              className: "w-full bg-white border border-slate-200 hover:bg-slate-50 text-charcoal-dark font-meta font-bold tracking-tight py-4 transition-all active:scale-[0.99] flex items-center justify-center gap-3",
              children: [
                /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
                      fill: "#4285F4"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
                      fill: "#34A853"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z",
                      fill: "#FBBC05"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z",
                      fill: "#EA4335"
                    }
                  )
                ] }),
                "Sign In with Google"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 pt-6 border-t border-slate-100 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 font-body-md", children: [
          "Not a member yet?",
          " ",
          /* @__PURE__ */ jsx(Link, { to: "/register", className: "text-[var(--brand-green)] font-bold hover:underline", children: "Join the Movement" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-center mt-8", children: /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " The Base. Secure Login."
      ] }) })
    ] })
  ] });
}
const MembershipCard = ({
  userName,
  avatarUrl,
  userRegNo,
  onPhotoClick,
  initials,
  gender,
  joinedDate,
  status,
  country,
  region,
  constituency,
  chapter
}) => {
  const { settings } = useBranding();
  return /* @__PURE__ */ jsxs("div", { className: "relative aspect-[1.6/1] w-full overflow-hidden bg-white flex flex-col font-meta shadow-2xl border-l-[3px] border-r-[3px] border-primary border-t-destructive border-b-accent rounded-[8px]", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-destructive p-3 sm:p-4 flex justify-between items-start", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 sm:gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-[8px] p-1 shadow-md", children: /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "Logo", className: "w-full h-full object-contain", decoding: "async", loading: "lazy" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-white font-bold text-micro sm:text-xs leading-none", children: "The Base Movement" }),
          /* @__PURE__ */ jsx("p", { className: "text-white/80 text-[6px] sm:text-[7px] font-medium mt-1", children: "Ghana First, jobs for the youth!" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "px-2 sm:px-3 py-1 bg-white/10 border border-white/20 rounded-none", children: /* @__PURE__ */ jsx("span", { className: "text-white text-[7px] sm:text-[8px] font-bold tracking-tight", children: country && country !== "Ghana" ? "Base Diaspora Member" : "Ghana Member" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 p-3 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4 relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "w-24 h-28 sm:w-34 sm:h-42 p-[1.5px] shrink-0 bg-gradient-to-b from-destructive via-accent to-primary shadow-lg relative z-10 rounded-[4px]", children: /* @__PURE__ */ jsx("div", { className: "w-full h-full p-1 bg-muted/30 rounded-[3px]", children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: `w-full h-full bg-muted overflow-hidden relative group rounded-[2px] ${onPhotoClick ? "cursor-pointer" : ""}`,
          onClick: onPhotoClick,
          children: [
            avatarUrl ? /* @__PURE__ */ jsx("img", { src: avatarUrl, alt: userName, className: "w-full h-full object-cover", decoding: "async", loading: "lazy" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-primary flex items-center justify-center text-white text-xl sm:text-2xl font-bold", children: initials || "M" }),
            onPhotoClick && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-white text-sm sm:text-base", children: "photo_camera" }) })
          ]
        }
      ) }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1 sm:space-y-1.5 min-w-0 pr-20 sm:pr-24", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h5", { className: "text-[hsl(var(--foreground))] font-bold text-micro sm:text-xl tracking-tight leading-normal truncate pb-[2px]", title: userName || "Member Name", children: userName || "Member Name" }),
          /* @__PURE__ */ jsx("div", { className: "h-0.5 w-6 sm:w-12 bg-primary mt-0.5" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-y-0.5 sm:gap-y-1 text-on-surface", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[7px] sm:text-micro font-bold text-muted-foreground w-12 sm:w-16 shrink-0", children: "Reg. no." }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-tiny font-bold text-primary tracking-tight whitespace-nowrap overflow-hidden truncate pb-[1px]", children: userRegNo || "DI-XXXXXX" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[7px] sm:text-micro font-bold text-muted-foreground w-12 sm:w-16 shrink-0", children: "Gender" }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-micro font-bold whitespace-nowrap overflow-hidden truncate pb-[1px]", children: gender || "Not Specified" })
          ] }),
          !country || country === "Ghana" ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[7px] sm:text-micro font-bold text-muted-foreground w-12 sm:w-16 shrink-0", children: "Region" }),
              /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-micro font-bold whitespace-nowrap overflow-hidden truncate pb-[1px]", children: region || "Not Specified" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[7px] sm:text-micro font-bold text-muted-foreground w-12 sm:w-16 shrink-0", children: "Const." }),
              /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-micro font-bold whitespace-nowrap overflow-hidden truncate pb-[1px]", children: constituency || "Not Specified" })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[7px] sm:text-micro font-bold text-muted-foreground w-12 sm:w-16 shrink-0", children: "Country" }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-micro font-bold whitespace-nowrap overflow-hidden truncate pb-[1px]", children: country || "Not Specified" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[7px] sm:text-micro font-bold text-muted-foreground w-12 sm:w-16 shrink-0", children: "Chapter" }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-micro font-bold whitespace-nowrap overflow-hidden truncate pb-[1px]", children: chapter || "Not Specified" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[7px] sm:text-micro font-bold text-muted-foreground w-12 sm:w-16 shrink-0", children: "Joined" }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-micro font-bold whitespace-nowrap overflow-hidden truncate pb-[1px]", children: joinedDate || "30 Apr 2026" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[7px] sm:text-micro font-bold text-muted-foreground w-12 sm:w-16 shrink-0", children: "Status" }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] sm:text-micro font-bold text-primary whitespace-nowrap overflow-hidden truncate pb-[1px]", children: status || "Verified" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "absolute top-1/2 -translate-y-1/2 right-2 sm:right-6 flex flex-col items-center scale-[0.65] sm:scale-[1.0] origin-right z-20", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-white border border-border/60 p-1 shadow-sm", children: /* @__PURE__ */ jsx(
          QRCodeSVG,
          {
            value: `${typeof window !== "undefined" ? window.location.origin : "https://thebasemovement.com"}/verify/${userRegNo || "DI-XXXXXX"}`,
            size: 80,
            level: "H",
            includeMargin: false,
            className: "w-12 h-12 sm:w-20 sm:h-20"
          }
        ) }),
        /* @__PURE__ */ jsx("span", { className: "text-[6px] sm:text-[8px] text-muted-foreground/80 mt-1 font-bold tracking-tight", children: "Verify id" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0", children: /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "", className: "w-40 sm:w-64 object-contain grayscale", decoding: "async", loading: "lazy" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-muted/30 border-t border-border/40 px-3 sm:px-6 py-1 sm:py-1.5 flex items-center justify-center", children: /* @__PURE__ */ jsxs("p", { className: "text-[5px] sm:text-[7px] text-muted-foreground/80 font-bold tracking-tight truncate leading-none m-0", children: [
      typeof window !== "undefined" ? window.location.origin : "https://thebasemovement.com",
      "/verify/",
      userRegNo || "DI-XXXXXX"
    ] }) })
  ] });
};
async function getCroppedImg(imageSrc, pixelCrop, flip = { horizontal: false, vertical: false }) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  const rotRad = 0;
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotRad
  );
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, "image/jpeg", 0.85);
  });
}
const createImage = (url) => new Promise((resolve, reject) => {
  const image = new Image();
  image.addEventListener("load", () => resolve(image));
  image.addEventListener("error", (error) => reject(error));
  image.setAttribute("crossOrigin", "anonymous");
  image.src = url;
});
function rotateSize(width, height, rotation) {
  const rotRad = rotation * Math.PI / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height)
  };
}
const ageRanges = ["16-25", "26-40", "41-60", "60+"];
function Register() {
  const { settings } = useBranding();
  const [searchParams] = useSearchParams();
  const platformParam = searchParams.get("platform");
  const [step, setStep] = useState(platformParam ? "form" : "choice");
  const [formStep, setFormStep] = useState(1);
  const [platform, setPlatform] = useState(platformParam || "GHANA");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [regNumber, setRegNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dbCountries, setDbCountries] = useState([]);
  const [dbCountryCodes, setDbCountryCodes] = useState({ "Ghana": "+233" });
  const [dbRegions, setDbRegions] = useState([]);
  const [dbConstituencies, setDbConstituencies] = useState([]);
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: countriesData, error: countriesError } = await supabase.from("countries").select("*").order("name", { ascending: true });
        if (countriesError) throw countriesError;
        if (Array.isArray(countriesData)) {
          const names = countriesData.map((c) => c.name);
          const codes = {};
          countriesData.forEach((c) => {
            codes[c.name] = c.dialing_code;
          });
          const uniqueNames = Array.from(new Set(names.filter((n) => n !== "Ghana")));
          setDbCountries(uniqueNames);
          setDbCountryCodes(codes);
        }
        const { data: regionsData, error: regionsError } = await supabase.from("ghana_regions").select("*").order("name", { ascending: true });
        if (regionsError) throw regionsError;
        const uniqueRegions = Array.from(new Map((regionsData || []).map((r) => [r.name, r])).values());
        setDbRegions(uniqueRegions);
        const { data: conData, error: conError } = await supabase.from("ghana_constituencies").select("*").order("name", { ascending: true });
        if (conError) throw conError;
        const uniqueConstituencies = Array.from(
          new Map((conData || []).map((c) => [`${c.region_id}-${c.name}`, c])).values()
        );
        setDbConstituencies(uniqueConstituencies);
      } catch (error) {
        console.error("[DATABASE] Failed to fetch master data for registration:", error);
      }
    }
    fetchData();
  }, []);
  const navigate = useNavigate();
  const [isScanningId, setIsScanningId] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const handleIdScan = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsScanningId(true);
    try {
      const file = e.target.files[0];
      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("ocr-verify", {
        body: { imageBase64: base64 }
      });
      if (error) throw error;
      if (data && data.success && data.data) {
        toast$1.success(`Identity Verified: Welcome, ${data.data.fullName || "Patriot"}`);
        setFormData((prev) => ({
          ...prev,
          fullName: data.data.fullName || prev.fullName,
          idNumber: data.data.idNumber || prev.idNumber
        }));
        if (data.data.dateOfBirth) {
          const birthYear = new Date(data.data.dateOfBirth).getFullYear();
          const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
          const age = currentYear - birthYear;
          let computedAgeRange = "";
          if (age >= 16 && age <= 25) computedAgeRange = "16-25";
          else if (age >= 26 && age <= 40) computedAgeRange = "26-40";
          else if (age >= 41 && age <= 60) computedAgeRange = "41-60";
          else if (age > 60) computedAgeRange = "60+";
          if (computedAgeRange) {
            setFormData((prev) => ({ ...prev, ageRange: computedAgeRange }));
          }
        }
      } else {
        throw new Error(data?.error || "Could not read ID card");
      }
    } catch (err) {
      console.error(err);
      toast$1.error(err instanceof Error ? err.message : "Verification failed. Please enter details manually.");
    } finally {
      setIsScanningId(false);
    }
  };
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels2) => {
    setCroppedAreaPixels(croppedAreaPixels2);
  }, []);
  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setPhotoUrl(reader.result?.toString() || null));
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  const [formData, setFormData] = useState({
    idNumber: "",
    fullName: "",
    countryCode: "+233",
    country: "Ghana",
    children_count: 0,
    contactNumber: "",
    ageRange: "",
    gender: "Male",
    password: "",
    email: "",
    residentialAddress: "",
    region: "",
    constituency: "",
    chapter: "",
    profession: "",
    educationLevel: "",
    emergencyContactName: "",
    emergencyRelationship: "",
    emergencyNumber: ""
  });
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handlePlatformChange = (newPlatform) => {
    setPlatform(newPlatform);
    if (newPlatform === "GHANA") {
      setFormData((prev) => ({ ...prev, country: "Ghana", countryCode: "+233" }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formStep < 4) {
      setFormStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const yearStr = (/* @__PURE__ */ new Date()).getFullYear().toString().slice(-2);
      const randomNum = String(Math.floor(1e3 + Math.random() * 9e3));
      const regNo = `TBM-${platform === "GHANA" ? "GH" : "DI"}-${yearStr}${randomNum}`;
      setRegNumber(regNo);
      setIsLoading(true);
      try {
        const authEmail = formData.email || `${regNo.toLowerCase()}@thebase.org`;
        let finalAvatarUrl = photoUrl;
        if (photoUrl && croppedAreaPixels) {
          try {
            const croppedBlob = await getCroppedImg(photoUrl, croppedAreaPixels);
            if (!croppedBlob) throw new Error("Cropping failed");
            const fileName = `${regNo}.jpg`;
            const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, croppedBlob, {
              upsert: true,
              contentType: "image/jpeg"
            });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
            finalAvatarUrl = urlData.publicUrl;
          } catch (uploadErr) {
            console.error("[STORAGE] Avatar upload failed, falling back to local URL:", uploadErr);
          }
        }
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: authEmail,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              avatar_url: finalAvatarUrl
            }
          }
        });
        if (authError) throw authError;
        const { error: dbError } = await supabase.from("users").insert({
          id: authData.user?.id,
          national_id: formData.idNumber,
          full_name: formData.fullName,
          email: authEmail,
          registration_number: regNo,
          platform,
          country: formData.country,
          phone_number: formData.countryCode + formData.contactNumber,
          gender: formData.gender,
          region: formData.region,
          constituency: formData.constituency,
          chapter: formData.chapter,
          profession: formData.profession,
          status: "Pending",
          verification_status: "In Review",
          age_range: formData.ageRange,
          education_level: formData.educationLevel,
          emergency_name: formData.emergencyContactName,
          emergency_relationship: formData.emergencyRelationship,
          emergency_phone: formData.emergencyNumber,
          avatar_url: finalAvatarUrl,
          children_count: formData.children_count
        });
        if (dbError) throw dbError;
        toast$1.success("Official records synchronized.");
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.error("[DATABASE] Registration failed:", error);
        toast$1.error(error instanceof Error ? error.message : "Registration failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };
  const goBack = () => {
    setFormStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (submitted) {
    return /* @__PURE__ */ jsx("main", { className: "bg-background font-body-md min-h-screen py-12 px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6 animate-bounce", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-8 h-8" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-on-surface tracking-tighter font-meta mb-2", children: "Registration complete" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/90 font-meta tracking-tight text-xs", children: "Welcome to the movement, patriot." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/60 p-2 shadow-2xl relative", children: [
          /* @__PURE__ */ jsx("div", { className: "border-b border-border/40 pb-3 mb-4 px-4 pt-2", children: /* @__PURE__ */ jsx("h3", { className: "font-meta font-bold text-micro text-muted-foreground/80 tracking-tight", children: "Official membership card" }) }),
          /* @__PURE__ */ jsx("div", { className: "max-w-md mx-auto py-4", children: /* @__PURE__ */ jsx(
            MembershipCard,
            {
              userName: formData.fullName,
              avatarUrl: photoUrl,
              userRegNo: regNumber,
              initials: formData.fullName.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join(""),
              gender: formData.gender + " / " + formData.ageRange,
              joinedDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
              status: "Active & Verified",
              region: formData.region,
              constituency: formData.constituency,
              country: formData.country,
              chapter: formData.chapter
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "bg-muted/30 p-6 mt-4 border-t border-border/40", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-meta font-bold text-xs text-on-surface tracking-tight mb-1", children: "Registration number" }),
              /* @__PURE__ */ jsx("p", { className: "font-meta font-bold text-xl text-primary tracking-tight", children: regNumber })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "gold",
                  onClick: () => window.print(),
                  className: "flex items-center justify-center gap-2 px-6 py-3 h-auto",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[18px]", children: "print" }),
                    "Print card"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "default",
                  onClick: () => setSubmitted(false),
                  className: "flex items-center justify-center gap-2 px-6 py-3 h-auto text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50 transition-all active:scale-95 shadow-sm",
                  children: [
                    /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
                    " Edit info"
                  ]
                }
              )
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/60 p-8 shadow-sm", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-meta font-bold text-micro text-muted-foreground/80 tracking-tight mb-4", children: "Membership verification" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-primary animate-pulse" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface font-meta tracking-tight", children: "Status: Verified" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-2 font-body-md leading-relaxed", children: "Your official records have been synchronized with the movement's hub. You can now access the platform overview." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-primary text-primary-foreground p-8 flex flex-col justify-between shadow-lg", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-meta font-bold text-micro text-primary-foreground/90 tracking-tight mb-4 uppercase", children: "Next step" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold font-meta leading-tight mb-4", children: "Access your portal to join a chapter and start mobilizing." })
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "default",
                onClick: () => navigate("/dashboard"),
                className: "w-full inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-primary-foreground h-auto p-3 text-center justify-center font-bold transition-all active:scale-95 shadow-sm",
                children: [
                  "Enter Overview ",
                  /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
                ]
              }
            )
          ] }),
          "            "
        ] })
      ] })
    ] }) });
  }
  if (step === "choice") {
    return /* @__PURE__ */ jsxs("main", { className: "bg-background font-body-md min-h-screen flex flex-col justify-center py-12 px-4", children: [
      /* @__PURE__ */ jsx(
        SEO,
        {
          title: "Join the Movement",
          description: "Register to join The Base Movement. Whether in Ghana or the diaspora, your contribution matters for national development.",
          canonical: "/register"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "max-w-5xl w-full mx-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
          /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "The Base", className: "h-24 w-auto mx-auto mb-6 object-contain", decoding: "async" }),
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-on-surface tracking-tighter font-meta mb-2", children: "The Base" }),
          /* @__PURE__ */ jsx("div", { className: "w-20 h-1.5 bg-destructive mx-auto mb-6" }),
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-muted-foreground tracking-tight font-meta", children: "Membership registration options" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12", children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => {
                handlePlatformChange("GHANA");
                setStep("form");
                setFormStep(1);
              },
              className: "group relative bg-white border border-border/60 hover:border-brand-green/40 p-10 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-brand-green/10 flex flex-col justify-between",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-0 h-1.5 bg-brand-green group-hover:w-full transition-all duration-700" }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-8", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-brand-green/5 flex items-center justify-center group-hover:bg-brand-green/10 transition-colors", children: /* @__PURE__ */ jsx(FileText, { className: "w-10 h-10 text-brand-green" }) }),
                    /* @__PURE__ */ jsx("div", { className: "text-micro font-bold text-brand-green bg-brand-green/10 px-3 py-1 tracking-tight", children: "In-country" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxs("h3", { className: "font-bold text-3xl text-on-surface tracking-tight font-meta leading-none group-hover:text-brand-green transition-colors", children: [
                      "Local membership ",
                      /* @__PURE__ */ jsx("br", {}),
                      " (Ghana)"
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground/90 leading-relaxed font-body-md", children: "Designed for citizens and residents currently living within the 16 regions of Ghana. This is the core of our grassroots mobilization." }),
                      /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: [
                        "Automatic assignment to your regional and constituency chapter",
                        "Full voting rights on tactical and leadership directives",
                        "Eligibility for local leadership and volunteer roles",
                        "Access to physical field stations and community hubs"
                      ].map((item, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3 text-xs text-on-surface/90 font-body-md", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" }),
                        item
                      ] }, i)) }),
                      /* @__PURE__ */ jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsxs(
                        Link,
                        {
                          to: "/register/preview?platform=GHANA",
                          onClick: (e) => e.stopPropagation(),
                          className: "inline-flex items-center gap-2 text-micro font-bold tracking-tight text-brand-green/60 hover:text-brand-green hover:underline transition-all",
                          children: [
                            /* @__PURE__ */ jsx(Download, { className: "w-3 h-3" }),
                            "Download paper form (Ghana)"
                          ]
                        }
                      ) })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-10 pt-6 border-t border-border/40 flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-tiny font-bold tracking-tight text-brand-green", children: [
                    "Select membership ",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 transition-transform group-hover:translate-x-1" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-on-surface/5 group-hover:text-brand-green/20 transition-colors", children: /* @__PURE__ */ jsx(ArrowRight, { className: "w-16 h-16 rotate-[-45deg]" }) })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => {
                handlePlatformChange("DIASPORA");
                setStep("form");
                setFormStep(1);
              },
              className: "group relative bg-white border border-border/60 hover:border-brand-gold/40 p-10 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-brand-gold/10 flex flex-col justify-between",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-0 h-1.5 bg-brand-gold group-hover:w-full transition-all duration-700" }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-8", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-brand-gold/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors", children: /* @__PURE__ */ jsx(User, { className: "w-10 h-10 text-brand-gold" }) }),
                    /* @__PURE__ */ jsx("div", { className: "text-micro font-bold text-brand-gold bg-brand-gold/10 px-3 py-1 tracking-tight", children: "Global community" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxs("h3", { className: "font-bold text-3xl text-on-surface tracking-tight font-meta leading-none group-hover:text-brand-gold transition-colors", children: [
                      "Diaspora ",
                      /* @__PURE__ */ jsx("br", {}),
                      " membership"
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground/90 leading-relaxed font-body-md", children: "Tailored for Ghanaians and supporters living abroad. Leverage your global expertise and resources to transform the motherland." }),
                      /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: [
                        "Participation in global advisory and expert committees",
                        "Special access to digital town halls and diaspora forums",
                        "Support the movement's logistics and intelligence operations",
                        "Dedicated Diaspora Member ID and recognition"
                      ].map((item, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3 text-xs text-on-surface/90 font-body-md", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 shrink-0" }),
                        item
                      ] }, i)) }),
                      /* @__PURE__ */ jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsxs(
                        Link,
                        {
                          to: "/register/preview?platform=DIASPORA",
                          onClick: (e) => e.stopPropagation(),
                          className: "inline-flex items-center gap-2 text-micro font-bold tracking-tight text-brand-gold/60 hover:text-brand-gold hover:underline transition-all",
                          children: [
                            /* @__PURE__ */ jsx(Download, { className: "w-3 h-3" }),
                            "Download paper form (Diaspora)"
                          ]
                        }
                      ) })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-10 pt-6 border-t border-border/40 flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-tiny font-bold tracking-tight text-brand-gold", children: [
                    "Select membership ",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 transition-transform group-hover:translate-x-1" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-on-surface/5 group-hover:text-brand-gold/20 transition-colors", children: /* @__PURE__ */ jsx(ArrowRight, { className: "w-16 h-16 rotate-[-45deg]" }) })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-center mt-16 pt-8 border-t border-border/60", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground font-body-md", children: [
          "Already a member? ",
          /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-primary font-bold hover:underline", children: "Sign in securely" })
        ] }) })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("main", { className: "bg-background font-body-md min-h-screen", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-border/60 pt-16 pb-12 px-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "The Base", className: "h-20 w-auto mx-auto mb-6 object-contain", decoding: "async" }),
      /* @__PURE__ */ jsx("h1", { className: "text-on-surface mb-2", children: "The Base" }),
      /* @__PURE__ */ jsxs("div", { className: "w-24 h-1.5 mx-auto mb-4 flex", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 bg-destructive" }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 bg-accent" }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 bg-primary" })
      ] }),
      /* @__PURE__ */ jsx("h2", { className: "text-muted-foreground mb-8", children: "Official Registration Form" }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "default",
          onClick: () => setStep("choice"),
          className: "inline-flex items-center gap-2 px-6 py-2 h-auto text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50 transition-all active:scale-95 shadow-sm",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-3.5 h-3.5" }),
            " Back to registration options"
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "max-w-6xl mx-auto py-12 px-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-12 items-start", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3 space-y-2 sticky top-8", children: [
        /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight mb-6 pl-4", children: "Registration progress" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1", children: [
          { step: 1, label: "Primary details" },
          { step: 2, label: "Demographic info" },
          { step: 3, label: "Emergency contact" },
          { step: 4, label: "Final verification" }
        ].map((item) => /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-4 p-4 transition-all border-l-4 ${formStep === item.step ? "bg-white border-primary shadow-sm" : "border-transparent text-muted-foreground/80 opacity-60"}`, children: [
          /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-meta shrink-0 ${formStep >= item.step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`, children: formStep > item.step ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5" }) : item.step }),
          /* @__PURE__ */ jsx("span", { className: `text-xs font-bold tracking-tight font-meta ${formStep === item.step ? "text-on-surface" : ""}`, children: item.label })
        ] }, item.step)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-12 pl-4 pt-8 border-t border-border/60", children: [
          /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground/80 tracking-tight mb-1", children: "Need assistance?" }),
          /* @__PURE__ */ jsx("a", { href: "mailto:info@thebasemovement.com", className: "text-xs font-meta font-medium text-muted-foreground hover:text-primary transition-colors", children: "info@thebasemovement.com" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-9", children: /* @__PURE__ */ jsx("div", { className: "bg-white border border-border/60 p-8 md:p-12 shadow-sm", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
        formStep === 1 && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
          /* @__PURE__ */ jsx("div", { className: "border-b-2 border-primary/20 pb-3 mb-8", children: /* @__PURE__ */ jsx("h3", { className: "text-on-surface", children: "Step 1: Primary details" }) }),
          platform === "GHANA" && /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden mb-10 bg-on-surface rounded-sm p-8 border border-white/5 shadow-2xl", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-primary/10 -mr-32 -mt-32 blur-3xl" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                  /* @__PURE__ */ jsx(Zap, { className: "w-5 h-5 text-accent" }),
                  /* @__PURE__ */ jsx("h4", { className: "text-white font-meta font-bold tracking-tight text-lg", children: "AI identity verification" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-white/80 text-sm max-w-sm mb-0", children: "Scan your Ghana Card or Voter ID to instantly auto-fill your profile and verify your membership." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    accept: "image/*",
                    capture: "environment",
                    onChange: handleIdScan,
                    disabled: isScanningId,
                    className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    type: "button",
                    variant: "solid",
                    disabled: isScanningId,
                    className: "relative z-10 w-full sm:w-auto shadow-lg shadow-primary/20",
                    children: isScanningId ? /* @__PURE__ */ jsxs("span", { className: "flex items-center", children: [
                      /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                      " Scanning..."
                    ] }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center", children: [
                      /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 mr-2" }),
                      " Scan National ID"
                    ] })
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: [
              "Full name ",
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/80 ml-1", children: "(First & last name)" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                required: true,
                pattern: ".*\\s+.*",
                title: "Please enter both your first and last name separated by a space.",
                value: formData.fullName,
                onChange: (e) => handleChange("fullName", e.target.value),
                className: "w-full form-understate p-4 text-on-surface text-sm"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Membership platform" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: platform === "GHANA" ? "primary" : "default",
                  onClick: () => handlePlatformChange("GHANA"),
                  className: cn(
                    "h-auto p-4 text-sm transition-all active:scale-95 shadow-sm",
                    platform === "GHANA" ? "" : "text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50"
                  ),
                  children: "Ghana Base"
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: platform === "DIASPORA" ? "gold" : "default",
                  onClick: () => handlePlatformChange("DIASPORA"),
                  className: cn(
                    "h-auto p-4 text-sm transition-all active:scale-95 shadow-sm",
                    platform === "DIASPORA" ? "" : "text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50"
                  ),
                  children: "Diaspora Base"
                }
              )
            ] })
          ] }),
          platform === "GHANA" && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "National ID number (Optional)" }),
            /* @__PURE__ */ jsx("input", { value: formData.idNumber, onChange: (e) => handleChange("idNumber", e.target.value), placeholder: "GHA-000000000-0", className: "w-full form-understate p-4 text-on-surface text-sm" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-8", children: [
            platform === "DIASPORA" && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Country" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  required: true,
                  value: formData.country,
                  onChange: (e) => {
                    const selectedCountry = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      country: selectedCountry,
                      countryCode: dbCountryCodes[selectedCountry] || prev.countryCode
                    }));
                  },
                  className: "w-full form-understate p-4 text-on-surface text-sm",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Select Country" }),
                    dbCountries.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Phone" }),
              /* @__PURE__ */ jsxs("div", { className: "flex", children: [
                /* @__PURE__ */ jsx("select", { value: formData.countryCode, onChange: (e) => handleChange("countryCode", e.target.value), className: "px-2 bg-muted border border-border/60 text-xs", children: Array.from(new Set(Object.values(dbCountryCodes))).map((code) => /* @__PURE__ */ jsx("option", { value: code, children: code }, code)) }),
                /* @__PURE__ */ jsx("input", { required: true, value: formData.contactNumber, onChange: (e) => handleChange("contactNumber", e.target.value), className: "w-full form-understate p-4 text-on-surface text-sm" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Password" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: showPassword ? "text" : "password",
                  required: true,
                  minLength: 8,
                  value: formData.password,
                  onChange: (e) => handleChange("password", e.target.value),
                  className: "w-full form-understate p-4 pr-12 text-on-surface text-sm"
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  onClick: () => setShowPassword(!showPassword),
                  className: "absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-primary",
                  children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-micro text-muted-foreground/80 font-meta leading-relaxed", children: [
              "Avoid weak passwords like ",
              /* @__PURE__ */ jsx("span", { className: "text-on-surface font-bold", children: '"password123"' }),
              " or ",
              /* @__PURE__ */ jsx("span", { className: "text-on-surface font-bold", children: '"ghana2024"' }),
              ". Use a mix of letters, numbers, and symbols."
            ] })
          ] })
        ] }),
        formStep === 2 && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
          /* @__PURE__ */ jsx("div", { className: "border-b-2 border-primary/20 pb-3 mb-8", children: /* @__PURE__ */ jsx("h3", { className: "text-on-surface", children: "Step 2: Demographic details" }) }),
          /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Age range" }),
              /* @__PURE__ */ jsxs("select", { required: true, value: formData.ageRange, onChange: (e) => handleChange("ageRange", e.target.value), className: "w-full form-understate p-4 text-on-surface text-sm", children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select Range" }),
                ageRanges.map((r) => /* @__PURE__ */ jsx("option", { value: r, children: r }, r))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Gender" }),
              /* @__PURE__ */ jsxs("select", { required: true, value: formData.gender, onChange: (e) => handleChange("gender", e.target.value), className: "w-full form-understate p-4 text-on-surface text-sm", children: [
                /* @__PURE__ */ jsx("option", { value: "Male", children: "Male" }),
                /* @__PURE__ */ jsx("option", { value: "Female", children: "Female" }),
                /* @__PURE__ */ jsx("option", { value: "Other", children: "Other" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-8", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Number of children" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                value: formData.children_count,
                onChange: (e) => handleChange("children_count", e.target.value),
                className: "w-full form-understate p-4 text-on-surface text-sm",
                placeholder: "0"
              }
            )
          ] }) }),
          platform === "GHANA" && /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Region" }),
              /* @__PURE__ */ jsxs("select", { required: true, value: formData.region, onChange: (e) => handleChange("region", e.target.value), className: "w-full form-understate p-4 text-on-surface text-sm", children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select Region" }),
                dbRegions.map((r) => /* @__PURE__ */ jsx("option", { value: r.name, children: r.name }, r.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Constituency" }),
              /* @__PURE__ */ jsxs("select", { required: true, value: formData.constituency, onChange: (e) => handleChange("constituency", e.target.value), className: "w-full form-understate p-4 text-on-surface text-sm", children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select Constituency" }),
                formData.region && dbConstituencies.filter((c) => c.region_id === dbRegions.find((r) => r.name === formData.region)?.id).map((c) => /* @__PURE__ */ jsx("option", { value: c.name, children: c.name }, c.name))
              ] })
            ] })
          ] })
        ] }),
        formStep === 3 && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
          /* @__PURE__ */ jsx("div", { className: "border-b-2 border-primary/20 pb-3 mb-8", children: /* @__PURE__ */ jsx("h3", { className: "text-on-surface", children: "Step 3: Emergency & profile" }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Profession" }),
            /* @__PURE__ */ jsx("input", { required: true, value: formData.profession, onChange: (e) => handleChange("profession", e.target.value), className: "w-full form-understate p-4 text-on-surface text-sm" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Emergency name" }),
              /* @__PURE__ */ jsx("input", { required: true, value: formData.emergencyContactName, onChange: (e) => handleChange("emergencyContactName", e.target.value), className: "w-full form-understate p-4 text-on-surface text-sm" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Emergency phone" }),
              /* @__PURE__ */ jsx("input", { required: true, value: formData.emergencyNumber, onChange: (e) => handleChange("emergencyNumber", e.target.value), className: "w-full form-understate p-4 text-on-surface text-sm" })
            ] })
          ] })
        ] }),
        formStep === 4 && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
          /* @__PURE__ */ jsx("div", { className: "border-b-2 border-primary/20 pb-3 mb-8", children: /* @__PURE__ */ jsx("h3", { className: "text-on-surface", children: "Step 4: Final verification" }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-on-surface font-meta tracking-tight block", children: "Photo" }),
            !photoUrl ? /* @__PURE__ */ jsxs("div", { className: "border-2 border-dashed p-12 text-center bg-muted/30 relative", children: [
              /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", onChange: handlePhotoUpload, className: "absolute inset-0 opacity-0 cursor-pointer" }),
              /* @__PURE__ */ jsx(Upload, { className: "mx-auto mb-4 text-muted-foreground/40" }),
              /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-muted-foreground", children: "Upload photo" })
            ] }) : /* @__PURE__ */ jsx("div", { className: "relative h-[400px] bg-on-surface", children: /* @__PURE__ */ jsx(Cropper, { image: photoUrl, crop, zoom, aspect: 3 / 4, onCropChange: setCrop, onCropComplete, onZoomChange: setZoom }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 p-6 bg-on-surface text-white border-l-4 border-primary", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: agreed, onChange: (e) => setAgreed(e.target.checked), className: "mt-1" }),
            /* @__PURE__ */ jsx("label", { className: "text-sm", children: "I accept the declaration and agree to the Privacy Policy." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-10 mt-12 border-t border-border/60 flex justify-between gap-4", children: [
          formStep > 1 && /* @__PURE__ */ jsx(Button, { type: "button", variant: "default", onClick: goBack, className: "w-1/3 py-6", children: "Back" }),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              variant: "solid",
              disabled: formStep === 4 && !agreed || isLoading,
              className: "flex-1 py-6",
              children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }),
                " Processing..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                formStep < 4 ? "Next step" : "Submit registration",
                /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
              ] })
            }
          )
        ] })
      ] }) }) })
    ] }) })
  ] });
}
function WelcomeModal({ isOpen, onClose, userName, assignedChapter }) {
  const navigate = useNavigate();
  if (!isOpen) return null;
  const handleChooseDifferent = () => {
    onClose();
    navigate("/dashboard/chapters");
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-[110] flex items-center justify-center p-4 bg-charcoal-dark/70 backdrop-blur-md animate-in fade-in duration-300",
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "bg-white w-full max-w-lg rounded-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex h-1.5 w-full", children: [
              /* @__PURE__ */ jsx("div", { className: "flex-1 bg-[var(--brand-red)]" }),
              /* @__PURE__ */ jsx("div", { className: "flex-1 bg-[var(--brand-gold)]" }),
              /* @__PURE__ */ jsx("div", { className: "flex-1 bg-[var(--brand-green)]" })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: onClose,
                className: "absolute top-6 right-6 w-8 h-8 rounded-none bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 hover:text-[var(--brand-green)] transition-colors z-10",
                children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "p-10", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", children: [
                /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-[var(--brand-green)]/10 flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(MapPin, { className: "w-8 h-8 text-[var(--brand-green)]" }) }),
                /* @__PURE__ */ jsx("h2", { className: "text-stone-900 mb-3", children: "Your Chapter Assignment" }),
                /* @__PURE__ */ jsxs("p", { className: "text-stone-500 max-w-sm mx-auto mb-0", children: [
                  "Welcome to the movement, ",
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-stone-800", children: userName }),
                  ". You've been automatically assigned to a chapter based on your registration details."
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "border-2 border-[var(--brand-green)] bg-emerald-50/30 p-6 mb-8 relative group", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5", children: [
                /* @__PURE__ */ jsx("div", { className: "w-14 h-14 bg-[var(--brand-green)] text-white flex items-center justify-center rounded-none shadow-lg", children: /* @__PURE__ */ jsx(Globe, { className: "w-7 h-7" }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                    /* @__PURE__ */ jsx("h5", { className: "text-stone-900 leading-tight mb-1", children: assignedChapter.name }),
                    /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-white bg-[var(--brand-green)] px-2 py-0.5 rounded-none tracking-tight", children: "Assigned" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-[var(--brand-green)] tracking-tight mb-0", children: assignedChapter.region })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs(
                  Button,
                  {
                    onClick: onClose,
                    className: "w-full h-14 bg-[var(--brand-green)] text-white hover:bg-emerald-800 rounded-none font-bold text-sm tracking-tight shadow-xl shadow-brand-green/20 transition-all active:scale-95 flex items-center justify-center gap-3",
                    children: [
                      /* @__PURE__ */ jsx(Check, { className: "w-5 h-5" }),
                      "Confirm this chapter"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleChooseDifferent,
                    className: "w-full py-4 text-xs font-bold text-stone-400 hover:text-[var(--brand-green)] tracking-tight transition-colors flex items-center justify-center gap-2 group",
                    children: [
                      /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 group-hover:translate-y-0.5 transition-transform" }),
                      "Choose a different chapter"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-10 pt-8 border-t border-stone-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-stone-400", children: [
                /* @__PURE__ */ jsx(Building2, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsxs("p", { className: "text-micro font-bold tracking-tight mb-0", children: [
                  "Assigned based on your region: ",
                  assignedChapter.region
                ] })
              ] }) })
            ] })
          ]
        }
      )
    }
  );
}
function ShareModal({ isOpen, onClose, title = "Share & Invite Others", url = "https://thebasemovement.com/register" }) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const shareOptions = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25D366]",
      hover: "hover:bg-[#25D366]/10",
      textColor: "text-[#25D366]",
      borderColor: "border-[#25D366]/20",
      link: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-[#1877F2]",
      hover: "hover:bg-[#1877F2]/10",
      textColor: "text-[#1877F2]",
      borderColor: "border-[#1877F2]/20",
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: "X",
      icon: Twitter,
      color: "bg-[#000000]",
      hover: "hover:bg-[#000000]/10",
      textColor: "text-black",
      borderColor: "border-black/20",
      link: `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-[var(--brand-red)]",
      hover: "hover:bg-[var(--brand-red)]/10",
      textColor: "text-[var(--brand-red)]",
      borderColor: "border-[var(--brand-red)]/20",
      link: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
    }
  ];
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-dark/60 backdrop-blur-sm animate-in fade-in duration-300",
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-stone-100 flex flex-col gap-2 bg-stone-50 relative", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-base font-bold text-stone-900 font-meta tracking-tight pr-10 truncate", children: title }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  className: "absolute top-4 right-4 w-8 h-8 rounded-none bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-[var(--brand-green)] transition-colors",
                  children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-stone-400 text-center tracking-tight", children: "Your personal invite link:" }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-full p-4 bg-stone-50 border border-stone-100 text-stone-600 text-sm font-medium break-all text-center", children: url }),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      onClick: handleCopy,
                      className: `w-full h-12 rounded-none font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-2 ${copied ? "bg-emerald-600 text-white" : "bg-white border border-stone-200 text-stone-600 hover:bg-[var(--brand-green)] hover:text-white hover:border-[var(--brand-green)]"}`,
                      children: copied ? /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx(Check, { className: "w-4 h-4" }),
                        "Copied to clipboard"
                      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" }),
                        "Copy link"
                      ] })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", "aria-hidden": "true", children: /* @__PURE__ */ jsx("div", { className: "w-full border-t border-stone-100" }) }),
                /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-micro font-bold tracking-tight", children: /* @__PURE__ */ jsx("span", { className: "bg-white px-4 text-stone-400", children: "Or share directly" }) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-3", children: shareOptions.map((option) => /* @__PURE__ */ jsxs(
                "a",
                {
                  href: option.link,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: `flex items-center gap-4 p-4 border ${option.borderColor} ${option.hover} transition-all group`,
                  children: [
                    /* @__PURE__ */ jsx("div", { className: `w-10 h-10 ${option.color} text-white flex items-center justify-center rounded-none shadow-sm`, children: /* @__PURE__ */ jsx(option.icon, { className: "w-5 h-5" }) }),
                    /* @__PURE__ */ jsxs("span", { className: `text-sm font-bold ${option.textColor}`, children: [
                      "Share on ",
                      option.name
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "ml-auto material-symbols-outlined text-stone-300 group-hover:text-stone-400 transition-colors text-[20px]", children: "chevron_right" })
                  ]
                },
                option.name
              )) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex h-1.5 w-full", children: [
              /* @__PURE__ */ jsx("div", { className: "flex-1 bg-[var(--brand-red)]" }),
              /* @__PURE__ */ jsx("div", { className: "flex-1 bg-[var(--brand-gold)]" }),
              /* @__PURE__ */ jsx("div", { className: "flex-1 bg-[var(--brand-green)]" })
            ] })
          ]
        }
      )
    }
  );
}
function MovementRoadmap() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchMilestones() {
      const data = await adminService.getRoadmapForecast();
      if (data && data.length > 0) {
        setMilestones(data);
      } else {
        setMilestones([
          {
            id: "1",
            title: "Phase 1: National Portal Rollout",
            description: "Initialization of the member database and official portal activation for all sixteen regions.",
            target_date: "2026-04-30",
            status: "Completed",
            category: "Infrastructure",
            importance_level: "Critical"
          },
          {
            id: "2",
            title: "Phase 2: Regional chapter offices",
            description: "Establishing physical community centers and outreach offices across the sixteen regions.",
            target_date: "2026-06-15",
            status: "In Progress",
            category: "Mobilization",
            importance_level: "High"
          },
          {
            id: "3",
            title: "Phase 3: National Policy Summit",
            description: "A collaborative gathering of grassroots leaders to finalize our economic and civic blueprints.",
            target_date: "2026-08-20",
            status: "Upcoming",
            category: "Policy",
            importance_level: "High"
          },
          {
            id: "4",
            title: "Phase 4: Community Outreach Expansion",
            description: "Onboarding and supporting 100,000 certified community organizers for local engagement.",
            target_date: "2026-10-10",
            status: "Upcoming",
            category: "Mobilization",
            importance_level: "Critical"
          }
        ]);
      }
      setLoading(false);
    }
    fetchMilestones();
  }, []);
  if (loading) return null;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-12", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold tracking-tight text-on-surface flex items-center gap-3 m-0", children: [
          /* @__PURE__ */ jsx("span", { className: "p-2 bg-[var(--brand-red)]/10 rounded-none", children: /* @__PURE__ */ jsx(Flag, { className: "w-6 h-6 text-[var(--brand-red)]" }) }),
          "National strategic ",
          /* @__PURE__ */ jsx("span", { className: "text-[var(--brand-green)]", children: "roadmap" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface/40 mt-3 ml-12", children: "The path to building the Ghana we deserve." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 ml-12 md:ml-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full", style: { backgroundColor: "rgb(var(--brand-green-rgb))" } }),
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight", style: { color: "rgb(var(--brand-green-rgb))" }, children: "Completed" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full", style: { backgroundColor: "rgb(var(--brand-gold-rgb))" } }),
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight", style: { color: "rgb(var(--brand-gold-rgb))" }, children: "Active" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full", style: { backgroundColor: "rgb(var(--brand-red-rgb))" } }),
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight", style: { color: "rgb(var(--brand-red-rgb))" }, children: "Future" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative pt-8 pb-12", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute left-6 top-0 bottom-0 w-[4px] sm:left-1/2 sm:-translate-x-1/2 overflow-hidden bg-stone-100 rounded-full", children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-[var(--brand-green-full)] via-[var(--brand-gold-full)] to-[var(--brand-red-full)]" }) }),
      /* @__PURE__ */ jsx("div", { className: "space-y-24", children: milestones.map((milestone, index) => /* @__PURE__ */ jsxs("div", { className: cn(
        "relative flex flex-col sm:flex-row items-start sm:items-center gap-12",
        index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
      ), children: [
        /* @__PURE__ */ jsx("div", { className: "absolute left-6 sm:left-1/2 -translate-x-1/2 z-20", children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "w-14 h-14 rounded-full border-4 border-white shadow-2xl flex items-center justify-center transition-all duration-700 relative z-10",
              milestone.status === "In Progress" && "animate-pulse shadow-[0_0_40px_rgba(var(--brand-gold-rgb),0.6)]"
            ),
            style: {
              backgroundColor: index === 0 ? "rgb(var(--brand-green-rgb))" : index === milestones.length - 1 ? "rgb(var(--brand-red-rgb))" : "rgb(var(--brand-gold-rgb))"
            },
            children: [
              /* @__PURE__ */ jsxs("div", { className: "relative z-20", children: [
                milestone.status === "Completed" && /* @__PURE__ */ jsx(CheckCircle2, { className: "w-7 h-7 text-white stroke-[4px]" }),
                milestone.status === "In Progress" && /* @__PURE__ */ jsx(Clock, { className: "w-7 h-7 text-white stroke-[4px]" }),
                milestone.status === "Upcoming" && /* @__PURE__ */ jsx(Target, { className: "w-7 h-7 text-white stroke-[4px]" })
              ] }),
              milestone.status === "In Progress" && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full bg-white/20 animate-ping" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: cn(
          "flex-1 ml-20 sm:ml-0 w-full group",
          index % 2 === 0 ? "sm:pr-24 sm:text-right" : "sm:pl-24 sm:text-left"
        ), children: /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 border-t-[5px] border-t-transparent relative shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" }),
          /* @__PURE__ */ jsx("div", { className: "absolute top-6 right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity", children: /* @__PURE__ */ jsx(TrendingUp, { className: "w-24 h-24 rotate-[-15deg]" }) }),
          /* @__PURE__ */ jsxs("div", { className: cn(
            "flex flex-col gap-3 mb-6",
            index % 2 === 0 ? "sm:items-end" : "sm:items-start"
          ), children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: "px-3 py-1 text-tiny font-bold text-white rounded-sm",
                  style: {
                    backgroundColor: milestone.status === "Completed" ? "rgb(var(--brand-green-rgb))" : milestone.status === "In Progress" ? "rgb(var(--brand-gold-rgb))" : "rgb(28, 25, 23)"
                  },
                  children: milestone.status
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-on-surface/20 tracking-tight capitalize", children: milestone.category })
            ] }),
            /* @__PURE__ */ jsx("h4", { className: "text-lg font-bold italic tracking-tight text-on-surface group-hover:text-[var(--brand-red)] transition-colors leading-tight", children: milestone.title })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-on-surface/60 leading-relaxed font-medium mb-6", children: milestone.description }),
          /* @__PURE__ */ jsxs("div", { className: cn(
            "flex flex-wrap items-center gap-4 pt-6 border-t border-stone-50 text-tiny font-bold text-on-surface/30 tracking-tight",
            index % 2 === 0 ? "sm:justify-end" : "sm:justify-start"
          ), children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3 text-[var(--brand-red)]" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Launch: ",
                new Date(milestone.target_date).toLocaleDateString([], { month: "short", year: "numeric" })
              ] })
            ] }),
            milestone.forecasted_date && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "w-1 h-1 bg-stone-200 rounded-full" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[var(--brand-green)] bg-[var(--brand-green)]/5 px-2 py-1", children: [
                /* @__PURE__ */ jsx(TrendingUp, { className: "w-3 h-3" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Fulfillment: ",
                  new Date(milestone.forecasted_date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
                ] })
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "hidden sm:block flex-1" })
      ] }, milestone.id)) })
    ] })
  ] });
}
function Dashboard() {
  const { settings } = useBranding();
  const [stats, setStats] = useState(null);
  const [member, setMember] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [allAvailableAchievements, setAllAvailableAchievements] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [shareData, setShareData] = useState({ title: "", url: "" });
  const [fieldActions, setFieldActions] = useState([]);
  const [checkingIn, setCheckingIn] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const { lowBandwidthMode } = usePerformance();
  const handleShare = () => {
    setShareData({
      title: 'Join "The Base" Movement - Ghana First!',
      url: `https://thebase.gh/join/${member?.full_name.toLowerCase().replace(/\s+/g, "") || "member"}`
    });
    setIsShareModalOpen(true);
  };
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const liveStats = await adminService.getGrowthStats();
      setStats(liveStats);
      const regNo = localStorage.getItem("userRegNo");
      if (regNo) {
        const liveMember = await adminService.getMemberProfile(regNo);
        if (liveMember) {
          setMember({
            full_name: liveMember.name,
            registration_number: liveMember.id,
            platform: liveMember.type === "Premium" ? "DIASPORA" : "GHANA",
            phone_number: liveMember.phone,
            age_range: "Not Specified",
            gender: liveMember.gender || "Not Set",
            region: liveMember.region,
            constituency: liveMember.constituency,
            chapter: liveMember.chapter || "Central Chapter",
            profession: "Member",
            status: liveMember.status
          });
          const [userAchievements, regionLeaderboard, userPoints, allPossible] = await Promise.all([
            adminService.getMemberAchievements(liveMember.id),
            adminService.getLeaderboard(liveMember.region),
            adminService.getMemberPoints(liveMember.id),
            adminService.getAchievements()
          ]);
          setAchievements(userAchievements);
          setLeaderboard(regionLeaderboard);
          setTotalPoints(userPoints);
          setAllAvailableAchievements(allPossible);
          const activeActions = await adminService.getFieldActions();
          setFieldActions(activeActions.filter((a) => a.status === "Live" || a.status === "Upcoming"));
        }
      }
      const userNotifications = await adminService.getNotifications();
      setNotifications(userNotifications);
      const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
      if (!hasSeenWelcome) {
        setIsWelcomeModalOpen(true);
        localStorage.setItem("hasSeenWelcome", "true");
      }
      setLoading(false);
    }
    fetchData();
  }, []);
  const handleCheckIn = async (action) => {
    setCheckingIn(action.id);
    if (!navigator.geolocation) {
      toast$1.error("Geolocation is not supported by your browser.");
      setCheckingIn(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      try {
        const regNo = localStorage.getItem("userRegNo");
        const profile = await adminService.getMemberProfile(regNo || "");
        if (!profile) throw new Error("Profile not found");
        const { error } = await supabase.from("field_action_attendance").insert([{
          action_id: action.id,
          user_id: profile.id,
          check_in_lat: latitude,
          check_in_lng: longitude,
          is_verified: false,
          // Admin verifies later, or auto-verify if distance < radius
          metadata: { platform: "web_dashboard" }
        }]);
        if (error) {
          if (error.code === "23505") toast$1.error("You have already signaled attendance for this action.");
          else throw error;
        } else {
          toast$1.success(`Tactical signal dispatched from ${action.location_name}. Verification pending.`);
        }
      } catch (err) {
        console.error("[GEOLOCATION] Signal failed:", err);
        toast$1.error("Tactical signal failed to reach HQ.");
      } finally {
        setCheckingIn(null);
      }
    }, (error) => {
      console.error("[GEOLOCATION] Access denied:", error);
      toast$1.error("Please enable location services to check-in.");
      setCheckingIn(null);
    });
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "w-full h-screen flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" }),
      /* @__PURE__ */ jsx("p", { className: "font-bold text-on-surface/40 tracking-tight text-tiny animate-pulse", children: "Synchronizing live data..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-6 backdrop-blur-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--brand-green-full)]" }),
        /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-primary tracking-tight", children: "National infrastructure stabilized" })
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "tracking-tighter mb-4 text-on-surface", children: "Operational Dashboard" }),
      /* @__PURE__ */ jsx(BrandLine, {}),
      /* @__PURE__ */ jsxs("p", { className: "text-on-surface/60 max-w-2xl mb-0", children: [
        "Welcome back, ",
        /* @__PURE__ */ jsx("span", { className: "text-on-surface font-bold", children: member?.full_name || "Patriot" }),
        ". Your tactical overview and movement directives are synchronized."
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      WelcomeModal,
      {
        isOpen: isWelcomeModalOpen,
        onClose: () => setIsWelcomeModalOpen(false),
        userName: member?.full_name || "Member",
        assignedChapter: {
          name: `The Base - ${member?.region || "National"} Chapter`,
          region: member?.region || "Ghana"
        }
      }
    ),
    /* @__PURE__ */ jsx("section", { className: "mb-12", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/40 p-6 rounded-none shadow-sm group hover:border-primary/40 transition-all", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-on-surface/40 tracking-tight", children: "New Members" }),
          /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-primary opacity-40" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold tracking-tighter m-0", children: stats?.joined_last_24h || 0 }),
          /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-on-surface/20", children: "Past 24h" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-micro text-on-surface/30 mt-4 font-medium italic", children: "National digital infrastructure stabilized and the regional rollout is now underway." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/40 p-6 rounded-none shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-on-surface/40 tracking-tight", children: "Active outreach" }),
          /* @__PURE__ */ jsx(Navigation, { className: "w-4 h-4 text-primary opacity-40" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold tracking-tight m-0", children: fieldActions.length }),
          /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-on-surface/20", children: "In area" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-tiny text-on-surface/30 mt-4 font-medium italic", children: "No community actions detected yet." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/40 p-6 rounded-none shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-on-surface/40 tracking-tight", children: "Impact points" }),
          /* @__PURE__ */ jsx(Trophy, { className: "w-4 h-4 text-[var(--brand-gold)] opacity-40" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold tracking-tight m-0", children: totalPoints }),
          /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-on-surface/20", children: "Earned" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-tiny text-on-surface/30 mt-4 font-medium italic", children: "Participate to earn your first points." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/40 p-6 rounded-none shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-on-surface/40 tracking-tight", children: "Achievements" }),
          /* @__PURE__ */ jsx(Flag, { className: "w-4 h-4 text-[var(--brand-red)] opacity-40" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold tracking-tight m-0", children: achievements.length }),
          /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-on-surface/20", children: "Unlocked" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-tiny text-on-surface/30 mt-4 font-medium italic", children: "Complete actions to earn badges." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "mb-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-on-surface flex items-center m-0", children: [
          /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined mr-2 text-destructive", style: { fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }, children: "stadium" }),
          "Active Community Engagement"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          userLocation && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-right-4 duration-500", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3 h-3 text-primary" }),
            /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold tracking-tight text-primary", children: [
              "Signal Active: ",
              userLocation.lat.toFixed(4),
              ", ",
              userLocation.lng.toFixed(4)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-destructive/10 border border-destructive/20 rounded-full", children: [
            /* @__PURE__ */ jsx("span", { className: "flex h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight text-destructive", children: "National Activity" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: fieldActions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-on-surface/5 border-2 border-dashed border-on-surface/10 p-16 text-center rounded-none relative overflow-hidden group", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-on-surface/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-on-surface/10", children: /* @__PURE__ */ jsx(Navigation, { className: "w-8 h-8 text-on-surface/20" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold tracking-tight text-on-surface/60 mb-2", children: "Community Events" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-on-surface/40 max-w-sm mx-auto", children: "No upcoming events in your area yet. We'll notify you as soon as new community outreach or rallies are scheduled." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center gap-6", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "default",
                size: "sm",
                className: "h-10 px-8 text-tiny font-bold tracking-tight border-stone-200 text-stone-500 hover:text-brand-green hover:bg-stone-50 transition-all rounded-none active:scale-95 shadow-sm",
                children: "Find Local Chapters"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "h-1 w-12 bg-[var(--brand-green)] opacity-20" }),
              /* @__PURE__ */ jsx("div", { className: "h-1 w-12 bg-[var(--brand-gold)] opacity-20" }),
              /* @__PURE__ */ jsx("div", { className: "h-1 w-12 bg-[var(--brand-red)] opacity-20" })
            ] })
          ] })
        ] })
      ] }) : fieldActions.map((action) => /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/40 shadow-sm rounded-sm overflow-hidden flex flex-col md:flex-row group hover:border-primary/40 transition-all", children: [
        /* @__PURE__ */ jsxs("div", { className: "w-full md:w-32 bg-on-surface flex flex-col items-center justify-center p-6 text-white border-b md:border-b-0 md:border-r border-white/5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold tracking-tight text-white/40 mb-1", children: format(new Date(action.start_time), "MMM") }),
          /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold italic tracking-tighter", children: format(new Date(action.start_time), "dd") }),
          /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight text-destructive mt-2", children: format(new Date(action.start_time), "HH:mm") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 p-6 relative", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
            /* @__PURE__ */ jsx("span", { className: cn(
              "text-micro font-bold tracking-tight px-2 py-0.5",
              action.status === "Live" ? "bg-destructive/10 text-destructive" : "bg-muted text-on-surface/40"
            ), children: action.status }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight text-on-surface/40", children: action.type })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold tracking-tight text-on-surface mb-2 leading-tight", children: action.title }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-on-surface/40 mb-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
              /* @__PURE__ */ jsx("span", { className: "text-micro font-bold tracking-tight truncate max-w-[120px]", children: action.location_name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Users, { className: "w-3 h-3" }),
              /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold tracking-tight", children: [
                action.target_attendance,
                " Target"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-auto pt-4 border-t border-border/10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Navigation, { className: "w-3.5 h-3.5 text-on-surface/10" }),
              /* @__PURE__ */ jsxs("span", { className: "text-micro font-bold text-on-surface/20 tracking-tight", children: [
                action.geofence_radius_meters,
                "m radius"
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "solid",
                onClick: () => handleCheckIn(action),
                className: "h-9 px-6 text-micro font-bold tracking-tight shadow-xl",
                disabled: checkingIn === action.id,
                children: checkingIn === action.id ? "Signaling..." : "Field check-in"
              }
            )
          ] })
        ] })
      ] }, action.id)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mb-12", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-on-surface mb-6 flex items-center", children: [
        /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined mr-2 text-primary", style: { fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }, children: "assignment_turned_in" }),
        "Upcoming Actions"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/40 p-12 text-center rounded-none shadow-sm relative overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-1 h-full bg-[var(--brand-gold)]" }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[var(--brand-gold)]/10 rounded-none flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-6 h-6 text-[var(--brand-gold)]" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-on-surface/60 tracking-tight", children: "All Tasks Completed" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface/40 font-medium mt-2 italic", children: "Awaiting new updates from your Regional Coordinator." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/40 rounded-sm shadow-sm overflow-hidden flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-on-surface/5 border-b border-border/10 p-4 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold tracking-tight text-primary flex items-center gap-2 m-0", children: [
              /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-lg", style: { fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }, children: "campaign" }),
              "Movement Directives"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-tiny font-bold text-on-surface/30 tracking-tight", children: [
              notifications.length,
              " Active updates"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "divide-y divide-border/10 max-h-[400px] overflow-y-auto flex-1", children: notifications.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-16 text-center", children: [
            /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-on-surface/10 text-5xl mb-6", style: { fontVariationSettings: "'FILL' 0, 'wght' 100, 'GRAD' 0, 'opsz' 48" }, children: "history" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-on-surface/40 tracking-tight", children: "All Caught Up" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface/20 font-medium mt-2 italic", children: "Standing by for new updates and national broadcasts." })
          ] }) : notifications.map((note) => /* @__PURE__ */ jsxs("div", { className: `p-6 transition-all border-l-4 ${note.is_read ? "border-transparent" : "border-primary bg-primary/5"}`, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 mb-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                note.type === "Alert" && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-destructive text-white text-micro font-bold tracking-tight rounded-none", children: "Urgent" }),
                /* @__PURE__ */ jsx("h4", { className: `text-sm font-bold tracking-tight m-0 ${note.is_read ? "text-on-surface/40" : "text-on-surface"}`, children: note.title })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-tiny text-on-surface/20 font-bold tracking-tight", children: new Date(note.created_at).toLocaleDateString() })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface/60 leading-relaxed mb-4", children: note.message }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "link",
                onClick: async () => {
                  const success = await adminService.markNotificationRead(note.id);
                  if (success) {
                    setNotifications((prev) => prev.map((n) => n.id === note.id ? { ...n, is_read: true } : n));
                  }
                },
                className: "h-auto p-0 text-tiny font-bold tracking-tight text-primary hover:underline justify-start",
                children: "Acknowledge directive"
              }
            )
          ] }, note.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface-warm border-t-[4px] border-t-transparent relative overflow-hidden rounded-sm shadow-sm flex flex-col", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 sm:p-8 flex-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "mb-6 sm:mb-8 border-b border-accent/20 pb-4 text-on-surface tracking-tighter italic font-bold text-xl", children: "Identity Details" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-y-8 sm:gap-y-10 gap-x-12", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny text-accent tracking-tight mb-2 font-bold", children: "Full Name" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-on-surface truncate mb-0 capitalize", children: member?.full_name?.toLowerCase() || "Not Available" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny text-accent tracking-tight mb-2 font-bold", children: "Registration Number" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-on-surface break-all sm:break-normal mb-0", children: member?.registration_number || "N/A" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny text-accent tracking-tight mb-2 font-bold", children: "Platform Status" }),
                /* @__PURE__ */ jsx("span", { className: "inline-block px-4 py-1.5 bg-primary text-white text-tiny font-bold tracking-tight rounded-none shadow-lg shadow-primary/20", children: member?.platform === "ADMIN" ? "Chapter Lead" : member?.platform === "PATRIOT" ? "Member" : member?.platform || "Member" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny text-accent tracking-tight mb-2 font-bold", children: "Verification Status" }),
                /* @__PURE__ */ jsx("span", { className: cn(
                  "inline-block px-4 py-1.5 text-white text-tiny font-bold tracking-tight rounded-none shadow-lg",
                  member?.status === "Active" || member?.status === "Approved" ? "bg-emerald-600 shadow-emerald-600/20" : "bg-amber-600 shadow-amber-600/20"
                ), children: member?.status === "Active" || member?.status === "Approved" ? "Verified Patriot" : "Pending Review" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny text-accent tracking-tight mb-2 font-bold", children: "Phone Number" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-on-surface", children: member?.phone_number || "Not Provided" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny text-accent tracking-tight mb-2 font-bold", children: "Age Range" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-on-surface", children: member?.age_range || "Not Set" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny text-accent tracking-tight mb-2 font-bold", children: "Gender" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-on-surface", children: member?.gender || "Not Set" })
              ] }),
              member?.region && /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny text-accent tracking-tight mb-2 font-bold", children: "Region" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-on-surface truncate", children: member.region })
              ] }),
              member?.chapter && /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny text-accent tracking-tight mb-2 font-bold", children: "Assigned Chapter" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-on-surface truncate", children: member.chapter })
              ] }),
              member?.profession && /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-tiny text-accent tracking-tight mb-2 font-bold", children: "Profession" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-on-surface truncate", children: member.profession })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-t border-accent/10 flex items-center gap-4 bg-accent/5 mt-auto", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-accent text-2xl", style: { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }, children: "verified_user" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold tracking-tighter text-on-surface text-sm mb-0.5 leading-none", children: "Verified civic member" }),
              /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-on-surface/30 mb-0 leading-none", children: "Authenticated for official voting and policy contribution." })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/40 rounded-sm shadow-sm p-6 sm:p-8 col-span-1 lg:col-span-12 mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-tiny font-bold tracking-tight text-on-surface m-0 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-primary" }),
              "Movement impact"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-micro font-bold text-on-surface/20 tracking-tight mt-1", children: "Total points earned through direct action." })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold italic tracking-tighter text-primary", children: totalPoints.toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted rounded-none overflow-hidden relative border border-border/10", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-full bg-primary transition-all duration-1000 ease-out relative",
              style: { width: `${Math.min(totalPoints / 1e3 * 100, 100)}%` },
              children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_2s_linear_infinite]" })
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/20 tracking-tight", children: "Next milestone: Chapter Leader" }),
            /* @__PURE__ */ jsx("span", { className: "text-micro font-bold text-on-surface/40 tracking-tight", children: 1e3 - totalPoints > 0 ? `${1e3 - totalPoints} points remaining` : "Elite Achievement Unlocked" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "lg:col-span-12", children: /* @__PURE__ */ jsxs("div", { className: "bg-primary-container p-6 md:p-8 border-none relative overflow-hidden group rounded-sm shadow-xl flex flex-col lg:flex-row lg:items-center gap-10", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-10 pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" }) }),
        /* @__PURE__ */ jsx("div", { className: "absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-700" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 relative z-10", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-white mb-4 text-2xl font-bold tracking-tighter", children: "Invite others to join The Base" }),
          /* @__PURE__ */ jsx("p", { className: "text-white/70 text-sm font-medium leading-relaxed max-w-2xl mb-0", children: "Our strength grows when more people take part in the movement. Share your unique registration link with fellow Ghanaians and help build a more resilient and representative civic voice for the nation." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-1/2 min-w-[320px] relative z-10 bg-white/5 p-4 border border-white/10 backdrop-blur-sm rounded-sm", children: [
          /* @__PURE__ */ jsx("p", { className: "text-white/40 text-tiny font-bold tracking-tight mb-3", children: "Your referral link" }),
          /* @__PURE__ */ jsxs("div", { className: "relative mb-4 flex items-center border-b border-white/20 pb-1", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                className: "w-full bg-transparent border-none text-white font-bold py-2 pl-0 pr-10 rounded-none focus:ring-0 focus:outline-none placeholder:text-white/20 text-sm tracking-tight",
                readOnly: true,
                type: "text",
                value: `${window.location.origin}/join?ref=${member?.registration_number || "PATRIOT"}`
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  const refLink = `${window.location.origin}/join?ref=${member?.registration_number || "PATRIOT"}`;
                  navigator.clipboard.writeText(refLink);
                  toast$1.success("Registration link copied to clipboard.");
                },
                className: "absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-white hover:text-accent transition-colors bg-transparent border-none",
                children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[18px]", style: { fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }, children: "content_copy" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "accent",
              onClick: handleShare,
              className: "w-full py-4 tracking-tight text-tiny flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-black/20",
              children: [
                /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-sm", style: { fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }, children: "share" }),
                "Invite & Share"
              ]
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "mt-12", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/40 rounded-sm shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-on-surface/5 border-b border-border/10 p-6 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold tracking-tight text-on-surface flex items-center gap-2 m-0", children: [
            /* @__PURE__ */ jsx(Trophy, { className: "w-4 h-4 text-accent" }),
            "Movement achievements"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-tiny font-bold text-on-surface/30 tracking-tight", children: [
            achievements.length,
            " Badges Earned"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 grid grid-cols-2 sm:grid-cols-3 gap-8", children: [
          achievements.map((achievement) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center group", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 border-2 border-accent/50 bg-[radial-gradient(circle_at_center,_rgba(184,134,11,0.1)_0%,transparent_100%)] shadow-sm group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(Award, { className: "w-8 h-8 text-accent" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold tracking-tight text-on-surface m-0", children: achievement.name }),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-on-surface/40 font-bold mt-1 leading-tight", children: achievement.description })
          ] }, achievement.id)),
          allAvailableAchievements.filter((a) => !achievements.some((ea) => ea.id === a.id)).slice(0, 3).map((locked) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center opacity-40 group", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-on-surface/5 rounded-full flex items-center justify-center mb-3 border-2 border-border/10 grayscale", children: /* @__PURE__ */ jsx(Medal, { className: "w-6 h-6 text-on-surface/10" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold tracking-tight text-on-surface/20 m-0", children: locked.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-micro text-on-surface/10 font-bold mt-1 leading-tight", children: [
              "Locked (",
              locked.points_awarded || 0,
              " pts)"
            ] })
          ] }, locked.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border/40 rounded-sm shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-on-surface/5 border-b border-border/10 p-6 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold tracking-tight text-on-surface flex items-center gap-2 m-0", children: [
            /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-primary text-sm", children: "trending_up" }),
            member?.region || "National",
            " leaderboard"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-on-surface/30 tracking-tight", children: "Top Community Members" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "divide-y divide-border/10", children: leaderboard.map((entry) => /* @__PURE__ */ jsxs("div", { className: "p-4 flex items-center justify-between hover:bg-on-surface/5 transition-colors", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("span", { className: `w-6 h-6 rounded-none flex items-center justify-center text-tiny font-bold ${entry.rank === 1 ? "bg-accent text-on-surface" : entry.rank === 2 ? "bg-on-surface/20 text-on-surface/60" : entry.rank === 3 ? "bg-accent/30 text-accent" : "bg-on-surface/5 text-on-surface/20"}`, children: entry.rank }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold tracking-tight text-on-surface m-0", children: entry.name }),
              /* @__PURE__ */ jsx("p", { className: "text-micro text-on-surface/20 font-bold tracking-tight", children: entry.region })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-primary m-0", children: entry.points.toLocaleString() }),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-on-surface/10 font-bold tracking-tight", children: "Points" })
          ] })
        ] }, entry.name)) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "mt-12", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-on-surface mb-6 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "h-1 w-8 bg-primary" }),
        " Quick Actions"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-6", children: [
        /* @__PURE__ */ jsxs(Link, { className: "bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm", to: "/settings", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" }),
          /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform", children: "badge" }),
          /* @__PURE__ */ jsx("p", { className: "font-meta text-tiny font-bold text-on-surface", children: "Member ID" })
        ] }),
        /* @__PURE__ */ jsxs(Link, { className: "bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm", to: "/dashboard/store", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" }),
          /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform", children: "storefront" }),
          /* @__PURE__ */ jsx("p", { className: "font-meta text-tiny font-bold text-on-surface", children: "Official Store" })
        ] }),
        /* @__PURE__ */ jsxs(Link, { className: "bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm", to: "/dashboard/polls", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" }),
          /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform", children: "how_to_vote" }),
          /* @__PURE__ */ jsx("p", { className: "font-meta text-tiny font-bold text-on-surface", children: "Opinion Polls" })
        ] }),
        /* @__PURE__ */ jsxs(Link, { className: "bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm", to: "/dashboard/feedback", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" }),
          /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-destructive mb-3 text-3xl group-hover:scale-110 transition-transform", children: "record_voice_over" }),
          /* @__PURE__ */ jsx("p", { className: "font-meta text-tiny font-bold text-on-surface", children: "Feedback Hub" })
        ] }),
        /* @__PURE__ */ jsxs(Link, { className: "bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm", to: "/dashboard/canvass", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" }),
          /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform", children: "diversity_3" }),
          /* @__PURE__ */ jsx("p", { className: "font-meta text-tiny font-bold text-on-surface", children: "Outreach" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "mt-20", children: /* @__PURE__ */ jsx(MovementRoadmap, {}) }),
    /* @__PURE__ */ jsxs("section", { className: cn(
      "mt-16 overflow-hidden rounded-sm h-[300px] relative",
      lowBandwidthMode && "bg-primary"
    ), children: [
      !lowBandwidthMode && /* @__PURE__ */ jsx("img", { alt: "The Base Banner", className: "w-full h-full object-cover", src: settings.banner_image_url || "/the-base-banner-1.png", decoding: "async", loading: "lazy" }),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/40 to-transparent flex flex-col justify-end items-end p-12 text-right", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-white mb-2", children: "Together, we build the Ghana we deserve." }),
        /* @__PURE__ */ jsx("p", { className: "text-white max-w-2xl mb-0", children: "Ghana First is more than a slogan - it's a commitment to our shared prosperity and civic responsibility." })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      ShareModal,
      {
        isOpen: isShareModalOpen,
        onClose: () => setIsShareModalOpen(false),
        title: shareData.title,
        url: shareData.url
      }
    )
  ] });
}
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      "data-slot": "input",
      className: cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      ),
      ...props
    }
  );
}
function Label({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    LabelPrimitive.Root,
    {
      "data-slot": "label",
      className: cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card",
      className: cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-sm border py-6 shadow-sm",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-title",
      className: cn("leading-none font-semibold", className),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-6", className),
      ...props
    }
  );
}
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-footer",
      className: cn("flex items-center px-6 [.border-t]:pt-6", className),
      ...props
    }
  );
}
function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.login(email, password);
      toast$1.success("Access Granted. Welcome to the Command Center.");
      navigate("/admin");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed. Please check your credentials.";
      toast$1.error(message);
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-[80vh] flex items-center justify-center px-4 py-12", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Admin Portal",
        noindex: true
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "max-w-md w-full", children: /* @__PURE__ */ jsx(Card, { className: "border-border/40 shadow-2xl rounded-sm overflow-hidden bg-white/80 backdrop-blur-xl", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10 flex flex-col items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-destructive/10 rounded-sm flex items-center justify-center mb-4 rotate-3", children: /* @__PURE__ */ jsx(Shield, { className: "w-8 h-8 text-destructive" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-on-surface mb-2 font-meta tracking-tight", children: "Admin login" }),
        /* @__PURE__ */ jsx(BrandLine, { className: "mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-micro text-muted-foreground/60 font-bold capitalize tracking-tight", children: "Authorized personnel only" })
      ] }),
      /* @__PURE__ */ jsxs("form", { className: "space-y-4", onSubmit: handleLogin, children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "admin-email", className: "text-xs font-bold text-on-surface/80 capitalize tracking-tight", children: "Email" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "admin-email",
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              placeholder: "admin@thebase.org",
              className: "h-12 bg-muted/5 border-border/60 focus-visible:ring-on-surface rounded-sm",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "admin-password", className: "text-xs font-bold text-on-surface/80 capitalize tracking-tight", children: "Password" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "admin-password",
                type: showPassword ? "text" : "password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                placeholder: "••••••••",
                className: "h-12 bg-muted/5 border-border/60 focus-visible:ring-on-surface rounded-sm pr-12",
                required: true
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setShowPassword(!showPassword),
                className: "absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-on-surface transition-colors",
                children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            variant: "primary",
            disabled: isLoading,
            className: "w-full h-14",
            children: isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" }),
              /* @__PURE__ */ jsx("span", { children: "Authenticating..." })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              "Sign in to Command ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" })
            ] })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative my-8", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("span", { className: "w-full border-t border-border/40" }) }),
          /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-micro capitalize tracking-tight font-bold", children: /* @__PURE__ */ jsx("span", { className: "bg-white px-4 text-muted-foreground/40", children: "Or authorized via" }) })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "default",
            onClick: async () => {
              try {
                await authService.signInWithGoogle();
              } catch (error) {
                toast$1.error(error instanceof Error ? error.message : "Google login failed");
              }
            },
            className: "w-full h-12 flex items-center justify-center gap-3",
            children: [
              /* @__PURE__ */ jsxs("svg", { className: "w-4 h-4", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
                    fill: "#4285F4"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
                    fill: "#34A853"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z",
                    fill: "#FBBC05"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z",
                    fill: "#EA4335"
                  }
                )
              ] }),
              "Google Command Access"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-center mt-6 pt-6 border-t border-border/40", children: /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-micro font-bold capitalize tracking-tight text-muted-foreground/60 hover:text-primary transition-colors", children: "Member login instead?" }) })
    ] }) }) })
  ] });
}
function Navbar() {
  const { settings } = useBranding();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true"
  );
  const [userAvatar, setUserAvatar] = useState(
    () => localStorage.getItem("userAvatar") || "https://i.pravatar.cc/150?u=a042581f4e29026704d"
  );
  const location = useLocation();
  const dropdownRef = useRef(null);
  useEffect(() => {
    function closeMenus() {
      setIsOpen(false);
      setIsDropdownOpen(false);
    }
    closeMenus();
  }, [location.pathname]);
  useEffect(() => {
    function checkLogin() {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
      setUserAvatar(localStorage.getItem("userAvatar") || "https://i.pravatar.cc/150?u=a042581f4e29026704d");
    }
    window.addEventListener("storage", checkLogin);
    return () => window.removeEventListener("storage", checkLogin);
  }, []);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userAvatar");
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
  };
  const isActive = (path) => location.pathname === path;
  return /* @__PURE__ */ jsxs("header", { className: "bg-white border-b border-border/40 sticky top-0 z-50", children: [
    /* @__PURE__ */ jsxs("nav", { "aria-label": "Main Navigation", className: "flex justify-between items-center max-w-[1440px] mx-auto px-8 h-20", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("img", { alt: "The Base Logo", className: "h-10 w-10 object-contain", src: settings.logo_url, decoding: "async" }),
        /* @__PURE__ */ jsx(Link, { to: "/", className: "text-on-surface hover:opacity-80 transition-opacity mb-0", children: /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold tracking-tight mb-0", children: "The Base" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center space-x-10 text-xs font-bold tracking-tight", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/",
            className: `transition-colors duration-200 ${isActive("/") ? "text-primary" : "text-on-surface/40 hover:text-primary"}`,
            children: "Home"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/blog",
            className: `transition-colors duration-200 ${isActive("/blog") ? "text-primary" : "text-on-surface/40 hover:text-primary"}`,
            children: "Updates"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: isLoggedIn ? "/dashboard/polls" : "/polls",
            className: `transition-colors duration-200 ${isActive(isLoggedIn ? "/dashboard/polls" : "/polls") ? "text-primary" : "text-on-surface/40 hover:text-primary"}`,
            children: "Polls"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: isLoggedIn ? "/dashboard/agenda" : "/our-agenda",
            className: `transition-colors duration-200 ${isActive(isLoggedIn ? "/dashboard/agenda" : "/our-agenda") ? "text-primary" : "text-on-surface/40 hover:text-primary"}`,
            children: "The Plan"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: isLoggedIn ? "/dashboard/chapters" : "/chapters",
            className: `transition-colors duration-200 ${isActive(isLoggedIn ? "/dashboard/chapters" : "/chapters") ? "text-primary" : "text-on-surface/40 hover:text-primary"}`,
            children: "Chapters"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: isLoggedIn ? "/dashboard/store" : "/store",
            className: `transition-colors duration-200 ${isActive(isLoggedIn ? "/dashboard/store" : "/store") ? "text-primary" : "text-on-surface/40 hover:text-primary"}`,
            children: "Supplies"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: isLoggedIn ? "/dashboard/donate" : "/donate",
            className: `transition-colors duration-200 ${isActive(isLoggedIn ? "/dashboard/donate" : "/donate") ? "text-primary" : "text-on-surface/40 hover:text-primary"}`,
            children: "Donate"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: isLoggedIn ? "/dashboard/contact" : "/contact",
            className: `transition-colors duration-200 ${isActive(isLoggedIn ? "/dashboard/contact" : "/contact") ? "text-primary" : "text-on-surface/40 hover:text-primary"}`,
            children: "Contact"
          }
        ),
        isLoggedIn && /* @__PURE__ */ jsx(
          Link,
          {
            to: "/dashboard",
            className: `transition-colors duration-200 ${isActive("/dashboard") ? "text-primary" : "text-primary/60 hover:text-primary"}`,
            children: "Dashboard"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center gap-3", children: isLoggedIn ? /* @__PURE__ */ jsxs("div", { className: "relative", ref: dropdownRef, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsDropdownOpen(!isDropdownOpen),
            className: "flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity",
            children: /* @__PURE__ */ jsx("img", { src: userAvatar, alt: "Profile", className: "w-10 h-10 rounded-full border-2 border-primary object-cover", decoding: "async" })
          }
        ),
        isDropdownOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 mt-3 w-64 bg-white border border-border/40 shadow-2xl rounded-sm py-3 z-50", children: [
          /* @__PURE__ */ jsxs("div", { className: "px-5 py-3 border-b border-border/10 mb-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface tracking-tight mb-0 leading-none", children: "Member portal" }),
            /* @__PURE__ */ jsx("p", { className: "text-micro text-accent font-bold tracking-tight mt-1 mb-0 leading-none", children: "Active patriot" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { to: "/dashboard", onClick: () => setIsDropdownOpen(false), className: "flex items-center gap-3 px-5 py-3 text-micro font-bold tracking-tight text-on-surface hover:bg-muted/5 transition-colors", children: [
            /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-primary" }),
            " Dashboard"
          ] }),
          /* @__PURE__ */ jsxs(Link, { to: "/settings", onClick: () => setIsDropdownOpen(false), className: "flex items-center gap-3 px-5 py-3 text-micro font-bold tracking-tight text-on-surface hover:bg-muted/5 transition-colors", children: [
            /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4 text-on-surface/20" }),
            " Settings"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "border-t border-border/10 mt-2 pt-2", children: /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleLogout,
              className: "flex items-center gap-3 w-full text-left px-5 py-3 text-micro font-bold tracking-tight text-destructive hover:bg-destructive/5 transition-colors",
              children: [
                /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
                " Logout"
              ]
            }
          ) })
        ] })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", size: "sm", className: "hover:text-primary", children: /* @__PURE__ */ jsx(Link, { to: "/login", children: "Login" }) }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "gold", size: "sm", children: /* @__PURE__ */ jsx(Link, { to: "/register", children: "Register" }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "md:hidden flex items-center", children: /* @__PURE__ */ jsx("button", { onClick: () => setIsOpen(!isOpen), className: "text-on-surface/40 hover:text-primary transition-colors p-2", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-3xl", children: isOpen ? "close" : "menu" }) }) })
    ] }),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "md:hidden bg-white border-t border-border/10 shadow-2xl px-6 py-8 space-y-2", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: `block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive("/") ? "bg-primary/5 text-primary" : "text-on-surface/60"}`, children: "Home" }),
      /* @__PURE__ */ jsx(Link, { to: "/blog", className: `block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive("/blog") ? "bg-primary/5 text-primary" : "text-on-surface/60"}`, children: "Updates" }),
      /* @__PURE__ */ jsx(Link, { to: isLoggedIn ? "/dashboard/polls" : "/polls", className: `block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? "/dashboard/polls" : "/polls") ? "bg-primary/5 text-primary" : "text-on-surface/60"}`, children: "Polls" }),
      /* @__PURE__ */ jsx(Link, { to: isLoggedIn ? "/dashboard/agenda" : "/our-agenda", className: `block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? "/dashboard/agenda" : "/our-agenda") ? "bg-primary/5 text-primary" : "text-on-surface/60"}`, children: "The Plan" }),
      /* @__PURE__ */ jsx(Link, { to: isLoggedIn ? "/dashboard/chapters" : "/chapters", className: `block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? "/dashboard/chapters" : "/chapters") ? "bg-primary/5 text-primary" : "text-on-surface/60"}`, children: "Chapters" }),
      /* @__PURE__ */ jsx(Link, { to: isLoggedIn ? "/dashboard/store" : "/store", className: `block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? "/dashboard/store" : "/store") ? "bg-primary/5 text-primary" : "text-on-surface/60"}`, children: "Supplies" }),
      /* @__PURE__ */ jsx(Link, { to: isLoggedIn ? "/dashboard/donate" : "/donate", className: `block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? "/dashboard/donate" : "/donate") ? "bg-primary/5 text-primary" : "text-on-surface/60"}`, children: "Donate" }),
      /* @__PURE__ */ jsx(Link, { to: isLoggedIn ? "/dashboard/contact" : "/contact", className: `block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? "/dashboard/contact" : "/contact") ? "bg-primary/5 text-primary" : "text-on-surface/60"}`, children: "Contact" }),
      /* @__PURE__ */ jsx("div", { className: "pt-8 flex flex-col gap-3 border-t border-border/10 mt-4", children: isLoggedIn ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Link, { to: "/dashboard", className: "flex items-center gap-3 py-3 px-4 bg-primary/5 text-primary rounded-sm text-micro font-bold tracking-tight", children: [
          /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }),
          " Dashboard"
        ] }),
        /* @__PURE__ */ jsxs(Link, { to: "/settings", className: "flex items-center gap-3 py-3 px-4 text-on-surface/60 rounded-sm text-micro font-bold tracking-tight", children: [
          /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4" }),
          " Settings"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: handleLogout, className: "flex items-center gap-3 py-3 px-4 text-destructive rounded-sm text-micro font-bold tracking-tight text-left", children: [
          /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
          " Logout"
        ] })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", className: "w-full", children: /* @__PURE__ */ jsx(Link, { to: "/login", children: "Login" }) }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "gold", className: "w-full", children: /* @__PURE__ */ jsx(Link, { to: "/register", children: "Register" }) })
      ] }) })
    ] })
  ] });
}
const FacebookIcon = ({ size = 24, className, ...props }) => /* @__PURE__ */ jsx(
  "img",
  {
    src: "/social-icons/facebook.svg",
    alt: "Facebook",
    width: size,
    height: size,
    className,
    ...props
  }
);
const InstagramIcon = ({ size = 24, className, ...props }) => /* @__PURE__ */ jsx(
  "img",
  {
    src: "/social-icons/instagram.svg",
    alt: "Instagram",
    width: size,
    height: size,
    className,
    ...props
  }
);
const TikTokIcon = ({ size = 24, className, ...props }) => /* @__PURE__ */ jsx(
  "img",
  {
    src: "/social-icons/tiktok.svg",
    alt: "TikTok",
    width: size,
    height: size,
    className,
    ...props
  }
);
const YouTubeIcon = ({ size = 24, className, ...props }) => /* @__PURE__ */ jsx(
  "img",
  {
    src: "/social-icons/youtube.svg",
    alt: "YouTube",
    width: size,
    height: size,
    className,
    ...props
  }
);
function Footer() {
  const { settings } = useBranding();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (email) {
      const success = await adminService.subscribeToNewsletter(email);
      if (success) {
        setSubscribed(true);
        setEmail("");
      }
    }
  };
  return /* @__PURE__ */ jsx("footer", { className: "bg-surface-warm/30 text-on-surface py-24 font-body-md border-t border-border/10", children: /* @__PURE__ */ jsxs("div", { className: "max-w-[1440px] mx-auto px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-4 space-y-8", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-4 hover:opacity-80 transition-opacity", children: [
          /* @__PURE__ */ jsx("img", { alt: "The Base Logo", className: "h-14 w-14 object-contain", src: settings.logo_url, decoding: "async", loading: "lazy" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-on-surface font-bold text-2xl tracking-tight leading-none mb-0", children: "The Base" }),
            /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold text-primary tracking-tight mt-2", children: "Ghana First, Jobs for the Youth!" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-on-surface/60 text-sm leading-relaxed font-medium max-w-sm", children: "A grassroots movement committed to youth jobs, accountable leadership, and national development for a more productive Ghana." }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6 pt-4", children: [
          /* @__PURE__ */ jsx("a", { href: "https://www.facebook.com/profile.php?id=61579415816496", target: "_blank", rel: "noopener noreferrer", className: "hover:scale-110 transition-transform", title: "Facebook", children: /* @__PURE__ */ jsx(FacebookIcon, { size: 24 }) }),
          /* @__PURE__ */ jsx("a", { href: "https://www.instagram.com/thebasemovementgh", target: "_blank", rel: "noopener noreferrer", className: "hover:scale-110 transition-transform", title: "Instagram", children: /* @__PURE__ */ jsx(InstagramIcon, { size: 24 }) }),
          /* @__PURE__ */ jsx("a", { href: "https://www.tiktok.com/@thebasemovementgh", target: "_blank", rel: "noopener noreferrer", className: "hover:scale-110 transition-transform", title: "TikTok", children: /* @__PURE__ */ jsx(TikTokIcon, { size: 24 }) }),
          /* @__PURE__ */ jsx("a", { href: "https://www.youtube.com/@thebasemovementgh", target: "_blank", rel: "noopener noreferrer", className: "hover:scale-110 transition-transform", title: "YouTube", children: /* @__PURE__ */ jsx(YouTubeIcon, { size: 24 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-primary font-bold tracking-tight text-tiny", children: "Foundation" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-4 text-micro font-bold tracking-tight text-on-surface/40", children: [
            /* @__PURE__ */ jsx(Link, { className: "hover:text-primary transition-colors", to: "/our-agenda", children: "The plan" }),
            /* @__PURE__ */ jsx(Link, { className: "hover:text-primary transition-colors", to: "/impact", children: "Impact" }),
            /* @__PURE__ */ jsx(Link, { className: "hover:text-primary transition-colors", to: "/chapters", children: "Chapters" }),
            /* @__PURE__ */ jsx(Link, { className: "hover:text-primary transition-colors", to: "/polls", children: "Polls" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-primary font-bold tracking-tight text-tiny", children: "Connect" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-4 text-micro font-bold tracking-tight text-on-surface/40", children: [
            /* @__PURE__ */ jsx(Link, { className: "hover:text-primary transition-colors", to: "/contact", children: "Contact" }),
            /* @__PURE__ */ jsx(Link, { className: "hover:text-primary transition-colors", to: "/press", children: "Press" }),
            /* @__PURE__ */ jsx(Link, { className: "hover:text-primary transition-colors", to: "/privacy", children: "Privacy" }),
            /* @__PURE__ */ jsx(Link, { className: "hover:text-primary transition-colors", to: "/terms", children: "Terms of service" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-primary font-bold tracking-tight text-tiny", children: "Action" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-4 text-micro font-bold tracking-tight text-on-surface/40", children: [
            /* @__PURE__ */ jsx(Link, { className: "hover:text-primary transition-colors", to: "/register", children: "Join" }),
            /* @__PURE__ */ jsx(Link, { className: "hover:text-primary transition-colors", to: "/donate", children: "Donate" }),
            /* @__PURE__ */ jsx(Link, { className: "hover:text-primary transition-colors", to: "/store", children: "Supplies" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-4 lg:pl-12", children: /* @__PURE__ */ jsxs("div", { className: "bg-charcoal-dark p-8 border-l-4 border-warm-gold text-white", children: [
        /* @__PURE__ */ jsx("h4", { className: "font-meta font-bold text-lg tracking-tight mb-4", children: "Stay Informed." }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed mb-6", children: "Subscribe to receive regular updates on our progress, community initiatives, and news from across the movement." }),
        subscribed ? /* @__PURE__ */ jsx("div", { className: "bg-brand-green/10 border border-brand-green/20 p-4 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-brand-green text-tiny font-bold tracking-tight", children: "Successfully Enlisted" }) }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubscribe, className: "space-y-3", children: [
          /* @__PURE__ */ jsx("div", { className: "relative group", children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              placeholder: "Email Address",
              required: true,
              className: "w-full bg-white/5 border border-white/10 p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-green transition-all rounded-sm"
            }
          ) }),
          /* @__PURE__ */ jsxs(Button, { type: "submit", variant: "primary", className: "w-full h-12 flex items-center justify-center gap-2 group", children: [
            "Subscribe",
            /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 transition-transform group-hover:translate-x-1" })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-24 pt-10 border-t border-border/10 flex flex-col md:flex-row items-center justify-between gap-8", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row items-center gap-4 md:gap-8", children: /* @__PURE__ */ jsx("p", { className: "text-tiny text-on-surface/30 mb-0 font-bold tracking-tight", children: "© 2026 The Base Movement. Ghana First." }) }),
      /* @__PURE__ */ jsx("div", { className: "w-48 h-2 bg-gradient-to-r from-destructive via-accent to-primary rounded-full shadow-[0_0_10px_rgba(206,17,38,0.1)] overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "w-full h-full" }) })
    ] })
  ] }) });
}
function BackToTop() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return window.scrollY > 400;
    }
    return false;
  });
  const toggleVisibility = () => {
    if (window.scrollY > 400) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);
  return /* @__PURE__ */ jsx(
    Button,
    {
      variant: "primary",
      size: "sm",
      onClick: scrollToTop,
      className: `fixed bottom-24 sm:bottom-8 right-8 z-50 w-12 h-12 p-0 shadow-2xl transition-all duration-500 ease-in-out ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-50 pointer-events-none"}`,
      "aria-label": "Back to top",
      children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-5 h-5" })
    }
  );
}
function PublicLayout() {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx(Outlet, {}) }),
    /* @__PURE__ */ jsx(Footer, {}),
    /* @__PURE__ */ jsx(BackToTop, {})
  ] });
}
function DropdownMenu({
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Root, { "data-slot": "dropdown-menu", ...props });
}
function DropdownMenuTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Trigger,
    {
      "data-slot": "dropdown-menu-trigger",
      ...props
    }
  );
}
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Content,
    {
      "data-slot": "dropdown-menu-content",
      sideOffset,
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        className
      ),
      ...props
    }
  ) });
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Item,
    {
      "data-slot": "dropdown-menu-item",
      "data-inset": inset,
      "data-variant": variant,
      className: cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Label,
    {
      "data-slot": "dropdown-menu-label",
      "data-inset": inset,
      className: cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuSeparator({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Separator,
    {
      "data-slot": "dropdown-menu-separator",
      className: cn("bg-border -mx-1 my-1 h-px", className),
      ...props
    }
  );
}
function DashboardLayout() {
  const { settings } = useBranding();
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userName, setUserName] = useState("Member");
  const [userPlatform, setUserPlatform] = useState("Member");
  const [userRegNo, setUserRegNo] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const readProfile = () => {
      const user = authService.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || "Member");
        setAvatarUrl(user.user_metadata?.avatar_url || null);
      } else {
        setAvatarUrl(localStorage.getItem("userAvatar"));
        setUserName(localStorage.getItem("userName") || "Member");
      }
      setUserPlatform(localStorage.getItem("userPlatform") || "General");
      setUserRegNo(localStorage.getItem("userRegNo") || "");
    };
    readProfile();
    const fetchUnread = async () => {
      const notes = await adminService.getNotifications();
      setUnreadCount(notes.filter((n) => !n.is_read).length);
    };
    fetchUnread();
    window.addEventListener("storage", readProfile);
    return () => window.removeEventListener("storage", readProfile);
  }, []);
  useEffect(() => {
    const closeSidebar = () => setIsSidebarOpen(false);
    closeSidebar();
  }, [location.pathname]);
  const initials = (userName || "Member").split(" ").map((n) => n[0]).join("").toUpperCase();
  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem("userToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userAvatar");
      localStorage.removeItem("userPlatform");
      localStorage.removeItem("userRegNo");
      navigate("/login");
    } catch (error) {
      console.error("[AUTH] Sign out sequence failed:", error);
      navigate("/login");
    }
  };
  const isActive = (path) => location.pathname === path;
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Overview";
    if (path === "/dashboard/blog") return "Updates";
    if (path.startsWith("/dashboard/blog/")) return "Update Article";
    if (path === "/dashboard/agenda") return "The Plan";
    if (path === "/dashboard/impact") return "Impact";
    if (path === "/dashboard/polls") return "Feedback";
    if (path === "/dashboard/store") return "Supplies";
    if (path === "/dashboard/donate") return "Donations";
    if (path === "/dashboard/members") return "Verified";
    if (path === "/dashboard/chapters") return "Chapters";
    if (path.startsWith("/dashboard/chapter/")) return "Chapter Details";
    if (path === "/dashboard/contact") return "Support";
    if (path === "/settings") return "Profile";
    if (path === "/dashboard/wishlist") return "Wishlist";
    if (path === "/dashboard/cart") return "Cart";
    if (path === "/dashboard/checkout") return "Checkout";
    if (path === "/dashboard/summary") return "Order Summary";
    return "Member Portal";
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface text-on-surface font-body-md min-h-screen", children: [
    isSidebarOpen && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm transition-opacity",
        onClick: () => setIsSidebarOpen(false)
      }
    ),
    /* @__PURE__ */ jsx(
      ShareModal,
      {
        isOpen: isShareModalOpen,
        onClose: () => setIsShareModalOpen(false),
        title: "Invite others to join The Base"
      }
    ),
    /* @__PURE__ */ jsxs(
      "aside",
      {
        "aria-label": "Dashboard Sidebar",
        className: `fixed left-0 top-0 h-full flex flex-col bg-muted/5 text-on-surface border-r border-border/40 z-50 transition-all duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 ${isSidebarCollapsed ? "w-20" : "w-64"}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: `py-8 flex items-center bg-white z-10 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? "px-0 justify-center" : "px-6 gap-3"}`, children: [
            /* @__PURE__ */ jsx("img", { src: settings.logo_url, alt: "The Base Logo", className: "h-10 w-10 object-contain shrink-0", decoding: "async" }),
            !isSidebarCollapsed && /* @__PURE__ */ jsxs("div", { className: "overflow-hidden whitespace-nowrap", children: [
              /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-on-surface leading-none mb-0 tracking-tight", children: "The Base" }),
              /* @__PURE__ */ jsx("p", { className: "text-tiny text-accent font-bold tracking-tight mt-1 mb-0", children: "Civic movement" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto sidebar-scroll pb-8", children: [
            /* @__PURE__ */ jsx("div", { className: "space-y-1", children: [
              { to: "/dashboard", icon: "grid_view", label: "Overview" },
              { to: "/dashboard/blog", icon: "article", label: "Updates" },
              { to: "/dashboard/agenda", icon: "event_note", label: "The Plan" },
              { to: "/dashboard/impact", icon: "insights", label: "Impact" },
              { to: "/dashboard/polls", icon: "how_to_vote", label: "Feedback" },
              { to: "/dashboard/store", icon: "shopping_bag", label: "Supplies" },
              { to: "/dashboard/donate", icon: "volunteer_activism", label: "Donations" },
              { to: "/dashboard/members", icon: "groups", label: "Verified" },
              { to: "/dashboard/chapters", icon: "account_balance", label: "Chapters" },
              { to: "/settings", icon: "person", label: "Account" }
            ].map((item) => /* @__PURE__ */ jsxs(
              Link,
              {
                className: `flex items-center transition-all font-meta text-sm font-bold tracking-tight ${isSidebarCollapsed ? "px-0 justify-center h-14" : "px-6 py-3"} ${isActive(item.to) || item.to !== "/dashboard" && location.pathname.startsWith(item.to) ? "text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700" : "text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800"}`,
                to: item.to,
                children: [
                  /* @__PURE__ */ jsx("span", { className: `material-symbols-outlined ${isSidebarCollapsed ? "mr-0" : "mr-3"}`, style: { fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }, children: item.icon }),
                  !isSidebarCollapsed && item.label
                ]
              },
              item.to
            )) }),
            !isSidebarCollapsed && /* @__PURE__ */ jsxs("div", { className: "mx-4 my-8 flex flex-col gap-4 transition-opacity duration-300", children: [
              /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-none relative group shrink-0 shadow-lg border border-border/10", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: settings.founder_image_url || "/founder.jpg",
                    alt: "Dr. George Oti Bonsu The Base Movement Founder",
                    className: "w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105",
                    decoding: "async"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "px-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-on-surface text-tiny font-bold tracking-tight leading-tight mb-1", children: "Dr. George Oti Bonsu" }),
                /* @__PURE__ */ jsx("p", { className: "text-accent text-tiny font-bold tracking-tight mb-0", children: "Movement Founder" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: `pt-2 transition-all duration-300 ${isSidebarCollapsed ? "px-2" : "px-6"}`, children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "primary",
                  onClick: () => setIsShareModalOpen(true),
                  className: `w-full font-bold tracking-tight shadow-2xl shadow-primary/20 flex items-center justify-center overflow-hidden ${isSidebarCollapsed ? "h-12 px-0" : "h-14"}`,
                  children: isSidebarCollapsed ? /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined", children: "share" }) : /* @__PURE__ */ jsx("span", { className: "text-tiny", children: "Invite & Share" })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: `mt-8 space-y-4 ${isSidebarCollapsed ? "px-0 flex flex-col items-center" : "pl-2"}`, children: [
                /* @__PURE__ */ jsxs(
                  Link,
                  {
                    className: `flex items-center transition-all font-bold text-tiny tracking-tight ${isActive("/dashboard/contact") ? "text-primary" : "text-on-surface/40 hover:text-primary"}`,
                    to: "/dashboard/contact",
                    children: [
                      /* @__PURE__ */ jsx("span", { className: `material-symbols-outlined ${isSidebarCollapsed ? "text-2xl" : "text-lg mr-3"}`, style: { fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }, children: "help" }),
                      !isSidebarCollapsed && "Support"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Link,
                  {
                    to: "/",
                    className: `flex items-center rounded-sm border border-border/40 text-on-surface/40 hover:border-primary hover:text-primary transition-all font-bold text-tiny tracking-tight group bg-white/50 ${isSidebarCollapsed ? "w-10 h-10 justify-center" : "w-full h-12 px-4 gap-3 mt-8"}`,
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-base group-hover:text-primary transition-colors", style: { fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }, children: "arrow_back" }),
                      !isSidebarCollapsed && "Back to Site"
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("main", { className: `min-h-screen bg-muted/10 flex flex-col pt-16 transition-all duration-300 ${isSidebarCollapsed ? "md:ml-20" : "md:ml-64"}`, children: [
      /* @__PURE__ */ jsx("div", { className: `fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/40 shadow-sm transition-all duration-300 ${isSidebarCollapsed ? "md:left-20" : "md:left-64"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 md:px-10 h-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(true);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              },
              className: "p-2 -ml-2 rounded-sm hover:bg-muted/10 text-on-surface/60 transition-colors",
              children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[28px]", children: "menu" })
            }
          ),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold tracking-tight text-on-surface m-0 font-meta", children: getPageTitle() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "relative hidden lg:block", children: /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30 group-focus-within:text-primary transition-colors" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search updates...",
                className: "w-full sm:w-64 pl-10 pr-4 py-2 bg-on-surface/5 border border-transparent focus:border-primary/20 focus:bg-white rounded-none text-xs font-medium transition-all outline-none"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "h-6 w-px bg-border/20 mx-2 hidden lg:block" }),
          /* @__PURE__ */ jsxs("button", { className: "relative p-2.5 rounded-sm hover:bg-muted/10 transition-all group", children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "material-symbols-outlined text-on-surface/40 group-hover:text-primary transition-colors text-[22px]",
                style: { fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" },
                children: "notifications"
              }
            ),
            unreadCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-destructive rounded-full ring-2 ring-white text-micro flex items-center justify-center text-white font-bold tracking-tight", children: unreadCount })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-6 w-px bg-border/20 mx-8" }),
          /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-4 group outline-none", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-sm overflow-hidden ring-4 ring-primary/5 group-hover:ring-primary/20 transition-all shadow-2xl shrink-0", children: avatarUrl ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: avatarUrl,
                  alt: userName,
                  className: "w-full h-full object-cover",
                  decoding: "async"
                }
              ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-primary flex items-center justify-center text-white text-tiny font-bold tracking-tight", children: initials || "M" }) }),
              /* @__PURE__ */ jsxs("div", { className: "hidden lg:block text-left", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface leading-none mb-1 capitalize tracking-tight", children: userName?.toLowerCase() }),
                /* @__PURE__ */ jsxs("p", { className: "text-tiny text-accent font-bold tracking-tight mb-0", children: [
                  userPlatform === "ADMIN" ? "Chapter Lead" : userPlatform === "PATRIOT" ? "Member" : "Member",
                  " ",
                  userRegNo && `· ${userRegNo}`
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: "material-symbols-outlined text-on-surface/20 text-[18px] group-hover:text-primary transition-colors",
                  style: { fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" },
                  children: "expand_more"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-56 mt-2 bg-white border-border/40 shadow-2xl rounded-none", children: [
              /* @__PURE__ */ jsx(DropdownMenuLabel, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-1", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-on-surface leading-none capitalize", children: userName?.toLowerCase() }),
                /* @__PURE__ */ jsx("p", { className: "text-tiny font-bold text-muted-foreground/60 tracking-tight truncate", children: userRegNo || "Unverified Account" })
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, { className: "bg-border/10" }),
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, className: "cursor-pointer p-3 focus:bg-primary/5 transition-colors group", children: /* @__PURE__ */ jsxs(Link, { to: "/dashboard/settings", className: "flex items-center gap-3 w-full", children: [
                /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" }),
                /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold tracking-tight text-on-surface/70 group-hover:text-on-surface", children: "Member Profile" })
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, className: "cursor-pointer p-3 focus:bg-primary/5 transition-colors group", children: /* @__PURE__ */ jsxs(Link, { to: "/dashboard/settings?tab=security", className: "flex items-center gap-3 w-full", children: [
                /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" }),
                /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold tracking-tight text-on-surface/70 group-hover:text-on-surface", children: "Security Settings" })
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, { className: "bg-border/10" }),
              /* @__PURE__ */ jsx(
                DropdownMenuItem,
                {
                  onClick: handleLogout,
                  className: "cursor-pointer p-3 focus:bg-destructive/5 transition-colors group text-destructive",
                  children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 w-full", children: [
                    /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" }),
                    /* @__PURE__ */ jsx("span", { className: "text-tiny font-bold tracking-tight", children: "Sign out of Base" })
                  ] })
                }
              )
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 main-content-wrapper px-6 md:px-10 py-8", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto w-full", children: /* @__PURE__ */ jsx(Outlet, {}) }) }),
      /* @__PURE__ */ jsx("footer", { className: "mt-16 py-16 px-12 border-t border-border/10 bg-muted/5", children: /* @__PURE__ */ jsxs("div", { className: "max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-tiny text-muted-foreground/40 mb-0 font-bold tracking-tight", children: [
          "© ",
          (/* @__PURE__ */ new Date()).getFullYear(),
          " The Base Movement. Ghana First."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-center items-center gap-6 sm:gap-10", children: [
          /* @__PURE__ */ jsx(Link, { className: "font-bold text-xs text-muted-foreground/40 hover:text-primary transition-colors", to: "/dashboard/privacy", children: "Privacy Policy" }),
          /* @__PURE__ */ jsx(Link, { className: "font-bold text-xs text-muted-foreground/40 hover:text-primary transition-colors", to: "/dashboard/terms", children: "Terms of Service" }),
          /* @__PURE__ */ jsx(Link, { className: "font-bold text-xs text-muted-foreground/40 hover:text-primary transition-colors", to: "/dashboard/contact", children: "Support Portal" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(BackToTop, {})
  ] });
}
const Blog = lazy(() => import("./assets/Blog-20uXhwJm.js"));
const OurAgenda = lazy(() => import("./assets/OurAgenda-C3_g7OOo.js"));
const Contact = lazy(() => import("./assets/Contact-bAn6zWIU.js"));
const Donate = lazy(() => import("./assets/Donate-Bl6iThDp.js"));
const Members = lazy(() => import("./assets/Members-CAXUmJ3O.js"));
const Store = lazy(() => import("./assets/Store-BSA8uuEN.js"));
const ProductDetails = lazy(() => import("./assets/ProductDetails-CDTGw2gS.js"));
const Cart = lazy(() => import("./assets/Cart-q1aCacO2.js"));
const Checkout = lazy(() => import("./assets/Checkout-DKXSwHTs.js"));
const OrderSummary = lazy(() => import("./assets/OrderSummary-DGlyktqC.js"));
const Impact = lazy(() => import("./assets/Impact-3trdO4ju.js"));
const Chapters = lazy(() => import("./assets/Chapters-BIN73Jkv.js"));
const ChapterDetails = lazy(() => import("./assets/ChapterDetails-Bl4a7T7X.js"));
const BlogPost = lazy(() => import("./assets/BlogPost-Bf3FmVZH.js"));
const Privacy = lazy(() => import("./assets/Privacy-C53ghv0g.js"));
const Terms = lazy(() => import("./assets/Terms-Z14auHL3.js"));
const Wishlist = lazy(() => import("./assets/Wishlist-B4VAfiVT.js"));
const VerifyID = lazy(() => import("./assets/VerifyID-BVrFSaZe.js"));
const Press = lazy(() => import("./assets/Press-Bsx6pkXW.js"));
const NotFound = lazy(() => import("./assets/NotFound-Bbvjswct.js"));
const RegistrationFormPreview = lazy(() => import("./assets/RegistrationFormPreview-CMkHGS7z.js"));
const ProfileSettings = lazy(() => import("./assets/ProfileSettings-z6MfXJPF.js"));
const Polls = lazy(() => import("./assets/Polls-QUU4P5Wa.js"));
const FeedbackHub = lazy(() => import("./assets/FeedbackHub-BPgLr95x.js"));
const CanvasserClipboard = lazy(() => import("./assets/CanvasserClipboard-3SWcNluy.js"));
const AdminLayout = lazy(() => import("./assets/AdminLayout-4nUevoQN.js"));
const AdminDashboard = lazy(() => import("./assets/Dashboard-D1o7nHnZ.js"));
const AdminMembers = lazy(() => import("./assets/Members-BFZRTNZg.js"));
const AdminChapters = lazy(() => import("./assets/Chapters-Bhs0psS4.js"));
const AdminPolls = lazy(() => import("./assets/Polls-S1VSqZgY.js"));
const AdminStore = lazy(() => import("./assets/Store-CogThuXH.js"));
const AdminSettings = lazy(() => import("./assets/Settings-B8dm8WQZ.js"));
const AdminMemberVerification = lazy(() => import("./assets/MemberVerification-BU6owpff.js"));
const AdminRegions = lazy(() => import("./assets/Regions-CnLfzdsN.js"));
const AdminBlogs = lazy(() => import("./assets/Blogs-BPpX1vXd.js"));
const AdminAuthors = lazy(() => import("./assets/Authors-DXfZPCQ6.js"));
const AdminEditAuthor = lazy(() => import("./assets/EditAuthor-CWX03Qud.js"));
const AdminMediaLibrary = lazy(() => import("./assets/MediaLibrary-C_MrWjIg.js"));
const AdminLeadershipHub = lazy(() => import("./assets/LeadershipHub-yMnzRHC1.js"));
const AdminDonations = lazy(() => import("./assets/DonationVerification-DxIGB6JO.js"));
const AdminAdministrators = lazy(() => import("./assets/Administrators-9eZqJAcg.js"));
const AdminBroadcasts = lazy(() => import("./assets/Broadcasts-CPZPTvlu.js"));
const AdminNewBroadcast = lazy(() => import("./assets/NewBroadcast-BAvE2h_Q.js"));
const AdminOrders = lazy(() => import("./assets/Orders-DdOetLfu.js"));
const AdminChapterHub = lazy(() => import("./assets/ChapterLeadHub-Dgrn6QHI.js"));
const AdminFieldDirectives = lazy(() => import("./assets/FieldDirectives-xVRhFL_B.js"));
const AdminMobilizationMetrics = lazy(() => import("./assets/MobilizationMetrics-CsRS_YY-.js"));
const AdminLogisticsIntelligence = lazy(() => import("./assets/LogisticsIntelligence-D2PCI6fU.js"));
const AdminRallyCommand = lazy(() => import("./assets/RallyCommand-BE9uR9Mz.js"));
const AdminSentimentIntelligence = lazy(() => import("./assets/SentimentIntelligence-h7JHYOFh.js"));
const AdminWarRoomCommand = lazy(() => import("./assets/WarRoomCommand-CSglW6c7.js"));
const AdminGroundGameCommand = lazy(() => import("./assets/GroundGameCommand-Bihz7NPe.js"));
const AdminDeployMission = lazy(() => import("./assets/DeployMission-PEQhQNWC.js"));
const AdminTrash = lazy(() => import("./assets/Trash-BZPkmwa-.js"));
const AdminRoadmap = lazy(() => import("./assets/Roadmap-CNsBMfC-.js"));
const AdminStrategicPriorities = lazy(() => import("./assets/StrategicPriorities-CuQzZEWR.js"));
const routes = [
  {
    path: "/admin",
    element: /* @__PURE__ */ jsx(Navigate, { to: "/admin/dashboard", replace: true })
  },
  {
    path: "/checkout",
    element: /* @__PURE__ */ jsx(Navigate, { to: "/store/checkout", replace: true })
  },
  {
    path: "/dashboard/checkout",
    element: /* @__PURE__ */ jsx(Navigate, { to: "/dashboard/store/checkout", replace: true })
  },
  {
    path: "/members",
    element: /* @__PURE__ */ jsx(Navigate, { to: "/dashboard/members", replace: true })
  },
  {
    path: "/register/preview",
    element: /* @__PURE__ */ jsx(RegistrationFormPreview, {})
  },
  {
    element: /* @__PURE__ */ jsx(PublicLayout, {}),
    children: [
      { path: "/", element: /* @__PURE__ */ jsx(Home, {}) },
      { path: "/blog", element: /* @__PURE__ */ jsx(Blog, {}) },
      { path: "/blog/:id", element: /* @__PURE__ */ jsx(BlogPost, {}) },
      { path: "/our-agenda", element: /* @__PURE__ */ jsx(OurAgenda, {}) },
      { path: "/register", element: /* @__PURE__ */ jsx(Register, {}) },
      { path: "/contact", element: /* @__PURE__ */ jsx(Contact, {}) },
      { path: "/donate", element: /* @__PURE__ */ jsx(Donate, {}) },
      { path: "/login", element: /* @__PURE__ */ jsx(Login, {}) },
      { path: "/store", element: /* @__PURE__ */ jsx(Store, {}) },
      { path: "/store/product/:slug", element: /* @__PURE__ */ jsx(ProductDetails, {}) },
      { path: "/store/cart", element: /* @__PURE__ */ jsx(Cart, {}) },
      { path: "/store/wishlist", element: /* @__PURE__ */ jsx(Wishlist, {}) },
      { path: "/store/checkout", element: /* @__PURE__ */ jsx(Checkout, {}) },
      { path: "/store/summary", element: /* @__PURE__ */ jsx(OrderSummary, {}) },
      { path: "/impact", element: /* @__PURE__ */ jsx(Impact, {}) },
      { path: "/polls", element: /* @__PURE__ */ jsx(Polls, {}) },
      { path: "/chapters", element: /* @__PURE__ */ jsx(Chapters, {}) },
      { path: "/privacy", element: /* @__PURE__ */ jsx(Privacy, {}) },
      { path: "/terms", element: /* @__PURE__ */ jsx(Terms, {}) },
      { path: "/press", element: /* @__PURE__ */ jsx(Press, {}) },
      { path: "/verify/:id", element: /* @__PURE__ */ jsx(VerifyID, {}) },
      { path: "/admin-login", element: /* @__PURE__ */ jsx(AdminLogin, {}) },
      { path: "*", element: /* @__PURE__ */ jsx(NotFound, {}) }
    ]
  },
  {
    element: /* @__PURE__ */ jsx(DashboardLayout, {}),
    children: [
      { path: "/dashboard", element: /* @__PURE__ */ jsx(Dashboard, {}) },
      { path: "/dashboard/blog", element: /* @__PURE__ */ jsx(Blog, {}) },
      { path: "/dashboard/blog/:id", element: /* @__PURE__ */ jsx(BlogPost, {}) },
      { path: "/dashboard/agenda", element: /* @__PURE__ */ jsx(OurAgenda, {}) },
      { path: "/dashboard/impact", element: /* @__PURE__ */ jsx(Impact, {}) },
      { path: "/dashboard/polls", element: /* @__PURE__ */ jsx(Polls, {}) },
      { path: "/dashboard/store", element: /* @__PURE__ */ jsx(Store, {}) },
      { path: "/dashboard/store/product/:slug", element: /* @__PURE__ */ jsx(ProductDetails, {}) },
      { path: "/dashboard/store/cart", element: /* @__PURE__ */ jsx(Cart, {}) },
      { path: "/dashboard/store/wishlist", element: /* @__PURE__ */ jsx(Wishlist, {}) },
      { path: "/dashboard/store/checkout", element: /* @__PURE__ */ jsx(Checkout, {}) },
      { path: "/dashboard/store/summary", element: /* @__PURE__ */ jsx(OrderSummary, {}) },
      { path: "/dashboard/feedback", element: /* @__PURE__ */ jsx(FeedbackHub, {}) },
      { path: "/dashboard/canvass", element: /* @__PURE__ */ jsx(CanvasserClipboard, {}) },
      { path: "/dashboard/donate", element: /* @__PURE__ */ jsx(Donate, {}) },
      { path: "/dashboard/contact", element: /* @__PURE__ */ jsx(Contact, {}) },
      { path: "/dashboard/members", element: /* @__PURE__ */ jsx(Members, {}) },
      { path: "/dashboard/chapters", element: /* @__PURE__ */ jsx(Chapters, {}) },
      { path: "/dashboard/chapters/:id", element: /* @__PURE__ */ jsx(ChapterDetails, {}) },
      { path: "/dashboard/privacy", element: /* @__PURE__ */ jsx(Privacy, {}) },
      { path: "/dashboard/terms", element: /* @__PURE__ */ jsx(Terms, {}) },
      { path: "/settings", element: /* @__PURE__ */ jsx(ProfileSettings, {}) }
    ]
  },
  {
    element: /* @__PURE__ */ jsx(AdminLayout, {}),
    children: [
      { path: "/admin/dashboard", element: /* @__PURE__ */ jsx(AdminDashboard, {}) },
      { path: "/admin/leadership", element: /* @__PURE__ */ jsx(AdminLeadershipHub, {}) },
      { path: "/admin/chapter-hub", element: /* @__PURE__ */ jsx(AdminChapterHub, {}) },
      { path: "/admin/directives", element: /* @__PURE__ */ jsx(AdminFieldDirectives, {}) },
      { path: "/admin/mobilization-metrics", element: /* @__PURE__ */ jsx(AdminMobilizationMetrics, {}) },
      { path: "/admin/logistics-intelligence", element: /* @__PURE__ */ jsx(AdminLogisticsIntelligence, {}) },
      { path: "/admin/rally-command", element: /* @__PURE__ */ jsx(AdminRallyCommand, {}) },
      { path: "/admin/sentiment-intelligence", element: /* @__PURE__ */ jsx(AdminSentimentIntelligence, {}) },
      { path: "/admin/war-room", element: /* @__PURE__ */ jsx(AdminWarRoomCommand, {}) },
      { path: "/admin/ground-game", element: /* @__PURE__ */ jsx(AdminGroundGameCommand, {}) },
      { path: "/admin/ground-game/deploy", element: /* @__PURE__ */ jsx(AdminDeployMission, {}) },
      { path: "/admin/donations", element: /* @__PURE__ */ jsx(AdminDonations, {}) },
      { path: "/admin/priorities", element: /* @__PURE__ */ jsx(AdminStrategicPriorities, {}) },
      { path: "/admin/members", element: /* @__PURE__ */ jsx(AdminMembers, {}) },
      { path: "/admin/verification", element: /* @__PURE__ */ jsx(AdminMemberVerification, {}) },
      { path: "/admin/chapters", element: /* @__PURE__ */ jsx(AdminChapters, {}) },
      { path: "/admin/polls", element: /* @__PURE__ */ jsx(AdminPolls, {}) },
      { path: "/admin/store", element: /* @__PURE__ */ jsx(AdminStore, {}) },
      { path: "/admin/settings", element: /* @__PURE__ */ jsx(AdminSettings, {}) },
      { path: "/admin/regions", element: /* @__PURE__ */ jsx(AdminRegions, {}) },
      { path: "/admin/blogs", element: /* @__PURE__ */ jsx(AdminBlogs, {}) },
      { path: "/admin/authors", element: /* @__PURE__ */ jsx(AdminAuthors, {}) },
      { path: "/admin/authors/new", element: /* @__PURE__ */ jsx(AdminEditAuthor, {}) },
      { path: "/admin/authors/edit/:id", element: /* @__PURE__ */ jsx(AdminEditAuthor, {}) },
      { path: "/admin/media", element: /* @__PURE__ */ jsx(AdminMediaLibrary, {}) },
      { path: "/admin/broadcasts", element: /* @__PURE__ */ jsx(AdminBroadcasts, {}) },
      { path: "/admin/broadcasts/new", element: /* @__PURE__ */ jsx(AdminNewBroadcast, {}) },
      { path: "/admin/administrators", element: /* @__PURE__ */ jsx(AdminAdministrators, {}) },
      { path: "/admin/orders", element: /* @__PURE__ */ jsx(AdminOrders, {}) },
      { path: "/admin/roadmap", element: /* @__PURE__ */ jsx(AdminRoadmap, {}) },
      { path: "/admin/trash", element: /* @__PURE__ */ jsx(AdminTrash, {}) }
    ]
  }
];
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Viewport,
  {
    ref,
    className: cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    ),
    ...props
  }
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    ToastPrimitives.Root,
    {
      ref,
      className: cn(toastVariants({ variant }), className),
      ...props
    }
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;
const ToastAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Action,
  {
    ref,
    className: cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    ),
    ...props
  }
));
ToastAction.displayName = ToastPrimitives.Action.displayName;
const ToastClose = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Close,
  {
    ref,
    className: cn(
      "absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    ),
    "toast-close": "",
    ...props,
    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
  }
));
ToastClose.displayName = ToastPrimitives.Close.displayName;
const ToastTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Title,
  {
    ref,
    className: cn("text-sm font-semibold [&+div]:text-xs", className),
    ...props
  }
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
const ToastDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Description,
  {
    ref,
    className: cn("text-sm opacity-90", className),
    ...props
  }
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1e6;
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}
const toastTimeouts = /* @__PURE__ */ new Map();
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === action.toast.id ? { ...t, ...action.toast } : t
        )
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast2) => {
          addToRemoveQueue(toast2.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === toastId || toastId === void 0 ? {
            ...t,
            open: false
          } : t
        )
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === void 0) {
        return {
          ...state,
          toasts: []
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId)
      };
  }
};
const listeners = [];
let memoryState = { toasts: [] };
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}
function toast({ ...props }) {
  const id = genId();
  const update = (props2) => dispatch({
    type: "UPDATE_TOAST",
    toast: { ...props2, id }
  });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      }
    }
  });
  return {
    id,
    dismiss,
    update
  };
}
function useToast() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);
  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId })
  };
}
function Toaster() {
  const { toasts } = useToast();
  return /* @__PURE__ */ jsxs(ToastProvider, { children: [
    toasts.map(function({ id, title, description, action, ...props }) {
      return /* @__PURE__ */ jsxs(Toast, { ...props, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
          title && /* @__PURE__ */ jsx(ToastTitle, { children: title }),
          description && /* @__PURE__ */ jsx(ToastDescription, { children: description })
        ] }),
        action,
        /* @__PURE__ */ jsx(ToastClose, {})
      ] }, id);
    }),
    /* @__PURE__ */ jsx(ToastViewport, {})
  ] });
}
function App() {
  const content = useRoutes(routes);
  return /* @__PURE__ */ jsx(PerformanceProvider, { children: /* @__PURE__ */ jsx(BrandingProvider, { children: /* @__PURE__ */ jsxs(StoreProvider, { children: [
    /* @__PURE__ */ jsx(ScrollToTop, {}),
    /* @__PURE__ */ jsx(ReadingProgressBar, {}),
    /* @__PURE__ */ jsx(Toaster, {}),
    /* @__PURE__ */ jsx(Toaster$1, { position: "top-right", richColors: true }),
    /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(LoadingScreen, {}), children: content })
  ] }) }) });
}
const ChaptersContext = createContext(null);
function ChaptersProvider({ children }) {
  const queryClient2 = useQueryClient();
  const { data: chapters = [], isLoading, refetch } = useQuery({
    queryKey: ["chapters"],
    queryFn: () => adminService.getChapters()
  });
  const addChapterMutation = useMutation({
    mutationFn: (chapter) => adminService.createChapter(chapter),
    onSuccess: (success) => {
      if (success) {
        queryClient2.invalidateQueries({ queryKey: ["chapters"] });
      }
    }
  });
  const updateChapterMutation = useMutation({
    mutationFn: ({ id, patch }) => adminService.updateChapter(id, patch),
    onSuccess: (success) => {
      if (success) {
        queryClient2.invalidateQueries({ queryKey: ["chapters"] });
      }
    }
  });
  const deleteChapterMutation = useMutation({
    mutationFn: ({ id, name }) => adminService.deleteChapter(id, name),
    onSuccess: (success) => {
      if (success) {
        queryClient2.invalidateQueries({ queryKey: ["chapters"] });
      }
    }
  });
  const refreshChapters = async () => {
    await refetch();
  };
  const addChapter = async (chapter) => {
    try {
      return await addChapterMutation.mutateAsync(chapter);
    } catch (error) {
      console.error("[ChaptersContext] Failed to add chapter:", error);
      return false;
    }
  };
  const updateChapter = async (id, patch) => {
    try {
      return await updateChapterMutation.mutateAsync({ id, patch });
    } catch (error) {
      console.error("[ChaptersContext] Failed to update chapter:", error);
      return false;
    }
  };
  const deleteChapter = async (id, name) => {
    try {
      return await deleteChapterMutation.mutateAsync({ id, name });
    } catch (error) {
      console.error("[ChaptersContext] Failed to delete chapter:", error);
      return false;
    }
  };
  return /* @__PURE__ */ jsx(
    ChaptersContext.Provider,
    {
      value: {
        chapters,
        isLoading,
        refreshChapters,
        addChapter,
        updateChapter,
        deleteChapter
      },
      children
    }
  );
}
function useChapters() {
  const ctx = useContext(ChaptersContext);
  if (!ctx) throw new Error("useChapters must be used inside <ChaptersProvider>");
  return ctx;
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3e5,
      retry: 3,
      networkMode: "always"
    }
  }
});
const createApp = ViteReactSSG(
  {
    routes: [
      {
        element: /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(HelmetProvider, { children: /* @__PURE__ */ jsx(ChaptersProvider, { children: /* @__PURE__ */ jsx(App, {}) }) }) }),
        children: routes
      }
    ]
  },
  ({ isClient }) => {
    if (isClient) {
      console.log("[MAIN] Application hydrated successfully");
    }
  }
);
export {
  Label as A,
  Button as B,
  Card as C,
  DropdownMenu as D,
  authService as E,
  Input as I,
  LoadingScreen as L,
  MembershipCard as M,
  SEO as S,
  adminService as a,
  BrandLine as b,
  cn as c,
  createApp,
  CardContent as d,
  ShareModal as e,
  donationService as f,
  chapterService as g,
  useChapters as h,
  StoreContext as i,
  CardHeader as j,
  usePerformance as k,
  logisticsService as l,
  memberService as m,
  DropdownMenuTrigger as n,
  DropdownMenuContent as o,
  DropdownMenuLabel as p,
  DropdownMenuSeparator as q,
  DropdownMenuItem as r,
  supabase as s,
  useToast as t,
  useBranding as u,
  CardTitle as v,
  CardDescription as w,
  contentService as x,
  buttonVariants as y,
  CardFooter as z
};
