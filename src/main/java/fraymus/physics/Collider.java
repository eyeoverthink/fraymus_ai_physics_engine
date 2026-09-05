package fraymus.physics;

public class Collider implements AutoCloseable {
    public Collider() {
        System.out.println("Entered fraymus.physics.Collider");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.physics.Collider");
    }
}