import { generatePayment } from '../utils/generators';

export type OrderPayment = {
  nameOnCard: string;
  cardNumber: string;
  cvc: string;
  expiryMonth: string;
  expiryYear: string;
};

/**
 * Generate random payment details for order tests.
 * Uses generic payment generator.
 * 
 * @param seed - Optional seed for reproducible data generation
 * @returns OrderPayment object with all required fields
 */
export function generateOrderPayment(seed?: string | number): OrderPayment {
  return generatePayment(seed);
}

/**
 * Default test payment data for convenience.
 * Uses a well-known Stripe test card number.
 */
export const orderPayment: OrderPayment = {
  nameOnCard: 'Test User',
  cardNumber: '4242 4242 4242 4242', // Stripe test card
  cvc: '123',
  expiryMonth: '12',
  expiryYear: '2030',
};


