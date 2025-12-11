import axios from "axios";

const BASE_URL = "http://localhost:3001/api";


export { BASE_URL };

function getAuthConfig(token) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export const createPlant = (data, token) =>
  axios.post(`${BASE_URL}/master/plant`, data, getAuthConfig(token));

export const getPlants = () => axios.get(`${BASE_URL}/master/plant`);

export const updatePlant = (id, data, token) =>
  axios.put(`${BASE_URL}/master/plant/${id}`, data, getAuthConfig(token));

export const deletePlant = (id, token) =>
  axios.delete(`${BASE_URL}/master/plant/${id}`, getAuthConfig(token));

export const createProject = (data, token) =>
  axios.post(`${BASE_URL}/master/project`, data, getAuthConfig(token));

export const getProjects = () => axios.get(`${BASE_URL}/master/project`);

export const updateProject = (id, data, token) =>
  axios.put(`${BASE_URL}/master/project/${id}`, data, getAuthConfig(token));

export const deleteProject = (id, token) =>
  axios.delete(`${BASE_URL}/master/project/${id}`, getAuthConfig(token));

export const createShop = (data, token) =>
  axios.post(`${BASE_URL}/master/shop`, data, getAuthConfig(token));

export const getShops = () => axios.get(`${BASE_URL}/master/shop`);

export const updateShop = (id, data, token) =>
  axios.put(`${BASE_URL}/master/shop/${id}`, data, getAuthConfig(token));

export const deleteShop = (id, token) =>
  axios.delete(`${BASE_URL}/master/shop/${id}`, getAuthConfig(token));

export const createLine = (data, token) =>
  axios.post(`${BASE_URL}/master/line`, data, getAuthConfig(token));

export const getLines = () => axios.get(`${BASE_URL}/master/line`);

export const updateLine = (id, data, token) =>
  axios.put(`${BASE_URL}/master/line/${id}`, data, getAuthConfig(token));

export const deleteLine = (id, token) =>
  axios.delete(`${BASE_URL}/master/line/${id}`, getAuthConfig(token));

export const createMachine = (data, token) =>
  axios.post(`${BASE_URL}/master/machine`, data, getAuthConfig(token));

export const getMachines = () => axios.get(`${BASE_URL}/master/machine`);

export const updateMachine = (id, data, token) =>
  axios.put(`${BASE_URL}/master/machine/${id}`, data, getAuthConfig(token));

export const deleteMachine = (id, token) =>
  axios.delete(`${BASE_URL}/master/machine/${id}`, getAuthConfig(token));

export const loginUser = (credentials) =>
  axios.post(`${BASE_URL}/users/login`, credentials);

export const createUser = (data, token) =>
  axios.post(`${BASE_URL}/users`, data, getAuthConfig(token));

export const getUsers = (token) =>
  axios.get(`${BASE_URL}/users`, getAuthConfig(token));

export const updateUser = (id, data, token) =>
  axios.put(`${BASE_URL}/users/${id}`, data, getAuthConfig(token));

export const deleteUser = (id, token) =>
  axios.delete(`${BASE_URL}/users/${id}`, getAuthConfig(token));

export const createTicket = (data, token) =>
  axios.post(`${BASE_URL}/tickets`, data, getAuthConfig(token));

export const getTickets = (search = '', token) =>
  axios.get(`${BASE_URL}/tickets`, {
    params: { search },
    ...getAuthConfig(token),
  });

export const getTicket = (ticketNumber, token) =>
  axios.get(`${BASE_URL}/tickets/${ticketNumber}`, getAuthConfig(token));

export const updateTicket = (ticketNumber, data, token) =>
  axios.put(`${BASE_URL}/tickets/${ticketNumber}`, data, getAuthConfig(token));

export const deleteTicket = (ticketNumber, token) =>
  axios.delete(`${BASE_URL}/tickets/${ticketNumber}`, getAuthConfig(token));

export const getTicketHistory = (ticketNumber, token) =>
  axios.get(`${BASE_URL}/tickets/${ticketNumber}/history`, getAuthConfig(token));

export const addTicketComment = (ticketNumber, formData, token) => {
  if (formData instanceof FormData) {
    return axios.post(
      `${BASE_URL}/tickets/${ticketNumber}/comments`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  } else {
    return axios.post(
      `${BASE_URL}/tickets/${ticketNumber}/comments`,
      {
        text: formData,
        userName: token,
      },
      getAuthConfig(token)
    );
  }
};

export const editTicketComment = (ticketNumber, commentId, newText, userName, token) =>
  axios.put(
    `${BASE_URL}/tickets/${ticketNumber}/history/${commentId}`,
    {
      text: newText,
      userName,
    },
    getAuthConfig(token)
  );

export const deleteTicketComment = (ticketNumber, commentId, token) =>
  axios.delete(`${BASE_URL}/tickets/${ticketNumber}/history/${commentId}`, getAuthConfig(token));

export const updateTicketRemark = (ticketNumber, remark, token) =>
  axios.put(
    `${BASE_URL}/tickets/${ticketNumber}/remark`,
    { remark },
    getAuthConfig(token)
  );

export const uploadTicketAttachments = (ticketNumber, formData, token) =>
  axios.post(`${BASE_URL}/tickets/${ticketNumber}/attachments`, formData, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
  });

export const assignTicket = (ticketNumber, developerUsername, token) =>
  axios.post(
    `${BASE_URL}/tickets/${ticketNumber}/assign`,
    { developer: developerUsername },
    getAuthConfig(token)
  );

export const updateTicketStatus = (ticketNumber, status, token) =>
  axios.put(
    `${BASE_URL}/tickets/${ticketNumber}/status`,
    { status },
    getAuthConfig(token)
  );

export const closeTicket = (ticketNumber, token) =>
  axios.post(`${BASE_URL}/tickets/${ticketNumber}/close`, null, getAuthConfig(token));

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:3001${path}`;
};
