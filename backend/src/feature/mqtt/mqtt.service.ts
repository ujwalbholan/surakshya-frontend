import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { TrackingIngestService } from '../tracking/tracking-ingest.interface';
import {
  deviceCommandsTopic,
  MQTT_BROKER_URL,
  MQTT_TOPICS,
} from './mqtt.constants';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client!: mqtt.MqttClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly trackingIngest: TrackingIngestService,
  ) {}

  onModuleInit() {
    const brokerUrl =
      this.configService.get<string>('MQTT_BROKER_URL') ?? MQTT_BROKER_URL;

    this.client = mqtt.connect(brokerUrl, {
      clientId: `surakshya-backend-${Date.now()}`,
      reconnectPeriod: 5000,
      clean: true,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker: ${brokerUrl}`);
      this.client.subscribe(MQTT_TOPICS, (err) => {
        if (err) {
          this.logger.error('MQTT subscribe failed', err);
          return;
        }
        this.logger.log(`Subscribed to: ${MQTT_TOPICS.join(', ')}`);
      });
    });

    this.client.on('message', (topic, message: Buffer) => {
      this.handleIncomingMessage(topic, message.toString('utf8'));
    });

    this.client.on('error', (err) => {
      this.logger.error(`MQTT error: ${err.message}`);
    });

    this.client.on('reconnect', () => {
      this.logger.warn('Reconnecting to MQTT broker...');
    });
  }

  /**
   * Push retained emergency-contact config to a band.
   * Retained so the device receives it on next MQTT subscribe.
   */
  publishEmergencyContactConfig(
    deviceId: string,
    phoneNumber: string | null,
  ): boolean {
    if (!this.client?.connected) {
      this.logger.warn(
        `MQTT not connected; cannot push emergency contact to ${deviceId}`,
      );
      return false;
    }

    const topic = deviceCommandsTopic(deviceId);
    const payload = JSON.stringify({
      type: 'emergency_contact',
      deviceId,
      phoneNumber,
      updatedAt: new Date().toISOString(),
    });

    this.client.publish(topic, payload, { qos: 1, retain: true }, (err) => {
      if (err) {
        this.logger.error(
          `Failed to publish emergency contact to ${topic}: ${err.message}`,
        );
        return;
      }
      this.logger.log(
        `Published emergency contact to ${topic}: ${phoneNumber ?? '(cleared)'}`,
      );
    });
    return true;
  }

  /**
   * Tell a band to stop live SOS tracking (app / ops cancel).
   * Not retained — only devices currently connected should act on it.
   */
  publishSosCancelCommand(deviceId: string, sosId?: string): boolean {
    if (!this.client?.connected) {
      this.logger.warn(
        `MQTT not connected; cannot push SOS cancel to ${deviceId}`,
      );
      return false;
    }

    const topic = deviceCommandsTopic(deviceId);
    const payload = JSON.stringify({
      type: 'sos_cancel',
      deviceId,
      ...(sosId ? { sosId } : {}),
      updatedAt: new Date().toISOString(),
    });

    this.client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
      if (err) {
        this.logger.error(
          `Failed to publish SOS cancel to ${topic}: ${err.message}`,
        );
        return;
      }
      this.logger.log(`Published SOS cancel to ${topic}`);
    });
    return true;
  }

  private handleIncomingMessage(topic: string, payload: string): void {
    void this.trackingIngest
      .ingestMqttMessage(topic, payload)
      .catch((error: unknown) => {
        this.logger.error(
          `Failed to ingest MQTT message on ${topic}`,
          error instanceof Error ? error.message : error,
        );
      });
  }

  onModuleDestroy() {
    this.client?.end(true);
  }
}
