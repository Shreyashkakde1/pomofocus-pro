package com.pomofocus.pro.dto;

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
public class DailyDebriefResponse {

    private UUID id;
    private LocalDate debriefDate;
    private String whatWentWell;
    private String whatWentWrong;
    private int energyRating;
    private String tomorrowNotes;
    private int totalFocusSecondsSnapshot;
    private int tasksCompletedCount;
    private int tasksTotalCount;
    private Instant createdAt;
    private Instant updatedAt;
}

