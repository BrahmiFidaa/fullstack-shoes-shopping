package com.shop.backend.service;

import com.shop.backend.model.*;
import com.shop.backend.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED");

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    private String generateOrderNumber() {
        // Format: ORD-20251128-A3F9
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = UUID.randomUUID().toString().replace("-", "").substring(0, 4).toUpperCase();
        return "ORD-" + date + "-" + randomPart;
    }

    @Transactional
    public Order createOrder(Long userId, String shippingAddress, String phoneNumber) {
        // Validate input
        if (shippingAddress == null || shippingAddress.isBlank()) {
            throw new IllegalArgumentException("Shipping address is required");
        }
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cannot create order from empty cart");
        }

        System.out.println("[OrderService] Creating order for userId: " + userId + 
                          ", items count: " + cartItems.size());

        Order order = new Order();
        order.setUser(user);
        order.setOrderNumber(generateOrderNumber());
        order.setStatus("PENDING");
        order.setShippingAddress(shippingAddress);
        order.setPhoneNumber(phoneNumber);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        List<OrderItem> orderItems = new ArrayList<>();
        double totalAmount = 0.0;

        for (CartItem cartItem : cartItems) {
            // Get ONLY the product ID - don't use the cartItem's product at all
            Long productId = cartItem.getProduct().getId();
            
            System.out.println("[OrderService] Processing cart item - ProductId: " + productId + 
                             ", Quantity: " + cartItem.getQuantity() + ", Size: " + cartItem.getSize());
            
                // Fetch fresh product (no merge to avoid unintended persistence operations)
                Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
            
            System.out.println("[OrderService] Fetched product: " + product.getName() + 
                             ", Price: " + product.getPrice() + ", Stock: " + product.getStockQuantity());
            
            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new IllegalArgumentException(
                    String.format("Product '%s' is out of stock. Available: %d, Requested: %d",
                        product.getName(), product.getStockQuantity(), cartItem.getQuantity())
                );
            }

            int updatedStock = product.getStockQuantity() - cartItem.getQuantity();
            product.setStockQuantity(updatedStock);
            productRepository.save(product);
            
            // Create NEW OrderItem using productId (no entity association)
            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(productId);
            orderItem.setSize(cartItem.getSize());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(product.getPrice());
            
            double subtotal = product.getPrice() * cartItem.getQuantity();
            orderItem.setSubtotal(subtotal);
            
            orderItems.add(orderItem);
            totalAmount += subtotal;
            
            System.out.println("[OrderService] Created OrderItem - Subtotal: " + subtotal);
        }

        order.setTotalAmount(totalAmount);
        
        // Save order first
        Order savedOrder = orderRepository.save(order);
        
        // Now associate and save each OrderItem with the saved order
        List<OrderItem> savedItems = new ArrayList<>();
        for (OrderItem item : orderItems) {
            item.setOrder(savedOrder);
            OrderItem savedItem = orderItemRepository.save(item);
            savedItems.add(savedItem);
        }
        
        // Set the saved items on the order for the response
        savedOrder.setItems(savedItems);
        System.out.println("[OrderService] ✅ Order created with number: " + savedOrder.getOrderNumber());

        // Clear cart after successful order creation
        cartItemRepository.deleteByUserId(userId);

        return savedOrder;
    }

    public List<Order> getUserOrders(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order updateOrderStatus(Long orderId, String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }
        if (!ALLOWED_STATUSES.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status.toUpperCase());
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }
}
