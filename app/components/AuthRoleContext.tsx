"use client";

import { createContext, useContext } from "react";

type AuthRoleContextValue = {
  role: string;
  name: string;
};

const AuthRoleContext = createContext<AuthRoleContextValue>({
  role: "Admin",
  name: "Carlos",
});

export function AuthRoleProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AuthRoleContextValue;
}) {
  return <AuthRoleContext.Provider value={value}>{children}</AuthRoleContext.Provider>;
}

export function useAuthRole() {
  return useContext(AuthRoleContext);
}
