package com.pomofocus.pro.repository;

import com.pomofocus.pro.entity.User;
import com.pomofocus.pro.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {
    Optional<VerificationToken> findTopByUserOrderByCreatedAtDesc(User user);
    Optional<VerificationToken> findTopByUserAndOtpCodeOrderByCreatedAtDesc(User user, String otpCode);
    void deleteAllByUser(User user);
    void deleteByExpiresAtBefore(Instant now);
}

