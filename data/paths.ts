export const paths = {
  viewCart: '/view_cart',
  login: '/login',
  signup: '/signup',
  home: '/',
} as const;

export type PathKey = keyof typeof paths;

