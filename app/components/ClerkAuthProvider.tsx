"use client";

import { ClerkProvider } from "@clerk/react";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

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
