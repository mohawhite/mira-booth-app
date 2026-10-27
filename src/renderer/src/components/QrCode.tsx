import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

export function QrCode({ value, size = 280 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    QRCode.toString(value, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0A0A0A', light: '#FAFAFA' } })
      .then(setSvg)
      .catch(() => setSvg(''))
  }, [value])
  return <div className="qr" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />
}
