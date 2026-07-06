import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationUpdatePayload, SosEventPayload } from './tracking.types';

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(TrackingGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket): Promise<void> {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const secret = process.env.JWT_ACCESS_SECRET;
      if (!secret)
        throw new UnauthorizedException('JWT_ACCESS_SECRET is missing');

      const payload = await this.jwtService.verifyAsync<{ type?: string }>(
        token,
        { secret },
      );
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitLocationUpdate(payload: LocationUpdatePayload) {
    this.server
      .to(`device:${payload.deviceId}`)
      .emit('location_update', payload);
  }

  emitSosEvent(payload: SosEventPayload) {
    this.server.emit('sos_event', payload);
    if (payload.deviceId) {
      this.server.to(`device:${payload.deviceId}`).emit('sos_event', payload);
    }
  }

  @SubscribeMessage('subscribe_all_sos')
  handleSubscribeAllSos(@ConnectedSocket() client: Socket) {
    void client.join('sos_all');
    return { ok: true };
  }

  @SubscribeMessage('subscribe_device')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { deviceId?: string } | string,
  ) {
    const deviceId = typeof body === 'string' ? body : body?.deviceId;
    if (!deviceId) {
      return { ok: false, error: 'deviceId is required' };
    }

    void client.join(`device:${deviceId}`);
    this.logger.log(`Client ${client.id} subscribed to device:${deviceId}`);
    return { ok: true, deviceId };
  }

  @SubscribeMessage('unsubscribe_device')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { deviceId?: string } | string,
  ) {
    const deviceId = typeof body === 'string' ? body : body?.deviceId;
    if (!deviceId) {
      return { ok: false, error: 'deviceId is required' };
    }

    void client.leave(`device:${deviceId}`);
    return { ok: true, deviceId };
  }
}
