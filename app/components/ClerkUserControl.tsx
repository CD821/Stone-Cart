"use client";

import { SignInButton, UserButton, useUser } from "@clerk/react";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

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
