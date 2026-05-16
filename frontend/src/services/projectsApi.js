const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const parseErrorMessage = async (response, fallbackMessage) => {
  try {
    const payload = await response.json();
    return payload.message || fallbackMessage;
  } catch (error) {
    return fallbackMessage;
  }
};

export const fetchProjects = async (signal) => {
  const response = await fetch(`${API_BASE_URL}/projects`, { signal });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Unable to fetch projects.'));
  }

  return response.json();
};