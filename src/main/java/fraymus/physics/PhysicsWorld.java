package fraymus.physics;

public class PhysicsWorld implements AutoCloseable {
    public PhysicsWorld() {
        System.out.println("Entered fraymus.physics.PhysicsWorld");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.physics.PhysicsWorld");
    }
}