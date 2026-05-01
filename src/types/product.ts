export interface Product {
  id: number;
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
}
