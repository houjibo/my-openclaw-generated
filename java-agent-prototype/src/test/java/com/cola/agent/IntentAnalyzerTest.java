package com.cola.agent;

import com.cola.agent.intent.Intent;
import com.cola.agent.intent.IntentAnalyzer;
import com.cola.agent.intent.IntentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class IntentAnalyzerTest {

    private IntentAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new IntentAnalyzer();
    }

    @Test
    void testQueryIntent() {
        Intent intent = analyzer.analyze("What is Java 25?");
        assertEquals(IntentType.QUERY, intent.getType());
        assertTrue(intent.getConfidence() > 0.5);
    }

    @Test
    void testExecuteIntent() {
        Intent intent = analyzer.analyze("Create a new agent");
        assertEquals(IntentType.EXECUTE, intent.getType());
        assertTrue(intent.getConfidence() > 0.5);
        assertEquals("create", intent.getParameter("action"));
        assertEquals("agent", intent.getParameter("target"));
    }

    @Test
    void testExploreIntent() {
        Intent intent = analyzer.analyze("Explore AI trends");
        assertEquals(IntentType.EXPLORE, intent.getType());
        assertTrue(intent.getConfidence() > 0.5);
    }

    @Test
    void testRememberIntent() {
        Intent intent = analyzer.analyze("Remember this decision");
        assertEquals(IntentType.REMEMBER, intent.getType());
        assertTrue(intent.getConfidence() > 0.5);
    }

    @Test
    void testEmptyInput() {
        Intent intent = analyzer.analyze("");
        assertEquals(IntentType.UNKNOWN, intent.getType());
        assertEquals(0.0, intent.getConfidence());
    }

    @Test
    void testHighConfidence() {
        Intent intent = analyzer.analyze("Create a new file");
        assertTrue(intent.isHighConfidence() || intent.isMediumConfidence());
    }
}
