package com.shop.backend.security;

import com.shop.backend.config.JwtTokenProvider;
import com.shop.backend.model.User;
import com.shop.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String host = request.getRemoteHost();
        String remoteAddr = request.getRemoteAddr();
        String requestURI = request.getRequestURI();

        // Check if request is from localhost
        boolean isLocalhost = isLocalhostRequest(remoteAddr, host);
        Long userId = null;

        // Check if request has Authorization header
        String authHeader = request.getHeader("Authorization");
        boolean hasToken = authHeader != null && authHeader.startsWith("Bearer ");

        if (hasToken) {
            String token = authHeader.substring(7);
            
            if (!jwtTokenProvider.validateToken(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\": \"Invalid token\"}");
                return false;
            }

            userId = jwtTokenProvider.getUserIdFromToken(token);
            String username = jwtTokenProvider.getUsernameFromToken(token);

            request.setAttribute("userId", userId);
            request.setAttribute("username", username);
        } else if (isLocalhost) {
            // For localhost without token, allow all requests and set default user context
            userId = 1L; // Default admin user ID
            request.setAttribute("userId", userId);
            request.setAttribute("username", "admin");
            request.setAttribute("isLocalhost", true);
        } else {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"Missing or invalid authorization header\"}");
            return false;
        }

        // Enforce Admin Role for /api/admin/** endpoints
        if (requestURI.startsWith("/api/admin")) {
            if (userId == null) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return false;
            }

            User user = userRepository.findById(userId).orElse(null);
            if (user == null || !Boolean.TRUE.equals(user.getIsAdmin())) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("{\"error\": \"Access Denied: Admin privileges required\"}");
                return false;
            }
        }

        return true;
    }

    private boolean isLocalhostRequest(String remoteAddr, String host) {
        // Allow localhost and private network IPs for development
        // In production, remove the private IP ranges
        return remoteAddr != null && (
            remoteAddr.equals("127.0.0.1") ||
            remoteAddr.equals("0:0:0:0:0:0:0:1") ||
            remoteAddr.startsWith("127.") ||
            remoteAddr.equals("localhost") ||
            remoteAddr.startsWith("192.168.") ||  // Private network (hotspot/WiFi)
            remoteAddr.startsWith("10.") ||       // Private network
            remoteAddr.startsWith("172.16.") ||   // Private network
            host != null && host.equals("localhost")
        );
    }
}
