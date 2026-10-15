package com.pomofocus.pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyReportResponse {
    private LocalDate date;
    private int totalTargetMinutes;
    private int totalActualMinutes;
    private int totalActualSeconds;
    private double overallCompletionPercentage;
    private int totalDeficitOrSurplusMinutes;
    private int contextSwitchCount;
    private int totalFocusSessions;
    private List<TaskReportItem> taskBreakdown;
    private List<SessionResponse> timeline;
}

