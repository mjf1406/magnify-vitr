export function providerDisplayName(provider: string): string {
  switch (provider) {
    case "google":
      return "Google";
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}
