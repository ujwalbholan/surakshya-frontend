library tracking_map_view;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/features/dashboard/tracking/map_markers.dart';
import 'package:suraksha/models/location_model.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

class TrackingMapView extends ConsumerStatefulWidget {
  const TrackingMapView({super.key});

  @override
  ConsumerState<TrackingMapView> createState() => _TrackingMapViewState();
}

class _TrackingMapViewState extends ConsumerState<TrackingMapView> {
  static const _darkMatrix = <double>[
    -1, 0, 0, 0, 255,
    0, -1, 0, 0, 255,
    0, 0, -1, 0, 255,
    0, 0, 0, 1, 0,
  ];

  final MapController _mapController = MapController();
  LocationModel? _lastFollowedLocation;

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  void _followLocation(LocationModel location) {
    final point = LatLng(location.latitude, location.longitude);
    final last = _lastFollowedLocation;
    final moved = last == null ||
        last.latitude != location.latitude ||
        last.longitude != location.longitude;

    if (!moved) return;

    _lastFollowedLocation = location;
    final zoom = _mapController.camera.zoom;
    _mapController.move(point, zoom);
  }

  double _accuracyRadius(LocationModel location) {
    final accuracy = location.accuracyMeters;
    if (accuracy == null || accuracy <= 0) return 80;
    return accuracy.clamp(25, 200);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(dashboardProvider);
    final location = state.currentLocation;

    ref.listen<LocationModel>(
      dashboardProvider.select((s) => s.currentLocation),
      (previous, next) => _followLocation(next),
    );

    final center = LatLng(location.latitude, location.longitude);
    final dest = LatLng(
      state.destination.latitude,
      state.destination.longitude,
    );

    return RepaintBoundary(
      child: FlutterMap(
        mapController: _mapController,
        options: MapOptions(
          initialCenter: center,
          initialZoom: AppConstants.mapDefaultZoom,
          backgroundColor: dashboardBg,
          interactionOptions: const InteractionOptions(
            flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
          ),
          onMapReady: () => _followLocation(location),
        ),
        children: [
          TileLayer(
            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            userAgentPackageName: 'com.suraksha.suraksha',
            tileBuilder: (context, widget, tile) => ColorFiltered(
              colorFilter: const ColorFilter.matrix(_darkMatrix),
              child: widget,
            ),
          ),
          CircleLayer(
            circles: [
              CircleMarker(
                point: center,
                radius: _accuracyRadius(location),
                color: surakshaCrimson.withValues(alpha: 0.12),
                borderColor: surakshaCrimson.withValues(alpha: 0.4),
                borderStrokeWidth: 1.5,
                useRadiusInMeter: true,
              ),
            ],
          ),
          MarkerLayer(
            markers: [
              Marker(
                point: dest,
                width: 36,
                height: 36,
                child: const DestinationMapMarker(),
              ),
              Marker(
                point: center,
                width: 52,
                height: 62,
                alignment: Alignment.topCenter,
                child: const UserMapPin(
                  avatarPath: 'assets/images/avatars/avatar_profile.png',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
