# ASRTAVA Frontend API Integration & Data Communication

## 1. Architecture & Base Configuration

All frontend network requests communicate with the centralized backend running on port 5000 via a strongly typed Axios instance located in `apps/web-portal/src/services/api.ts`.

- **Base URL**: `http://localhost:5000/api/v1` (configurable via `VITE_API_URL`)
- **Credentials**: `withCredentials: true` enabled for cross-origin cookie exchange
- **Content Type**: `application/json` with automated multipart handling for file uploads

---

## 2. JWT Authentication & Silent Token Rotation

ASRTAVA employs short-lived JWT access tokens (15-minute validity) paired with rotated refresh tokens stored securely in `sessionStorage` or HTTP-only cookies.

### Request Interceptor
Automatically injects the current access token and active tenant identifier into every outgoing request header:

```typescript
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('asrtava_access_token');
  const tenantId = sessionStorage.getItem('asrtava_tenant_id');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
  }
  return config;
});
```

### Response Interceptor & Automatic Token Renewal
When a request fails with an HTTP `401 Unauthorized` due to token expiration, the interceptor automatically pauses the request queue, invokes the refresh endpoint (`/api/v1/auth/refresh`), rotates both tokens, and retries the original request seamlessly without user disruption:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = sessionStorage.getItem('asrtava_refresh_token');
        const res = await axios.post('http://localhost:5000/api/v1/auth/refresh', { refreshToken });
        
        const newAccessToken = res.data.data.accessToken;
        sessionStorage.setItem('asrtava_access_token', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshErr) {
        sessionStorage.clear();
        window.location.href = '/staff/login';
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 3. Endpoints Matrix by Domain

| Service Module | Endpoint Route | Methods | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/auth/login`, `/auth/refresh`, `/auth/switch-role` | `POST` | Multi-gateway login, token refresh, and workspace switching |
| **Patients** | `/patients`, `/patients/:id` | `GET`, `POST`, `PUT` | Registration, search by UHID, demographic updates |
| **Clinical EMR** | `/clinical/encounters`, `/clinical/prescriptions` | `GET`, `POST` | OPD notes, vitals logging, electronic prescriptions |
| **Bed Management** | `/admissions/wards`, `/admissions/beds` | `GET`, `POST`, `PATCH` | Bed grid status, patient admission, transfers |
| **Pharmacy** | `/pharmacy/queue`, `/pharmacy/dispense`, `/pharmacy/batches` | `GET`, `POST` | Rx dispensing with FEFO deduction, OTC POS sales |
| **Diagnostics** | `/laboratory/orders`, `/radiology/studies` | `GET`, `POST`, `PATCH` | Requisitions, analyzer results, PACS DICOM linking |
| **Billing** | `/billing/invoices`, `/billing/payments` | `GET`, `POST` | Invoice generation, multi-mode payment collection |
| **Tenants** | `/tenants`, `/tenants/onboard` | `GET`, `POST`, `PATCH` | SaaS hospital provisioning and plan management |

