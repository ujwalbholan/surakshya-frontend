library location_service;

import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/models/location_model.dart';

enum LocationFetchFailure {
  permissionDenied,
  permissionDeniedForever,
  serviceDisabled,
  timeout,
  unknown,
}

sealed class LocationFetchResult {
  const LocationFetchResult();
}

final class LocationFetchSuccess extends LocationFetchResult {
  const LocationFetchSuccess(this.location);

  final LocationModel location;
}

final class LocationFetchError extends LocationFetchResult {
  const LocationFetchError(this.failure, {this.message});

  final LocationFetchFailure failure;
  final String? message;
}

class LocationService {
  LatLng? _lastGeocodedPoint;
  String? _cachedLabel;

  Future<bool> isServiceEnabled() => Geolocator.isLocationServiceEnabled();

  Future<LocationPermission> checkPermission() =>
      Geolocator.checkPermission();

  Future<LocationPermission> requestPermission() =>
      Geolocator.requestPermission();

  Future<LocationFetchResult> fetchLiveLocation() async {
    if (!await isServiceEnabled()) {
      return const LocationFetchError(LocationFetchFailure.serviceDisabled);
    }

    final status = await Permission.locationWhenInUse.status;
    if (status.isDenied) {
      final requested = await Permission.locationWhenInUse.request();
      if (requested.isDenied) {
        return const LocationFetchError(LocationFetchFailure.permissionDenied);
      }
      if (requested.isPermanentlyDenied) {
        return const LocationFetchError(
          LocationFetchFailure.permissionDeniedForever,
        );
      }
    } else if (status.isPermanentlyDenied) {
      return const LocationFetchError(
        LocationFetchFailure.permissionDeniedForever,
      );
    }

    // Keep geolocator permission state consistent after permission_handler.
    var permission = await checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await requestPermission();
    }
    if (permission == LocationPermission.denied) {
      return const LocationFetchError(LocationFetchFailure.permissionDenied);
    }
    if (permission == LocationPermission.deniedForever) {
      return const LocationFetchError(
        LocationFetchFailure.permissionDeniedForever,
      );
    }

    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: AppConstants.locationFetchTimeout,
      );

      final label = await _resolveLabel(
        position.latitude,
        position.longitude,
      );

      return LocationFetchSuccess(
        LocationModel(
          latitude: position.latitude,
          longitude: position.longitude,
          label: label,
          updatedAt: DateTime.now(),
          accuracyMeters: position.accuracy,
        ),
      );
    } on LocationServiceDisabledException {
      return const LocationFetchError(LocationFetchFailure.serviceDisabled);
    } on TimeoutException {
      return const LocationFetchError(LocationFetchFailure.timeout);
    } catch (e) {
      return LocationFetchError(
        LocationFetchFailure.unknown,
        message: e.toString(),
      );
    }
  }

  Future<String> _resolveLabel(double latitude, double longitude) async {
    final point = LatLng(latitude, longitude);
    if (_lastGeocodedPoint != null && _cachedLabel != null) {
      const distance = Distance();
      final meters = distance(_lastGeocodedPoint!, point);
      if (meters < AppConstants.locationGeocodeMinDistanceMeters) {
        return _cachedLabel!;
      }
    }

    try {
      final placemarks = await placemarkFromCoordinates(latitude, longitude);
      if (placemarks.isEmpty) {
        return _formatCoordinates(latitude, longitude);
      }
      final p = placemarks.first;
      final parts = [
        if (p.subLocality?.isNotEmpty == true) p.subLocality,
        if (p.locality?.isNotEmpty == true) p.locality,
        if (p.administrativeArea?.isNotEmpty == true) p.administrativeArea,
      ].whereType<String>().toList();

      final label = parts.isNotEmpty
          ? parts.join(', ')
          : _formatCoordinates(latitude, longitude);

      _lastGeocodedPoint = point;
      _cachedLabel = label;
      return label;
    } catch (_) {
      return _formatCoordinates(latitude, longitude);
    }
  }

  String _formatCoordinates(double latitude, double longitude) =>
      '${latitude.toStringAsFixed(4)}, ${longitude.toStringAsFixed(4)}';
}

final locationServiceProvider = Provider<LocationService>(
  (ref) => LocationService(),
);
