import axios from 'axios'

const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://saversonic.com/api/v1'
  : 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

export default api
