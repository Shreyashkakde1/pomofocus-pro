package com.pomofocus.pro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "task_timer_states")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskTimerState {

    @EmbeddedId
    private TaskTimerStateId id;

    @Column(name = "remaining_seconds", nullable = false)
    private int remainingSeconds;

    @Column(name = "duration_seconds", nullable = false)
    private int durationSeconds;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
