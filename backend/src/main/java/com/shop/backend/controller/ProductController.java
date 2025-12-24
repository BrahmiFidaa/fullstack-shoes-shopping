package com.shop.backend.controller;


import com.shop.backend.model.Product;
import com.shop.backend.model.User;
import com.shop.backend.service.ProductService;
import com.shop.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ProductController {
    
    @Autowired
    private ProductService productService;

    @Autowired
    private UserRepository userRepository;
    
    @GetMapping
    public List<Product> getAllProducts(HttpServletRequest request) {
        // User context available in request attributes if needed
        return productService.getAllProducts();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id, HttpServletRequest request) {
        return productService.getProductById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<?> createProduct(@RequestAttribute(required = false) Long userId,
                                           @RequestBody Product product) {
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getIsAdmin())) {
            return ResponseEntity.status(403).body("Admin privileges required");
        }
        Product saved = productService.saveProduct(product);
        return ResponseEntity.ok(saved);
    }
}