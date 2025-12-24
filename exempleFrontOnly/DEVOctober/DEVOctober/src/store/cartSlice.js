import { createSlice } from '@reduxjs/toolkit';
import cartData from '../data/cart';

const initialState = {
  items: cartData,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, size = 42 } = action.payload;
      console.log('Redux cartSlice.addToCart called with:', { product, quantity, size });

      // Check if product with same id and size already exists
      const existingIndex = state.items.findIndex(
        (i) => i.product?.id === product.id && i.size === size
      );

      if (existingIndex > -1) {
        console.log('Product exists at index', existingIndex, ', incrementing quantity');
        state.items[existingIndex].quantity += quantity;
      } else {
        console.log('Adding new product to cart');
        state.items.unshift({ product, size, quantity });
      }

      console.log('Cart state after add:', state.items);
    },

    increaseQuantity: (state, action) => {
      const productId = action.payload;
      console.log('Redux increaseQuantity called for productId:', productId);

      const item = state.items.find((i) => i.product?.id === productId);
      if (item) {
        item.quantity += 1;
        console.log('Increased quantity for product', productId, 'new quantity:', item.quantity);
      }
    },

    decreaseQuantity: (state, action) => {
      const productId = action.payload;
      console.log('Redux decreaseQuantity called for productId:', productId);

      state.items = state.items
        .map((i) => (i.product?.id === productId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);

      console.log('Cart state after decrease:', state.items);
    },
  },
});

export const { addToCart, increaseQuantity, decreaseQuantity } = cartSlice.actions;
export default cartSlice.reducer;
