package fraymus.core;

public class Entity implements AutoCloseable {
    public Entity() {
        System.out.println("Entered fraymus.core.Entity");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.core.Entity");
    }
}