package fraymus.agent;

public class Memory implements AutoCloseable {
    public Memory() {
        System.out.println("Entered fraymus.agent.Memory");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.agent.Memory");
    }
}