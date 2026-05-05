// Clerk's middleware is incompatible with both Edge (Node-only deps) and Node
// runtimes in Next 16 + Clerk 6 right now. Route protection is enforced
// per-page via <SignedOut><RedirectToSignIn /></SignedOut> instead.
export default function middleware() {
  return;
}

export const config = {
  matcher: [],
};
