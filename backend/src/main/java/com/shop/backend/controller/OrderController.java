package com.shop.backend.controller;

import com.shop.backend.dto.ErrorResponse;
import com.shop.backend.model.Order;
import com.shop.backend.model.User;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestAttribute(required = false) Long userId,
                                         @RequestBody CreateOrderRequest request) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Unauthorized"));
        }
        if (request.getShippingAddress() == null || request.getShippingAddress().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("shippingAddress is required"));
        }
        if (request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("phoneNumber is required"));
        }
        try {
            Order order = orderService.createOrder(
                userId,
                request.getShippingAddress(),
                request.getPhoneNumber()
            );
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("Failed to create order: " + ex.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrders(@PathVariable Long userId,
                                         @RequestAttribute(required = false) Long requesterId) {
        if (requesterId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Unauthorized"));
        }
        if (!requesterId.equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("Cannot view other users' orders"));
        }
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }

    @GetMapping
    public ResponseEntity<?> getAllOrders(@RequestAttribute(required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Unauthorized"));
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getIsAdmin())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("Admin privileges required"));
        }
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestAttribute(required = false) Long userId,
                                          @RequestParam String status) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Unauthorized"));
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("User not found"));
        }
        if (!Boolean.TRUE.equals(user.getIsAdmin())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("Admin privileges required to update status"));
        }
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("status is required"));
        }
        try {
            return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }
}

class CreateOrderRequest {
    private String shippingAddress;
    private String phoneNumber;
    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
}
