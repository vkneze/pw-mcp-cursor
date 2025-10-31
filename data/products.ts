export const products = {
  url: '/products',
  // Common searchable products present on AutomationExercise products page
  sampleQueries: {
    blueTop: {
      query: 'Blue Top',
      expectedName: 'Blue Top',
    },
    menTshirt: {
      query: 'Men Tshirt',
      expectedName: 'Men Tshirt',
    },
    stylishDress: {
      query: 'Stylish Dress',
      expectedName: 'Stylish Dress',
    },
  },
};

export type ProductsData = typeof products;


