export function httpsEndpoint(location: string | undefined): string | null {
  try {
    const url = new URL(location ?? '');
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
