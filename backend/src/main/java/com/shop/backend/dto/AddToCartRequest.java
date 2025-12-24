package com.shop.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class AddToCartRequest {
    @NotNull(message = "Product ID is required")
    @Min(value = 1, message = "Product ID must be greater than 0")
    private Long productId;
    
    @NotNull(message = "Size is required")
    @Min(value = 36, message = "Size must be between 36 and 50")
    @Max(value = 50, message = "Size must be between 36 and 50")
    private Integer size;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 100, message = "Cannot add more than 100 items at once")
    private Integer quantity;
}