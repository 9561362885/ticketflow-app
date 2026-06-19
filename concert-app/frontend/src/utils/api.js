import axios from 'axios';

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/api` });

export const getConcerts  = ()          => api.get('/concerts').then(r => r.data);
export const getConcert   = (id)        => api.get(`/concerts/${id}`).then(r => r.data);
export const addConcert   = (data)      => api.post('/concerts', data).then(r => r.data);
export const createBooking = (data)     => api.post('/bookings', data).then(r => r.data);
export const getBookings  = ()          => api.get('/bookings').then(r => r.data);
export const updateStage  = (id, stage) => api.patch(`/bookings/${id}/stage`, { stage }).then(r => r.data);
