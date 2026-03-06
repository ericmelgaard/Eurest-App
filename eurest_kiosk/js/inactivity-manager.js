import { getTimeoutDuration, getWarningDuration } from './kiosk-config.js';

export class InactivityManager {
  constructor(onTimeout, onWarning) {
    this.onTimeout = onTimeout;
    this.onWarning = onWarning;
    this.timeoutId = null;
    this.warningId = null;
    this.isWarningShown = false;
    this.isPaused = false;
    this.lastActivity = Date.now();

    this.timeoutDuration = getTimeoutDuration();
    this.warningDuration = getWarningDuration();

    this.events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    this.init();
  }

  init() {
    this.events.forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), { passive: true });
    });

    this.startTimer();
  }

  startTimer() {
    if (this.isPaused) return;

    this.clearTimers();
    this.isWarningShown = false;
    this.lastActivity = Date.now();

    const warningTime = this.timeoutDuration - this.warningDuration;

    this.warningId = setTimeout(() => {
      if (!this.isPaused) {
        this.showWarning();
      }
    }, warningTime);

    this.timeoutId = setTimeout(() => {
      if (!this.isPaused) {
        this.handleTimeout();
      }
    }, this.timeoutDuration);
  }

  resetTimer() {
    if (this.isWarningShown) {
      this.hideWarning();
    }
    this.startTimer();
  }

  clearTimers() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
      this.warningId = null;
    }
  }

  showWarning() {
    this.isWarningShown = true;
    if (this.onWarning) {
      this.onWarning(this.warningDuration / 1000);
    }
  }

  hideWarning() {
    this.isWarningShown = false;
  }

  handleTimeout() {
    if (this.onTimeout) {
      this.onTimeout();
    }
    this.startTimer();
  }

  pause() {
    this.isPaused = true;
    this.clearTimers();
  }

  resume() {
    this.isPaused = false;
    this.startTimer();
  }

  destroy() {
    this.clearTimers();
    this.events.forEach(event => {
      document.removeEventListener(event, () => this.resetTimer());
    });
  }
}
