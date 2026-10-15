package com.pomofocus.pro.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class LogSessionRequest {
    private UUID taskId; // nullable for untracked breaks

    @NotBlank(message = "Session type is required")
    @Size(max = 50, message = "Session type must not exceed 50 characters")
    @Pattern(regexp = "^(FOCUS|SHORT_BREAK|LONG_BREAK)$", message = "Session type must be FOCUS, SHORT_BREAK, or LONG_BREAK")
    private String sessionType;

    @NotNull(message = "Start time is required")
    private Instant startTime;

    @NotNull(message = "End time is required")
    private Instant endTime;

    @Min(value = 0, message = "Duration seconds cannot be negative")
    @Max(value = 86400, message = "Duration cannot exceed 24 hours (86400 seconds)")
    private int durationSeconds;

    private boolean completed = true;
}

