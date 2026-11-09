import { apiClient, setAuthToken, setActiveHospitalHeader } from './client';

export * from './client';

export const patientAuthApi = {
  login: async (credentials: { phone: string; password?: string; otp?: string }) => {
    const res = await apiClient.post('/auth/patient-login', credentials);
    if (res.data?.data?.token) {
      setAuthToken(res.data.data.token);
    }
    return res.data;
  },
  register: async (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    password?: string;
  }) => {
    return apiClient.post('/auth/patient-register', data);
  },
  logout: async () => {
    setAuthToken(null);
    return apiClient.post('/auth/logout');
  },
};

export const patientDashboardApi = {
  getProfile: async () => {
    return apiClient.get('/patients/me');
  },
  getLinkedHospitals: async () => {
    return apiClient.get('/patients/me/hospitals');
  },
  switchHospital: (hospitalId: string) => {
    setActiveHospitalHeader(hospitalId);
  },
};

export const patientAppointmentsApi = {
  getMyAppointments: async (params?: { status?: string }) => {
    return apiClient.get('/appointments/my-appointments', { params });
  },
  getDoctors: async (params?: { department?: string; specialty?: string; search?: string }) => {
    return apiClient.get('/hospitals/doctors', { params });
  },
  bookAppointment: async (bookingData: {
    doctorId: string;
    hospitalId: string;
    appointmentDate: string;
    timeSlot: string;
    consultationType: 'in_person' | 'teleconsultation';
    reason?: string;
  }) => {
    return apiClient.post('/appointments', bookingData);
  },
  cancelAppointment: async (appointmentId: string, reason: string) => {
    return apiClient.post(`/appointments/${appointmentId}/cancel`, { reason });
  },
};

export const patientRecordsApi = {
  getPrescriptions: async () => {
    return apiClient.get('/clinical/my-prescriptions');
  },
  getLabReports: async () => {
    return apiClient.get('/diagnostics/my-lab-reports');
  },
  getRadiologyStudies: async () => {
    return apiClient.get('/diagnostics/my-radiology-reports');
  },
  getInvoices: async () => {
    return apiClient.get('/billing/my-invoices');
  },
  getAdmissions: async () => {
    return apiClient.get('/inpatient/my-admissions');
  },
};

export const patientDocumentsApi = {
  uploadDocument: async (formData: any) => {
    return apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMyDocuments: async () => {
    return apiClient.get('/documents/my-documents');
  },
};

export const patientNotificationsApi = {
  getNotifications: async () => {
    return apiClient.get('/notifications/my-notifications');
  },
  markAsRead: async (notificationId: string) => {
    return apiClient.patch(`/notifications/${notificationId}/read`);
  },
};

