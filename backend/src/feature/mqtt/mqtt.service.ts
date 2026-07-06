import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { TrackingIngestService } from '../tracking/tracking-ingest.interface';
import { MQTT_BROKER_URL, MQTT_TOPICS } from './mqtt.constants';

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
