export const notificationSettings = [
  { id: "sos", label: "New SOS alerts", description: "Instant push when wristband double-tap detected", enabled: true },
  { id: "dispatch", label: "Unit dispatch updates", description: "When a unit is assigned or arrives on scene", enabled: true },
  { id: "resolve", label: "Case resolution", description: "When an SOS is marked resolved", enabled: false },
  { id: "daily", label: "Daily briefing", description: "Morning summary of overnight activity", enabled: true },
] 

export const systemSettings = [
  { id: "gps", label: "Live GPS streaming", description: "Real-time victim location during active SOS", enabled: true },
  { id: "audio", label: "Ambient audio capture", description: "Record 30s audio on SOS trigger (with consent)", enabled: false },
  { id: "family", label: "Auto-notify family", description: "SMS emergency contacts on SOS activation", enabled: true },
]
