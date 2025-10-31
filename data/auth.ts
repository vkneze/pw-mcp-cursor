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

export function generateSignupUser(seed?: string): SignupUser {
  const ts = seed ?? String(Date.now());
  const name = `TestUser_${ts}`;
  const email = `test_${ts}@example.com`;
  return {
    name,
    email,
    password: 'P@ssw0rd!123',
    firstName: 'Test',
    lastName: 'User',
    address1: '123 Test Street',
    country: 'Canada',
    state: 'ON',
    city: 'Toronto',
    zipcode: 'M5H 2N2',
    mobile: '+1-416-555-1234',
  };
}


