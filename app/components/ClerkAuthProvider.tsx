"use client";

import { ClerkProvider } from "@clerk/react";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function ClerkAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!clerkPublishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  );
}
