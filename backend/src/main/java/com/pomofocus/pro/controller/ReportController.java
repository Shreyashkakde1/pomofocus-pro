package com.pomofocus.pro.controller;

import com.pomofocus.pro.dto.DailyReportResponse;
import com.pomofocus.pro.dto.WeeklyReportResponse;
import com.pomofocus.pro.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<DailyReportResponse> getDailyReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String timezone,
            @RequestHeader(value = "X-Timezone", required = false) String headerTimezone
    ) {
        String tz = (timezone != null && !timezone.isBlank()) ? timezone : headerTimezone;
        return ResponseEntity.ok(reportService.getDailyReport(date, tz));
    }

    @GetMapping("/weekly")
    public ResponseEntity<WeeklyReportResponse> getWeeklyReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String timezone,
            @RequestHeader(value = "X-Timezone", required = false) String headerTimezone
    ) {
        String tz = (timezone != null && !timezone.isBlank()) ? timezone : headerTimezone;
        return ResponseEntity.ok(reportService.getWeeklyReport(startDate, endDate, tz));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportSessions(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) String timezone,
            @RequestHeader(value = "X-Timezone", required = false) String headerTimezone
    ) {
        String tz = (timezone != null && !timezone.isBlank()) ? timezone : headerTimezone;
        String csvData = reportService.generateCsvExport(tz);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"pomofocus_sessions.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData.getBytes());
    }
}

