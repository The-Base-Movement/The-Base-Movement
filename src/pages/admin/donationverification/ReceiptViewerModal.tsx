import DonationReceiptModal from '@/components/donations/DonationReceiptModal'

interface ReceiptViewerModalProps {
  isOpen: boolean
  donationId: string | null
  reference?: string | null
  onClose: () => void
}

export function ReceiptViewerModal({
  isOpen,
  donationId,
  reference,
  onClose,
}: ReceiptViewerModalProps) {
  return (
    <DonationReceiptModal
      isOpen={isOpen}
      donationId={donationId}
      reference={reference}
      onClose={onClose}
    />
  )
}
export default ReceiptViewerModal
