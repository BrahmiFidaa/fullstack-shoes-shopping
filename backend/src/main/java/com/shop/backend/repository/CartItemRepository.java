package com.shop.backend.repository;
import com.shop.backend.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserId(Long userId);
    void deleteByUserId(Long userId);
    
    // For deduplication: find if same product+size already in user's cart
    Optional<CartItem> findByUserIdAndProductIdAndSize(Long userId, Long productId, Integer size);

    Optional<CartItem> findByIdAndUserId(Long id, Long userId);
}
