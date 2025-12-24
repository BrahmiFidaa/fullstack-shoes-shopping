package com.shop.backend.dto;

import com.shop.backend.model.User;

public class UserResponse {
    private User user;

    public UserResponse() {
    }

    public UserResponse(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
