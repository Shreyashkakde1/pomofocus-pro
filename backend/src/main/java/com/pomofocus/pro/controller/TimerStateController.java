package com.pomofocus.pro.controller;

import com.pomofocus.pro.dto.TimerStateRequest;
import com.pomofocus.pro.dto.TimerStateResponse;
import com.pomofocus.pro.service.TimerStateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/timer-states")
@RequiredArgsConstructor
public class TimerStateController {

    private final TimerStateService timerStateService;

    @GetMapping
    public ResponseEntity<List<TimerStateResponse>> getTimerStates() {
        return ResponseEntity.ok(timerStateService.getTimerStates());
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<Void> saveTimerState(
            @PathVariable UUID taskId,
            @Valid @RequestBody TimerStateRequest request
    ) {
        timerStateService.saveTimerState(taskId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTimerState(@PathVariable UUID taskId) {
        timerStateService.deleteTimerState(taskId);
        return ResponseEntity.noContent().build();
    }
}
