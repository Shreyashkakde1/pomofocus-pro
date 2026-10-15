package com.pomofocus.pro.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTaskRequest {

    @NotBlank(message = "Task title is required")
    private String title;

    private String priorityTier;

    private LocalDate plannedDate;

    private UUID targetId;

    private Integer estimatedMinutes;

    private Integer sortOrder;
}

