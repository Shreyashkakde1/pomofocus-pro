package com.pomofocus.pro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_debriefs", uniqueConstraints = {
    @UniqueConstraint(name = "uq_daily_debriefs_user_date", columnNames = {"user_id", "debrief_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyDebrief {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "debrief_date", nullable = false)
    private LocalDate debriefDate;

    @Column(name = "what_went_well", columnDefinition = "TEXT")
    private String whatWentWell;

    @Column(name = "what_went_wrong", columnDefinition = "TEXT")
    private String whatWentWrong;

    @Builder.Default
    @Column(name = "energy_rating", nullable = false)
    private int energyRating = 3;

    @Column(name = "tomorrow_notes", columnDefinition = "TEXT")
    private String tomorrowNotes;

    @Builder.Default
    @Column(name = "total_focus_seconds_snapshot", nullable = false)
    private int totalFocusSecondsSnapshot = 0;

    @Builder.Default
    @Column(name = "tasks_completed_count", nullable = false)
    private int tasksCompletedCount = 0;

    @Builder.Default
    @Column(name = "tasks_total_count", nullable = false)
    private int tasksTotalCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

