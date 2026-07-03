export function mapFirebaseAdminError(code: string | undefined): {
  message: string;
  status: number;
} {
  switch (code) {
    case "auth/configuration-not-found":
      return {
        message:
          "Firebase Authentication is not enabled. Open Firebase Console → Authentication → Get started, then enable Email/Password.",
        status: 503,
      };
    case "auth/email-already-exists":
      return { message: "Email already in use", status: 400 };
    case "auth/invalid-email":
      return { message: "Invalid email address", status: 400 };
    case "auth/invalid-password":
      return { message: "Password must be at least 6 characters", status: 400 };
    case "auth/weak-password":
      return { message: "Password is too weak", status: 400 };
    default:
      return { message: "Internal server error", status: 500 };
  }
}
