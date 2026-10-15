package com.pomofocus.pro.repository;

import com.pomofocus.pro.entity.DailyDebrief;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyDebriefRepository extends JpaRepository<DailyDebrief, UUID> {

    Optional<DailyDebrief> findByUserIdAndDebriefDate(UUID userId, LocalDate debriefDate);

    List<DailyDebrief> findAllByUserIdOrderByDebriefDateDesc(UUID userId);
}

