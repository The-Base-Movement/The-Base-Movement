import { useId } from 'react'
import MembershipCard from './MembershipCard'
import { cardCaptureStyle, downloadCardPdf, printCard } from '@/lib/cardExport'

type CardProps = Omit<React.ComponentProps<typeof MembershipCard>, 'isForDownload'>

interface Props {
  cardProps: CardProps
  regNo?: string
  style?: React.CSSProperties
}

/** Download PDF + Print buttons for a MembershipCard, with a hidden full-res
 * capture target used by both actions. Shared by the dashboard card and the
 * settings page's live-preview panel so the export logic lives in one place. */
export function MembershipCardActions({ cardProps, regNo, style }: Props) {
  const captureId = `membership-card-capture-${useId()}`

  return (
    <>
      <div id={captureId} style={cardCaptureStyle}>
        <MembershipCard {...cardProps} isForDownload />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          ...style,
        }}
      >
        <button
          className="btn btn-outline btn-sm"
          onClick={() => printCard(captureId, 'THE BASE - Official Membership Card')}
          style={{ justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            print
          </span>
          Print card
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => downloadCardPdf(captureId, `THE-BASE-CARD-${regNo || 'MEMBER'}.pdf`)}
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
