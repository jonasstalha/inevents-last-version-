export function getAuthErrorMessage(error: unknown): string {
  const code = typeof (error as any)?.code === 'string' ? (error as any).code : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/weak-password':
      return 'Choose a stronger password.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled yet.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function getPasswordResetErrorMessage(error: unknown): string {
  const code = typeof (error as any)?.code === 'string' ? (error as any).code : '';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait and try again.';
  if (code === 'auth/network-request-failed') return 'Check your internet connection and try again.';
  return 'We could not send the reset email. Please try again.';
}