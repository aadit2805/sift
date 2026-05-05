"use client";

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>{children}</SignedIn>
    </>
  );
}
