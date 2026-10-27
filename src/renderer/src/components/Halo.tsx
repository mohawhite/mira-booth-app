// Signature visuelle MIRA : un halo lumineux qui « respire », comme un iris.
export function Halo({ size = 220, intense = false }: { size?: number; intense?: boolean }) {
  return (
    <div className={`halo ${intense ? 'halo-intense' : ''}`} style={{ width: size, height: size }} aria-hidden>
      <div className="halo-ring" />
      <div className="halo-ring halo-ring-2" />
      <div className="halo-core" />
    </div>
  )
}
