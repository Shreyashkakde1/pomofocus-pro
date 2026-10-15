package com.pomofocus.pro.controller;

import com.pomofocus.pro.dto.CheckpointRequest;
import com.pomofocus.pro.dto.CheckpointResponse;
import com.pomofocus.pro.service.ContextCheckpointService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/checkpoints")
@RequiredArgsConstructor
public class CheckpointController {

    private final ContextCheckpointService checkpointService;

    @PostMapping
    public ResponseEntity<CheckpointResponse> saveCheckpoint(@Valid @RequestBody CheckpointRequest request) {
        return ResponseEntity.ok(checkpointService.saveCheckpoint(request));
    }

    @GetMapping("/latest")
    public ResponseEntity<CheckpointResponse> getLatestCheckpoint(@RequestParam UUID taskId) {
        CheckpointResponse checkpoint = checkpointService.getLatestCheckpointForTask(taskId);
        if (checkpoint == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(checkpoint);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<CheckpointResponse>> getRecentCheckpoints() {
        return ResponseEntity.ok(checkpointService.getRecentCheckpoints());
    }
}

