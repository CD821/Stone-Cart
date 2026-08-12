"use client";

import { ClerkProvider, SignInButton, useUser } from "@clerk/react";
import { AuthRoleProvider } from "./AuthRoleContext";

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
      <RequireAuth>{children}</RequireAuth>
    </ClerkProvider>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <main className="auth-screen" aria-label="Loading StoneCart">
        <section className="auth-card">
          <div className="brand auth-brand">
            <div className="brand-mark">SC</div>
            <div>
              <p>StoneCart</p>
              <span>Fabrication control</span>
            </div>
          </div>
          <div className="auth-loader" aria-hidden="true" />
        </section>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="auth-screen" aria-label="StoneCart sign in">
        <section className="auth-card">
          <div className="brand auth-brand">
            <div className="brand-mark">SC</div>
            <div>
              <p>StoneCart</p>
              <span>Fabrication control</span>
            </div>
          </div>
          <div className="auth-copy">
            <h1>Sign in to StoneCart</h1>
            <p>Manage cart checkouts, returns, inventory, and activity from one secure workspace.</p>
          </div>
          <SignInButton mode="modal">
            <button className="primary-action auth-sign-in">Sign In</button>
          </SignInButton>
          <p className="auth-security-note">
            <span aria-hidden="true" />Secure access for authorized StoneCart users
          </p>
        </section>
      </main>
    );
  }

  return (
    <AuthRoleProvider
      value={{
        role: String(user?.publicMetadata?.role ?? "Installer"),
        name: user?.fullName || user?.primaryEmailAddress?.emailAddress || "Carlos",
      }}
    >
      {children}
    </AuthRoleProvider>
  );
}
