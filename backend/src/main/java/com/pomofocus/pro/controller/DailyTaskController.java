package com.pomofocus.pro.controller;

import com.pomofocus.pro.dto.DailyTaskRequest;
import com.pomofocus.pro.dto.DailyTaskResponse;
import com.pomofocus.pro.dto.RolloverRequest;
import com.pomofocus.pro.service.DailyTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/daily-tasks")
@RequiredArgsConstructor
public class DailyTaskController {

    private final DailyTaskService dailyTaskService;

    @GetMapping
    public ResponseEntity<List<DailyTaskResponse>> getTasks(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(dailyTaskService.getTasksForDate(date));
    }

    @PostMapping
    public ResponseEntity<DailyTaskResponse> createTask(@Valid @RequestBody DailyTaskRequest request) {
        return ResponseEntity.ok(dailyTaskService.createTask(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<DailyTaskResponse> updateTask(
            @PathVariable UUID id,
            @RequestBody DailyTaskRequest request
    ) {
        return ResponseEntity.ok(dailyTaskService.updateTask(id, request));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<DailyTaskResponse> toggleTask(@PathVariable UUID id) {
        return ResponseEntity.ok(dailyTaskService.toggleTask(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        dailyTaskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/rollover")
    public ResponseEntity<List<DailyTaskResponse>> rolloverTasks(@Valid @RequestBody RolloverRequest request) {
        return ResponseEntity.ok(dailyTaskService.rolloverIncompleteTasks(request));
    }
}

