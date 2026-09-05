package fraymus.core;

public class SimulationClock implements AutoCloseable {
    public SimulationClock() {
        System.out.println("Entered fraymus.core.SimulationClock");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.core.SimulationClock");
    }
}