package com.shop.backend.service;


import com.shop.backend.model.CartItem;
import com.shop.backend.model.Product;
import com.shop.backend.repository.CartItemRepository;
import com.shop.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CartService {
    
    @Autowired
    private CartItemRepository cartItemRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    /**
     * Get all cart items for a user
     */
    public List<CartItem> getAllCartItems(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User id is required to fetch cart");
        }
        System.out.println("[CartService] Fetching cart for user " + userId + " from database");
        return cartItemRepository.findByUserId(userId);
    }
    
    /**
     * Add to cart
     */
    public CartItem addToCart(Long productId, Integer size, Integer quantity, Long userId) {
        System.out.println("[CartService] Adding to cart - userId: " + userId + ", productId: " + productId + 
                          ", size: " + size + ", quantity: " + quantity);
        // Validate product exists
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + productId));
        
        // Check stock availability
        if (product.getStockQuantity() < quantity) {
            throw new IllegalArgumentException(
                String.format("Insufficient stock. Available: %d, Requested: %d", 
                    product.getStockQuantity(), quantity)
            );
        }
        
        // Check for duplicate: same user, product, and size
        Optional<CartItem> existingItem = cartItemRepository.findByUserIdAndProductIdAndSize(userId, productId, size);
        
        if (existingItem.isPresent()) {
            // Merge quantities instead of creating duplicate
            CartItem item = existingItem.get();
            int newQuantity = item.getQuantity() + quantity;
            
            // Validate total quantity doesn't exceed stock
            if (newQuantity > product.getStockQuantity()) {
                throw new IllegalArgumentException(
                    String.format("Cannot add more items. Stock available: %d, Current in cart: %d, Requested: %d",
                        product.getStockQuantity(), item.getQuantity(), quantity)
                );
            }
            
            item.setQuantity(newQuantity);
            System.out.println("[CartService] ✅ Merged quantities for existing item: " + item.getId());
            return cartItemRepository.save(item);
        }
        
        // Create new cart item if not exists
        CartItem cartItem = new CartItem();
        cartItem.setProduct(product);
        cartItem.setSize(size);
        cartItem.setQuantity(quantity);
        cartItem.setUserId(userId);
        
        System.out.println("[CartService] ✅ Created new cart item");
        return cartItemRepository.save(cartItem);
    }
    
    /**
     * Remove from cart
     */
    public void removeFromCart(Long userId, Long cartItemId) {
        if (userId == null) {
            throw new IllegalArgumentException("User id is required to remove cart items");
        }
        System.out.println("[CartService] Removing cart item: " + cartItemId + " for user: " + userId);
        CartItem cartItem = cartItemRepository.findByIdAndUserId(cartItemId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));
        cartItemRepository.delete(cartItem);
        System.out.println("[CartService] ✅ Removed cart item: " + cartItemId);
    }
    
    /**
     * Update cart quantity
     */
    public CartItem updateQuantity(Long userId, Long cartItemId, Integer quantity) {
        if (userId == null) {
            throw new IllegalArgumentException("User id is required to update cart items");
        }
        System.out.println("[CartService] Updating quantity for cart item: " + cartItemId + ", new quantity: " + quantity);
        CartItem cartItem = cartItemRepository.findByIdAndUserId(cartItemId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));
        
        // Check stock availability
        Product product = cartItem.getProduct();
        if (product.getStockQuantity() < quantity) {
            throw new IllegalArgumentException(
                String.format("Insufficient stock. Available: %d, Requested: %d", 
                    product.getStockQuantity(), quantity)
            );
        }
        
        if (quantity <= 0) {
            cartItemRepository.delete(cartItem);
            System.out.println("[CartService] ✅ Deleted cart item (quantity was 0 or negative): " + cartItemId);
            return null;
        }
        
        cartItem.setQuantity(quantity);
        System.out.println("[CartService] ✅ Updated cart item quantity to: " + quantity);
        return cartItemRepository.save(cartItem);
    }
}