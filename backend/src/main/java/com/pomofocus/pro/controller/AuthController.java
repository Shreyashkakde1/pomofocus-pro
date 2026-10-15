package com.pomofocus.pro.controller;

import com.pomofocus.pro.dto.*;
import com.pomofocus.pro.entity.User;
import com.pomofocus.pro.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.signup(request));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<AuthResponse> resendCode(@Valid @RequestBody ResendCodeRequest request) {
        return ResponseEntity.ok(authService.resendCode(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/demo")
    public ResponseEntity<AuthResponse> demoLogin() {
        return ResponseEntity.ok(authService.demoLogin());
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(authService.toUserDto(currentUser));
    }
}

