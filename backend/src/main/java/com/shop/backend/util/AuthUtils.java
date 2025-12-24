package com.shop.backend.util;

import jakarta.servlet.http.HttpServletRequest;

public class AuthUtils {
    
    public static Long getUserId(HttpServletRequest request) {
        Object userIdAttr = request.getAttribute("userId");
        if (userIdAttr instanceof Long) {
            return (Long) userIdAttr;
        }
        if (userIdAttr instanceof Integer) {
            return ((Integer) userIdAttr).longValue();
        }
        return null;
    }

    public static String getUsername(HttpServletRequest request) {
        Object usernameAttr = request.getAttribute("username");
        return usernameAttr != null ? usernameAttr.toString() : null;
    }

    public static boolean isLocalhostRequest(HttpServletRequest request) {
        Object isLocalhostAttr = request.getAttribute("isLocalhost");
        return isLocalhostAttr != null && (Boolean) isLocalhostAttr;
    }
}
