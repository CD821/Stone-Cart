"use client";

import { SignInButton, UserButton, useUser } from "@clerk/react";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

export default function ClerkUserControl() {
  if (!clerkPublishableKey) return null;

  return <ClerkUserControlInner />;
}

function ClerkUserControlInner() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <div className="auth-user">
        <UserButton />
      </div>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="auth-button">Sign In</button>
    </SignInButton>
  );
}
