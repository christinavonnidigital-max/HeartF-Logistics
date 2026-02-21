const API_BASE = "/api";

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export const vehiclesApi = {
  getAll: () => apiRequest<any[]>("db-vehicles"),
  getById: (id: number) => apiRequest<any>(`db-vehicles?id=${id}`),
  create: (data: any) => apiRequest<any>("db-vehicles", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiRequest<any>(`db-vehicles?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest<void>(`db-vehicles?id=${id}`, { method: "DELETE" }),
};

export const customersApi = {
  getAll: () => apiRequest<any[]>("db-customers"),
  getById: (id: number) => apiRequest<any>(`db-customers?id=${id}`),
  create: (data: any) => apiRequest<any>("db-customers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiRequest<any>(`db-customers?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest<void>(`db-customers?id=${id}`, { method: "DELETE" }),
};

export const bookingsApi = {
  getAll: () => apiRequest<any[]>("db-bookings"),
  getById: (id: number) => apiRequest<any>(`db-bookings?id=${id}`),
  create: (data: any) => apiRequest<any>("db-bookings", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiRequest<any>(`db-bookings?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest<void>(`db-bookings?id=${id}`, { method: "DELETE" }),
};

export const driversApi = {
  getAll: () => apiRequest<any[]>("db-drivers"),
  getById: (id: number) => apiRequest<any>(`db-drivers?id=${id}`),
  create: (data: any) => apiRequest<any>("db-drivers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiRequest<any>(`db-drivers?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest<void>(`db-drivers?id=${id}`, { method: "DELETE" }),
};

export const leadsApi = {
  getAll: () => apiRequest<any[]>("db-leads"),
  getById: (id: number) => apiRequest<any>(`db-leads?id=${id}`),
  create: (data: any) => apiRequest<any>("db-leads", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiRequest<any>(`db-leads?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest<void>(`db-leads?id=${id}`, { method: "DELETE" }),
};

export const invoicesApi = {
  getAll: () => apiRequest<any[]>("db-invoices"),
  getById: (id: number) => apiRequest<any>(`db-invoices?id=${id}`),
  create: (data: any) => apiRequest<any>("db-invoices", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiRequest<any>(`db-invoices?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest<void>(`db-invoices?id=${id}`, { method: "DELETE" }),
};

export const expensesApi = {
  getAll: () => apiRequest<any[]>("db-expenses"),
  getById: (id: number) => apiRequest<any>(`db-expenses?id=${id}`),
  create: (data: any) => apiRequest<any>("db-expenses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiRequest<any>(`db-expenses?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest<void>(`db-expenses?id=${id}`, { method: "DELETE" }),
};

export const opportunitiesApi = {
  getAll: () => apiRequest<any[]>("db-opportunities"),
  getById: (id: number) => apiRequest<any>(`db-opportunities?id=${id}`),
  create: (data: any) => apiRequest<any>("db-opportunities", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiRequest<any>(`db-opportunities?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest<void>(`db-opportunities?id=${id}`, { method: "DELETE" }),
};

export const usersApi = {
  getAll: () => apiRequest<any[]>("db-users"),
  getById: (id: string | number) => apiRequest<any>(`db-users?id=${encodeURIComponent(String(id))}`),
  getByEmail: (email: string) => apiRequest<any | null>(`db-users?email=${encodeURIComponent(email)}`),
  create: (data: any) => apiRequest<any>("db-users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string | number, data: any) => apiRequest<any>(`db-users?id=${encodeURIComponent(String(id))}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string | number) => apiRequest<void>(`db-users?id=${encodeURIComponent(String(id))}`, { method: "DELETE" }),
};

export const notificationsApi = {
  getAll: () => apiRequest<any[]>("db-notifications"),
  getQueued: () => apiRequest<any[]>("db-notifications?status=queued"),
  create: (data: any) => apiRequest<any>("db-notifications", { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id: number, data: any) => apiRequest<any>(`db-notifications?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
};
