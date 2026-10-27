import { useEffect, useRef, useState } from 'react'
import { openCamera } from '@/camera/camera'
import { useConfig } from '@/lib/config'
import type { ColorMode } from '@shared/types'

/** Live view 3:2 : même cadrage que la photo finale (recadrage, rotation, miroir d'aperçu). */
export function LiveView({ width, colorMode, onError }: { width: number; colorMode: ColorMode; onError?: () => void }) {
  const cam = useConfig((s) => s.config.camera)
  const ref = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    let cancelled = false
    openCamera(cam)
      .then((driver) => {
        if (cancelled || !ref.current) return
        ref.current.srcObject = driver.stream
        void ref.current.play().catch(() => {})
      })
      .catch(() => onErrorRef.current?.())
    return () => {
      cancelled = true
    }
  }, [cam])

  const transforms = [
    cam.rotation === 180 ? 'rotate(180deg)' : '',
    cam.mirrorPreview ? 'scaleX(-1)' : '',
    `scale(${cam.zoom})`
  ].join(' ')

  return (
    <div className="liveview" style={{ width, height: (width * 2) / 3 }}>
      <video
        ref={ref}
        muted
        playsInline
        onLoadedData={() => setReady(true)}
        style={{
          transform: transforms,
          filter: colorMode === 'nb' ? 'grayscale(1) contrast(1.12)' : 'none',
          opacity: ready ? 1 : 0
        }}
      />
      <div className="liveview-frame" aria-hidden>
        <span /><span /><span /><span />
      </div>
    </div>
  )
}
