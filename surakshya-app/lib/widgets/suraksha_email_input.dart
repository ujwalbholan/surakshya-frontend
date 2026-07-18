library suraksha_email_input;

import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:suraksha/features/auth/widgets/auth_underline_field_style.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';

/// Visual chrome for [SurakshaEmailInput].
enum SurakshaEmailInputStyle {
  /// Filled rounded card (default — used on Signup and elsewhere).
  filled,

  /// Hairline underline only (opt-in — Sign In screen).
  underline,
}

/// Maps UI suffix labels to full email provider domains.
class EmailDomains {
  EmailDomains._();

  static const String defaultSelected = 'gmail.com';

  static const List<EmailSuffixOption> suffixes = [
    EmailSuffixOption(label: '@gmail.com', domain: 'gmail.com'),
    EmailSuffixOption(label: '@icloud.com', domain: 'icloud.com'),
    EmailSuffixOption(label: '@protonmail.org', domain: 'protonmail.org'),
    EmailSuffixOption(label: '@live.net', domain: 'live.net'),
  ];

  static EmailSuffixOption optionForDomain(String domain) => suffixes.firstWhere(
        (option) => option.domain == domain,
        orElse: () => suffixes.first,
      );
}

class EmailSuffixOption {
  const EmailSuffixOption({required this.label, required this.domain});

  final String label;
  final String domain;
}

/// Split email field: local-part text input with a suffix chip and frosted
/// domain dropdown.
class SurakshaEmailInput extends StatefulWidget {
  const SurakshaEmailInput({
    super.key,
    required this.localPartController,
    this.initialDomain = EmailDomains.defaultSelected,
    this.placeholder = 'EMAIL',
    this.textInputAction,
    this.onSubmitted,
    this.onEmailChanged,
    this.onDomainChanged,
    this.enabled = true,
    this.style = SurakshaEmailInputStyle.filled,
  });

  final TextEditingController localPartController;
  final String initialDomain;
  final String placeholder;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onEmailChanged;
  final ValueChanged<String>? onDomainChanged;
  final bool enabled;

  /// Defaults to [SurakshaEmailInputStyle.filled] so Signup is unchanged.
  final SurakshaEmailInputStyle style;

  @override
  State<SurakshaEmailInput> createState() => SurakshaEmailInputState();
}

class SurakshaEmailInputState extends State<SurakshaEmailInput> {
  static const _minHeight = 36.0;
  static const _animationDuration = Duration(milliseconds: 150);
  static const _menuWidth = 168.0;

