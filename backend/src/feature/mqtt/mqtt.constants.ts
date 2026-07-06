export const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL ?? 'mqtt://192.168.100.134:1883';

// Subscribe to all devices, or a specific one
export const MQTT_TOPICS = [
  'device/+/telemetry', // e.g. device/wearable-001/telemetry
  'device/+', // e.g. device/wearable-001
  'surakshawatch/+/events', // SOS events
];
