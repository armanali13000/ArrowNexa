export type ThemeMode = 'light' | 'dark' | 'system';

export type Theme = {
  colors: {
    background: string;
    surface: string;
    card: string;
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    textPrimary: string;
    textSecondary: string;
    divider: string;
    boardBackground: string;
    arrowDefault: string;
    arrowBlocked: string;
    arrowHinted: string;
  };
  spacing: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number>;
  radius: Record<'sm' | 'md' | 'lg' | 'xl' | 'pill', number>;
  typography: Record<
    'display' | 'heading1' | 'heading2' | 'title' | 'body' | 'bodySmall' | 'button' | 'caption',
    { fontSize: number; lineHeight: number; fontWeight: '400' | '500' | '600' | '700' | '800' }
  >;
  shadow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
};

const base = {
  spacing: { xs: 6, sm: 10, md: 16, lg: 22, xl: 30, xxl: 40 },
  radius: { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 },
  typography: {
    display: { fontSize: 38, lineHeight: 44, fontWeight: '800' },
    heading1: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
    heading2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
    title: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
    body: { fontSize: 16, lineHeight: 23, fontWeight: '500' },
    bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    button: { fontSize: 16, lineHeight: 20, fontWeight: '800' },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  },
  shadow: {
    shadowColor: '#17202A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
} satisfies Omit<Theme, 'colors'>;

export const lightTheme: Theme = {
  ...base,
  colors: {
    background: '#F4F8FB',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    primary: '#1B8A8F',
    secondary: '#6D5DF6',
    accent: '#FFB84D',
    success: '#2EA86F',
    warning: '#D88920',
    error: '#D9514E',
    textPrimary: '#14212B',
    textSecondary: '#667886',
    divider: '#DBE5EA',
    boardBackground: '#EAF3F2',
    arrowDefault: '#1B8A8F',
    arrowBlocked: '#98A5AE',
    arrowHinted: '#FFB84D',
  },
};

export const darkTheme: Theme = {
  ...base,
  colors: {
    background: '#10151A',
    surface: '#172027',
    card: '#1C2730',
    primary: '#4CC4BE',
    secondary: '#8B82FF',
    accent: '#FFC66B',
    success: '#53C58B',
    warning: '#E2A13A',
    error: '#FF726F',
    textPrimary: '#F2F7F8',
    textSecondary: '#AAB7BE',
    divider: '#31404A',
    boardBackground: '#16282A',
    arrowDefault: '#4CC4BE',
    arrowBlocked: '#687984',
    arrowHinted: '#FFC66B',
  },
};
