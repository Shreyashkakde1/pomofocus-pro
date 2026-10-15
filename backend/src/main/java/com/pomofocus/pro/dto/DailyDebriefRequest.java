package com.pomofocus.pro.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyDebriefRequest {

    @NotNull(message = "Debrief date is required")
    private LocalDate debriefDate;

    private String whatWentWell;

    private String whatWentWrong;

    private int energyRating;

    private String tomorrowNotes;
}

