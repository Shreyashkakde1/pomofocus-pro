package com.pomofocus.pro.service;

import com.pomofocus.pro.dto.TaskRequest;
import com.pomofocus.pro.dto.TaskResponse;
import com.pomofocus.pro.entity.ContextCheckpoint;
import com.pomofocus.pro.entity.Task;
import com.pomofocus.pro.entity.User;
import com.pomofocus.pro.exception.ResourceNotFoundException;
import com.pomofocus.pro.repository.ContextCheckpointRepository;
import com.pomofocus.pro.repository.FocusSessionRepository;
import com.pomofocus.pro.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final ContextCheckpointRepository checkpointRepository;
    private final AuthService authService;

    public List<TaskResponse> getActiveTasksWithTodayStats(String clientZoneId) {
        User user = authService.getCurrentAuthenticatedUser();
        ZoneId zone = resolveZoneId(clientZoneId);

        ZonedDateTime nowInZone = ZonedDateTime.now(zone);
        ZonedDateTime startOfDay = nowInZone.toLocalDate().atStartOfDay(zone);
        ZonedDateTime endOfDay = startOfDay.plusDays(1);

        Instant startInstant = startOfDay.toInstant();
        Instant endInstant = endOfDay.toInstant();

        List<Task> tasks = taskRepository.findAllByUserIdAndIsArchivedFalseOrderBySortOrderAscCreatedAtAsc(user.getId());

        return tasks.stream()
                .map(task -> mapToTaskResponse(task, user.getId(), startInstant, endInstant))
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        User user = authService.getCurrentAuthenticatedUser();

        int nextSort = taskRepository.countByUserIdAndIsArchivedFalse(user.getId()) + 1;

        Task task = Task.builder()
                .user(user)
                .title(request.getTitle().trim())
                .category(request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory().trim() : "General")
                .colorHex(request.getColorHex() != null && !request.getColorHex().isBlank() ? request.getColorHex().trim() : "#00f3ff")
                .dailyTargetMinutes(request.getDailyTargetMinutes() > 0 ? request.getDailyTargetMinutes() : 60)
                .sortOrder(request.getSortOrder() > 0 ? request.getSortOrder() : nextSort)
                .isArchived(false)
                .build();

        task = taskRepository.save(task);

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .category(task.getCategory())
                .colorHex(task.getColorHex())
                .dailyTargetMinutes(task.getDailyTargetMinutes())
                .isArchived(task.isArchived())
                .sortOrder(task.getSortOrder())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .todayFocusSeconds(0)
                .todayFocusMinutes(0)
                .progressPercentage(0.0)
                .deficitOrSurplusMinutes(-task.getDailyTargetMinutes())
                .latestCheckpointNote(null)
                .build();
    }

    @Transactional
    public TaskResponse updateTask(UUID taskId, TaskRequest request, String clientZoneId) {
        User user = authService.getCurrentAuthenticatedUser();
        Task task = taskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        task.setTitle(request.getTitle().trim());
        if (request.getCategory() != null) {
            String cat = request.getCategory().trim();
            task.setCategory(cat.isEmpty() ? "General" : cat);
        }
        if (request.getColorHex() != null && !request.getColorHex().isBlank()) {
            task.setColorHex(request.getColorHex().trim());
        }
        if (request.getDailyTargetMinutes() > 0) {
            task.setDailyTargetMinutes(request.getDailyTargetMinutes());
        }
        if (request.getSortOrder() > 0) {
            task.setSortOrder(request.getSortOrder());
        }

        task = taskRepository.save(task);

        ZoneId zone = resolveZoneId(clientZoneId);
        ZonedDateTime nowInZone = ZonedDateTime.now(zone);
        ZonedDateTime startOfDay = nowInZone.toLocalDate().atStartOfDay(zone);
        ZonedDateTime endOfDay = startOfDay.plusDays(1);

        return mapToTaskResponse(task, user.getId(), startOfDay.toInstant(), endOfDay.toInstant());
    }

    @Transactional
    public void archiveTask(UUID taskId) {
        User user = authService.getCurrentAuthenticatedUser();
        Task task = taskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        task.setArchived(true);
        taskRepository.save(task);
    }

    private TaskResponse mapToTaskResponse(Task task, UUID userId, Instant startInstant, Instant endInstant) {
        Integer seconds = focusSessionRepository.sumFocusSecondsForTaskBetween(userId, task.getId(), startInstant, endInstant);
        int totalSeconds = (seconds != null) ? seconds : 0;
        int totalMinutes = totalSeconds / 60;

        int targetMinutes = task.getDailyTargetMinutes();
        double progress = targetMinutes > 0 ? Math.min(100.0, Math.round(((double) totalSeconds / (targetMinutes * 60.0)) * 1000.0) / 10.0) : 0.0;
        int deficitOrSurplus = totalMinutes - targetMinutes;

        String latestNote = checkpointRepository.findTopByTaskIdOrderByCreatedAtDesc(task.getId())
                .map(ContextCheckpoint::getCheckpointNote)
                .orElse(null);

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .category(task.getCategory())
                .colorHex(task.getColorHex())
                .dailyTargetMinutes(task.getDailyTargetMinutes())
                .isArchived(task.isArchived())
                .sortOrder(task.getSortOrder())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .todayFocusSeconds(totalSeconds)
                .todayFocusMinutes(totalMinutes)
                .progressPercentage(progress)
                .deficitOrSurplusMinutes(deficitOrSurplus)
                .latestCheckpointNote(latestNote)
                .build();
    }

    public ZoneId resolveZoneId(String clientZoneId) {
        if (clientZoneId != null && !clientZoneId.isBlank()) {
            try {
                return ZoneId.of(clientZoneId.trim());
            } catch (Exception ignored) {
            }
        }
        return ZoneId.systemDefault();
    }
}

