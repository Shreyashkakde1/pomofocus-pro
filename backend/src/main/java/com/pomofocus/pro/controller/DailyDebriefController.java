package com.pomofocus.pro.controller;

import com.pomofocus.pro.dto.DailyDebriefRequest;
import com.pomofocus.pro.dto.DailyDebriefResponse;
import com.pomofocus.pro.service.DailyDebriefService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/daily-debriefs")
@RequiredArgsConstructor
public class DailyDebriefController {

    private final DailyDebriefService dailyDebriefService;

    @GetMapping
    public ResponseEntity<DailyDebriefResponse> getDebrief(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        DailyDebriefResponse response = dailyDebriefService.getDebrief(date);
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<DailyDebriefResponse> saveDebrief(
            @Valid @RequestBody DailyDebriefRequest request,
            @RequestParam(required = false) String timezone,
            @RequestHeader(value = "X-Timezone", required = false) String headerTimezone
    ) {
        String tz = (timezone != null && !timezone.isBlank()) ? timezone : headerTimezone;
        return ResponseEntity.ok(dailyDebriefService.saveDebrief(request, tz));
    }

    @GetMapping("/history")
    public ResponseEntity<List<DailyDebriefResponse>> getHistory() {
        return ResponseEntity.ok(dailyDebriefService.getHistory());
    }
}

