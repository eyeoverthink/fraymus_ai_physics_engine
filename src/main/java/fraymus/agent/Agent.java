package fraymus.agent;

public class Agent implements AutoCloseable {
    public Agent() {
        System.out.println("Entered fraymus.agent.Agent");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.agent.Agent");
    }
}