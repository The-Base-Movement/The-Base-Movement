interface SizeGuideModalProps {
  onClose: () => void
}

export function SizeGuideModal({ onClose }: SizeGuideModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-lg shadow-2xl rounded-none overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-brand-green p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="font-h3 text-lg tracking-tight">Apparel size guide</h3>
            <p className="text-micro opacity-80 tracking-tight">All measurements in inches</p>
          </div>
          <button
            onClick={onClose}
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
                  <th className="py-4 text-micro font-bold text-stone-400 tracking-tight">Size</th>
                  <th className="py-4 text-micro font-bold text-stone-400 tracking-tight text-center">
                    Chest
                  </th>
                  <th className="py-4 text-micro font-bold text-stone-400 tracking-tight text-center">
                    Length
                  </th>
                  <th className="py-4 text-micro font-bold text-stone-400 tracking-tight text-center">
                    Sleeve
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {[
                  { size: 'S', chest: '36-38', length: '28', sleeve: '8.5' },
                  { size: 'M', chest: '38-40', length: '29', sleeve: '9' },
                  { size: 'L', chest: '42-44', length: '30', sleeve: '9.5' },
                  { size: 'XL', chest: '46-48', length: '31', sleeve: '10' },
                  { size: 'XXL', chest: '50-52', length: '32', sleeve: '10.5' },
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
            * Please note that these are approximate measurements. For a more relaxed fit, we
            recommend ordering one size up.
          </p>
          <button
            onClick={onClose}
            className="w-full mt-8 bg-stone-900 hover:bg-stone-800 text-white text-micro font-bold tracking-tight rounded-none h-12 border-none cursor-pointer transition-colors"
          >
            Close guide
          </button>
        </div>
      </div>
    </div>
  )
}
