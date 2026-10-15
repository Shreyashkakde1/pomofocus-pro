package com.pomofocus.pro.service;

import com.pomofocus.pro.dto.LogSessionRequest;
import com.pomofocus.pro.dto.SessionResponse;
import com.pomofocus.pro.entity.FocusSession;
import com.pomofocus.pro.entity.Task;
import com.pomofocus.pro.entity.User;
import com.pomofocus.pro.exception.ResourceNotFoundException;
import com.pomofocus.pro.repository.FocusSessionRepository;
import com.pomofocus.pro.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FocusSessionService {

    private final FocusSessionRepository focusSessionRepository;
    private final TaskRepository taskRepository;
    private final AuthService authService;

    @Transactional
    public SessionResponse logSession(LogSessionRequest request) {
        User user = authService.getCurrentAuthenticatedUser();

        Task task = null;
        if (request.getTaskId() != null) {
            task = taskRepository.findByIdAndUserId(request.getTaskId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + request.getTaskId()));
        }

        FocusSession session = FocusSession.builder()
                .user(user)
                .task(task)
                .sessionType(request.getSessionType() != null ? request.getSessionType().toUpperCase() : "FOCUS")
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .durationSeconds(request.getDurationSeconds())
                .isCompleted(request.isCompleted())
                .build();

        session = focusSessionRepository.save(session);

        return toSessionResponse(session);
    }

    public List<SessionResponse> getRecentSessions() {
        User user = authService.getCurrentAuthenticatedUser();
        return focusSessionRepository.findAllByUserIdOrderByStartTimeDesc(user.getId())
                .stream()
                .limit(50)
                .map(this::toSessionResponse)
                .collect(Collectors.toList());
    }

    public SessionResponse toSessionResponse(FocusSession session) {
        return SessionResponse.builder()
                .id(session.getId())
                .taskId(session.getTask() != null ? session.getTask().getId() : null)
                .taskTitle(session.getTask() != null ? session.getTask().getTitle() : "Untracked Break")
                .taskColorHex(session.getTask() != null ? session.getTask().getColorHex() : "#64748b")
                .sessionType(session.getSessionType())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .durationSeconds(session.getDurationSeconds())
                .isCompleted(session.isCompleted())
                .createdAt(session.getCreatedAt())
                .build();
    }
}

