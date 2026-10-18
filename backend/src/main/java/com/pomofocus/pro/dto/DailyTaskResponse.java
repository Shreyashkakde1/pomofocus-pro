package com.pomofocus.pro.dto;

import com.pomofocus.pro.entity.PriorityTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTaskResponse {

    private UUID id;
    private UUID targetId;
    private String targetTitle;
    private String targetColorHex;
    private String title;
    private PriorityTier priorityTier;
    private LocalDate plannedDate;
    @com.fasterxml.jackson.annotation.JsonProperty("isCompleted")
    @com.fasterxml.jackson.annotation.JsonAlias("completed")
    private boolean isCompleted;
    private Instant completedAt;
    private int estimatedMinutes;
    private int sortOrder;
    private Instant createdAt;
    private Instant updatedAt;
}

