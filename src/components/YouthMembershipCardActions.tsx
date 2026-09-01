import { useId } from 'react'
import YouthMembershipCard from './YouthMembershipCard'
import { cardCaptureStyle, downloadCardPdf, printCard } from '@/lib/cardExport'

type CardProps = Omit<React.ComponentProps<typeof YouthMembershipCard>, 'isForDownload'>

interface Props {
  cardProps: CardProps
  style?: React.CSSProperties
}

/** Print + PDF buttons for a Youth Wing card. Separate from the adult actions so
 * the two card types can never be exported through each other's file naming. */
export function YouthMembershipCardActions({ cardProps, style }: Props) {
  const captureId = `youth-card-capture-${useId()}`

  return (
    <>
      <div id={captureId} style={cardCaptureStyle}>
        <YouthMembershipCard {...cardProps} isForDownload />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, ...style }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => printCard(captureId, 'THE BASE - Youth Wing Card')}
          style={{ justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            print
          </span>
          Print card
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() =>
            downloadCardPdf(
              captureId,
              `THE-BASE-YOUTH-CARD-${cardProps.membershipNumber || 'MEMBER'}.pdf`
            )
          }
          style={{ justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            download
          </span>
          Download PDF
        </button>
      </div>
    </>
  )
}
