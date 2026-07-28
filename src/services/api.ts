import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api/modu-high'

export const api = axios.create({ baseURL: BASE })
