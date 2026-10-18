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
public class SessionResponse {
    private UUID id;
    private UUID taskId;
    private String taskTitle;
    private String taskColorHex;
    private String sessionType;
    private Instant startTime;
    private Instant endTime;
    private int durationSeconds;
    @com.fasterxml.jackson.annotation.JsonProperty("isCompleted")
    @com.fasterxml.jackson.annotation.JsonAlias("completed")
    private boolean isCompleted;
    private Instant createdAt;
}

