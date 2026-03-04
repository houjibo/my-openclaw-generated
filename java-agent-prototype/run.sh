#!/bin/bash

# Java Agent Prototype - Startup Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Java Agent Prototype"
echo "========================================"
echo ""

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 25 ]; then
    echo -e "${RED}Error: Java 25 or higher is required${NC}"
    echo "Current version: $JAVA_VERSION"
    exit 1
fi
echo -e "${GREEN}✓ Java version: $JAVA_VERSION${NC}"

# Check environment variables
if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}Warning: No LLM API key found${NC}"
    echo "Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable"
    echo ""
    echo "Example:"
    echo "  export OPENAI_API_KEY=your-key-here"
    echo ""
fi

# Compile
echo "Compiling project..."
mvn clean package -q

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Compilation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Compilation successful${NC}"
echo ""

# Run
echo "Starting application..."
echo "========================================"
java -jar target/java-agent-prototype-0.1.0.jar
