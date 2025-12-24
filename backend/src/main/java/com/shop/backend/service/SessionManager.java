package com.shop.backend.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Session management service for tracking user activity and sessions
 * Simple in-memory implementation using basic lists
 */
@Service
public class SessionManager {
    
    // In-memory session storage using simple records
    private final List<SessionRecord> sessions = new ArrayList<>();
    
    /**
     * Create or update user session
     */
    public void createSession(Long userId, String token) {
        long now = System.currentTimeMillis();
        SessionRecord record = findRecord(userId);
        if (record == null) {
            record = new SessionRecord();
            record.setUserId(userId);
            sessions.add(record);
        }
        record.setToken(token);
        record.setCreatedAt(now);
        record.setLastActivity(now);
        System.out.println("[Session] ✅ Session created for user: " + userId);
    }
    
    /**
     * Get user session data
     */
    public SessionRecord getSession(Long userId) {
        SessionRecord record = findRecord(userId);
        if (record != null) {
            updateActivityTimestamp(userId);
            System.out.println("[Session] ✅ Retrieved session for user: " + userId);
        } else {
            System.out.println("[Session] ⚠️ No session found for user: " + userId);
        }
        return record;
    }
    
    /**
     * Validate if user session exists and is valid
     */
    public boolean isSessionValid(Long userId) {
        return findRecord(userId) != null;
    }
    
    /**
     * Update last activity timestamp
     */
    public void updateActivityTimestamp(Long userId) {
        SessionRecord record = findRecord(userId);
        if (record != null) {
            record.setLastActivity(System.currentTimeMillis());
        }
    }
    
    /**
     * Log user activity
     */
    public void logActivity(Long userId, String action, String details) {
        System.out.println("[Activity] User " + userId + " - " + action + ": " + details);
    }
    
    /**
     * Invalidate user session (logout)
     */
    public void invalidateSession(Long userId) {
        Iterator<SessionRecord> iterator = sessions.iterator();
        while (iterator.hasNext()) {
            if (iterator.next().getUserId().equals(userId)) {
                iterator.remove();
                break;
            }
        }
        System.out.println("[Session] ✅ Session invalidated for user: " + userId);
    }
    
    /**
     * Get all active sessions count
     */
    public Long getActiveSessions() {
        return (long) sessions.size();
    }
    
    /**
     * Get user activity logs
     */
    public String[] getUserActivityLogs(Long userId, int limit) {
        return new String[0];
    }

    private SessionRecord findRecord(Long userId) {
        for (SessionRecord record : sessions) {
            if (record.getUserId().equals(userId)) {
                return record;
            }
        }
        return null;
    }

    public static class SessionRecord {
        private Long userId;
        private String token;
        private long createdAt;
        private long lastActivity;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public long getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(long createdAt) {
            this.createdAt = createdAt;
        }

        public long getLastActivity() {
            return lastActivity;
        }

        public void setLastActivity(long lastActivity) {
            this.lastActivity = lastActivity;
        }
    }
}
