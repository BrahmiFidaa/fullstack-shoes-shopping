package com.shop.backend.repository;

import com.shop.backend.model.AppLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LogRepository extends JpaRepository<AppLog, Long> {
    List<AppLog> findByUserId(Long userId);
    List<AppLog> findByAction(String action);
}
