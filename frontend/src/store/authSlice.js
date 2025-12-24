import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI, setAuthToken, clearAuthToken, getAuthToken } from '../services/api';

export const restoreAuth = createAsyncThunk(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    console.log('[Auth] Starting token restoration...');
    try {
      const token = await getAuthToken();
      if (token) {
        console.log('[Auth] Token found in storage:', token.substring(0, 30) + '...');
        // Validate token by fetching user profile
        console.log('[Auth] Validating token with /auth/profile endpoint...');
        const response = await authAPI.getProfile();
        console.log('[Auth] ✅ Token restored successfully, user:', response.data.user?.username);
        return response.data;
      }
      console.warn('[Auth] ⚠️ No token found in storage');
      return rejectWithValue('No token found');
    } catch (error) {
      console.error('[Auth] ❌ Token restore failed:', error.response?.data || error.message);
      console.log('[Auth] Clearing invalid token from storage...');
      // Clear invalid token
      await clearAuthToken();
      return rejectWithValue('Invalid token');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(username, password);
      // Store token in AsyncStorage
      if (response.data?.token) {
        await setAuthToken(response.data.token);
        console.log('[Auth] Token stored successfully');
      }
      return response.data;
    } catch (error) {
      console.error('[Auth] Login error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Login failed');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.signup(userData);
      // Store token in AsyncStorage
      if (response.data?.token) {
        await setAuthToken(response.data.token);
        console.log('[Auth] Token stored successfully');
      }
      return response.data;
    } catch (error) {
      console.error('[Auth] Signup error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Signup failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      // Clear token from storage
      clearAuthToken().catch(err => console.error('[Auth] Error clearing token:', err));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Restore auth
      .addCase(restoreAuth.fulfilled, (state, action) => {
        console.log('[Auth Reducer] restoreAuth.fulfilled - User:', action.payload.user?.username);
        state.isAuthenticated = true;
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(restoreAuth.rejected, (state) => {
        console.log('[Auth Reducer] restoreAuth.rejected - No valid token');
        state.isAuthenticated = false;
        state.user = null;
        state.loading = false;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        console.log('[Auth Reducer] loginUser.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('[Auth Reducer] loginUser.fulfilled - User:', action.payload.user?.username);
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log('[Auth Reducer] loginUser.rejected - Error:', action.payload);
        state.loading = false;
        state.error = action.payload;
      })
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
