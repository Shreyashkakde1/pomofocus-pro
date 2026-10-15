package com.pomofocus.pro.service;

import com.pomofocus.pro.dto.DailyTaskRequest;
import com.pomofocus.pro.dto.DailyTaskResponse;
import com.pomofocus.pro.dto.RolloverRequest;
import com.pomofocus.pro.entity.DailyTask;
import com.pomofocus.pro.entity.PriorityTier;
import com.pomofocus.pro.entity.Task;
import com.pomofocus.pro.entity.User;
import com.pomofocus.pro.exception.ResourceNotFoundException;
import com.pomofocus.pro.repository.DailyTaskRepository;
import com.pomofocus.pro.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyTaskService {

    private final DailyTaskRepository dailyTaskRepository;
    private final TaskRepository taskRepository;
    private final AuthService authService;

    public List<DailyTaskResponse> getTasksForDate(LocalDate date) {
        User user = authService.getCurrentAuthenticatedUser();
        LocalDate targetDate = date != null ? date : LocalDate.now();

        List<DailyTask> tasks = dailyTaskRepository
                .findAllByUserIdAndPlannedDateOrderBySortOrderAscCreatedAtAsc(user.getId(), targetDate);

        return tasks.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public DailyTaskResponse createTask(DailyTaskRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        LocalDate plannedDate = request.getPlannedDate() != null ? request.getPlannedDate() : LocalDate.now();

        Task target = null;
        if (request.getTargetId() != null) {
            target = taskRepository.findByIdAndUserId(request.getTargetId(), user.getId())
                    .orElse(null);
        }

        PriorityTier tier = PriorityTier.INBOX;
        if (request.getPriorityTier() != null && !request.getPriorityTier().isBlank()) {
            try {
                tier = PriorityTier.valueOf(request.getPriorityTier().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        int nextSort = dailyTaskRepository.countByUserIdAndPlannedDate(user.getId(), plannedDate) + 1;

        DailyTask task = DailyTask.builder()
                .user(user)
                .target(target)
                .title(request.getTitle().trim())
                .priorityTier(tier)
                .plannedDate(plannedDate)
                .isCompleted(false)
                .estimatedMinutes(request.getEstimatedMinutes() != null && request.getEstimatedMinutes() > 0 ? request.getEstimatedMinutes() : 25)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : nextSort)
                .build();

        task = dailyTaskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public DailyTaskResponse updateTask(UUID id, DailyTaskRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        DailyTask task = dailyTaskRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Daily task not found with ID: " + id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            task.setTitle(request.getTitle().trim());
        }

        if (request.getPriorityTier() != null) {
            try {
                task.setPriorityTier(PriorityTier.valueOf(request.getPriorityTier().toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        }

        if (request.getPlannedDate() != null) {
            task.setPlannedDate(request.getPlannedDate());
        }

        if (request.getTargetId() != null) {
            Task target = taskRepository.findByIdAndUserId(request.getTargetId(), user.getId()).orElse(null);
            task.setTarget(target);
        }

        if (request.getEstimatedMinutes() != null && request.getEstimatedMinutes() > 0) {
            task.setEstimatedMinutes(request.getEstimatedMinutes());
        }

        if (request.getSortOrder() != null) {
            task.setSortOrder(request.getSortOrder());
        }

        task = dailyTaskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public DailyTaskResponse toggleTask(UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        DailyTask task = dailyTaskRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Daily task not found with ID: " + id));

        boolean newCompleted = !task.isCompleted();
        task.setCompleted(newCompleted);
        task.setCompletedAt(newCompleted ? Instant.now() : null);

        task = dailyTaskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public void deleteTask(UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        DailyTask task = dailyTaskRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Daily task not found with ID: " + id));

        dailyTaskRepository.delete(task);
    }

    @Transactional
    public List<DailyTaskResponse> rolloverIncompleteTasks(RolloverRequest request) {
        User user = authService.getCurrentAuthenticatedUser();

        List<DailyTask> candidates;
        if (request.getTaskIds() != null && !request.getTaskIds().isEmpty()) {
            candidates = dailyTaskRepository.findAllById(request.getTaskIds()).stream()
                    .filter(t -> t.getUser().getId().equals(user.getId()) && !t.isCompleted())
                    .collect(Collectors.toList());
        } else {
            candidates = dailyTaskRepository.findAllByUserIdAndPlannedDateAndIsCompletedFalse(user.getId(), request.getFromDate());
        }

        int currentMaxSort = dailyTaskRepository.countByUserIdAndPlannedDate(user.getId(), request.getToDate());

        List<DailyTask> rolledOver = new ArrayList<>();
        for (DailyTask source : candidates) {
            source.setPlannedDate(request.getToDate());
            source.setSortOrder(++currentMaxSort);
            rolledOver.add(dailyTaskRepository.save(source));
        }

        return rolledOver.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public DailyTaskResponse toResponse(DailyTask task) {
        return DailyTaskResponse.builder()
                .id(task.getId())
                .targetId(task.getTarget() != null ? task.getTarget().getId() : null)
                .targetTitle(task.getTarget() != null ? task.getTarget().getTitle() : null)
                .targetColorHex(task.getTarget() != null ? task.getTarget().getColorHex() : null)
                .title(task.getTitle())
                .priorityTier(task.getPriorityTier())
                .plannedDate(task.getPlannedDate())
                .isCompleted(task.isCompleted())
                .completedAt(task.getCompletedAt())
                .estimatedMinutes(task.getEstimatedMinutes())
                .sortOrder(task.getSortOrder())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}

