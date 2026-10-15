package com.pomofocus.pro.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TaskRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category = "General";

    @Pattern(regexp = "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", message = "Color must be a valid hex color code (e.g. #3157f6)")
    private String colorHex = "#3157f6";

    @Min(value = 1, message = "Daily target must be at least 1 minute")
    @Max(value = 1440, message = "Daily target cannot exceed 24 hours (1440 minutes)")
    private int dailyTargetMinutes = 60;

    @Min(value = 0, message = "Sort order cannot be negative")
    private int sortOrder = 0;
}

