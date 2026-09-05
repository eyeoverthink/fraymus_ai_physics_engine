package fraymus.core;

public class Transform implements AutoCloseable {
    public Transform() {
        System.out.println("Entered fraymus.core.Transform");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.core.Transform");
    }
}