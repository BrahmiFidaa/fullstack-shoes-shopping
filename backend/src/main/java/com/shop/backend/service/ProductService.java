package com.shop.backend.service;

import com.shop.backend.model.Product;
import com.shop.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    /**
     * Get all products
     */
    public List<Product> getAllProducts() {
        System.out.println("[ProductService] Fetching all products from database");
        return productRepository.findAll();
    }
    
    /**
     * Get product by ID
     */
    public Optional<Product> getProductById(Long id) {
        System.out.println("[ProductService] Fetching product " + id + " from database");
        return productRepository.findById(id);
    }
    
    /**
     * Save product
     */
    public Product saveProduct(Product product) {
        System.out.println("[ProductService] Saving product: " + product.getName());
        return productRepository.save(product);
    }
    
    /**
     * Update product
     */
    public Product updateProduct(Long id, Product productDetails) {
        Optional<Product> product = productRepository.findById(id);
        if (product.isPresent()) {
            Product p = product.get();
            if (productDetails.getName() != null) p.setName(productDetails.getName());
            if (productDetails.getDescription() != null) p.setDescription(productDetails.getDescription());
            if (productDetails.getPrice() != null) p.setPrice(productDetails.getPrice());
            if (productDetails.getStockQuantity() != null) p.setStockQuantity(productDetails.getStockQuantity());
            System.out.println("[ProductService] Updating product: " + p.getName());
            return productRepository.save(p);
        }
        return null;
    }
    
    /**
     * Delete product
     */
    public void deleteProduct(Long id) {
        System.out.println("[ProductService] Deleting product: " + id);
        productRepository.deleteById(id);
    }
}