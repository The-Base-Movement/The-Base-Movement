import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Star, Plus, Minus, ShieldCheck, Truck, RefreshCw, Heart, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ShareModal } from '@/components/ShareModal'
import type { Product } from '@/types/product'
import { useStore } from '@/hooks/useStore'

const products: Product[] = [
  {
    id: 1,
    name: 'The Base Premium T-Shirt',
    slug: 'premium-t-shirt',
    price: 'GHS 85.00',
    description: '100% heavy cotton with high-density movement branding. Designed for durability and comfort during movement activities.',
    longDescription: 'Our signature movement t-shirt is engineered for the modern citizen. Made from 240gsm premium cotton, it features reinforced stitching and a specialized high-density print of "The Base" logo that won\'t fade or crack. Each shirt is pre-shrunk to ensure a perfect fit that lasts.',
    status: 'Available',
    category: 'Apparel',
    rating: 4.9,
    reviews: 128,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Jet Black', 'Movement Green', 'Stone White']
  },
  {
    id: 2,
    name: 'Ghana First Signature Cap',
    slug: 'signature-cap',
    price: 'GHS 55.00',
    description: 'Structured 6-panel cap with premium 3D embroidery.',
    longDescription: 'Crafted from premium brushed cotton twill, this signature cap features high-definition 3D embroidery of the "Ghana First" slogan. With a structured 6-panel design and an adjustable brass buckle, it offers both a superior fit and a bold statement of patriotism.',
    status: 'Available',
    category: 'Accessories',
    rating: 4.8,
    reviews: 84,
    sizes: ['One Size'],
    colors: ['Black', 'Forest Green', 'Sand']
  },
  {
    id: 3,
    name: 'Patriotic Movement Wristband',
    slug: 'movement-wristband',
    price: 'GHS 15.00',
    description: 'Eco-friendly silicone with debossed movement slogan.',
    longDescription: 'Wear your support with pride. These durable, eco-friendly silicone wristbands feature debossed movement slogans that won\'t wear off. Available in the official movement colors, they are designed to be worn every day as a symbol of our collective commitment to a better Ghana.',
    status: 'Available',
    category: 'Accessories',
    rating: 4.7,
    reviews: 312,
    sizes: ['M', 'L'],
    colors: ['Green', 'Gold', 'Red']
  },
  {
    id: 4,
    name: 'Executive Movement Notebook',
    slug: 'movement-notebook',
    price: 'GHS 35.00',
    description: 'Hardcover A5 with gold foil branding and 120gsm paper.',
    longDescription: 'The essential tool for every organizer. This A5 hardcover notebook features elegant gold foil branding and 160 pages of premium 120gsm ivory paper, perfect for fountain pens. Includes a ribbon marker, elastic closure, and an expandable inner pocket for secure storage of movement flyers.',
    status: 'Available',
    category: 'Stationery',
    rating: 4.9,
    reviews: 56,
    sizes: ['A5'],
    colors: ['Navy Blue', 'Forest Green', 'Executive Black']
  },
  {
    id: 5,
    name: 'Movement Growth Hoodie',
    slug: 'growth-hoodie',
    price: 'GHS 180.00',
    description: 'Oversized fit with screen-printed back graphics.',
    longDescription: 'A blend of style and mission. Our Growth Hoodie is made from heavy-weight 400gsm fleece with a comfortable oversized fit. The back features a high-impact screen-printed graphic symbolizing the growth of the movement across all 16 regions of Ghana.',
    status: 'Coming Soon',
    category: 'Apparel',
    rating: 5.0,
    reviews: 0,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Slate Gray', 'Forest Green']
  },
  {
    id: 6,
    name: 'Founding Member Pin',
    slug: 'member-pin',
    price: 'GHS 25.00',
    description: 'Enamel pin with polished gold finish and secure clasp.',
    longDescription: 'The ultimate symbol of early commitment. This Founding Member Pin is struck from high-quality copper with a hard enamel finish and polished gold plating. It features a secure butterfly clasp on the reverse and comes in a presentation box, marking you as a pioneer of the movement.',
    status: 'Available',
    category: 'Limited Edition',
    rating: 4.9,
    reviews: 215,
    sizes: ['One Size'],
    colors: ['Gold']
  }
]