  static final TextStyle _suffixStyle = GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    height: 1.2,
    color: surakshaForeground,
  );

  static final TextStyle _menuItemStyle = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.43,
    color: Colors.black,
  );

  late final FocusNode _focusNode;
  late final OverlayPortalController _overlayController;
  late final LayerLink _layerLink;

  late String _selectedDomain;
  bool _isFocused = false;
  bool _menuOpen = false;

  String get fullEmail =>
      '${widget.localPartController.text.trim()}@$_selectedDomain';

  EmailSuffixOption get _selectedOption =>
      EmailDomains.optionForDomain(_selectedDomain);

  @override
  void initState() {
    super.initState();
    _selectedDomain = widget.initialDomain;
    _focusNode = FocusNode()..addListener(_onFocusChange);
    _overlayController = OverlayPortalController();
    _layerLink = LayerLink();
    widget.localPartController.addListener(_notifyEmailChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) => _notifyEmailChanged());
  }

  @override
  void didUpdateWidget(covariant SurakshaEmailInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.localPartController != widget.localPartController) {
      oldWidget.localPartController.removeListener(_notifyEmailChanged);
      widget.localPartController.addListener(_notifyEmailChanged);
      _notifyEmailChanged();
    }
    if (oldWidget.initialDomain != widget.initialDomain) {
      _selectedDomain = widget.initialDomain;
      _notifyEmailChanged();
    }
  }

  @override
  void dispose() {
    widget.localPartController.removeListener(_notifyEmailChanged);
    _focusNode
      ..removeListener(_onFocusChange)
      ..dispose();
    super.dispose();
  }

  void _onFocusChange() {
    final focused = _focusNode.hasFocus;
    if (focused == _isFocused) return;
    setState(() => _isFocused = focused);
  }

  void _notifyEmailChanged() {
    widget.onEmailChanged?.call(fullEmail);
  }

  BoxShadow get _baseShadow => BoxShadow(
        color: Colors.black.withValues(alpha: 0.05),
        blurRadius: 2,
        offset: const Offset(0, 1),
      );

  void _openMenu() {
    if (!widget.enabled || _menuOpen) return;
    setState(() => _menuOpen = true);
    _overlayController.show();
  }

  void _closeMenu() {
    if (!_menuOpen) return;
    setState(() => _menuOpen = false);
    _overlayController.hide();
  }

  void _toggleMenu() {
    if (_menuOpen) {
      _closeMenu();
    } else {
      _openMenu();
    }
  }

  void _selectDomain(EmailSuffixOption option) {
    if (_selectedDomain == option.domain) {
      _closeMenu();
      return;
    }
    setState(() => _selectedDomain = option.domain);
    widget.onDomainChanged?.call(option.domain);
    _notifyEmailChanged();
    _closeMenu();
  }

  Widget _buildOverlay(BuildContext context) {
    return CompositedTransformFollower(
      link: _layerLink,
      targetAnchor: Alignment.bottomRight,
      followerAnchor: Alignment.topRight,
      offset: const Offset(0, 4),
      child: Align(
        alignment: Alignment.topRight,
        child: TapRegion(
          onTapOutside: (_) => _closeMenu(),
          child: AnimatedOpacity(
            duration: _animationDuration,
            curve: Curves.easeOut,
            opacity: _menuOpen ? 1 : 0,
            child: AnimatedScale(
              duration: _animationDuration,
              curve: Curves.easeOut,
              scale: _menuOpen ? 1 : 0.95,
              alignment: Alignment.topRight,
              child: Material(
                color: Colors.transparent,
                child: SizedBox(
                  width: _menuWidth,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(S.radiusLg),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.75),
                          borderRadius: BorderRadius.circular(S.radiusLg),
                          border: Border.all(
                            color: Colors.black.withValues(alpha: 0.08),
                          ),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            for (final option in EmailDomains.suffixes)
                              _DomainMenuRow(
                                option: option,
                                selected: option.domain == _selectedDomain,
                                style: _menuItemStyle,
                                onTap: () => _selectDomain(option),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isUnderline = widget.style == SurakshaEmailInputStyle.underline;
    final borderColor = isUnderline
        ? (_isFocused ? kFieldUnderlineFocused : kFieldUnderlineIdle)
        : (_isFocused ? surakshaAuthFocus : surakshaBorder);
    final shadows = isUnderline
        ? const <BoxShadow>[]
        : _isFocused
            ? [
                BoxShadow(
                  color: surakshaAuthFocus.withValues(alpha: 0.2),
                  spreadRadius: 3,
                ),
                _baseShadow,
              ]
            : [_baseShadow];

    final decoration = isUnderline
        ? BoxDecoration(
            color: Colors.transparent,
            border: Border(
              bottom: BorderSide(
                color: borderColor,
                width: kFieldUnderlineWidth,
              ),
            ),
          )
        : BoxDecoration(
            color: surakshaCard,
            borderRadius: BorderRadius.circular(S.radius),
            border: Border.all(color: borderColor),
            boxShadow: shadows,
          );

    return OverlayPortal(
      controller: _overlayController,
      overlayChildBuilder: _buildOverlay,
      child: Opacity(
        opacity: widget.enabled ? 1 : 0.5,
        child: AnimatedContainer(
          duration: _animationDuration,
          curve: Curves.easeOut,
          width: double.infinity,
          constraints: const BoxConstraints(minHeight: _minHeight),
          decoration: decoration,
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: isUnderline ? 0 : 12,
              vertical: 8,
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: widget.localPartController,
                    focusNode: _focusNode,
                    enabled: widget.enabled,
                    keyboardType: TextInputType.text,
                    textInputAction: widget.textInputAction,
                    onSubmitted: widget.onSubmitted,
                    onChanged: (_) => _notifyEmailChanged(),
                    cursorColor: isUnderline
                        ? kFieldUnderlineFocused
                        : surakshaAuthFocus,
                    style: const TextStyle(color: surakshaAuthText),
                    decoration: InputDecoration(
                      // Label is rendered above the field on Sign In; keep
                      // internal label only for the filled (Signup) chrome.
                      labelText: isUnderline ? null : widget.placeholder,
                      floatingLabelBehavior: FloatingLabelBehavior.never,
                      filled: false,
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                      isDense: true,
                    ),
                  ),
                ),
                Container(
                  width: 1,
                  height: 18,
                  margin: const EdgeInsets.only(left: 6, right: 6),
                  color: isUnderline ? kFieldUnderlineIdle : surakshaBorder,
                ),
                CompositedTransformTarget(
                  link: _layerLink,
                  child: _SuffixChip(
                    label: _selectedOption.label,
                    enabled: widget.enabled,
                    open: _menuOpen,
                    textStyle: _suffixStyle,
                    onTap: _toggleMenu,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SuffixChip extends StatelessWidget {
  const _SuffixChip({
    required this.label,
    required this.enabled,
    required this.open,
    required this.textStyle,
    required this.onTap,
  });

  static const _chipAnimDuration = Duration(milliseconds: 150);

  final String label;
  final bool enabled;
  final bool open;
  final TextStyle textStyle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: enabled ? onTap : null,
          borderRadius: BorderRadius.circular(6),
          child: AnimatedContainer(
            duration: _chipAnimDuration,
            curve: Curves.easeOut,
            padding: const EdgeInsets.fromLTRB(8, 5, 4, 5),
            decoration: BoxDecoration(
              color: surakshaSecondary,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: open ? surakshaAuthFocus : surakshaBorder,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: textStyle,
                  maxLines: 1,
                  softWrap: false,
                ),
                const SizedBox(width: 2),
                Icon(
                  open ? Icons.expand_less_rounded : Icons.expand_more_rounded,
                  size: 16,
                  color: open ? surakshaForeground : surakshaMuted,
                ),
              ],
            ),
          ),
        ),
      );
}

class _DomainMenuRow extends StatelessWidget {
  const _DomainMenuRow({
    required this.option,
    required this.selected,
    required this.style,
    required this.onTap,
  });

  final EmailSuffixOption option;
  final bool selected;
  final TextStyle style;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                SizedBox(
                  width: 20,
                  child: selected
                      ? const Icon(Icons.check, size: 16, color: Colors.black)
                      : null,
                ),
                Expanded(
                  child: Text(
                    option.label,
                    style: style,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
