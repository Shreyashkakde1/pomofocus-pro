package com.pomofocus.pro;

import com.pomofocus.pro.entity.TaskTimerState;
import com.pomofocus.pro.repository.TaskTimerStateRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

// Needs the database, like PomofocusProApplicationTests. Uses the demo user and targets seeded by V1.
@SpringBootTest
@Transactional
class TimerStateRepositoryTests {

    private static final UUID DEMO_USER = UUID.fromString("a0000000-0000-0000-0000-000000000001");
    private static final UUID DEMO_TASK = UUID.fromString("b0000000-0000-0000-0000-000000000001");

    @Autowired
    private TaskTimerStateRepository repository;

    @Autowired
    private EntityManager entityManager;

    private List<TaskTimerState> states() {
        entityManager.clear();
        return repository.findAllByIdUserIdOrderByUpdatedAtDesc(DEMO_USER);
    }

    @Test
    void upsertInsertsThenOverwritesTheSameRow() {
        repository.upsert(DEMO_USER, DEMO_TASK, 8400, 10800);
        repository.upsert(DEMO_USER, DEMO_TASK, 7800, 10800);

        List<TaskTimerState> states = states();
        assertEquals(1, states.size());
        assertEquals(7800, states.get(0).getRemainingSeconds());
        assertEquals(10800, states.get(0).getDurationSeconds());
        assertNotNull(states.get(0).getUpdatedAt());
    }

    @Test
    void deleteRemovesTheRowAndRepeatingItIsHarmless() {
        repository.upsert(DEMO_USER, DEMO_TASK, 8400, 10800);

        repository.deleteForUserAndTask(DEMO_USER, DEMO_TASK);
        repository.deleteForUserAndTask(DEMO_USER, DEMO_TASK);

        assertTrue(states().isEmpty());
    }
}
