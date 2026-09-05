package fraymus.core;

public class Component implements AutoCloseable {
    public Component() {
        System.out.println("Entered fraymus.core.Component");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.core.Component");
    }
}