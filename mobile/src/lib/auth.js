export function validateLogin(email, password) {
  const errors = {};

  if (!email.trim()) {
    errors.email = 'Enter your email.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password.length) {
    errors.password = 'Enter your password.';
  }

  return errors;
}
