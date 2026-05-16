const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const ADMIN_TOKEN_KEY = 'filmyourfilm.admin.token';
const ADMIN_NAME_KEY = 'filmyourfilm.admin.name';

const parseErrorMessage = async (response, fallbackMessage) => {
  try {
    const payload = await response.json();
    return payload.message || fallbackMessage;
  } catch (error) {
    return fallbackMessage;
  }
};

const buildAuthorizedRequest = (token, options = {}) => ({
  ...options,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  },
});

export const getStoredAdminSession = () => ({
  token: window.localStorage.getItem(ADMIN_TOKEN_KEY) || '',
  name: window.localStorage.getItem(ADMIN_NAME_KEY) || 'Admin',
});

export const clearStoredAdminSession = () => {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_NAME_KEY);
};

export const loginAdmin = async (password) => {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Unable to sign in.'));
  }

  const payload = await response.json();
  const session = {
    token: payload.token,
    name: payload.admin?.name || 'Admin',
  };

  window.localStorage.setItem(ADMIN_TOKEN_KEY, session.token);
  window.localStorage.setItem(ADMIN_NAME_KEY, session.name);

  return session;
};

export const fetchAdminProjects = async (token) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/projects`,
    buildAuthorizedRequest(token, {
      method: 'GET',
    })
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Unable to fetch admin projects.'));
  }

  return response.json();
};

export const createAdminProject = async (token, payload) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/projects`,
    buildAuthorizedRequest(token, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Unable to create the project.'));
  }

  return response.json();
};

export const reorderAdminProjects = async (token, items) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/projects/reorder`,
    buildAuthorizedRequest(token, {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    })
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Unable to save the project order.'));
  }

  return response.json();
};