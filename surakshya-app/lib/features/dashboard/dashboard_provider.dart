library dashboard_provider;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/features/guardians/guardian_provider.dart';
import 'package:suraksha/models/contact_model.dart';
import 'package:suraksha/models/location_model.dart';

enum SosPhase { idle, counting, dispatching, active, resolved }

enum DashboardTab { tracking, sos, profile }

enum SafetyStatus { protected, sosActive }

class DashboardStateData {
  const DashboardStateData({
    this.safetyStatus = SafetyStatus.protected,
    this.locationSharingActive = true,
    this.sosPhase = SosPhase.idle,
    this.sosCountdownSeconds = AppConstants.sosCountdownSeconds,
    this.batteryLevel = 87,
    this.bandConnected = true,
    this.contactsOnline = 3,
    this.currentTab = DashboardTab.tracking,
    this.sheetTabIndex = 0,
    this.activeGroup = 'My family',
    this.contacts = const [],
    this.places = const [],
    this.currentLocation = const LocationModel(
      latitude: 27.7172,
      longitude: 85.3240,
      label: 'Kathmandu, Nepal',
    ),
    this.destination = const LocationModel(
      latitude: 27.7100,
      longitude: 85.3300,
      label: 'Work',
    ),
    this.unreadNotifications = 0,
    this.activeSosId,
  });

  final SafetyStatus safetyStatus;
  final bool locationSharingActive;
  final SosPhase sosPhase;
  final int sosCountdownSeconds;
  final int batteryLevel;
  final bool bandConnected;
  final int contactsOnline;
  final DashboardTab currentTab;
  final int sheetTabIndex;
  final String activeGroup;
  final List<ContactModel> contacts;
  final List<PlaceModel> places;
  final LocationModel currentLocation;
  final LocationModel destination;
  final int unreadNotifications;
  final String? activeSosId;

  DashboardStateData copyWith({
    SafetyStatus? safetyStatus,
    bool? locationSharingActive,
    SosPhase? sosPhase,
    int? sosCountdownSeconds,
    int? batteryLevel,
    bool? bandConnected,
    int? contactsOnline,
    DashboardTab? currentTab,
    int? sheetTabIndex,
    String? activeGroup,
    List<ContactModel>? contacts,
    List<PlaceModel>? places,
    LocationModel? currentLocation,
    LocationModel? destination,
    int? unreadNotifications,
    String? activeSosId,
    bool clearActiveSosId = false,
  }) =>
      DashboardStateData(
        safetyStatus: safetyStatus ?? this.safetyStatus,
        locationSharingActive:
            locationSharingActive ?? this.locationSharingActive,
        sosPhase: sosPhase ?? this.sosPhase,
        sosCountdownSeconds: sosCountdownSeconds ?? this.sosCountdownSeconds,
        batteryLevel: batteryLevel ?? this.batteryLevel,
        bandConnected: bandConnected ?? this.bandConnected,
        contactsOnline: contactsOnline ?? this.contactsOnline,
        currentTab: currentTab ?? this.currentTab,
        sheetTabIndex: sheetTabIndex ?? this.sheetTabIndex,
        activeGroup: activeGroup ?? this.activeGroup,
        contacts: contacts ?? this.contacts,
        places: places ?? this.places,
        currentLocation: currentLocation ?? this.currentLocation,
        destination: destination ?? this.destination,
        unreadNotifications: unreadNotifications ?? this.unreadNotifications,
        activeSosId:
            clearActiveSosId ? null : (activeSosId ?? this.activeSosId),
      );
}

final kMockPlaces = <PlaceModel>[];

class DashboardNotifier extends StateNotifier<DashboardStateData> {
  DashboardNotifier()
      : super(const DashboardStateData(
          contacts: [],
          places: [],
          batteryLevel: 0,
          bandConnected: false,
          contactsOnline: 0,
        ));

  void setTab(DashboardTab tab) => state = state.copyWith(currentTab: tab);

  void setSheetTab(int index) => state = state.copyWith(sheetTabIndex: index);

  void setActiveGroup(String group) =>
      state = state.copyWith(activeGroup: group);

  void toggleLocationSharing() => state = state.copyWith(
        locationSharingActive: !state.locationSharingActive,
      );

  void setLocationSharingActive(bool active) =>
      state = state.copyWith(locationSharingActive: active);

  void resetSos() => state = state.copyWith(
        sosPhase: SosPhase.idle,
        sosCountdownSeconds: AppConstants.sosCountdownSeconds,
        safetyStatus: SafetyStatus.protected,
        clearActiveSosId: true,
      );

  void startSosCountdown() => state = state.copyWith(
        sosPhase: SosPhase.counting,
        sosCountdownSeconds: AppConstants.sosCountdownSeconds,
        safetyStatus: SafetyStatus.sosActive,
        currentTab: DashboardTab.sos,
        clearActiveSosId: true,
      );

  void updateCountdown(int seconds) =>
      state = state.copyWith(sosCountdownSeconds: seconds);

  void startDispatching() => state = state.copyWith(
        sosPhase: SosPhase.dispatching,
        safetyStatus: SafetyStatus.sosActive,
      );

  void setActiveSosId(String id) => state = state.copyWith(activeSosId: id);

  /// Mirror an SOS that was started on the IoT band / server.
  void markSosActive({required String sosId}) => state = state.copyWith(
        sosPhase: SosPhase.active,
        safetyStatus: SafetyStatus.sosActive,
        currentTab: DashboardTab.sos,
        activeSosId: sosId,
      );

  void resolveSos() => state = state.copyWith(
        sosPhase: SosPhase.resolved,
        safetyStatus: SafetyStatus.protected,
      );

  void setBattery(int level) => state = state.copyWith(batteryLevel: level);

  void setBandConnected(bool connected) =>
      state = state.copyWith(bandConnected: connected);

  void updateLocation(LocationModel location) =>
      state = state.copyWith(currentLocation: location);
}

final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardStateData>(
  (ref) => DashboardNotifier(),
);

final familyMembersProvider = Provider<List<ContactModel>>((ref) {
  final linking = ref.watch(guardianLinkingProvider);
  if (linking.error != null || linking.loading) {
    return const [];
  }
  if (linking.guardians.isEmpty) {
    return const [];
  }
  return linking.guardians
      .map(
        (g) => ContactModel(
          id: g.id,
          name: g.fullName,
          phone: g.phone,
          role: g.isEmergencyContact ? 'Emergency' : 'Guardian',
          isEmergency: g.isEmergencyContact,
          initials: g.initials,
        ),
      )
      .toList();
});

/// Explicit family-list UI state — never silently fall back to mock contacts.
enum FamilyListUiState { loading, error, empty, ready }

final familyListUiStateProvider = Provider<FamilyListUiState>((ref) {
  final linking = ref.watch(guardianLinkingProvider);
  if (linking.loading) return FamilyListUiState.loading;
  if (linking.error != null) return FamilyListUiState.error;
  if (linking.guardians.isEmpty) return FamilyListUiState.empty;
  return FamilyListUiState.ready;
});

final familyListErrorProvider = Provider<String?>((ref) {
  return ref.watch(guardianLinkingProvider).error;
});

final emergencyContactsProvider = Provider<List<ContactModel>>((ref) {
  return ref.watch(familyMembersProvider);
});
