package com.pomofocus.pro;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pomofocus.pro.dto.DailyTaskResponse;
import com.pomofocus.pro.dto.SessionResponse;
import com.pomofocus.pro.dto.TaskResponse;
import com.pomofocus.pro.dto.UserDto;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class DailyTaskResponseTest {

    @Test
    void testDailyTaskSerializationAndDeserialization() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        DailyTaskResponse response = DailyTaskResponse.builder()
                .isCompleted(true)
                .title("Test Task")
                .build();
        String json = mapper.writeValueAsString(response);
        assertTrue(json.contains("\"isCompleted\":true"), "JSON must contain isCompleted:true");

        DailyTaskResponse fromIsCompleted = mapper.readValue("{\"isCompleted\":true,\"title\":\"T1\"}", DailyTaskResponse.class);
        assertTrue(fromIsCompleted.isCompleted(), "Must deserialize isCompleted");

        DailyTaskResponse fromCompleted = mapper.readValue("{\"completed\":true,\"title\":\"T2\"}", DailyTaskResponse.class);
        assertTrue(fromCompleted.isCompleted(), "Must deserialize completed fallback");
    }

    @Test
    void testOtherDtoBooleanSerialization() throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        SessionResponse session = SessionResponse.builder().isCompleted(true).build();
        String sessionJson = mapper.writeValueAsString(session);
        assertTrue(sessionJson.contains("\"isCompleted\":true"));
        SessionResponse fromSession = mapper.readValue("{\"completed\":true}", SessionResponse.class);
        assertTrue(fromSession.isCompleted());

        TaskResponse task = TaskResponse.builder().isArchived(true).build();
        String taskJson = mapper.writeValueAsString(task);
        assertTrue(taskJson.contains("\"isArchived\":true"));
        TaskResponse fromTask = mapper.readValue("{\"archived\":true}", TaskResponse.class);
        assertTrue(fromTask.isArchived());

        UserDto user = UserDto.builder().isVerified(true).build();
        String userJson = mapper.writeValueAsString(user);
        assertTrue(userJson.contains("\"isVerified\":true"));
        UserDto fromUser = mapper.readValue("{\"verified\":true}", UserDto.class);
        assertTrue(fromUser.isVerified());
    }
}
