package com.pomofocus.pro.repository;

import com.pomofocus.pro.entity.TaskTimerState;
import com.pomofocus.pro.entity.TaskTimerStateId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskTimerStateRepository extends JpaRepository<TaskTimerState, TaskTimerStateId> {

    List<TaskTimerState> findAllByIdUserIdOrderByUpdatedAtDesc(UUID userId);

    // An atomic upsert: two devices saving a target's first state at once must not fail.
    @Modifying
    @Query(value = """
            INSERT INTO task_timer_states (user_id, task_id, remaining_seconds, duration_seconds, updated_at)
            VALUES (:userId, :taskId, :remainingSeconds, :durationSeconds, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, task_id) DO UPDATE
            SET remaining_seconds = EXCLUDED.remaining_seconds,
                duration_seconds = EXCLUDED.duration_seconds,
                updated_at = EXCLUDED.updated_at
            """, nativeQuery = true)
    void upsert(@Param("userId") UUID userId,
                @Param("taskId") UUID taskId,
                @Param("remainingSeconds") int remainingSeconds,
                @Param("durationSeconds") int durationSeconds);

    @Modifying
    @Query("DELETE FROM TaskTimerState s WHERE s.id.userId = :userId AND s.id.taskId = :taskId")
    void deleteForUserAndTask(@Param("userId") UUID userId, @Param("taskId") UUID taskId);
}
