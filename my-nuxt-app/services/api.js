import axios from 'axios'

const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://deals.ishay.me/api/v1'
  : 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL,
  withCredentials: true,
})

export default api