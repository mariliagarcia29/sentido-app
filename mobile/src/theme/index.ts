export const Colors = {
  primary: '#2D7DD2',
  primaryDark: '#1A5FA8',
  secondary: '#3BB273',
  danger: '#E84855',
  warning: '#F9C74F',
  background: '#F4F6FB',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#1A202C',
  textSecondary: '#718096',
  textMuted: '#A0AEC0',
  moodColors: ['#E84855', '#F9C74F', '#90BE6D', '#2D7DD2', '#9B72CF'],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
};
