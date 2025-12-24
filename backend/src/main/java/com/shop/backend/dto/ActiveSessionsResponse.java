package com.shop.backend.dto;

public class ActiveSessionsResponse {
    private Long activeSessions;

    public ActiveSessionsResponse() {
    }

    public ActiveSessionsResponse(Long activeSessions) {
        this.activeSessions = activeSessions;
    }

    public Long getActiveSessions() {
        return activeSessions;
    }

    public void setActiveSessions(Long activeSessions) {
        this.activeSessions = activeSessions;
    }
}
