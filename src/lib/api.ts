import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Table types
export interface Table {
  id: string;
  table_number: string;
  min_capacity: number;
  max_capacity: number;
  is_shared: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
  x?: number;
  y?: number;
}

export interface TableCreate {
  table_number: string;
  min_capacity: number;
  max_capacity: number;
  is_shared: boolean;
  location: string | null;
}

// Hours types
export interface RestaurantHours {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  last_reservation_time: string;
}

export interface RestaurantHoursCreate {
  day_of_week: number;
  open_time: string;
  close_time: string;
  last_reservation_time: string;
}

// Tables API
export const getTables = async (): Promise<Table[]> => {
  const response = await api.get('/tables');
  return response.data;
};

export const createTable = async (table: TableCreate): Promise<Table> => {
  const response = await api.post('/tables', table);
  return response.data;
};

export const updateTable = async (id: string, table: TableCreate): Promise<Table> => {
  const response = await api.put(`/tables/${id}`, table);
  return response.data;
};

export const deleteTable = async (id: string): Promise<void> => {
  await api.delete(`/tables/${id}`);
};

// Hours API
export const getHours = async (): Promise<RestaurantHours[]> => {
  const response = await api.get('/hours');
  return response.data;
};

export const setHours = async (hours: RestaurantHoursCreate): Promise<RestaurantHours> => {
  const response = await api.put('/hours', hours);
  return response.data;
};

export default api;