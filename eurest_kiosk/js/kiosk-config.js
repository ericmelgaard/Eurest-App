export const kioskConfig = {
  enabled: true,
  timeoutDuration: 45000,
  warningDuration: 10000,
  enableSounds: false,
  touchTargetSize: 56,
  preventZoom: true,
  preventSelection: true,
  preventContextMenu: true,
  fullscreenMode: false,
  scrollToTopThreshold: 300
};

export function isKioskMode() {
  return kioskConfig.enabled;
}

export function getTimeoutDuration() {
  return kioskConfig.timeoutDuration;
}

export function getWarningDuration() {
  return kioskConfig.warningDuration;
}
