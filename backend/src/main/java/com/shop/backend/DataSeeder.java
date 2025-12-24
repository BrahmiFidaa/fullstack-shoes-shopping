package com.shop.backend;



import com.shop.backend.model.Product;
import com.shop.backend.model.User;
import com.shop.backend.repository.ProductRepository;
import com.shop.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;

@Configuration
public class DataSeeder {
    
    @Bean
    CommandLineRunner initDatabase(ProductRepository productRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed Admin User
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setEmail("admin@example.com");
                admin.setFirstName("Admin");
                admin.setLastName("User");
                admin.setIsAdmin(true);
                userRepository.save(admin);
                System.out.println("Admin user created: admin / admin123");
            }

            // Seed Test User (admin for testing)
            if (userRepository.findByUsername("testuser").isEmpty()) {
                User testUser = new User();
                testUser.setUsername("testuser");
                testUser.setPassword(passwordEncoder.encode("password123"));
                testUser.setEmail("testuser@example.com");
                testUser.setFirstName("Test");
                testUser.setLastName("User");
                testUser.setPhone("1234567890");
                testUser.setIsAdmin(true);  // Make testuser an admin for testing
                userRepository.save(testUser);
                System.out.println("Test user created: testuser / password123 (Admin)");
            }

            if (productRepository.count() == 0) {
                Product p1 = new Product();
                p1.setName("Wild Berry Runner");
                p1.setPrice(160.0);
                p1.setImage("https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike1.png");
                p1.setDescription("Lightweight performance shoe with breathable mesh upper.");
                p1.setSizes(Arrays.asList(39, 40, 41, 42, 43));
                p1.setImages(Arrays.asList(
                        "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike1.png",
                        "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike1_1.png"
                ));

                Product p2 = new Product();
                p2.setName("Trail Grip");
                p2.setPrice(120.0);
                p2.setImage("https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike2.png");
                p2.setDescription("Durable outsole for rugged terrain with cushioned midsole.");
                p2.setSizes(Arrays.asList(40, 41, 42, 43, 44));
                p2.setImages(Arrays.asList(
                        "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike2.png"
                ));

                Product p3 = new Product();
                p3.setName("City Sneaker");
                p3.setPrice(85.0);
                p3.setImage("https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike3.png");
                p3.setDescription("Casual everyday comfort with minimalist styling.");
                p3.setSizes(Arrays.asList(38, 39, 40, 41, 42));
                p3.setImages(Arrays.asList(
                        "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike3.png"
                ));

                productRepository.saveAll(Arrays.asList(p1, p2, p3));
                System.out.println("Seeded 3 products");
            }
        };
    }
}