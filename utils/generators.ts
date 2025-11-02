import { faker } from '@faker-js/faker';

/**
 * Pure utility functions for generating test data using Faker.
 * These are generic data generators with no business logic.
 */

/**
 * Generate a random user with realistic data.
 * 
 * @param seed - Optional seed for reproducible data generation
 * @returns User object with personal and address information
 */
export function generateUser(seed?: string | number) {
  if (seed !== undefined) {
    faker.seed(typeof seed === 'string' ? parseInt(seed, 10) || Date.now() : seed);
  }

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  // Add timestamp + random suffix to email to ensure uniqueness in parallel execution
  const uniqueSuffix = `${Date.now()}${Math.random().toString(36).substring(2, 7)}`;
  const baseEmail = faker.internet.email({ firstName, lastName }).toLowerCase();
  const [localPart, domain] = baseEmail.split('@');
  const uniqueEmail = `${localPart}+${uniqueSuffix}@${domain}`;
  
  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    email: uniqueEmail,
    password: faker.internet.password({ length: 12, memorable: false, pattern: /[A-Za-z0-9!@#$%]/ }),
    address1: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipcode: faker.location.zipCode(),
    mobile: faker.phone.number({ style: 'international' }),
  };
}

/**
 * Generate random credit card payment details.
 * 
 * @param seed - Optional seed for reproducible data generation
 * @returns Payment object with card information
 */
export function generatePayment(seed?: string | number) {
  if (seed !== undefined) {
    faker.seed(typeof seed === 'string' ? parseInt(seed, 10) || Date.now() : seed);
  }

  return {
    nameOnCard: faker.person.fullName(),
    cardNumber: faker.finance.creditCardNumber({ issuer: 'visa' }),
    cvc: faker.finance.creditCardCVV(),
    expiryMonth: faker.date.future().getMonth().toString().padStart(2, '0'),
    expiryYear: faker.date.future({ years: 5 }).getFullYear().toString(),
  };
}

