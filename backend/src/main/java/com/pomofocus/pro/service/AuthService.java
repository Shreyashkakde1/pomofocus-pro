package com.pomofocus.pro.service;

import com.pomofocus.pro.dto.*;
import com.pomofocus.pro.entity.User;
import com.pomofocus.pro.entity.VerificationToken;
import com.pomofocus.pro.exception.ApiException;
import com.pomofocus.pro.exception.ResourceNotFoundException;
import com.pomofocus.pro.repository.UserRepository;
import com.pomofocus.pro.repository.VerificationTokenRepository;
import com.pomofocus.pro.security.JwtService;
import com.pomofocus.pro.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            User existing = userRepository.findByEmail(request.getEmail().trim().toLowerCase()).orElseThrow();
            if (existing.isVerified()) {
                throw new ApiException("An account with this email is already verified. Please sign in.", HttpStatus.CONFLICT);
            }
            // If user exists but is unverified, update credentials & issue new OTP
            existing.setUsername(request.getUsername().trim());
            existing.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            userRepository.save(existing);
            OtpResult result = sendOtpForUser(existing);
            String message = result.sent()
                    ? "Verification code dispatched via Resend to " + existing.getEmail()
                    : "Passcode generated! Your 6-digit verification code is: " + result.otp();
            return AuthResponse.builder()
                    .status("PENDING_VERIFICATION")
                    .message(message)
                    .user(toUserDto(existing))
                    .build();
        }

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .username(request.getUsername().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .authProvider("LOCAL")
                .isVerified(false)
                .build();

        user = userRepository.save(user);
        OtpResult result = sendOtpForUser(user);
        String message = result.sent()
                ? "Verification code dispatched via Resend to " + user.getEmail()
                : "Passcode generated! Your 6-digit verification code is: " + result.otp();

        return AuthResponse.builder()
                .status("PENDING_VERIFICATION")
                .message(message)
                .user(toUserDto(user))
                .build();
    }

    private record OtpResult(String otp, boolean sent) {}

    private OtpResult sendOtpForUser(User user) {
        String otp = String.format("%06d", RANDOM.nextInt(1000000));
        Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);

        tokenRepository.deleteAllByUser(user);

        VerificationToken token = VerificationToken.builder()
                .user(user)
                .otpCode(otp)
                .expiresAt(expiresAt)
                .attemptsCount(0)
                .build();

        tokenRepository.save(token);
        boolean sent = emailService.sendVerificationOtp(user.getEmail(), user.getUsername(), otp);
        return new OtpResult(otp, sent);
    }

    @Transactional
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found for email: " + email));

        if (user.isVerified()) {
            UserPrincipal principal = new UserPrincipal(user);
            String token = jwtService.generateToken(principal, user.getId());
            return AuthResponse.builder()
                    .token(token)
                    .status("ALREADY_VERIFIED")
                    .message("Account is already verified")
                    .user(toUserDto(user))
                    .build();
        }

        VerificationToken token = tokenRepository.findTopByUserOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new ApiException("No pending verification request found. Please request a new code.", HttpStatus.BAD_REQUEST));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException("Verification code has expired. Please request a new code.", HttpStatus.BAD_REQUEST);
        }

        if (token.getAttemptsCount() >= 5) {
            throw new ApiException("Too many invalid attempts. Please request a fresh code.", HttpStatus.TOO_MANY_REQUESTS);
        }

        if (!token.getOtpCode().equals(request.getOtp().trim())) {
            token.setAttemptsCount(token.getAttemptsCount() + 1);
            tokenRepository.save(token);
            throw new ApiException("Invalid verification code. Please check and try again.", HttpStatus.BAD_REQUEST);
        }

        user.setVerified(true);
        userRepository.save(user);
        tokenRepository.deleteAllByUser(user);

        UserPrincipal principal = new UserPrincipal(user);
        String jwtToken = jwtService.generateToken(principal, user.getId());

        return AuthResponse.builder()
                .token(jwtToken)
                .status("VERIFIED")
                .message("Account verified successfully")
                .user(toUserDto(user))
                .build();
    }

    @Transactional
    public AuthResponse resendCode(ResendCodeRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found for email: " + email));

        if (user.isVerified()) {
            throw new ApiException("Account is already verified. Please sign in.", HttpStatus.BAD_REQUEST);
        }

        OtpResult result = sendOtpForUser(user);
        String message = result.sent()
                ? "Fresh verification code sent to " + user.getEmail()
                : "Fresh code generated! Your 6-digit verification code is: " + result.otp();

        return AuthResponse.builder()
                .status("PENDING_VERIFICATION")
                .message(message)
                .user(toUserDto(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("Invalid email or password", HttpStatus.UNAUTHORIZED));

        if (!user.isVerified()) {
            throw new ApiException("Your account email has not been verified yet. Please complete OTP verification.", HttpStatus.FORBIDDEN);
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        UserPrincipal principal = new UserPrincipal(user);
        String jwtToken = jwtService.generateToken(principal, user.getId());

        return AuthResponse.builder()
                .token(jwtToken)
                .status("AUTHENTICATED")
                .message("Login successful")
                .user(toUserDto(user))
                .build();
    }

    @Transactional
    public AuthResponse demoLogin() {
        String demoEmail = "demo@pomofocus.pro";
        User demoUser = userRepository.findByEmail(demoEmail).orElseGet(() -> {
            User user = User.builder()
                    .email(demoEmail)
                    .username("CyberRunner")
                    .passwordHash(passwordEncoder.encode("password123"))
                    .authProvider("LOCAL")
                    .isVerified(true)
                    .build();
            return userRepository.save(user);
        });

        UserPrincipal principal = new UserPrincipal(demoUser);
        String jwtToken = jwtService.generateToken(principal, demoUser.getId());

        return AuthResponse.builder()
                .token(jwtToken)
                .status("AUTHENTICATED")
                .message("Demo operator terminal initialized")
                .user(toUserDto(demoUser))
                .build();
    }

    public User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ApiException("Unauthorized request", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public UserDto toUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .authProvider(user.getAuthProvider())
                .avatarUrl(user.getAvatarUrl())
                .isVerified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

