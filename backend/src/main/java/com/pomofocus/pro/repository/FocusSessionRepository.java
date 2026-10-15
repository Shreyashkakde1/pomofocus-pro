package com.pomofocus.pro.repository;

import com.pomofocus.pro.entity.FocusSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession, UUID> {

    @Query("SELECT fs FROM FocusSession fs WHERE fs.user.id = :userId AND fs.startTime >= :start AND fs.startTime < :end ORDER BY fs.startTime ASC")
    List<FocusSession> findSessionsForUserBetween(
            @Param("userId") UUID userId,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    @Query("SELECT fs FROM FocusSession fs WHERE fs.user.id = :userId AND fs.task.id = :taskId AND fs.startTime >= :start AND fs.startTime < :end")
    List<FocusSession> findSessionsForUserAndTaskBetween(
            @Param("userId") UUID userId,
            @Param("taskId") UUID taskId,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    @Query("SELECT COALESCE(SUM(fs.durationSeconds), 0) FROM FocusSession fs WHERE fs.user.id = :userId AND fs.task.id = :taskId AND fs.sessionType = 'FOCUS' AND fs.startTime >= :start AND fs.startTime < :end")
    Integer sumFocusSecondsForTaskBetween(
            @Param("userId") UUID userId,
            @Param("taskId") UUID taskId,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    @Query("SELECT COALESCE(SUM(fs.durationSeconds), 0) FROM FocusSession fs WHERE fs.user.id = :userId AND fs.sessionType = 'FOCUS' AND fs.startTime >= :start AND fs.startTime < :end")
    Integer sumFocusSecondsForUserBetween(
            @Param("userId") UUID userId,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    List<FocusSession> findAllByUserIdOrderByStartTimeDesc(UUID userId);
}

