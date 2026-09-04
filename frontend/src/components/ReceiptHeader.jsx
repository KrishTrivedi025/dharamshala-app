import { RECEIPT_HEADER_IMAGE, RECEIPT_HEADER_RATIO } from '../utils/receiptAssets'

export const SANSTHAN_NAME = 'Shree Mahalaxmi Shreemali Brahman Seva Sansthan, Sanderao'

// Shared hero header for every downloadable receipt (hall booking, daan peti,
// annual ritual). Height is a percentage of width (classic responsive
// aspect-ratio box) so it fills whatever card width it's dropped into,
// fixed or fluid, without ever stretching the deity artwork.
export function ReceiptHeader() {
  const heightPercent = (1 / RECEIPT_HEADER_RATIO) * 100
  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: `${heightPercent}%`, overflow: 'hidden' }}>
      <img
        src={RECEIPT_HEADER_IMAGE}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
      />
      {/* Percentage padding here is relative to the card's WIDTH (a CSS
          quirk for padding-top/bottom) — that's what we want, since it
          scales in step with the height, which is itself width-derived
          above. Name sits below the logo (not beside it, which overlapped
          it) — the logo occupies roughly the top-left 14% of this banner. */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '13.6% 5.2% 0' }}>
        <div style={{
          fontFamily: "'Cinzel', 'Segoe UI', serif", fontWeight: 700,
          fontSize: 16, lineHeight: 1.25, letterSpacing: '0.2px',
          color: '#8B1A1A', maxWidth: '66%',
        }}>
          {SANSTHAN_NAME}
        </div>
      </div>
    </div>
  )
}
