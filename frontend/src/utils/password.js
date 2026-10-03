/** Same password rules as the server (routes/admin.py password_problem), so errors show before submitting. */
export function passwordProblem(password, username) {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 128) return 'Use 128 characters or fewer.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Use a mix of letters and numbers.';
  if (username && password.toLowerCase() === username.toLowerCase()) {
    return 'Your password cannot be the same as your username.';
  }
  return '';
}

export const PASSWORD_HINT = 'At least 8 characters, with letters and numbers.';
