package com.pomofocus.pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String email;
    private String username;
    private String authProvider;
    private String avatarUrl;
    @com.fasterxml.jackson.annotation.JsonProperty("isVerified")
    @com.fasterxml.jackson.annotation.JsonAlias("verified")
    private boolean isVerified;
    private Instant createdAt;
}

