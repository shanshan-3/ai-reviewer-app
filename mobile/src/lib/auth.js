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

export function validateRegister(fullName, email, password) {
  const errors = validateLogin(email, password);

  if (!fullName.trim()) {
    errors.fullName = 'Enter your full name.';
  }

  return errors;
}
