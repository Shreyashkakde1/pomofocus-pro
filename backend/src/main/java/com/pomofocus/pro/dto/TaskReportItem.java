package com.pomofocus.pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskReportItem {
    private UUID taskId;
    private String title;
    private String category;
    private String colorHex;
    private int targetMinutes;
    private int actualMinutes;
    private int actualSeconds;
    private double completionPercentage;
    private int deficitOrSurplusMinutes; // e.g. -30 (deficit) or +15 (surplus)
    private int sessionCount;
}

