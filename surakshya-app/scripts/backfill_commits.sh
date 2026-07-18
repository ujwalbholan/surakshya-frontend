#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

commit() {
  git add "$@"
  git commit -m "$MSG"
}

MSG='add gitignore'
commit .gitignore

MSG='flutter project metadata'
commit .metadata

MSG='pubspec deps'
commit pubspec.yaml pubspec.lock

MSG='readme notes'
commit README.md

MSG='analysis_options lints'
commit analysis_options.yaml

MSG='basic widget test'
commit test/widget_test.dart

MSG='main entrypoint'
commit lib/main.dart

MSG='suraksha color tokens'
commit lib/theme/suraksha_colors.dart

MSG='spacing constants'
commit lib/theme/suraksha_spacing.dart

MSG='typography setup'
commit lib/theme/suraksha_typography.dart

MSG='animation durations'
commit lib/theme/suraksha_animations.dart

MSG='material theme wiring'
commit lib/theme/suraksha_theme.dart

MSG='app constants'
commit lib/core/constants/app_constants.dart

MSG='copy strings'
commit lib/core/constants/copy_constants.dart

MSG='haptics + scroll utils'
commit lib/core/utils/haptics.dart lib/core/utils/scroll_controller.dart

MSG='context extensions'
commit lib/core/extensions/context_extensions.dart

MSG='user model'
commit lib/models/user_model.dart

MSG='contact model'
commit lib/models/contact_model.dart

MSG='location + chapter models'
commit lib/models/location_model.dart lib/models/chapter_model.dart

MSG='splash particle model'
commit lib/features/splash/models/splash_particle.dart

MSG='ams + ble services'
commit lib/services/ams_api_service.dart lib/services/ble_service.dart

MSG='location + notifications'
commit lib/services/location_service.dart lib/services/notification_service.dart

MSG='wristband sos bridge'
commit lib/services/wristband_sos_service.dart

MSG='go_router setup'
commit lib/router/app_routes.dart lib/router/app_router.dart

MSG='auth state provider'
commit lib/features/auth/auth_provider.dart

MSG='login screen'
commit lib/features/auth/login_screen.dart

MSG='signup screen'
commit lib/features/auth/signup_screen.dart

MSG='app widget root'
commit lib/app.dart

MSG='splash timeline phases'
commit lib/features/splash/splash_timeline.dart

MSG='splash master controller'
commit lib/features/splash/splash_master_controller.dart

MSG='splash screens 1 and 2'
commit lib/features/splash/splash_screen1.dart lib/features/splash/splash_screen2.dart

MSG='splash scene layers'
commit lib/features/splash/layers/splash_scene.dart

MSG='wristband float layer'
commit lib/features/splash/layers/splash_wristband.dart

MSG='wristband torus painter'
commit lib/features/splash/painters/splash_wristband_painter.dart

MSG='splash atmosphere'
commit lib/features/splash/layers/splash_atmosphere.dart

MSG='ambient streak painter'
commit lib/features/splash/painters/splash_ambient_painter.dart

MSG='particle layer'
commit lib/features/splash/layers/splash_particle_layer.dart

MSG='splash brand panel'
commit lib/features/splash/layers/splash_brand_panel.dart

MSG='skip spinner button'
commit lib/features/splash/widgets/skip_spinner_button.dart

MSG='splash copy content'
commit lib/features/splash/splash_content.dart

MSG='shield painter'
commit lib/features/splash/painters/shield_painter.dart

MSG='cosmic + convergence painters'
commit lib/features/splash/painters/cosmic_background_painter.dart lib/features/splash/painters/convergence_painter.dart

MSG='particle field painter'
commit lib/features/splash/painters/particle_field_painter.dart

MSG='ember painter'
commit lib/features/splash/painters/ember_painter.dart

MSG='chrome + shield layers'
commit lib/features/splash/layers/splash_chrome.dart lib/features/splash/layers/splash_shield.dart

MSG='splash wordmark'
commit lib/features/splash/widgets/splash_wordmark.dart

MSG='onboarding flow'
commit lib/features/onboarding/onboarding_screen.dart

MSG='onboarding page layout'
commit lib/features/onboarding/widgets/onboarding_page.dart

MSG='onboarding dots'
commit lib/features/onboarding/widgets/onboarding_indicator.dart

MSG='home controller'
commit lib/features/home/home_controller.dart

MSG='home screen shell'
commit lib/features/home/home_screen.dart

