/**
 * Decorative crosshair (+) markers at four corners of the hero,
 * matching the lightweight.info style.
 */
export default function Crosshairs() {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 15,
    color: "#333",
    fontSize: 14,
    opacity: 0.6,
    pointerEvents: "none",
    userSelect: "none",
  }
  return (
    <>
      <span style={{ ...baseStyle, top: 24, left: 24 }}>+</span>
      <span style={{ ...baseStyle, top: 24, right: 24 }}>+</span>
      <span style={{ ...baseStyle, bottom: 24, left: 24 }}>+</span>
      <span style={{ ...baseStyle, bottom: 24, right: 24 }}>+</span>
    </>
  )
}
