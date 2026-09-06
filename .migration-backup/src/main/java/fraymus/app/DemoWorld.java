package fraymus.app;

import fraymus.core.Component;
import fraymus.core.Entity;
import fraymus.core.Transform;
import fraymus.core.World;
import fraymus.renderer.java2d.Primitive2D;
import java.awt.Color;

/** Creates the demonstration simulation shared by desktop and headless launch modes. */
public final class DemoWorld implements AutoCloseable {
    private final World world;
    private final Entity probe;

    private DemoWorld(World world, Entity probe) {
        this.world = world;
        this.probe = probe;
    }

    public static DemoWorld create() {
        World world = new World();
        Entity probe = world.addEntity(new Entity("Moving probe", new Transform(-3.0, 0.0)));
        probe.getTransform().setScale(1.5, 1.5).setRotation(Math.toRadians(12.0));
        probe.addComponent(new ConstantVelocity(0.8, 0.0));
        probe.addComponent(Primitive2D.rectangle(1.5, 1.0, new Color(84, 181, 255)));

        Entity origin = world.addEntity(new Entity("Origin", new Transform(0.0, 0.0)));
        origin.addComponent(Primitive2D.circle(0.18, new Color(255, 196, 92)));
        return new DemoWorld(world, probe);
    }

    public World world() {
        return world;
    }

    public Entity probe() {
        return probe;
    }

    @Override
    public void close() {
        world.close();
    }

    private static final class ConstantVelocity extends Component {
        private final double velocityX;
        private final double velocityY;

        private ConstantVelocity(double velocityX, double velocityY) {
            this.velocityX = velocityX;
            this.velocityY = velocityY;
        }

        @Override
        protected void update(double fixedStepSeconds) {
            getEntity().getTransform().translate(
                    velocityX * fixedStepSeconds,
                    velocityY * fixedStepSeconds);
        }
    }
}