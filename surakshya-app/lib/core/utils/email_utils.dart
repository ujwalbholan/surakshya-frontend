library email_utils;

final _emailRegex = RegExp(
  r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
);

bool isValidEmail(String email) =>
    _emailRegex.hasMatch(email.trim().toLowerCase());

/// Builds a complete address from the username field and selected provider.
/// Handles common mistakes like typing `name@gmail` before the `.com` chip.
String buildEmailAddress(String localPart, String selectedDomain) {
  final trimmed = localPart.trim().toLowerCase();
  final domain = selectedDomain.trim().toLowerCase();
  if (trimmed.isEmpty) return '';

  if (isValidEmail(trimmed)) return trimmed;

  final atIndex = trimmed.indexOf('@');
  if (atIndex > 0) {
    final local = trimmed.substring(0, atIndex);
    final host = trimmed.substring(atIndex + 1);
    if (host.isEmpty) return '$local@$domain';

    if (host.contains('.')) {
      final candidate = '$local@$host';
      if (isValidEmail(candidate)) return candidate;
    }

    if (domain == host || domain.startsWith('$host.')) {
      return '$local@$domain';
    }

    final tld =
        domain.contains('.') ? domain.substring(domain.indexOf('.')) : '.com';
    final candidate = '$local@$host$tld';
    if (isValidEmail(candidate)) return candidate;
  }

  return '$trimmed@$domain';
}
