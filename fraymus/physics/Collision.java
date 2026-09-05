package fraymus.physics;

public class Collision implements AutoCloseable {
    public Collision() {
        System.out.println("Entered fraymus.physics.Collision");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.physics.Collision");
    }
}