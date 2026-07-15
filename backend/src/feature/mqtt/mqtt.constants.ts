export const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL ?? 'mqtt://test.mosquitto.org:1883';

// Subscribe to all devices, or a specific one
export const MQTT_TOPICS = [
  'device/+/telemetry', // e.g. device/wearable-001/telemetry
  'device/+', // e.g. device/wearable-001
  'surakshyawatch/+/events', // SOS events
];

/** Downstream config/commands for a specific band (retained). */
export function deviceCommandsTopic(deviceId: string): string {
  return `surakshyawatch/${deviceId}/commands`;
}
