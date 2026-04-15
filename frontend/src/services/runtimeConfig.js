export const getRuntimeConfigValue = (key, fallbackValue) => {
  if (typeof window !== 'undefined' && window.__APP_CONFIG__ && window.__APP_CONFIG__[key]) {
    return window.__APP_CONFIG__[key];
  }

  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  return fallbackValue;
};
