import env from '@/configs/environments/env';
import axiosDefault from 'axios';

const authAxios = axiosDefault.create({
  baseURL: env.SERVER_URL,
  withCredentials: true,
  timeout: 60000,
  headers: { Accept: 'application/json' },
});

authAxios.interceptors.request.use(
  async (config) => {
    if (!config.headers) return config;

    // config.headers.Authorization = `Bearer ${token}`;
    config.headers.Authorization = null;

    return config;
  },
  (error) => Promise.reject(error)
);

export default authAxios;
