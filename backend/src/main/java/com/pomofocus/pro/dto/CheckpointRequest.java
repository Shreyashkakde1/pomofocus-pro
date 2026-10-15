package com.pomofocus.pro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CheckpointRequest {
    @NotNull(message = "Task ID is required")
    private UUID taskId;

    @NotBlank(message = "Checkpoint note is required")
    @Size(max = 2000, message = "Checkpoint note cannot exceed 2000 characters")
    private String checkpointNote;
}

