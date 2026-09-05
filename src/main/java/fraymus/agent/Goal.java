package fraymus.agent;

public class Goal implements AutoCloseable {
    public Goal() {
        System.out.println("Entered fraymus.agent.Goal");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.agent.Goal");
    }
}