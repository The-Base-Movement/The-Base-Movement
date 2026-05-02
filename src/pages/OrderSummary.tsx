import { Link } from 'react-router-dom'
import { ArrowRight, Printer, Share2, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function OrderSummary() {
  // In a real app, we'd fetch this from state or an API
  const orderNumber = 'ORD-2024-8842-BASE'
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="w-full px-6 md:px-12 py-12 bg-off-white min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-brand-green p-10 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none flex items-center justify-center rotate-12 scale-150">
              <img src="/logo.png" alt="" className="w-64 h-64 object-contain" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white rounded-none flex items-center justify-center shadow-lg p-2">
                  <img src="/logo.png" alt="The Base" className="w-10 h-10 object-contain" />
                </div>
                <div className="text-left border-l border-white/20 pl-4">
                  <h2 className="font-h1 text-2xl uppercase tracking-tighter leading-none">The Base</h2>
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-80">Official Store</p>
                </div>
              </div>
              <h1 className="font-h1 text-h3 mb-1 uppercase tracking-tight">Order Confirmed</h1>
              <p className="font-meta text-[10px] opacity-90 uppercase tracking-widest">Your support drives the movement forward</p>
            </div>
          </div>

          <div className="p-6">
            {/* Order Info Bar */}
            <div className="flex flex-col gap-6 py-6 border-b border-stone-100 mb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Order Number</p>
                  <p className="font-bold text-stone-900 break-all sm:break-normal">{orderNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 sm:text-right">Date</p>
                  <p className="font-bold text-stone-900 sm:text-right">{date}</p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-8 mb-12 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-10deg]">
                <img src="/logo.png" alt="" className="w-80 h-80 object-contain" />
              </div>
              
              <div className="relative z-10">
                <h3 className="font-h3 text-xl text-stone-900 mb-6">Items Ordered</h3>
                <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 bg-stone-50 px-4 rounded-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white flex items-center justify-center border border-stone-100 shrink-0">
                      <ShoppingBag className="w-6 h-6 text-stone-300" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 text-sm leading-tight">The Base Premium T-Shirt (M, Jet Black)</p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Quantity: 1</p>
                    </div>
                  </div>
                  <p className="font-bold text-stone-900 text-sm whitespace-nowrap">GHS 85.00</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 bg-stone-50 px-4 rounded-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white flex items-center justify-center border border-stone-100 shrink-0">
                      <ShoppingBag className="w-6 h-6 text-stone-300" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 text-sm leading-tight">Ghana First Signature Cap (One Size, Green)</p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Quantity: 2</p>
                    </div>
                  </div>
                  <p className="font-bold text-stone-900 text-sm whitespace-nowrap">GHS 110.00</p>
                </div>
              </div>
            </div>
          </div>

            {/* Totals */}
            <div className="bg-stone-900 p-8 rounded-sm text-white mb-10">
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-meta uppercase tracking-widest opacity-60">
                  <span>Subtotal</span>
                  <span>GHS 195.00</span>
                </div>
                <div className="flex justify-between text-xs font-meta uppercase tracking-widest opacity-60">
                  <span>Shipping</span>
                  <span>GHS 25.00</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="font-h3 text-lg uppercase tracking-tight">Total Paid</span>
                  <span className="font-h3 text-2xl text-brand-green whitespace-nowrap">GHS 220.00</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 border border-stone-100 rounded-sm bg-white shadow-sm">
                <div className="w-10 h-10 bg-brand-green/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-brand-green">mail</span>
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-sm mb-1">Confirmation Sent</p>
                  <p className="text-xs text-stone-500 leading-relaxed">A detailed receipt and tracking information has been sent to your registered email address.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="flex-1 h-12 border-stone-200 text-stone-600 hover:bg-brand-gold hover:text-stone-900 hover:border-brand-gold text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all duration-300">
                  <Printer className="w-4 h-4 mr-2" /> Print Invoice
                </Button>
                <Button variant="outline" className="flex-1 h-12 border-stone-200 text-stone-600 hover:bg-brand-gold hover:text-stone-900 hover:border-brand-gold text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all duration-300">
                  <Share2 className="w-4 h-4 mr-2" /> Share Support
                </Button>
              </div>

              <Button asChild className="w-full h-14 bg-brand-green hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded-sm shadow-lg shadow-brand-green/20">
                <Link to="/dashboard">
                  Back to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-stone-400 font-meta uppercase tracking-widest flex items-center justify-center flex-wrap gap-1">
            Problems with your order? <Link to="/contact" className="text-brand-green font-bold hover:underline whitespace-nowrap">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
