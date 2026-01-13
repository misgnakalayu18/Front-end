import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Define the user type
export type TUser = {
  _id: string;
  email: string;
  exp: number;
  iat: number;
  role: string; // Added role to align with Sidebar logic
};

// Define the initial state structure
interface InitialState {
  user: null | TUser;
  token: null | string;
}

const initialState: InitialState = {
  user: null,
  token: null,
};

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginUser: (state, action: PayloadAction<{ token: string; user: TUser }>) => {
      state.user = action.payload.user; // Set user data, including role
      state.token = action.payload.token; // Set token
    },
    logoutUser: (state) => {
      state.user = null; // Clear user data
      state.token = null; // Clear token
    },
  },
});

// Export actions
export const { loginUser, logoutUser } = authSlice.actions;

// Export the reducer
export default authSlice.reducer;

// Selector to get the current user
export const getCurrentUser = (state: RootState) => state.auth.user;

// Selector to get the current token
export const getCurrentToken = (state: RootState) => state.auth.token;
