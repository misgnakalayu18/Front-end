export interface IUser {
  name: string;
  email: string;
  title?: string;
  description?: string;
  role: string;
  avatar?: string;
  password: string;
  status: string;
  address?: string;
  phone?: string;
  country?: string;
}

export const profileKeys = [
  { keyName: 'name' },
  { keyName: 'email' },
  { keyName: 'title' },
  { keyName: 'description' },
  { keyName: 'status' },
  { keyName: 'role' },
  { keyName: 'address' },
  { keyName: 'phone' },
  { keyName: 'country' },
]

export const profileInputFields = [
  { id: 1, name: 'name', label: 'Name' },
  { id: 2, name: 'email', label: 'Email' },
  { id: 3, name: 'title', label: 'Title' },
  { id: 4, name: 'description', label: 'Description' },
  { id: 7, name: 'address', label: 'Address' },
  { id: 8, name: 'phone', label: 'Phone' },
  { id: 10, name: 'country', label: 'Country' },
]