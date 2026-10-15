package com.pomofocus.pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTrendItem {
    private LocalDate date;
    private int targetMinutes;
    private int actualMinutes;
    private int focusSessionsCount;
    private double completionPercentage;
}