export default function ProductDetails() {
  const { id } = useParams() // This is now the slug
  const { isInWishlist, addToWishlist, removeFromWishlist } = useStore()
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedColor, setSelectedColor] = useState('Jet Black')
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const product = products.find(p => p.slug === id) || products[0]
  const isWishlisted = product ? isInWishlist(product.id) : false

  return (
    <div className="w-full px-6 md:px-12 py-12 bg-off-white min-h-screen">
      <Breadcrumbs />
      <Link 
        to={window.location.pathname.includes('/dashboard') ? '/dashboard/store' : '/store'}
        className="inline-flex items-center gap-2 text-stone-500 hover:text-brand-green transition-colors mb-12 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="font-meta text-xs font-bold uppercase tracking-widest">Back to Store</span>
      </Link>

      <div className="grid lg:grid-cols-2 gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-stone-100 rounded-sm overflow-hidden border border-stone-200">
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-32 h-32 text-stone-300" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square bg-stone-100 border border-stone-200 rounded-sm cursor-pointer hover:border-brand-green transition-all" />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-brand-green/10 text-brand-green text-[10px] font-bold tracking-widest uppercase rounded-full mb-4">
              {product.category}
            </span>
            <h1 className="font-h1 text-h2 text-stone-900 mb-4">{product.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'fill-warm-gold text-warm-gold' : 'text-stone-300'}`} />
                ))}
                <span className="ml-2 text-sm font-bold text-stone-900">{product.rating}</span>
              </div>
              <span className="text-stone-300">|</span>
              <span className="text-sm text-stone-500">{product.reviews} Verified Reviews</span>
            </div>
            <p className="text-2xl font-bold text-brand-green">{product.price}</p>
          </div>

          <p className="text-stone-600 font-body-md leading-relaxed mb-10">
            {product.longDescription}
          </p>

          <div className="space-y-8 mb-10">
            {/* Color Selection */}
            <div>
              <p className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-4">Color: {selectedColor}</p>
              <div className="flex gap-3">
                {product.colors?.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color ? 'border-brand-green scale-110 shadow-md' : 'border-transparent shadow-sm'
                    }`}
                    style={{ backgroundColor: color === 'Jet Black' ? '#1a1a1a' : color === 'Movement Green' ? '#006B3C' : '#f5f5f4' }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Select Size</p>
                <button 
                  onClick={() => setShowSizeGuide(true)}
                  className="text-[10px] font-bold text-brand-green uppercase tracking-widest hover:underline"
                >
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes?.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] h-12 flex items-center justify-center border text-xs font-bold transition-all rounded-sm ${
                      selectedSize === size
                        ? 'bg-brand-green border-brand-green text-white shadow-md'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-brand-green'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-4">Quantity</p>
              <div className="flex items-center w-32 h-12 border border-stone-200 bg-white rounded-sm overflow-hidden">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex-1 h-full flex items-center justify-center hover:bg-stone-50 transition-colors"
                >
                  <Minus className="w-4 h-4 text-stone-500" />
                </button>
                <span className="flex-1 text-center font-bold text-stone-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex-1 h-full flex items-center justify-center hover:bg-stone-50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-stone-500" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-12">
            <Button asChild className="flex-1 h-14 bg-brand-green hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded-sm shadow-lg shadow-brand-green/20">
              <Link to={window.location.pathname.includes('/dashboard') ? '/dashboard/store/cart' : '/store/cart'}>
                Add to Shopping Bag
              </Link>
            </Button>
            <button 
              onClick={() => {
                if (product) {
                  if (isWishlisted) {
                    removeFromWishlist(product.id)
                  } else {
                    addToWishlist(product)
                  }
                }
              }}
              className={`w-14 h-14 border flex items-center justify-center transition-all rounded-sm ${isWishlisted ? 'border-brand-red bg-brand-red/5 text-brand-red shadow-lg shadow-brand-red/10' : 'border-stone-200 text-stone-400 hover:border-brand-red hover:text-brand-red'}`}
            >
              <Heart className={`w-6 h-6 transition-all ${isWishlisted ? 'fill-brand-red text-brand-red' : ''}`} />
            </button>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="w-14 h-14 border border-stone-200 text-stone-400 hover:border-brand-green hover:text-brand-green transition-all rounded-sm flex items-center justify-center"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          {/* Delivery & Returns Info */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 py-8 border-t border-stone-200">
            <div className="flex flex-col items-center text-center gap-2">
              <Truck className="w-5 h-5 text-brand-green" />
              <p className="text-sm font-bold text-stone-900 uppercase tracking-widest leading-tight">Fast Delivery</p>
              <p className="text-sm text-stone-500 font-medium leading-tight">2-3 Days</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2 border-x border-stone-100 px-2">
              <ShieldCheck className="w-5 h-5 text-brand-green" />
              <p className="text-sm font-bold text-stone-900 uppercase tracking-widest leading-tight">Secure Pay</p>
              <p className="text-sm text-stone-500 font-medium leading-tight">Verified</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <RefreshCw className="w-5 h-5 text-brand-green" />
              <p className="text-sm font-bold text-stone-900 uppercase tracking-widest leading-tight">Easy Returns</p>
              <p className="text-sm text-stone-500 font-medium leading-tight">7-Day Policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Products */}
      <section className="mt-24">
        <h2 className="font-h2 text-h3 text-stone-900 mb-12">You Might Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Mock recommended products would go here */}
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[4/5] bg-stone-100 rounded-sm animate-pulse" />
          ))}
        </div>
      </section>
      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setShowSizeGuide(false)}
          />
          <div className="relative bg-white w-full max-w-lg shadow-2xl rounded-none overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-brand-green p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-h3 text-lg uppercase tracking-widest">Apparel Size Guide</h3>
                <p className="text-[10px] opacity-80 uppercase tracking-widest">All measurements in inches</p>
              </div>
              <button 
                onClick={() => setShowSizeGuide(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-stone-100">
                      <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Size</th>
                      <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Chest</th>
                      <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Length</th>
                      <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Sleeve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {[
                      { size: 'S', chest: '36-38', length: '28', sleeve: '8.5' },
                      { size: 'M', chest: '38-40', length: '29', sleeve: '9' },
                      { size: 'L', chest: '42-44', length: '30', sleeve: '9.5' },
                      { size: 'XL', chest: '46-48', length: '31', sleeve: '10' },
                      { size: 'XXL', chest: '50-52', length: '32', sleeve: '10.5' }
                    ].map((row) => (
                      <tr key={row.size} className="hover:bg-stone-50 transition-colors">
                        <td className="py-4 font-bold text-stone-900 text-sm">{row.size}</td>
                        <td className="py-4 text-stone-600 text-sm text-center">{row.chest}</td>
                        <td className="py-4 text-stone-600 text-sm text-center">{row.length}</td>
                        <td className="py-4 text-stone-600 text-sm text-center">{row.sleeve}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-8 text-sm text-stone-400 leading-relaxed italic">
                * Please note that these are approximate measurements. For a more relaxed fit, we recommend ordering one size up.
              </p>
              <Button 
                onClick={() => setShowSizeGuide(false)}
                className="w-full mt-8 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-none h-12"
              >
                Close Guide
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title={`Check out the ${product.name} at The Base Movement Store!`}
        url={window.location.href}
      />
    </div>
  )
}
