package com.pomofocus.pro.service;

import com.pomofocus.pro.dto.TimerStateRequest;
import com.pomofocus.pro.dto.TimerStateResponse;
import com.pomofocus.pro.entity.TaskTimerState;
import com.pomofocus.pro.entity.User;
import com.pomofocus.pro.exception.ResourceNotFoundException;
import com.pomofocus.pro.repository.TaskRepository;
import com.pomofocus.pro.repository.TaskTimerStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimerStateService {

    private final TaskTimerStateRepository timerStateRepository;
    private final TaskRepository taskRepository;
    private final AuthService authService;

    public List<TimerStateResponse> getTimerStates() {
        User user = authService.getCurrentAuthenticatedUser();
        return timerStateRepository.findAllByIdUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void saveTimerState(UUID taskId, TimerStateRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        taskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        timerStateRepository.upsert(user.getId(), taskId, request.getRemainingSeconds(), request.getDurationSeconds());
    }

    @Transactional
    public void deleteTimerState(UUID taskId) {
        User user = authService.getCurrentAuthenticatedUser();
        timerStateRepository.deleteForUserAndTask(user.getId(), taskId);
    }

    private TimerStateResponse toResponse(TaskTimerState state) {
        return TimerStateResponse.builder()
                .taskId(state.getId().getTaskId())
                .remainingSeconds(state.getRemainingSeconds())
                .durationSeconds(state.getDurationSeconds())
                .updatedAt(state.getUpdatedAt())
                .build();
    }
}
