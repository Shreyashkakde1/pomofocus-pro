package com.pomofocus.pro.repository;

import com.pomofocus.pro.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findAllByUserIdAndIsArchivedFalseOrderBySortOrderAscCreatedAtAsc(UUID userId);
    List<Task> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Task> findByIdAndUserId(UUID id, UUID userId);
    int countByUserIdAndIsArchivedFalse(UUID userId);
}

