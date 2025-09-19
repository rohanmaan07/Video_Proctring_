// src/util/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://videoproctoring.onrender.com", 
  withCredentials: true,
});

export default api;
