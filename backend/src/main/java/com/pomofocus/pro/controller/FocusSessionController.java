package com.pomofocus.pro.controller;

import com.pomofocus.pro.dto.LogSessionRequest;
import com.pomofocus.pro.dto.SessionResponse;
import com.pomofocus.pro.service.FocusSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class FocusSessionController {

    private final FocusSessionService sessionService;

    @PostMapping
    public ResponseEntity<SessionResponse> logSession(@Valid @RequestBody LogSessionRequest request) {
        return ResponseEntity.ok(sessionService.logSession(request));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<SessionResponse>> getRecentSessions() {
        return ResponseEntity.ok(sessionService.getRecentSessions());
    }
}

