package fraymus.core;

public class World implements AutoCloseable {
    public World() {
        System.out.println("Entered fraymus.core.World");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.core.World");
    }
}