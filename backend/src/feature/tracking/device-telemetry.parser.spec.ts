import {
  extractDeviceIdFromTopic,
  parseDeviceTelemetry,
} from './device-telemetry.parser';

describe('extractDeviceIdFromTopic', () => {
  it('extracts device id from telemetry topic', () => {
    expect(extractDeviceIdFromTopic('device/wearable-001/telemetry')).toBe(
      'wearable-001',
    );
  });

  it('extracts device id from status topic', () => {
    expect(extractDeviceIdFromTopic('device/wearable-001/status')).toBe(
      'wearable-001',
    );
  });

  it('extracts device id from surakshyawatch events topic', () => {
    expect(extractDeviceIdFromTopic('surakshyawatch/wearable-001/events')).toBe(
      'wearable-001',
    );
  });

  it('returns last segment for simple device topic', () => {
    expect(extractDeviceIdFromTopic('device/wearable-001')).toBe(
      'wearable-001',
    );
  });

  it('returns undefined for empty topic', () => {
    expect(extractDeviceIdFromTopic('')).toBeUndefined();
  });
});

describe('parseDeviceTelemetry', () => {
  it('parses plain-text telemetry block', () => {
    const result = parseDeviceTelemetry(
      'Device: wearable-001\nLatitude: 27.7\nLongitude: 85.33',
      'fallback-id',
    );

    expect(result).toEqual(
      expect.objectContaining({
        deviceId: 'wearable-001',
        latitude: 27.7,
        longitude: 85.33,
      }),
    );
  });

  it('uses fallback device id when Device line is missing', () => {
    const result = parseDeviceTelemetry(
      'Latitude: 27.7\nLongitude: 85.33',
      'wearable-001',
    );

    expect(result?.deviceId).toBe('wearable-001');
  });
});
