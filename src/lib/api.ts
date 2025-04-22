import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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

// Special Hours types
export interface SpecialHours {
  id: string;
  date: string;
  name: string;
  description: string | null;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  last_reservation_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpecialHoursCreate {
  date: string;
  name: string;
  description?: string | null;
  is_closed: boolean;
  open_time?: string | null;
  close_time?: string | null;
  last_reservation_time?: string | null;
}

// Reservation types
export interface ReservationCreate {
  party_size: number;
  reservation_date: string;
  start_time: string;
  duration_minutes: number;
  notes?: string;
  status?: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
  table_ids: string[];
}

export interface AvailabilityRequest {
  party_size: number;
  reservation_date: string;
  start_time: string;
  duration_minutes: number;
}

// Tables API
export const getTables = async (): Promise<Table[]> => {
  try {
    const response = await api.get('/tables');
    return response.data;
  } catch (error) {
    console.error('Error fetching tables:', error);
    return [];
  }
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
  try {
    const response = await api.get('/hours');
    return response.data;
  } catch (error) {
    console.error('Error fetching hours:', error);
    return [];
  }
};

export const setHours = async (hours: RestaurantHoursCreate): Promise<RestaurantHours> => {
  const response = await api.put('/hours', hours);
  return response.data;
};

// Special Hours API
export const getSpecialHours = async (
  dateFrom?: string,
  dateTo?: string
): Promise<SpecialHours[]> => {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    
    const url = '/special-hours' + (params.toString() ? `?${params.toString()}` : '');
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching special hours:', error);
    return [];
  }
};

export const getSpecialHoursByDate = async (
  date: string
): Promise<SpecialHours | null> => {
  try {
    console.log(`Fetching special hours for date: ${date}`);
    const response = await api.get(`/special-hours/${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching special hours:', error);
    return null;
  }
};

export const setSpecialHours = async (
  hours: SpecialHoursCreate
): Promise<SpecialHours> => {
  const response = await api.put('/special-hours', hours);
  return response.data;
};

export const deleteSpecialHours = async (id: string): Promise<void> => {
  await api.delete(`/special-hours/${id}`);
};

// Reservation API
export const getReservations = async (params: any): Promise<any[]> => {
  try {
    const response = await api.get('/reservations', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
};

export const getReservation = async (id: string): Promise<any> => {
  const response = await api.get(`/reservations/${id}`);
  return response.data;
};

export const createReservation = async (reservation: ReservationCreate): Promise<any> => {
  try {
    const response = await api.post('/reservations', reservation);
    return response.data;
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    if (error.response) {
      throw new Error(`Server error: ${error.response.status} - ${
        error.response.data?.detail || 'Unknown error'
      }`);
    } else if (error.request) {
      throw new Error('No response from server. Network issue or server down.');
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
};

export const updateReservationStatus = async (id: string, status: string): Promise<any> => {
  try {
    const response = await api.patch(`/reservations/${id}/status?status=${status}`);
    return response.data;
  } catch (error) {
    console.error('Error updating reservation status:', error);
    throw error;
  }
};

export const deleteReservation = async (id: string): Promise<void> => {
  try {
    await api.delete(`/reservations/${id}`);
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
};

// Availability API
export const checkAvailability = async (request: AvailabilityRequest): Promise<any> => {
  try {
    const response = await api.post('/availability', request);
    return response.data;
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
};

export default api;
