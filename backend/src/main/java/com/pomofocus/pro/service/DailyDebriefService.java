package com.pomofocus.pro.service;

import com.pomofocus.pro.dto.DailyDebriefRequest;
import com.pomofocus.pro.dto.DailyDebriefResponse;
import com.pomofocus.pro.entity.DailyDebrief;
import com.pomofocus.pro.entity.User;
import com.pomofocus.pro.repository.DailyDebriefRepository;
import com.pomofocus.pro.repository.DailyTaskRepository;
import com.pomofocus.pro.repository.FocusSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyDebriefService {

    private final DailyDebriefRepository debriefRepository;
    private final DailyTaskRepository dailyTaskRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final AuthService authService;

    public DailyDebriefResponse getDebrief(LocalDate date) {
        User user = authService.getCurrentAuthenticatedUser();
        LocalDate targetDate = date != null ? date : LocalDate.now();

        return debriefRepository.findByUserIdAndDebriefDate(user.getId(), targetDate)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public DailyDebriefResponse saveDebrief(DailyDebriefRequest request, String clientZoneId) {
        User user = authService.getCurrentAuthenticatedUser();
        LocalDate debriefDate = request.getDebriefDate() != null ? request.getDebriefDate() : LocalDate.now();

        ZoneId zone = resolveZoneId(clientZoneId);
        ZonedDateTime startOfDay = debriefDate.atStartOfDay(zone);
        ZonedDateTime endOfDay = startOfDay.plusDays(1);
        Instant startInstant = startOfDay.toInstant();
        Instant endInstant = endOfDay.toInstant();

        // Compute automated telemetry snapshot
        Integer focusSeconds = focusSessionRepository.sumFocusSecondsForUserBetween(user.getId(), startInstant, endInstant);
        int totalFocusSeconds = focusSeconds != null ? focusSeconds : 0;

        int totalTasks = dailyTaskRepository.countByUserIdAndPlannedDate(user.getId(), debriefDate);
        int completedTasks = dailyTaskRepository.countByUserIdAndPlannedDateAndIsCompletedTrue(user.getId(), debriefDate);

        DailyDebrief debrief = debriefRepository.findByUserIdAndDebriefDate(user.getId(), debriefDate)
                .orElseGet(() -> DailyDebrief.builder()
                        .user(user)
                        .debriefDate(debriefDate)
                        .build());

        debrief.setWhatWentWell(request.getWhatWentWell() != null ? request.getWhatWentWell().trim() : null);
        debrief.setWhatWentWrong(request.getWhatWentWrong() != null ? request.getWhatWentWrong().trim() : null);
        debrief.setEnergyRating(request.getEnergyRating() > 0 ? Math.min(5, request.getEnergyRating()) : 3);
        debrief.setTomorrowNotes(request.getTomorrowNotes() != null ? request.getTomorrowNotes().trim() : null);
        debrief.setTotalFocusSecondsSnapshot(totalFocusSeconds);
        debrief.setTasksTotalCount(totalTasks);
        debrief.setTasksCompletedCount(completedTasks);

        debrief = debriefRepository.save(debrief);
        return toResponse(debrief);
    }

    public List<DailyDebriefResponse> getHistory() {
        User user = authService.getCurrentAuthenticatedUser();
        return debriefRepository.findAllByUserIdOrderByDebriefDateDesc(user.getId())
                .stream()
                .limit(30)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private ZoneId resolveZoneId(String clientZoneId) {
        if (clientZoneId != null && !clientZoneId.isBlank()) {
            try {
                return ZoneId.of(clientZoneId.trim());
            } catch (Exception ignored) {}
        }
        return ZoneId.of("UTC");
    }

    public DailyDebriefResponse toResponse(DailyDebrief debrief) {
        return DailyDebriefResponse.builder()
                .id(debrief.getId())
                .debriefDate(debrief.getDebriefDate())
                .whatWentWell(debrief.getWhatWentWell())
                .whatWentWrong(debrief.getWhatWentWrong())
                .energyRating(debrief.getEnergyRating())
                .tomorrowNotes(debrief.getTomorrowNotes())
                .totalFocusSecondsSnapshot(debrief.getTotalFocusSecondsSnapshot())
                .tasksCompletedCount(debrief.getTasksCompletedCount())
                .tasksTotalCount(debrief.getTasksTotalCount())
                .createdAt(debrief.getCreatedAt())
                .updatedAt(debrief.getUpdatedAt())
                .build();
    }
}
