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
public class TaskResponse {
    private UUID id;
    private String title;
    private String category;
    private String colorHex;
    private int dailyTargetMinutes;
    @com.fasterxml.jackson.annotation.JsonProperty("isArchived")
    @com.fasterxml.jackson.annotation.JsonAlias("archived")
    private boolean isArchived;
    private int sortOrder;
    private Instant createdAt;
    private Instant updatedAt;

    // Computed Daily HUD Telemetry
    private int todayFocusSeconds;
    private int todayFocusMinutes;
    private double progressPercentage;
    private int deficitOrSurplusMinutes; // negative if deficit, positive if surplus
    private String latestCheckpointNote;
}

