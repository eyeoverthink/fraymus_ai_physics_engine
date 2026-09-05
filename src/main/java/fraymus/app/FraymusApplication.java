package fraymus.app;

import fraymus.core.SimulationClock;
import fraymus.core.World;
import fraymus.renderer.java2d.DesktopWindow;
import java.awt.GraphicsEnvironment;
import java.util.Arrays;

/** Command-line bootstrap for the desktop and headless FRAYMUS applications. */
public final class FraymusApplication {
    private static final int DEFAULT_TICKS = 120;

    private FraymusApplication() {
    }

    public static void main(String[] args) {
        if (Arrays.asList(args).contains("--desktop")) {
            launchDesktop();
            return;
        }
        runHeadless(parseRequestedTicks(args));
    }

    private static void launchDesktop() {
        if (GraphicsEnvironment.isHeadless()) {
            throw new IllegalStateException(
                    "Desktop mode requires a graphical environment; use --headless on this machine");
        }
        DesktopWindow.launch();
    }

    private static void runHeadless(int requestedTicks) {
        SimulationClock clock = new SimulationClock();
        try (DemoWorld demo = DemoWorld.create()) {
            World world = demo.world();
            for (int i = 0; i < requestedTicks; i++) {
                clock.advance(clock.getFixedStepSeconds(), () -> world.step(clock.getFixedStepSeconds()));
            }

            System.out.printf(
                    "FRAYMUS Core ready: mode=headless entities=%d ticks=%d simulationSeconds=%.3f "
                            + "entity=%s position=(%.3f,%.3f) fixedStep=%.6f%n",
                    world.getEntities().size(),
                    clock.getTick(),
                    clock.getSimulationSeconds(),
                    demo.probe().getName(),
                    demo.probe().getTransform().getX(),
                    demo.probe().getTransform().getY(),
                    clock.getFixedStepSeconds());
        }
    }

    private static int parseRequestedTicks(String[] args) {
        if (args.length == 0 || (args.length == 1 && "--headless".equals(args[0]))) {
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
        throw new IllegalArgumentException(
                "Usage: java -jar fraymus.jar [--desktop | --headless | --ticks N]");
    }
}