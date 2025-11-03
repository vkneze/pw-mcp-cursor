// Named link text (single source of truth)
const links = {
  home: 'Home',
  products: 'Products',
  cart: 'Cart',
  signupLogin: 'Signup / Login',
  testCases: 'Test Cases',
  apiTesting: 'API Testing',
  videoTutorials: 'Video Tutorials',
  contactUs: 'Contact us',
} as const;

export const home = {
  url: '/',
  // Data-only values (no selectors here)
  homeTitleText: 'Automation Exercise',
  links,
};

export type HomeData = typeof home;


