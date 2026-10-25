/**
 * Are we inside the Capacitor shell?
 *
 * Capacitor injects `Capacitor.isNativePlatform()`; in a plain browser that
 * global is absent. The status bar is drawn by the app in the browser preview
 * (so the composition matches the design mock) and left to the OS on device,
 * where the safe-area inset takes over instead.
 */
export function isNativeShell(): boolean {
  const capacitor = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.());
}
