package com.pomofocus.pro.service;

import com.pomofocus.pro.dto.*;
import com.pomofocus.pro.entity.FocusSession;
import com.pomofocus.pro.entity.Task;
import com.pomofocus.pro.entity.User;
import com.pomofocus.pro.repository.FocusSessionRepository;
import com.pomofocus.pro.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final FocusSessionRepository focusSessionRepository;
    private final TaskRepository taskRepository;
    private final AuthService authService;
    private final FocusSessionService sessionService;
    private final TaskService taskService;

    public DailyReportResponse getDailyReport(LocalDate targetDate, String clientZoneId) {
        User user = authService.getCurrentAuthenticatedUser();
        ZoneId zone = taskService.resolveZoneId(clientZoneId);

        LocalDate date = (targetDate != null) ? targetDate : LocalDate.now(zone);
        ZonedDateTime startOfDay = date.atStartOfDay(zone);
        ZonedDateTime endOfDay = startOfDay.plusDays(1);

        Instant startInstant = startOfDay.toInstant();
        Instant endInstant = endOfDay.toInstant();

        List<FocusSession> sessions = focusSessionRepository.findSessionsForUserBetween(user.getId(), startInstant, endInstant);
        List<Task> activeTasks = taskRepository.findAllByUserIdAndIsArchivedFalseOrderBySortOrderAscCreatedAtAsc(user.getId());

        int totalTargetMinutes = activeTasks.stream().mapToInt(Task::getDailyTargetMinutes).sum();

        Map<UUID, Integer> taskFocusSeconds = new HashMap<>();
        Map<UUID, Integer> taskSessionCount = new HashMap<>();
        int totalActualSeconds = 0;
        int totalFocusSessions = 0;

        UUID lastTaskId = null;
        int contextSwitchCount = 0;

        for (FocusSession s : sessions) {
            if ("FOCUS".equalsIgnoreCase(s.getSessionType())) {
                totalActualSeconds += s.getDurationSeconds();
                totalFocusSessions++;

                if (s.getTask() != null) {
                    UUID tId = s.getTask().getId();
                    taskFocusSeconds.merge(tId, s.getDurationSeconds(), Integer::sum);
                    taskSessionCount.merge(tId, 1, Integer::sum);

                    if (lastTaskId != null && !lastTaskId.equals(tId)) {
                        contextSwitchCount++;
                    }
                    lastTaskId = tId;
                }
            }
        }

        int totalActualMinutes = totalActualSeconds / 60;
        double overallCompletion = totalTargetMinutes > 0
                ? Math.min(100.0, Math.round(((double) totalActualMinutes / totalTargetMinutes) * 1000.0) / 10.0)
                : 0.0;
        int totalDeficitOrSurplus = totalActualMinutes - totalTargetMinutes;

        List<TaskReportItem> breakdown = activeTasks.stream().map(task -> {
            int actualSec = taskFocusSeconds.getOrDefault(task.getId(), 0);
            int actualMin = actualSec / 60;
            int targetMin = task.getDailyTargetMinutes();
            double pct = targetMin > 0
                    ? Math.min(100.0, Math.round(((double) actualMin / targetMin) * 1000.0) / 10.0)
                    : 0.0;

            return TaskReportItem.builder()
                    .taskId(task.getId())
                    .title(task.getTitle())
                    .category(task.getCategory())
                    .colorHex(task.getColorHex())
                    .targetMinutes(targetMin)
                    .actualMinutes(actualMin)
                    .actualSeconds(actualSec)
                    .completionPercentage(pct)
                    .deficitOrSurplusMinutes(actualMin - targetMin)
                    .sessionCount(taskSessionCount.getOrDefault(task.getId(), 0))
                    .build();
        }).collect(Collectors.toList());

        List<SessionResponse> timeline = sessions.stream()
                .map(sessionService::toSessionResponse)
                .collect(Collectors.toList());

        return DailyReportResponse.builder()
                .date(date)
                .totalTargetMinutes(totalTargetMinutes)
                .totalActualMinutes(totalActualMinutes)
                .totalActualSeconds(totalActualSeconds)
                .overallCompletionPercentage(overallCompletion)
                .totalDeficitOrSurplusMinutes(totalDeficitOrSurplus)
                .contextSwitchCount(contextSwitchCount)
                .totalFocusSessions(totalFocusSessions)
                .taskBreakdown(breakdown)
                .timeline(timeline)
                .build();
    }

    public WeeklyReportResponse getWeeklyReport(LocalDate start, LocalDate end, String clientZoneId) {
        User user = authService.getCurrentAuthenticatedUser();
        ZoneId zone = taskService.resolveZoneId(clientZoneId);

        LocalDate endDate = (end != null) ? end : LocalDate.now(zone);
        LocalDate startDate = (start != null) ? start : endDate.minusDays(6);

        ZonedDateTime startPeriod = startDate.atStartOfDay(zone);
        ZonedDateTime endPeriod = endDate.plusDays(1).atStartOfDay(zone);

        List<FocusSession> sessions = focusSessionRepository.findSessionsForUserBetween(
                user.getId(), startPeriod.toInstant(), endPeriod.toInstant()
        );
        List<Task> activeTasks = taskRepository.findAllByUserIdAndIsArchivedFalseOrderBySortOrderAscCreatedAtAsc(user.getId());
        int dailyTargetTotal = activeTasks.stream().mapToInt(Task::getDailyTargetMinutes).sum();

        List<DailyTrendItem> trends = new ArrayList<>();
        int daysHit = 0;
        int totalActualMinutes = 0;
        int totalDays = 0;

        LocalDate cur = startDate;
        while (!cur.isAfter(endDate)) {
            totalDays++;
            ZonedDateTime dayStart = cur.atStartOfDay(zone);
            ZonedDateTime dayEnd = dayStart.plusDays(1);
            Instant dayStartInst = dayStart.toInstant();
            Instant dayEndInst = dayEnd.toInstant();

            List<FocusSession> daySessions = sessions.stream()
                    .filter(s -> !s.getStartTime().isBefore(dayStartInst) && s.getStartTime().isBefore(dayEndInst))
                    .filter(s -> "FOCUS".equalsIgnoreCase(s.getSessionType()))
                    .toList();

            int daySecs = daySessions.stream().mapToInt(FocusSession::getDurationSeconds).sum();
            int dayMins = daySecs / 60;
            totalActualMinutes += dayMins;

            double pct = dailyTargetTotal > 0
                    ? Math.min(100.0, Math.round(((double) dayMins / dailyTargetTotal) * 1000.0) / 10.0)
                    : 0.0;

            if (pct >= 90.0) {
                daysHit++;
            }

            trends.add(DailyTrendItem.builder()
                    .date(cur)
                    .targetMinutes(dailyTargetTotal)
                    .actualMinutes(dayMins)
                    .focusSessionsCount(daySessions.size())
                    .completionPercentage(pct)
                    .build());

            cur = cur.plusDays(1);
        }

        double consistency = totalDays > 0 ? Math.round(((double) daysHit / totalDays) * 1000.0) / 10.0 : 0.0;

        Map<UUID, Integer> taskFocusSeconds = new HashMap<>();
        for (FocusSession s : sessions) {
            if ("FOCUS".equalsIgnoreCase(s.getSessionType()) && s.getTask() != null) {
                taskFocusSeconds.merge(s.getTask().getId(), s.getDurationSeconds(), Integer::sum);
            }
        }

        final int evaluatedDays = totalDays;
        List<TaskReportItem> breakdown = activeTasks.stream().map(task -> {
            int actualSec = taskFocusSeconds.getOrDefault(task.getId(), 0);
            int actualMin = actualSec / 60;
            int totalWeekTarget = task.getDailyTargetMinutes() * evaluatedDays;
            double pct = totalWeekTarget > 0
                    ? Math.min(100.0, Math.round(((double) actualMin / totalWeekTarget) * 1000.0) / 10.0)
                    : 0.0;

            return TaskReportItem.builder()
                    .taskId(task.getId())
                    .title(task.getTitle())
                    .category(task.getCategory())
                    .colorHex(task.getColorHex())
                    .targetMinutes(totalWeekTarget)
                    .actualMinutes(actualMin)
                    .actualSeconds(actualSec)
                    .completionPercentage(pct)
                    .deficitOrSurplusMinutes(actualMin - totalWeekTarget)
                    .sessionCount(0)
                    .build();
        }).collect(Collectors.toList());

        return WeeklyReportResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalTargetMinutes(dailyTargetTotal * totalDays)
                .totalActualMinutes(totalActualMinutes)
                .consistencyScore(consistency)
                .dailyTrends(trends)
                .taskBreakdown(breakdown)
                .build();
    }

    public String generateCsvExport(String clientZoneId) {
        User user = authService.getCurrentAuthenticatedUser();
        ZoneId zone = taskService.resolveZoneId(clientZoneId);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(zone);

        List<FocusSession> sessions = focusSessionRepository.findAllByUserIdOrderByStartTimeDesc(user.getId());

        StringBuilder sb = new StringBuilder();
        sb.append("Session ID,Start Time,End Time,Session Type,Task Title,Task Category,Duration Seconds,Duration Minutes,Completed\n");

        for (FocusSession s : sessions) {
            String startStr = formatter.format(s.getStartTime());
            String endStr = formatter.format(s.getEndTime());
            String title = (s.getTask() != null) ? escapeCsv(s.getTask().getTitle()) : "Untracked Break";
            String cat = (s.getTask() != null) ? escapeCsv(s.getTask().getCategory()) : "Break";
            int mins = s.getDurationSeconds() / 60;

            sb.append(s.getId()).append(",")
                    .append(startStr).append(",")
                    .append(endStr).append(",")
                    .append(s.getSessionType()).append(",")
                    .append(title).append(",")
                    .append(cat).append(",")
                    .append(s.getDurationSeconds()).append(",")
                    .append(mins).append(",")
                    .append(s.isCompleted()).append("\n");
        }

        return sb.toString();
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        String sanitized = val.trim();
        // Neutralize CSV Formula Injection (CWE-1236) for spreadsheet software (Excel, Calc, Sheets)
        if (sanitized.startsWith("=") || sanitized.startsWith("+") ||
            sanitized.startsWith("-") || sanitized.startsWith("@") ||
            sanitized.startsWith("\t") || sanitized.startsWith("\r")) {
            sanitized = "'" + sanitized;
        }
        if (sanitized.contains(",") || sanitized.contains("\"") || sanitized.contains("\n") || sanitized.contains("\r")) {
            return "\"" + sanitized.replace("\"", "\"\"") + "\"";
        }
        return sanitized;
    }
}
