package com.cola.agent.a2a;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * A2A Protocol - Agent-to-Agent Communication Protocol
 *
 * Defines the standard interface for agent communication, discovery, and coordination.
 * Supports both synchronous and asynchronous message exchange.
 */
public interface A2AProtocol {

    /**
     * Protocol identifier
     */
    String getProtocolId();

    /**
     * Protocol version
     */
    String getVersion();

    /**
     * Send a message to another agent
     *
     * @param message the message to send
     * @return the response message
     */
    A2AMessage send(A2AMessage message);

    /**
     * Send a message asynchronously
     *
     * @param message the message to send
     * @return CompletableFuture with the response
     */
    CompletableFuture<A2AMessage> sendAsync(A2AMessage message);

    /**
     * Broadcast a message to multiple agents
     *
     * @param message the message to broadcast
     * @param targetAgents list of target agent IDs
     * @return list of responses
     */
    List<A2AMessage> broadcast(A2AMessage message, List<String> targetAgents);

    /**
     * Discover available agents
     *
     * @param capabilities optional capability filter
     * @return list of discovered agent descriptors
     */
    List<AgentDescriptor> discoverAgents(String... capabilities);

    /**
     * Register an agent with the protocol
     *
     * @param descriptor agent descriptor
     * @return true if registration successful
     */
    boolean registerAgent(AgentDescriptor descriptor);

    /**
     * Unregister an agent
     *
     * @param agentId agent ID
     * @return true if unregistration successful
     */
    boolean unregisterAgent(String agentId);

    /**
     * Check if an agent is available
     *
     * @param agentId agent ID
     * @return true if agent is online and available
     */
    boolean isAgentAvailable(String agentId);

    /**
     * Get agent descriptor
     *
     * @param agentId agent ID
     * @return Optional with agent descriptor
     */
    Optional<AgentDescriptor> getAgent(String agentId);

    /**
     * Start the protocol server/client
     */
    void start();

    /**
     * Stop the protocol server/client
     */
    void stop();

    /**
     * Check if protocol is running
     */
    boolean isRunning();
}
