package fraymus.physics;

public class Rigidbody implements AutoCloseable {
    public Rigidbody() {
        System.out.println("Entered fraymus.physics.Rigidbody");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.physics.Rigidbody");
    }
}