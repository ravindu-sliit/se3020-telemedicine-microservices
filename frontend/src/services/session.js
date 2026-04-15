const SESSION_KEY = 'mediconnect_session';

export const getSession = () => {
  const rawSession = localStorage.getItem(SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch (error) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const saveSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('userRole', session.user.role);
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('userRole');
};

export const getAuthToken = () => getSession()?.token || '';
