package com.pomofocus.pro.repository;

import com.pomofocus.pro.entity.DailyTask;
import com.pomofocus.pro.entity.PriorityTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyTaskRepository extends JpaRepository<DailyTask, UUID> {

    List<DailyTask> findAllByUserIdAndPlannedDateOrderBySortOrderAscCreatedAtAsc(UUID userId, LocalDate plannedDate);

    List<DailyTask> findAllByUserIdAndPlannedDateAndPriorityTierOrderBySortOrderAscCreatedAtAsc(
            UUID userId, LocalDate plannedDate, PriorityTier priorityTier);

    Optional<DailyTask> findByIdAndUserId(UUID id, UUID userId);

    int countByUserIdAndPlannedDate(UUID userId, LocalDate plannedDate);

    int countByUserIdAndPlannedDateAndIsCompletedTrue(UUID userId, LocalDate plannedDate);

    List<DailyTask> findAllByUserIdAndPlannedDateAndIsCompletedFalse(UUID userId, LocalDate plannedDate);
}

