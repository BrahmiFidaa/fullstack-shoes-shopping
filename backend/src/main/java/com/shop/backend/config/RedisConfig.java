package com.shop.backend.config;

import org.springframework.context.annotation.Configuration;

/**
 * Configuration file - Caching disabled
 * Application runs without Redis or caching
 */
@Configuration
public class RedisConfig {
    
    // No caching beans configured
    // All database queries execute directly without caching
    
}
