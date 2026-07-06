export abstract class TrackingIngestService {
  abstract ingestMqttMessage(topic: string, payload: string): Promise<void>;
}
