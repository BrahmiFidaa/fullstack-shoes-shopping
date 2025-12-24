import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productAPI } from '../services/api';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[products] fetch started');
      const response = await productAPI.getAll();
      console.log('[products] fetch success count=', Array.isArray(response.data) ? response.data.length : 'n/a');
      return response.data;
    } catch (err) {
      console.log('[products] fetch error', err?.message);
      return rejectWithValue(err?.message || 'Fetch failed');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default productsSlice.reducer;