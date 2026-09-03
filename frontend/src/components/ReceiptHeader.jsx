import { RECEIPT_HEADER_IMAGE, RECEIPT_HEADER_RATIO } from '../utils/receiptAssets'

export const SANSTHAN_NAME = 'Shree Mahalaxmi Shreemali Brahman Seva Sansthan, Sanderao'

// Shared hero header for every downloadable receipt (hall booking, daan peti,
// annual ritual). Height is a percentage of width (classic responsive
// aspect-ratio box) so it fills whatever card width it's dropped into,
// fixed or fluid, without ever stretching the deity artwork.
export function ReceiptHeader({ badge, subtitle }) {
  const heightPercent = (1 / RECEIPT_HEADER_RATIO) * 100
  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: `${heightPercent}%` }}>
      <img
        src={RECEIPT_HEADER_IMAGE}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 26px' }}>
        <div style={{
          fontFamily: "'Cinzel', 'Segoe UI', serif", fontWeight: 700,
          fontSize: 19, lineHeight: 1.3, letterSpacing: '0.2px',
          color: '#8B1A1A', maxWidth: '62%',
        }}>
          {SANSTHAN_NAME}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b4040', marginTop: 6, lineHeight: 1.5, maxWidth: '62%' }}>
            {subtitle}
          </div>
        )}
        {badge && (
          <div style={{
            marginTop: 10, display: 'inline-block', width: 'fit-content',
            padding: '5px 14px', borderRadius: 99,
            background: 'rgba(255,251,240,0.85)', border: '1px solid rgba(139,26,26,0.4)',
            fontSize: 12, fontWeight: 800, color: '#8B1A1A', letterSpacing: '0.5px',
          }}>
            {badge}
          </div>
        )}
      </div>
    </div>
  )
}
