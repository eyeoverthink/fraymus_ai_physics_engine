package fraymus.agent;

public class Action implements AutoCloseable {
    public Action() {
        System.out.println("Entered fraymus.agent.Action");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.agent.Action");
    }
}