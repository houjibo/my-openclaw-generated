package com.cola.agent.intent;

/**
 * Intent Type - Classification of user intents
 *
 * Defines the primary purpose of a user's message
 */
public enum IntentType {

    /**
     * QUERY - Information seeking
     * User wants to know something
     * Examples: "What is A2A Protocol?", "Tell me about Java 25"
     */
    QUERY("query"),

    /**
     * EXECUTE - Task execution
     * User wants to perform an action
     * Examples: "Create a new agent", "Update MEMORY.md"
     */
    EXECUTE("execute"),

    /**
     * EXPLORE - Deep exploration
     * User wants to research or explore a topic
     * Examples: "Explore the metaverse trends", "Analyze the intent economy"
     */
    EXPLORE("explore"),

    /**
     * COLLABORATE - Collaboration request
     * User wants to work with agents or humans
     * Examples: "Coordinate with researcher agent", "Ask the assistant for help"
     */
    COLLABORATE("collaborate"),

    /**
     * REMEMBER - Memory storage
     * User wants to store information
     * Examples: "Remember this decision", "Save this to memory"
     */
    REMEMBER("remember"),

    /**
     * NEGOTIATE - Intent negotiation
     * User wants to clarify or refine intent
     * Examples: "I didn't mean X, I meant Y", "Actually, what I want is..."
     */
    NEGOTIATE("negotiate"),

    /**
     * UNKNOWN - Unknown intent
     * Could not classify the intent
     */
    UNKNOWN("unknown");

    private final String value;

    IntentType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    /**
     * Parse intent type from string value
     */
    public static IntentType fromString(String value) {
        if (value == null || value.isBlank()) {
            return UNKNOWN;
        }

        for (IntentType type : values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }

        return UNKNOWN;
    }
}
