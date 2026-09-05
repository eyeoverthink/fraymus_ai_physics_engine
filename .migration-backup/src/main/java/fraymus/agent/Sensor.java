package fraymus.agent;

public class Sensor implements AutoCloseable {
    public Sensor() {
        System.out.println("Entered fraymus.agent.Sensor");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.agent.Sensor");
    }
}