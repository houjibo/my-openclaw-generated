package com.cola.agent.intent;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Pattern;

/**
 * Intent Analyzer - Analyzes user input to determine intent
 *
 * Uses rule-based pattern matching and keyword analysis
 * Future: Integrate with LLM for more sophisticated analysis
 */
@Slf4j
@Component
public class IntentAnalyzer {

    // Confidence thresholds
    private static final double HIGH_CONFIDENCE = 0.8;
    private static final double MEDIUM_CONFIDENCE = 0.5;

    // Pattern matchers for each intent type
    private final Map<IntentType, List<Pattern>> patterns;
    private final Map<IntentType, List<String>> keywords;

    public IntentAnalyzer() {
        this.patterns = initializePatterns();
        this.keywords = initializeKeywords();
    }

    /**
     * Initialize regex patterns for intent detection
     */
    private Map<IntentType, List<Pattern>> initializePatterns() {
        Map<IntentType, List<Pattern>> map = new EnumMap<>(IntentType.class);

        // QUERY patterns
        map.put(IntentType.QUERY, Arrays.asList(
            Pattern.compile("^(what|who|when|where|why|how|tell me|explain|describe)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("^(can you|could you|would you).*(tell|explain|show)", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*\\?$"),
            Pattern.compile("(information about|details on|learn about)", Pattern.CASE_INSENSITIVE)
        ));

        // EXECUTE patterns
        map.put(IntentType.EXECUTE, Arrays.asList(
            Pattern.compile("^(create|make|build|generate|write|update|delete|remove|add)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("^(please|can you|could you).*(create|make|build|generate|write)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("^(run|execute|perform|do|implement)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(create a|build a|generate a|write a)", Pattern.CASE_INSENSITIVE)
        ));

        // EXPLORE patterns
        map.put(IntentType.EXPLORE, Arrays.asList(
            Pattern.compile("^(explore|research|investigate|analyze|study|deep dive)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(trends|landscape|ecosystem|overview|survey)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(comprehensive|detailed|thorough|in-depth)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(compare|contrast|evaluate|assess)", Pattern.CASE_INSENSITIVE)
        ));

        // COLLABORATE patterns
        map.put(IntentType.COLLABORATE, Arrays.asList(
            Pattern.compile("^(coordinate|collaborate|work with|ask|contact)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(help me|assist me|work together|team up)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(with.*agent|with.*assistant|with.*expert)", Pattern.CASE_INSENSITIVE)
        ));

        // REMEMBER patterns
        map.put(IntentType.REMEMBER, Arrays.asList(
            Pattern.compile("^(remember|save|store|note|record)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(don't forget|keep in mind|make sure to remember)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(add to memory|save to memory|store in memory)", Pattern.CASE_INSENSITIVE)
        ));

        // NEGOTIATE patterns
        map.put(IntentType.NEGOTIATE, Arrays.asList(
            Pattern.compile("^(actually|wait|no|not|instead|rather|i meant)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(i didn't mean|that's not what|what i meant was)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(clarify|correction|let me rephrase)", Pattern.CASE_INSENSITIVE)
        ));

        return map;
    }

    /**
     * Initialize keywords for intent detection
     */
    private Map<IntentType, List<String>> initializeKeywords() {
        Map<IntentType, List<String>> map = new EnumMap<>(IntentType.class);

        map.put(IntentType.QUERY, Arrays.asList(
            "what", "who", "when", "where", "why", "how", "tell me", "explain",
            "describe", "information", "details", "about", "learn", "understand"
        ));

        map.put(IntentType.EXECUTE, Arrays.asList(
            "create", "make", "build", "generate", "write", "update", "delete",
            "remove", "add", "run", "execute", "perform", "do", "implement",
            "develop", "code", "script", "configure", "setup"
        ));

        map.put(IntentType.EXPLORE, Arrays.asList(
            "explore", "research", "investigate", "analyze", "study", "deep dive",
            "trends", "landscape", "ecosystem", "overview", "survey", "compare",
            "contrast", "evaluate", "assess", "review", "examine"
        ));

        map.put(IntentType.COLLABORATE, Arrays.asList(
            "coordinate", "collaborate", "work with", "ask", "contact", "help",
            "assist", "work together", "team up", "engage", "involve"
        ));

        map.put(IntentType.REMEMBER, Arrays.asList(
            "remember", "save", "store", "note", "record", "keep", "retain",
            "preserve", "archive", "log", "document"
        ));

        map.put(IntentType.NEGOTIATE, Arrays.asList(
            "actually", "wait", "no", "not", "instead", "rather", "meant",
            "clarify", "correction", "rephrase", "revise", "modify"
        ));

        return map;
    }

    /**
     * Analyze user input and determine intent
     */
    public Intent analyze(String input) {
        if (input == null || input.trim().isEmpty()) {
            return Intent.unknown(input);
        }

        String normalized = input.trim().toLowerCase();
        log.debug("Analyzing intent for: {}", normalized);

        // Calculate scores for each intent type
        Map<IntentType, Double> scores = calculateScores(normalized);

        // Find best match
        IntentType bestType = IntentType.UNKNOWN;
        double bestScore = 0.0;

        for (Map.Entry<IntentType, Double> entry : scores.entrySet()) {
            if (entry.getValue() > bestScore) {
                bestScore = entry.getValue();
                bestType = entry.getKey();
            }
        }

        // Build intent
        Intent.IntentBuilder builder = Intent.builder()
                .type(bestType)
                .confidence(bestScore)
                .originalInput(input)
                .analysisMethod("rule-based");

        // Extract parameters and entities
        builder.parameters(extractParameters(normalized, bestType));
        builder.entities(extractEntities(normalized));

        // Add alternatives
        Intent intent = builder.build();
        scores.forEach((type, score) -> {
            if (type != bestType && score > 0.3) {
                intent.addAlternative(type, score);
            }
        });

        log.info("Intent analyzed: {} (confidence: {})", bestType, bestScore);
        return intent;
    }

    /**
     * Calculate confidence scores for all intent types
     */
    private Map<IntentType, Double> calculateScores(String input) {
        Map<IntentType, Double> scores = new EnumMap<>(IntentType.class);

        for (IntentType type : IntentType.values()) {
            if (type == IntentType.UNKNOWN) continue;

            double score = 0.0;

            // Pattern matching score
            List<Pattern> typePatterns = patterns.getOrDefault(type, Collections.emptyList());
            for (Pattern pattern : typePatterns) {
                if (pattern.matcher(input).find()) {
                    score += 0.4; // High weight for pattern match
                }
            }

            // Keyword matching score
            List<String> typeKeywords = keywords.getOrDefault(type, Collections.emptyList());
            int keywordMatches = 0;
            for (String keyword : typeKeywords) {
                if (input.contains(keyword.toLowerCase())) {
                    keywordMatches++;
                }
            }
            score += Math.min(keywordMatches * 0.1, 0.4); // Cap at 0.4

            // Question mark bonus for QUERY
            if (type == IntentType.QUERY && input.endsWith("?")) {
                score += 0.2;
            }

            scores.put(type, Math.min(score, 1.0));
        }

        return scores;
    }

    /**
     * Extract parameters based on intent type
     */
    private Map<String, Object> extractParameters(String input, IntentType type) {
        Map<String, Object> params = new HashMap<>();

        switch (type) {
            case EXECUTE:
                // Extract action verb
                String[] actionVerbs = {"create", "make", "build", "generate", "write", 
                                       "update", "delete", "remove", "add", "run", "execute"};
                for (String verb : actionVerbs) {
                    if (input.contains(verb)) {
                        params.put("action", verb);
                        break;
                    }
                }
                // Extract target (what to create/update/etc.)
                Pattern targetPattern = Pattern.compile("(create|make|build|generate|write|update|delete|remove|add)\\s+(?:a|an|the)?\\s*(\\w+)");
                java.util.regex.Matcher matcher = targetPattern.matcher(input);
                if (matcher.find()) {
                    params.put("target", matcher.group(2));
                }
                break;

            case QUERY:
                // Extract topic (what is being asked about)
                Pattern topicPattern = Pattern.compile("(?:about|regarding|concerning)\\s+(\\w+)");
                java.util.regex.Matcher topicMatcher = topicPattern.matcher(input);
                if (topicMatcher.find()) {
                    params.put("topic", topicMatcher.group(1));
                }
                break;

            case EXPLORE:
                // Extract domain or topic
                Pattern domainPattern = Pattern.compile("(?:explore|research|analyze)\\s+(?:the)?\\s*(\\w+)");
                java.util.regex.Matcher domainMatcher = domainPattern.matcher(input);
                if (domainMatcher.find()) {
                    params.put("domain", domainMatcher.group(1));
                }
                break;

            default:
                break;
        }

        return params;
    }

    /**
     * Extract entities (names, dates, topics, etc.)
     */
    private Map<String, String> extractEntities(String input) {
        Map<String, String> entities = new HashMap<>();

        // Extract quoted strings
        Pattern quotePattern = Pattern.compile("\"([^\"]+)\"");
        java.util.regex.Matcher quoteMatcher = quotePattern.matcher(input);
        int quoteCount = 0;
        while (quoteMatcher.find()) {
            entities.put("quoted_" + (++quoteCount), quoteMatcher.group(1));
        }

        // Extract file paths (simple heuristic)
        Pattern pathPattern = Pattern.compile("(\\w+\\.\\w+)");
        java.util.regex.Matcher pathMatcher = pathPattern.matcher(input);
        if (pathMatcher.find()) {
            entities.put("file", pathMatcher.group(1));
        }

        return entities;
    }

    /**
     * Batch analyze multiple inputs
     */
    public List<Intent> analyzeBatch(List<String> inputs) {
        List<Intent> intents = new ArrayList<>();
        for (String input : inputs) {
            intents.add(analyze(input));
        }
        return intents;
    }

    /**
     * Quick check if input matches a specific intent type
     */
    public boolean matches(String input, IntentType type) {
        Intent intent = analyze(input);
        return intent.getType() == type && intent.isHighConfidence();
    }
}
