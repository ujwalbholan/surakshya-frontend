library chapter_model;

class ChapterData {
  const ChapterData({
    required this.index,
    required this.label,
    required this.headline,
    required this.body,
    required this.showCta,
    required this.cameraZ,
  });

  final String index;
  final String label;
  final String headline;
  final String body;
  final bool showCta;
  final double cameraZ;
}

const List<ChapterData> kHeroChapters = [
  ChapterData(
    index: '01',
    label: 'WELCOME',
    headline: 'The Evolution\nOf Safety',
    body:
        'A precision instrument engineered for the woman who refuses to compromise.',
    showCta: true,
    cameraZ: 3.5,
  ),
  ChapterData(
    index: '02',
    label: 'SOS',
    headline: 'One Tap.\nInstant Help.',
    body:
        'Double-tap your band, 5-second countdown, then your circle is alerted.',
    showCta: false,
    cameraZ: 2.5,
  ),
  ChapterData(
    index: '03',
    label: 'TRACKING',
    headline: 'Live Location.\nAlways On.',
    body: 'GPS shared with your trusted circle. 24/7. No phone required.',
    showCta: false,
    cameraZ: 3.2,
  ),
];
