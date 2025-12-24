import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../services/api';
import { logout } from './authSlice';

const extractError = (error) => error?.response?.data?.error || error?.message || 'Unknown error';

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    console.log('[Cart] Fetching cart...');
    const userId = getState().auth.user?.user?.id;
    if (!userId) {
      console.log('[Cart] No authenticated user, returning empty cart');
      return [];
    }
    try {
      const response = await cartAPI.getCart();
      console.log('[Cart] ✅ Cart fetched successfully, items:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.warn('[Cart] ❌ Failed to fetch cart:', extractError(error));
      return rejectWithValue(extractError(error));
    }
  }
);

export const addToCartAsync = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, size, quantity }, { getState, rejectWithValue }) => {
    console.log('[Cart] Adding to cart:', { productId, size, quantity });
    const userId = getState().auth.user?.user?.id;
    if (!userId) {
      return rejectWithValue('You must be logged in to add items to the cart');
    }
    try {
      const response = await cartAPI.addToCart(productId, size, quantity);
      console.log('[Cart] ✅ Item added to cart successfully');
      return response.data;
    } catch (error) {
      console.warn('[Cart] ❌ Failed to add item:', extractError(error));
      return rejectWithValue(extractError(error));
    }
  }
);

export const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCart',
  async (id, { rejectWithValue }) => {
    try {
      await cartAPI.removeFromCart(id);
      return id;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const updateQuantityAsync = createAsyncThunk(
  'cart/updateQuantity',
  async ({ id, quantity }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.updateQuantity(id, quantity);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

export const increaseQuantityAsync = createAsyncThunk(
  'cart/increaseQuantity',
  async (cartItemId, { getState, rejectWithValue }) => {
    const state = getState();
    const cartItem = state.cart.items.find(item => item.id === cartItemId);
    if (cartItem) {
      const newQuantity = cartItem.quantity + 1;
      try {
        const response = await cartAPI.updateQuantity(cartItemId, newQuantity);
        return response.data;
      } catch (error) {
        return rejectWithValue(extractError(error));
      }
    }
    return rejectWithValue('Cart item not found');
  }
);

export const decreaseQuantityAsync = createAsyncThunk(
  'cart/decreaseQuantity',
  async (cartItemId, { getState, rejectWithValue }) => {
    const state = getState();
    const cartItem = state.cart.items.find(item => item.id === cartItemId);
    if (cartItem) {
      const newQuantity = Math.max(1, cartItem.quantity - 1);
      try {
        const response = await cartAPI.updateQuantity(cartItemId, newQuantity);
        return response.data;
      } catch (error) {
        return rejectWithValue(extractError(error));
      }
    }
    return rejectWithValue('Cart item not found');
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.error = null;
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(updateQuantityAsync.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.items.findIndex(item => item.id === action.payload.id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
        } else {
          // Item was removed (quantity was 0)
          state.items = state.items.filter(item => item.id !== action.meta.arg.id);
        }
        state.error = null;
      })
      .addCase(updateQuantityAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(increaseQuantityAsync.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.items.findIndex(item => item.id === action.payload.id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(increaseQuantityAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(decreaseQuantityAsync.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.items.findIndex(item => item.id === action.payload.id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(decreaseQuantityAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(logout, (state) => {
        state.items = [];
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;