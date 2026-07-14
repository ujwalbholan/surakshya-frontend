import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import mqtt from 'mqtt';

const SERIAL_PORT = process.env.SERIAL_PORT ?? '/dev/cu.usbserial-0001';
const MQTT_URL = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
const DEVICE_ID = process.env.SERIAL_DEVICE_ID ?? 'wearable-001';
const TOPIC_TELEMETRY = `device/${DEVICE_ID}/telemetry`;
const TOPIC_SOS = `surakshyawatch/${DEVICE_ID}/events`;

const mqttClient = mqtt.connect(MQTT_URL);
mqttClient.on('connect', () =>
  console.log(`Bridge MQTT connected to ${MQTT_URL}`),
);
mqttClient.on('error', (err) =>
  console.error('Bridge MQTT error:', err.message),
);

function parseTelemetryBlock(lines) {
  const text = lines.join('\n');
  const m = (pattern) => pattern.exec(text)?.[1];
  const lat = parseFloat(m(/Latitude:\s*([\d.-]+)/));
  const lng = parseFloat(m(/Longitude:\s*([\d.-]+)/));
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const alt = parseFloat(m(/Altitude:\s*([\d.-]+)\s*m/));
  const speed = parseFloat(m(/Speed:\s*([\d.-]+)\s*km\/h/));
  const sats = parseInt(m(/GPS satellites:\s*(\d+)/), 10);
  const hdop = parseFloat(m(/GPS HDOP:\s*([\d.-]+)/));

  return {
    deviceId: DEVICE_ID,
    latitude: lat,
    longitude: lng,
    altitudeM: Number.isNaN(alt) ? undefined : alt,
    speedKmph: Number.isNaN(speed) ? undefined : speed,
    satellites: Number.isNaN(sats) ? undefined : sats,
    hdop: Number.isNaN(hdop) ? undefined : hdop,
  };
}

function parseSosBlock(lines) {
  const text = lines.join('\n');
  const eventMatch = /SOS event:\s*(\S+)/.exec(text);
  if (!eventMatch) return null;

  const eventType = eventMatch[1];
  const payload = {
    deviceId: DEVICE_ID,
    eventType,
    sosActive: eventType !== 'sos_stopped',
    connectionType: 'serial',
  };

  if (eventType !== 'sos_stopped') {
    const locMatch = /SOS location:\s*([\d.-]+),\s*([\d.-]+)/.exec(text);
    if (locMatch) {
      payload.latitude = parseFloat(locMatch[1]);
      payload.longitude = parseFloat(locMatch[2]);
    }

    const m = (pattern) => pattern.exec(text)?.[1];
    const alt = parseFloat(m(/Altitude:\s*([\d.-]+)\s*m/));
    const speed = parseFloat(m(/Speed:\s*([\d.-]+)\s*km\/h/));
    const sats = parseInt(m(/Satellites:\s*(\d+)/), 10);
    if (!Number.isNaN(alt)) payload.altitudeM = alt;
    if (!Number.isNaN(speed)) payload.speedKmph = speed;
    if (!Number.isNaN(sats)) payload.satellites = sats;
  }

  return payload;
}

function publish(topic, payload) {
  const body = JSON.stringify(payload);
  mqttClient.publish(topic, body, { qos: 1 });
  console.log(`Published to ${topic}: ${body}`);
}

const rl = createInterface({
  input: createReadStream(SERIAL_PORT),
  crlfDelay: Infinity,
});

let buffer = [];
let state = 'idle';
let lastTelemetryPublish = 0;

rl.on('line', (line) => {
  if (line.startsWith('SOS event:')) {
    if (state === 'telemetry' && buffer.length) {
      const telemetry = parseTelemetryBlock(buffer);
      if (telemetry) publish(TOPIC_TELEMETRY, telemetry);
    }
    buffer = [line];
    state = 'sos';
    return;
  }

  if (line.startsWith('Device:')) {
    if (state === 'sos' && buffer.length) {
      const sos = parseSosBlock(buffer);
      if (sos) publish(TOPIC_SOS, sos);
    }
    buffer = [line];
    state = 'telemetry';
    return;
  }

  if (state === 'telemetry') {
    buffer.push(line);
    if (
      line.startsWith('GPS UTC') ||
      (line.startsWith('Speed:') &&
        line.includes('km/h') &&
        !line.startsWith('GPS'))
    ) {
      const telemetry = parseTelemetryBlock(buffer);
      if (telemetry) {
        const now = Date.now();
        if (now - lastTelemetryPublish >= 4000) {
          publish(TOPIC_TELEMETRY, telemetry);
          lastTelemetryPublish = now;
        }
      }
      buffer = [];
      state = 'idle';
    }
    return;
  }

  if (state === 'sos') {
    buffer.push(line);
    if (line.startsWith('---') || line.startsWith('GPS UTC')) {
      const sos = parseSosBlock(buffer);
      if (sos) publish(TOPIC_SOS, sos);
      buffer = [];
      state = 'idle';
    }
  }
});

rl.on('error', (err) => console.error('Serial read error:', err.message));

function shutdown() {
  mqttClient.end(true);
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`Serial bridge listening on ${SERIAL_PORT}`);
console.log(`  Telemetry -> ${TOPIC_TELEMETRY}`);
console.log(`  SOS events -> ${TOPIC_SOS}`);
