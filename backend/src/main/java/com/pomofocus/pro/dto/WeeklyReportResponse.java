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
public class WeeklyReportResponse {
    private LocalDate startDate;
    private LocalDate endDate;
    private int totalTargetMinutes;
    private int totalActualMinutes;
    private double consistencyScore; // percentage of days target was hit
    private List<DailyTrendItem> dailyTrends;
    private List<TaskReportItem> taskBreakdown;
}

