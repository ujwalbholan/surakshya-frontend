library notification_service;

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class NotificationService {
  static const _sosChannelId = 'suraksha_sos';
  static const _sosNotificationId = 1001;

  final _plugin = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );
    const channel = AndroidNotificationChannel(
      _sosChannelId,
      'SOS Alerts',
      description: 'Emergency SOS notifications',
      importance: Importance.max,
    );
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  Future<void> showSosOngoing() async {
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        _sosChannelId,
        'SOS Alerts',
        channelDescription: 'Emergency SOS notifications',
        importance: Importance.max,
        priority: Priority.high,
        ongoing: true,
        autoCancel: false,
      ),
      iOS: DarwinNotificationDetails(),
    );
    await _plugin.show(
      _sosNotificationId,
      'SOS Active',
      'Your location is being shared with your emergency circle.',
      details,
    );
  }

  Future<void> cancelSosNotification() async {
    await _plugin.cancel(_sosNotificationId);
  }

  Future<void> showSosSent() async {
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        _sosChannelId,
        'SOS Alerts',
        channelDescription: 'Emergency SOS notifications',
        importance: Importance.max,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );
    await _plugin.show(
      2,
      'SOS Activated',
      'Your location has been shared with your emergency circle.',
      details,
    );
  }
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});
