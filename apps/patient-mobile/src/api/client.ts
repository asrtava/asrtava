import axios from 'axios';
import { Platform } from 'react-native';

// In development, Android emulator accesses host loopback via 10.0.2.2
const DEFAULT_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000/api/v1' 
  : 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

let authToken: string | null = null;
let activeHospitalId: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const setActiveHospitalHeader = (hospitalId: string | null) => {
  activeHospitalId = hospitalId;
};

// Request Interceptor: inject Bearer Token and Tenant Header
apiClient.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    if (activeHospitalId) {
      config.headers['x-hospital-id'] = activeHospitalId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle 401 token expiry gracefully
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Session expired, caller should redirect to login
    }
    return Promise.reject(error);
  }
);

