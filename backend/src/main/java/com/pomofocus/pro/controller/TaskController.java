package com.pomofocus.pro.controller;

import com.pomofocus.pro.dto.TaskRequest;
import com.pomofocus.pro.dto.TaskResponse;
import com.pomofocus.pro.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(
            @RequestParam(required = false) String timezone,
            @RequestHeader(value = "X-Timezone", required = false) String headerTimezone
    ) {
        String tz = (timezone != null && !timezone.isBlank()) ? timezone : headerTimezone;
        return ResponseEntity.ok(taskService.getActiveTasksWithTodayStats(tz));
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable UUID id,
            @Valid @RequestBody TaskRequest request,
            @RequestParam(required = false) String timezone,
            @RequestHeader(value = "X-Timezone", required = false) String headerTimezone
    ) {
        String tz = (timezone != null && !timezone.isBlank()) ? timezone : headerTimezone;
        return ResponseEntity.ok(taskService.updateTask(id, request, tz));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archiveTask(@PathVariable UUID id) {
        taskService.archiveTask(id);
        return ResponseEntity.noContent().build();
    }
}

