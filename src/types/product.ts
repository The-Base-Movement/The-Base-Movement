export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  display_order: number;
}

export interface ProductReview {
  id: string;
  patriot_name: string;
  rating: number;
  content: string;
  is_verified: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  description: string;
  status: string;
  category: string;
  rating: number;
  image?: string;
  longDescription?: string;
  sizes?: string[];
  colors?: string[];
  reviews?: number;
  compare_at_price?: string | number;
  stock_quantity?: number;
  // Premium Fields
  is_featured?: boolean;
  customization_allowed?: boolean;
  specifications?: Record<string, string | number | boolean | null>;
  gallery_images?: ProductImage[];
  reviews_data?: ProductReview[];
}
