/**
 * Shared selector utilities used across page objects.
 * Keep this file focused on truly global UI primitives and parameterized helpers.
 */

// Common primitives
export const COMMON = {
  CART_MODAL: '#cartModal',
  ANY_VISIBLE_MODAL: '#cartModal, .modal:visible',
  PRODUCT_INFORMATION: '.product-information',
  FEATURES_ITEMS_CARD: '.features_items .product-image-wrapper',
};

// Product related
export const PRODUCT = {
  NAME_IN_CARD: '.single-products .productinfo p',
  DETAILS_LINK: 'a[href*="product_details/"]',
};

// Search
export const SEARCH = {
  INPUT: '#search_product',
  BUTTON: '#submit_search',
};

// Cart
export const CART = {
  TABLE: '#cart_info_table',
  DELETE_BUTTONS: '#cart_info_table a.cart_quantity_delete',
};

// Left menu / panels
export const PANELS = {
  ROOT: '.panel.panel-default',
  TITLE_LINK: '.panel-title a',
  COLLAPSE: '.panel-collapse',
  BRANDS_LINKS: '.brands_products a',
};

// Parameterized helpers
export const by = {
  brandLink: (brandName: string): string => `${PANELS.BRANDS_LINKS}:has-text("${brandName}")`,
};

/**
 * Backward-compatible flat export for existing imports.
 * Prefer importing from grouped objects above in new code.
 */
export const SELECTORS = {
  // Common
  CART_MODAL: COMMON.CART_MODAL,
  ANY_VISIBLE_MODAL: COMMON.ANY_VISIBLE_MODAL,
  PRODUCT_INFORMATION: COMMON.PRODUCT_INFORMATION,
  FEATURES_ITEMS_CARD: COMMON.FEATURES_ITEMS_CARD,

  // Product
  PRODUCT_NAME_IN_CARD: PRODUCT.NAME_IN_CARD,
  PRODUCT_DETAILS_LINK: PRODUCT.DETAILS_LINK,

  // Search
  SEARCH_INPUT: SEARCH.INPUT,
  SEARCH_BUTTON: SEARCH.BUTTON,

  // Cart
  CART_TABLE: CART.TABLE,
  CART_DELETE_BUTTONS: CART.DELETE_BUTTONS,

  // Panels
  PANELS: PANELS.ROOT,
  PANEL_TITLE_LINK: PANELS.TITLE_LINK,
  PANEL_COLLAPSE: PANELS.COLLAPSE,
  BRANDS_LINKS: PANELS.BRANDS_LINKS,
};


