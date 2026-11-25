export function validateEmail(email) {
  const errors = {};

  if (!email.trim()) {
    errors.email = 'Enter your email.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  return errors;
}

export function validateLogin(email, password) {
  const errors = validateEmail(email);

  if (!password.length) {
    errors.password = 'Enter your password.';
  }

  return errors;
}

export function validateRegister(fullName, email, password) {
  const errors = validateLogin(email, password);

  if (!fullName.trim()) {
    errors.fullName = 'Enter your full name.';
  } else if (!/^[\p{L}\p{M}'\-\s]{2,}$/u.test(fullName.trim())) {
    errors.fullName = 'Enter a valid name.';
  }

  return errors;
}

export function validateOtp(code) {
  if (!/^\d{6}$/.test(code)) {
    return { code: 'Enter a 6-digit code.' };
  }

  return {};
}

export function validateSetPassword(password, confirmPassword) {
  const errors = {};

  if (!password.length) {
    errors.password = 'Enter your new password.';
  }
  if (!confirmPassword.length) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}
