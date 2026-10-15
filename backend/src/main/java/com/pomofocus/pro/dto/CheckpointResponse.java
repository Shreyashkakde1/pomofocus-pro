package com.pomofocus.pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckpointResponse {
    private UUID id;
    private UUID taskId;
    private String taskTitle;
    private String taskColorHex;
    private String checkpointNote;
    private Instant createdAt;
}

