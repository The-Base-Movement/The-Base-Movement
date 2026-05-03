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
}
