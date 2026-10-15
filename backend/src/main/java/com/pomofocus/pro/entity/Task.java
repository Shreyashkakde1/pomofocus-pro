package com.pomofocus.pro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Builder.Default
    @Column(nullable = false, length = 100)
    private String category = "General";

    @Builder.Default
    @Column(name = "color_hex", nullable = false, length = 20)
    private String colorHex = "#00f3ff";

    @Builder.Default
    @Column(name = "daily_target_minutes", nullable = false)
    private int dailyTargetMinutes = 60;

    @Builder.Default
    @Column(name = "is_archived", nullable = false)
    private boolean isArchived = false;

    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

