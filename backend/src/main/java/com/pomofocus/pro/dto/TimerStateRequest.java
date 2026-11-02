package com.pomofocus.pro.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TimerStateRequest {
    @NotNull(message = "Remaining seconds is required")
    @Min(value = 1, message = "Remaining seconds must be at least 1")
    @Max(value = 86400, message = "Remaining seconds cannot exceed 24 hours (86400 seconds)")
    private Integer remainingSeconds;

    @NotNull(message = "Duration seconds is required")
    @Min(value = 1, message = "Duration seconds must be at least 1")
    @Max(value = 86400, message = "Duration seconds cannot exceed 24 hours (86400 seconds)")
    private Integer durationSeconds;

    @JsonIgnore
    @AssertTrue(message = "Remaining seconds cannot exceed duration seconds")
    public boolean isRemainingWithinDuration() {
        return remainingSeconds == null || durationSeconds == null || remainingSeconds <= durationSeconds;
    }
}
