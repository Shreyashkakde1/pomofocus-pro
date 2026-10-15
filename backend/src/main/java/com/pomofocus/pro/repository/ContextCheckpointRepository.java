package com.pomofocus.pro.repository;

import com.pomofocus.pro.entity.ContextCheckpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContextCheckpointRepository extends JpaRepository<ContextCheckpoint, UUID> {
    Optional<ContextCheckpoint> findTopByTaskIdOrderByCreatedAtDesc(UUID taskId);
    List<ContextCheckpoint> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    List<ContextCheckpoint> findAllByTaskIdOrderByCreatedAtDesc(UUID taskId);
}

