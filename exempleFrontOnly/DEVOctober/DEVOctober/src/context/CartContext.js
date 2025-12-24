import React, { createContext, useState } from 'react';
import cartData from '../data/cart';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(cartData);

  const addToCart = (product, quantity = 1, size = 42) => {
    console.log('CartContext.addToCart called with:', { product, quantity, size });
    
    setItems(curr => {
      console.log('Current items before add:', curr);
      
      // Check if product with same id and size already exists
      const exists = curr.find(i => i.product?.id === product.id && i.size === size);
      
      if (exists) {
        console.log('Product exists, incrementing quantity');
        // Increment quantity if it exists
        const updated = curr.map(i =>
          i.product?.id === product.id && i.size === size 
            ? { ...i, quantity: i.quantity + quantity } 
            : i
        );
        console.log('Updated items:', updated);
        return updated;
      }

      // Otherwise add new item
      console.log('Adding new product to cart');
      const updated = [{ product, size, quantity }, ...curr];
      console.log('Updated items:', updated);
      return updated;
    });
  };

  const increaseQuantity = (productId) => {
    setItems(curr =>
      curr.map(i => (i.product?.id === productId ? { ...i, quantity: i.quantity + 1 } : i))
    );
  };

  const decreaseQuantity = (productId) => {
    setItems(curr =>
      curr
        .map(i => (i.product?.id === productId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter(i => i.quantity > 0)
    );
  };

  return (
    <CartContext.Provider value={{ items, addToCart, increaseQuantity, decreaseQuantity }}>
      {children}
    </CartContext.Provider>
  );
};
