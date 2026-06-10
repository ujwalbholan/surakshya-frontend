import L from "leaflet"
import { getInitials, type MockSosAlert } from "@/lib/admin/mock-data"
import { priorityMarkerColor } from "@/lib/admin/live-data"

export const GPS_ACCURACY_METERS = 85

export function createVictimMarkerIcon(alert: MockSosAlert, selected: boolean): L.DivIcon {
  const color = priorityMarkerColor(alert.priority)
  const initials = getInitials(alert.victim)
  const firstName = alert.victim.split(" ")[0] ?? alert.victim
  const selectedClass = selected ? " is-selected" : ""
  const criticalClass = alert.priority === "CRITICAL" ? " is-critical" : ""

  return L.divIcon({
    className: "live-victim-marker-icon",
    html: `
      <div class="live-victim-marker__wrap${selectedClass}${criticalClass}" style="--marker-color: ${color}">
        <div class="live-victim-marker__pulse" aria-hidden="true"></div>
        <div class="live-victim-marker__pin" title="${alert.victim}">
          <span class="live-victim-marker__initials">${initials}</span>
          <span class="live-victim-marker__person" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="3.5"/>
              <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
            </svg>
          </span>
        </div>
        <div class="live-victim-marker__label">${firstName}</div>
        <div class="live-victim-marker__coords">${alert.lat.toFixed(4)}°, ${alert.lng.toFixed(4)}°</div>
      </div>
    `,
    iconSize: [72, 88],
    iconAnchor: [36, 72],
    popupAnchor: [0, -68],
  })
}
