// Development environment config.
// apiBaseUrl is intentionally relative so the Angular dev proxy (proxy.conf.json)
// forwards /api/* requests to the backend without hardcoding a port number.
export const environment = {
  production: false,
  apiBaseUrl: '/api',
};
