package com.pomofocus.pro;

import com.pomofocus.pro.dto.TimerStateRequest;
import com.pomofocus.pro.dto.TimerStateResponse;
import com.pomofocus.pro.entity.Task;
import com.pomofocus.pro.entity.TaskTimerState;
import com.pomofocus.pro.entity.TaskTimerStateId;
import com.pomofocus.pro.entity.User;
import com.pomofocus.pro.exception.ResourceNotFoundException;
import com.pomofocus.pro.repository.TaskRepository;
import com.pomofocus.pro.repository.TaskTimerStateRepository;
import com.pomofocus.pro.service.AuthService;
import com.pomofocus.pro.service.TimerStateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TimerStateServiceTest {

    private final TaskTimerStateRepository timerStateRepository = mock(TaskTimerStateRepository.class);
    private final TaskRepository taskRepository = mock(TaskRepository.class);
    private final AuthService authService = mock(AuthService.class);
    private final TimerStateService service = new TimerStateService(timerStateRepository, taskRepository, authService);

    private final UUID userId = UUID.randomUUID();
    private final UUID taskId = UUID.randomUUID();

    @BeforeEach
    void signIn() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);
        when(authService.getCurrentAuthenticatedUser()).thenReturn(user);
    }

    private TimerStateRequest request(int remaining, int duration) {
        TimerStateRequest request = new TimerStateRequest();
        request.setRemainingSeconds(remaining);
        request.setDurationSeconds(duration);
        return request;
    }

    @Test
    void savesStateForOwnTask() {
        when(taskRepository.findByIdAndUserId(taskId, userId)).thenReturn(Optional.of(mock(Task.class)));

        service.saveTimerState(taskId, request(8400, 10800));

        verify(timerStateRepository).upsert(userId, taskId, 8400, 10800);
    }

    @Test
    void rejectsAnotherUsersTaskWithoutWriting() {
        when(taskRepository.findByIdAndUserId(taskId, userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.saveTimerState(taskId, request(8400, 10800)));

        verifyNoInteractions(timerStateRepository);
    }

    @Test
    void deleteIsScopedToTheCurrentUser() {
        service.deleteTimerState(taskId);

        verify(timerStateRepository).deleteForUserAndTask(userId, taskId);
    }

    @Test
    void listsStatesForTheCurrentUser() {
        Instant updatedAt = Instant.parse("2026-11-02T10:00:00Z");
        TaskTimerState state = TaskTimerState.builder()
                .id(new TaskTimerStateId(userId, taskId))
                .remainingSeconds(8400)
                .durationSeconds(10800)
                .updatedAt(updatedAt)
                .build();
        when(timerStateRepository.findAllByIdUserIdOrderByUpdatedAtDesc(userId)).thenReturn(List.of(state));

        List<TimerStateResponse> states = service.getTimerStates();

        assertEquals(1, states.size());
        assertEquals(taskId, states.get(0).getTaskId());
        assertEquals(8400, states.get(0).getRemainingSeconds());
        assertEquals(10800, states.get(0).getDurationSeconds());
        assertEquals(updatedAt, states.get(0).getUpdatedAt());
    }
}
