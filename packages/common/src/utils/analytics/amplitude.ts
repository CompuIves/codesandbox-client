import { debug, global } from './utils';
import delay from '../delay';

// After 30min no event we mark a session
const NEW_SESSION_TIME = 1000 * 60 * 30;

const getLastTimeEventSent = () => {
  const lastTime = localStorage.getItem('csb-last-event-sent');

  if (lastTime === null) {
    return 0;
  }

  return +lastTime;
};

const markLastTimeEventSent = () => {
  localStorage.setItem('csb-last-event-sent', Date.now().toString());
};

const amplitudePromise = async () => {
  for (let i = 0; i < 10; i++) {
    if (typeof global.amplitude !== 'undefined') {
      return true;
    }

    // eslint-disable-next-line no-await-in-loop
    await delay(1000);
  }

  return false;
};

export const identify = async (key: string, value: any) => {
  await amplitudePromise();
  if (typeof global.amplitude !== 'undefined') {
    const identity = new global.amplitude.Identify();
    identity.set(key, value);
    global.amplitude.identify(identity);
    debug('[Amplitude] Identifying', key, value);
  } else {
    debug('[Amplitude] NOT identifying because Amplitude is not loaded');
  }
};

export const setUserId = async (userId: string) => {
  await amplitudePromise();
  if (typeof global.amplitude !== 'undefined') {
    debug('[Amplitude] Setting User ID', userId);
    identify('userId', userId);

    global.amplitude.getInstance().setUserId(userId);
  } else {
    debug('[Amplitude] NOT setting userid because Amplitude is not loaded');
  }
};

export const resetUserId = async () => {
  await amplitudePromise();
  if (typeof global.amplitude !== 'undefined') {
    debug('[Amplitude] Resetting User ID');
    identify('userId', null);

    if (
      global.amplitude.getInstance().options &&
      global.amplitude.getInstance().options.userId
    ) {
      global.amplitude.getInstance().setUserId(null);
      global.amplitude.getInstance().regenerateDeviceId();
    }
  } else {
    debug('[Amplitude] NOT resetting user id because Amplitude is not loaded');
  }
};

export const track = async (eventName: string, data: any) => {
  await amplitudePromise();
  if (typeof global.amplitude !== 'undefined') {
    const currentTime = Date.now();
    if (currentTime - getLastTimeEventSent() > NEW_SESSION_TIME) {
      // We send a separate New Session event if people have been inactive for a while
      global.amplitude.logEvent('New Session');
    }
    markLastTimeEventSent();

    debug('[Amplitude] Tracking', eventName, data);
    global.amplitude.logEvent(eventName, data);
  } else {
    debug(
      '[Amplitude] NOT tracking because Amplitude is not loaded',
      eventName
    );
  }
};
