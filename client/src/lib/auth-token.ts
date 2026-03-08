type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export function setTokenGetter(fn: TokenGetter) {
  tokenGetter = fn;
}

export async function getToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  return tokenGetter();
}
