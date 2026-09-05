package fraymus.app;

import fraymus.core.SimulationClock;

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

        for (int i = 0; i < requestedTicks; i++) {
            clock.advance(clock.getFixedStepSeconds(), () -> {
                // Simulation systems will be advanced here, one fixed step at a time.
            });
        }

        System.out.printf(
                "FRAYMUS Core ready: mode=headless ticks=%d simulationSeconds=%.3f fixedStep=%.6f%n",
                clock.getTick(),
                clock.getSimulationSeconds(),
                clock.getFixedStepSeconds());
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
}