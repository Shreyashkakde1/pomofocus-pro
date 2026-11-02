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
public class TimerStateResponse {
    private UUID taskId;
    private int remainingSeconds;
    private int durationSeconds;
    private Instant updatedAt;
}
