import laxmiJiHeaderImg from '../assets/laxmi-ji-header.png'
import cinzelBoldFontUrl from '../assets/fonts/Cinzel-Bold.ttf'

// Native pixel dimensions of laxmi-ji-header.png — keep every header sized to
// this ratio so the deity artwork is never stretched or squashed.
export const RECEIPT_HEADER_IMAGE = laxmiJiHeaderImg
export const RECEIPT_HEADER_RATIO = 4092 / 1328 // ~3.082 : 1

let cachedDataUrl = null

// jsPDF's addImage() needs a base64 data URL, not a bundled asset URL — this
// fetches the built asset once and caches the conversion for later exports.
export async function getReceiptHeaderDataUrl() {
  if (cachedDataUrl) return cachedDataUrl
  const res = await fetch(laxmiJiHeaderImg)
  const blob = await res.blob()
  cachedDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return cachedDataUrl
}

let cachedFontBase64 = null

// jsPDF only ships helvetica/times/courier — it can't render the Cinzel web
// font used everywhere else, so the sansthan name has to be embedded as an
// actual font file (VFS + addFont) to look the same as the on-screen receipts.
export async function getCinzelBoldFontBase64() {
  if (cachedFontBase64) return cachedFontBase64
  const res = await fetch(cinzelBoldFontUrl)
  const blob = await res.blob()
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  cachedFontBase64 = dataUrl.split(',')[1]
  return cachedFontBase64
}
