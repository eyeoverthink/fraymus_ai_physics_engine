package fraymus.app;

import fraymus.core.SimulationClock;
import fraymus.core.Component;
import fraymus.core.Entity;
import fraymus.core.World;

/**
 * Headless bootstrap for the renderer-independent FRAYMUS Core.
 *
 * <p>This deliberately exercises the same deterministic clock that future
 * renderer adapters and simulations will use, without pulling legacy OpenGL
 * dependencies into the core module.</p>
 */
public final class FraymusApplication {
    private static final int DEFAULT_TICKS = 120;

    private FraymusApplication() {
    }

    public static void main(String[] args) {
        int requestedTicks = parseRequestedTicks(args);
        SimulationClock clock = new SimulationClock();
        try (World world = new World()) {
            Entity probe = world.addEntity(new Entity("Headless probe"));
            probe.addComponent(new ConstantVelocity(3.0, -1.5));

            for (int i = 0; i < requestedTicks; i++) {
                clock.advance(clock.getFixedStepSeconds(), () -> world.step(clock.getFixedStepSeconds()));
            }

            System.out.printf(
                    "FRAYMUS Core ready: mode=headless entities=%d ticks=%d simulationSeconds=%.3f "
                            + "probe=(%.3f,%.3f) fixedStep=%.6f%n",
                    world.getEntities().size(),
                    clock.getTick(),
                    clock.getSimulationSeconds(),
                    probe.getTransform().getX(),
                    probe.getTransform().getY(),
                    clock.getFixedStepSeconds());
        }
    }

    private static int parseRequestedTicks(String[] args) {
        if (args.length == 0 || "--headless".equals(args[0])) {
            return DEFAULT_TICKS;
        }

        if (args.length == 2 && "--ticks".equals(args[0])) {
            try {
                int ticks = Integer.parseInt(args[1]);
                if (ticks < 0) {
                    throw new IllegalArgumentException("--ticks must be zero or greater");
                }
                return ticks;
            } catch (NumberFormatException exception) {
                throw new IllegalArgumentException("--ticks must be an integer", exception);
            }
        }

        throw new IllegalArgumentException("Usage: java -jar fraymus.jar [--headless | --ticks N]");
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