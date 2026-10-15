package com.pomofocus.pro.service;

import com.pomofocus.pro.dto.CheckpointRequest;
import com.pomofocus.pro.dto.CheckpointResponse;
import com.pomofocus.pro.entity.ContextCheckpoint;
import com.pomofocus.pro.entity.Task;
import com.pomofocus.pro.entity.User;
import com.pomofocus.pro.exception.ResourceNotFoundException;
import com.pomofocus.pro.repository.ContextCheckpointRepository;
import com.pomofocus.pro.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContextCheckpointService {

    private final ContextCheckpointRepository checkpointRepository;
    private final TaskRepository taskRepository;
    private final AuthService authService;

    @Transactional
    public CheckpointResponse saveCheckpoint(CheckpointRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        Task task = taskRepository.findByIdAndUserId(request.getTaskId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + request.getTaskId()));

        ContextCheckpoint checkpoint = ContextCheckpoint.builder()
                .user(user)
                .task(task)
                .checkpointNote(request.getCheckpointNote().trim())
                .build();

        checkpoint = checkpointRepository.save(checkpoint);

        return toCheckpointResponse(checkpoint);
    }

    public CheckpointResponse getLatestCheckpointForTask(UUID taskId) {
        User user = authService.getCurrentAuthenticatedUser();
        Task task = taskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        return checkpointRepository.findTopByTaskIdOrderByCreatedAtDesc(task.getId())
                .map(this::toCheckpointResponse)
                .orElse(null);
    }

    public List<CheckpointResponse> getRecentCheckpoints() {
        User user = authService.getCurrentAuthenticatedUser();
        return checkpointRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .limit(20)
                .map(this::toCheckpointResponse)
                .collect(Collectors.toList());
    }

    private CheckpointResponse toCheckpointResponse(ContextCheckpoint checkpoint) {
        return CheckpointResponse.builder()
                .id(checkpoint.getId())
                .taskId(checkpoint.getTask().getId())
                .taskTitle(checkpoint.getTask().getTitle())
                .taskColorHex(checkpoint.getTask().getColorHex())
                .checkpointNote(checkpoint.getCheckpointNote())
                .createdAt(checkpoint.getCreatedAt())
                .build();
    }
}