MSG='hero section'
commit lib/features/home/sections/hero_section.dart

MSG='craft + philosophy sections'
commit lib/features/home/sections/craft_section.dart lib/features/home/sections/philosophy_section.dart

MSG='innovation section'
commit lib/features/home/sections/innovation_section.dart

MSG='app features section'
commit lib/features/home/sections/app_features_section.dart

MSG='newsletter + brand sections'
commit lib/features/home/sections/newsletter_section.dart lib/features/home/sections/brand_statement_section.dart

MSG='marquee + social sections'
commit lib/features/home/sections/perspective_marquee_section.dart lib/features/home/sections/social_wall_section.dart

MSG='home footer'
commit lib/features/home/sections/home_footer.dart

MSG='dashboard shell'
commit lib/features/dashboard/dashboard_shell.dart

MSG='dashboard provider'
commit lib/features/dashboard/dashboard_provider.dart

MSG='live location tracker'
commit lib/features/dashboard/live_location_tracker.dart

MSG='tracking tab'
commit lib/features/dashboard/tabs/tracking_tab.dart

MSG='sos tab'
commit lib/features/dashboard/tabs/sos_tab.dart

MSG='profile tab'
commit lib/features/dashboard/tabs/profile_tab.dart

MSG='tracking map view'
commit lib/features/dashboard/tracking/tracking_map_view.dart

MSG='map markers'
commit lib/features/dashboard/tracking/map_markers.dart

MSG='people places sheet'
commit lib/features/dashboard/tracking/people_places_sheet.dart

MSG='dark map widget'
commit lib/features/dashboard/tracking/widgets/dark_map_widget.dart

MSG='tracking list tiles'
commit \
  lib/features/dashboard/tracking/widgets/people_list_tile.dart \
  lib/features/dashboard/tracking/widgets/places_list_tile.dart \
  lib/features/dashboard/tracking/widgets/contact_list_tile.dart

MSG='family map widgets'
commit \
  lib/features/dashboard/tracking/widgets/family_member_tile.dart \
  lib/features/dashboard/tracking/widgets/family_header_bar.dart \
  lib/features/dashboard/tracking/widgets/map_location_sharing_banner.dart

MSG='tracking sheets + nav'
commit \
  lib/features/dashboard/tracking/widgets/group_selector_sheet.dart \
  lib/features/dashboard/tracking/widgets/contact_detail_sheet.dart \
  lib/features/dashboard/tracking/widgets/dashboard_bottom_nav.dart \
  lib/features/dashboard/tracking/widgets/battery_indicator.dart

MSG='sos countdown ui'
commit \
  lib/features/dashboard/sos/widgets/sos_oval_countdown.dart \
  lib/features/dashboard/sos/widgets/sos_center_display.dart \
  lib/features/dashboard/sos/widgets/sos_countdown_tip_card.dart

MSG='sos orbit + radar'
commit \
  lib/features/dashboard/sos/widgets/sos_contact_orbit.dart \
  lib/features/dashboard/sos/widgets/sos_radar_painter.dart \
  lib/features/dashboard/sos/widgets/wristband_sos_target.dart

MSG='sos bars and tips'
commit \
  lib/features/dashboard/sos/widgets/sos_app_bar.dart \
  lib/features/dashboard/sos/widgets/sos_swipe_cancel_bar.dart \
  lib/features/dashboard/sos/widgets/sos_tip_card.dart \
  lib/features/dashboard/sos/widgets/sos_text_section.dart

MSG='parallax widget'
commit lib/widgets/animations/parallax_widget.dart

MSG='text reveal animator'
commit lib/widgets/animations/text_reveal_animator.dart

MSG='stagger list animator'
commit lib/widgets/animations/stagger_list_animator.dart

MSG='suraksha navbar'
commit lib/widgets/navigation/suraksha_navbar.dart

MSG='film grain overlay'
commit lib/widgets/decorators/film_grain_overlay.dart

MSG='crimson accent line'
commit lib/widgets/decorators/crimson_accent_line.dart

MSG='noise painter'
commit lib/widgets/decorators/noise_painter.dart

MSG='avatar images'
commit assets/images/

MSG='wristband glb asset'
commit assets/models/

MSG='android project config'
commit android/

MSG='ios runner setup'
commit ios/

MSG='web shell'
commit web/

MSG='desktop runners'
commit macos/ linux/ windows/
