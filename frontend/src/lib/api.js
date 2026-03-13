import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

export const getAdminToken = () => localStorage.getItem("tailor_admin_token") || "";

export const authHeaders = () => ({
  Authorization: `Bearer ${getAdminToken()}`,
});
