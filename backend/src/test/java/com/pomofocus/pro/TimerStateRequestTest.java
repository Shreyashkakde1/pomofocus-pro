package com.pomofocus.pro;

import com.pomofocus.pro.dto.TimerStateRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class TimerStateRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private TimerStateRequest request(Integer remaining, Integer duration) {
        TimerStateRequest request = new TimerStateRequest();
        request.setRemainingSeconds(remaining);
        request.setDurationSeconds(duration);
        return request;
    }

    @ParameterizedTest
    @CsvSource({"1,1", "8400,10800", "86400,86400"})
    void acceptsValidState(int remaining, int duration) {
        assertTrue(validator.validate(request(remaining, duration)).isEmpty());
    }

    @ParameterizedTest
    @CsvSource({"0,100", "-1,100", "100,0", "101,100", "86401,86401", ",100", "100,"})
    void rejectsInvalidState(Integer remaining, Integer duration) {
        assertFalse(validator.validate(request(remaining, duration)).isEmpty());
    }
}
