import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (user?.access_token) {
    config.headers.Authorization = `Bearer ${user.access_token}`;
  }

  return config;
});

// Business Types
export const businessTypeAPI = {
  getAll: () => api.get('/business-types/'),
  getById: (id) => api.get(`/business-types/${id}`),
  create: (data) => api.post('/business-types/', data),
  delete: (id) => api.delete(`/business-types/${id}`),
};

// Companies
export const companyAPI = {
  getAll: () => api.get('/companies/'),
  getById: (id) => api.get(`/companies/${id}`),
  getWithBusinessTypes: () => api.get('/companies/with-business-types'),
  getBusinessTypes: (companyId) => api.get(`/companies/${companyId}/business-types`), // Make sure this exists
  create: (data) => api.post('/companies/', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

// Clients
export const clientAPI = {
  getAll: () => api.get('/clients/'),
  getById: (id) => api.get(`/clients/${id}`),  
  create: (data) => api.post('/clients/', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Transactions
export const transactionAPI = {
  getAll: () => api.get('/transactions/'),
  create: (data) => api.post('/transactions/', data),
  update: (id, data) => api.patch(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Reports
export const reportAPI = {
getBilling: (month, year, client_id, business_type_id) => {
  let url = `/reports/billing?`;

  if (month) url += `month=${month}&`;
  if (year) url += `year=${year}&`;
  if (client_id) url += `client_id=${client_id}&`;
  if (business_type_id) url += `business_type_id=${business_type_id}`;

  return api.get(url); // ✅ VERY IMPORTANT
},
  getCollection: (month, year, client_id = null, business_type_id = null) => {
  let url = `/reports/collection?`;

  if (month) url += `month=${month}&`;
  if (year) url += `year=${year}&`;
  if (client_id) url += `client_id=${client_id}&`;
  if (business_type_id) url += `business_type_id=${business_type_id}`;

  return api.get(url);
},

getOutstanding: (client_id = null, business_type_id = null) => {
  let url = `/reports/outstanding?`;

  if (client_id) url += `client_id=${client_id}&`;
  if (business_type_id) url += `business_type_id=${business_type_id}`;

  return api.get(url);
},
 getSummary: (month, year, client_id = null, business_type_id = null) => {
  let url = `/reports/summary?`;

  if (month) url += `month=${month}&`;
  if (year) url += `year=${year}&`;
  if (client_id) url += `client_id=${client_id}&`;
  if (business_type_id) url += `business_type_id=${business_type_id}`;

  return api.get(url);
},
  getDashboard: (month, year) => api.get(`/reports/dashboard?month=${month}&year=${year}`),
  getFilterOptions: () => api.get('/reports/filter-options'),
};

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};


export const masterAPI = {
  getTransactionFormData: (clientId = null, companyId = null) => {
    let url = '/master/transaction-form';
    if (clientId) url += `?client_id=${clientId}`;
    if (companyId) url += `&company_id=${companyId}`;
    return api.get(url);
  },
};

export const onAccountAPI = {
  getAll: (params = {}) =>
    api.get('/on-account/', {
      params,
    }),

  create: (data) => api.post('/on-account/', data),

  update: (id, data) =>
    api.patch(`/on-account/${id}`, data),

  delete: (id) =>
    api.delete(`/on-account/${id}`),
};

//Responsible Person
export const responsiblePersonAPI = {
  getAll: () => api.get('/responsible-persons'),
  getById: (id) =>  api.get(`/responsible-persons/${id}`),
  create: (data) => api.post('/responsible-persons', data),
  update: (id, data) => api.put(`/responsible-persons/${id}`, data),
  delete: (id) => api.delete(`/responsible-persons/${id}`),
};

// Company - Resposible Person
export const companyResponsiblePersonAPI = {
  create: (data) => api.post('/company-responsible-person', data),
  delete: (companyId, personId) => api.delete(`/company-responsible-person/company/${companyId}/person/${personId}`),
  getAll: () => api.get(`/company-responsible-person`),
  getByPerson: (personId) =>  api.get(`/company-responsible-person/person/${personId}`),
  getByCompany: (companyId) =>  api.get(`/company-responsible-person/company/${companyId}`),
  updateByPerson: (personId, data) => api.put(`/company-responsible-person/person/${personId}`, data),
  updateByCompany: (companyId, data) => api.put(`/company-responsible-person/company/${companyId}`, data),
};

// Scheduler
export const schedulerAPI = {
  getAll: () => api.get('/scheduler-setting'),
  update: (data) => api.put('/scheduler-setting', data),
};

export default api;