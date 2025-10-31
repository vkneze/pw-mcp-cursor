import { generateUser } from '../utils/generators';

export type SignupUser = {
  name: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address1: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  mobile: string;
};

/**
 * Generate a random user for signup/registration tests.
 * Uses generic user generator and adds application-specific fields.
 * 
 * @param seed - Optional seed for reproducible data generation (useful for debugging)
 * @returns SignupUser object with all required fields
 */
export function generateSignupUser(seed?: string | number): SignupUser {
  const user = generateUser(seed);
  
  return {
    ...user,
    country: 'Canada', // Application-specific: form requires fixed country
  };
}


