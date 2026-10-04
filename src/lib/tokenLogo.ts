/**
 * Real asset logos come from the issuer stellar.toml `image` field published
 * on Pi Horizon. A letter chip is only the fallback when no image is declared.
 */

const HORIZON = "https://api.mainnet.minepi.com";

export type LogoResult = {
  image: string | null;
  homeDomain: string | null;
  code: string;
  issuer: string;
};

const cache = new Map<string, LogoResult>();

function key(code: string, issuer: string) {
  return `${code.toUpperCase()}:${issuer}`;
}

export async function resolveAssetLogo(code: string, issuer: string, signal?: AbortSignal): Promise<LogoResult> {
  const hit = cache.get(key(code, issuer));
  if (hit) return hit;

  const empty: LogoResult = { image: null, homeDomain: null, code, issuer };
  try {
    const acc = await fetch(`${HORIZON}/accounts/${issuer}`, { signal });
    if (!acc.ok) {
      cache.set(key(code, issuer), empty);
      return empty;
    }
    const account = await acc.json();
    const home = account?.home_domain as string | undefined;
    if (!home) {
      cache.set(key(code, issuer), empty);
      return empty;
    }
    const tomlRes = await fetch(`https://${home}/.well-known/stellar.toml`, { signal });
    if (!tomlRes.ok) {
      const miss = { ...empty, homeDomain: home };
      cache.set(key(code, issuer), miss);
      return miss;
    }
    const toml = await tomlRes.text();
    const image = imageForCode(toml, code);
    const result = { image, homeDomain: home, code, issuer };
    cache.set(key(code, issuer), result);
    return result;
  } catch {
    return empty;
  }
}

function imageForCode(toml: string, code: string): string | null {
  const blocks = toml.split(/\[\[CURRENCIES\]\]/).slice(1);
  const wanted = code.toUpperCase();
  for (const block of blocks) {
    const codeMatch = block.match(/code\s*=\s*"([^"]+)"/i);
    const imageMatch = block.match(/image\s*=\s*"([^"]+)"/i);
    if (codeMatch && codeMatch[1].toUpperCase() === wanted && imageMatch) return imageMatch[1];
  }
  const any = toml.match(/image\s*=\s*"([^"]+)"/i);
  return any ? any[1] : null;
}
