export const labelStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.4)",
  marginBottom: 10,
  transform: active ? "translateY(-4px) scale(0.85)" : "translateY(0) scale(1)",
  transformOrigin: "left center",
  transition: "transform 0.25s ease",
  display: "inline-block",
});

export const inputBaseStyle = (focused: boolean): React.CSSProperties => ({
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: `1px solid ${focused ? "rgba(204,34,51,0.7)" : "rgba(255,255,255,0.12)"}`,
  borderRadius: 0,
  padding: "12px 0",
  color: "#F0EDE8",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  outline: "none",
  transition: "border-bottom-color 0.3s ease",
});
