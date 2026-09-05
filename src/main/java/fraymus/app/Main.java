package fraymus.app;

import fraymus.core.SimulationClock;
import fraymus.render.HeadlessSurface;
import fraymus.render.RenderSurface;
import fraymus.render.SwingWindow;
import java.awt.GraphicsEnvironment;

/**
 * FOUNDATION-003/004 entry point. The loop below is identical whether it is
 * driving a real window or a headless surface — only the RenderSurface
 * implementation changes.
 */
public final class Main {
    private static final int HEADLESS_TICKS = 60;

    public static void main(String[] args) {
        boolean headless = hasFlag(args, "--headless") || GraphicsEnvironment.isHeadless();
        RenderSurface surface = headless
                ? new HeadlessSurface()
                : new SwingWindow(1920, 1080, "Fraymus");
        run(surface, headless);
    }

    static void run(RenderSurface surface, boolean headless) {
        surface.open();
        try {
            if (headless) {
                runHeadless(surface);
            } else {
                runWindowed(surface);
            }
        } finally {
            surface.close();
        }
    }

    /** Deterministic, bounded: for CI/tests/servers with no display. */
    private static void runHeadless(RenderSurface surface) {
        SimulationClock clock = new SimulationClock();
        for (int i = 0; i < HEADLESS_TICKS && !surface.isCloseRequested(); i++) {
            clock.advance(clock.getFixedStepSeconds(), () -> { /* world.step() lands here later */ });
            surface.beginFrame();
            surface.clear(1f, 1f, 1f);
            surface.endFrame();
        }
    }

    /** Real wall-clock loop: runs until the window is closed. */
    private static void runWindowed(RenderSurface surface) {
        SimulationClock clock = new SimulationClock();
        long lastNanos = System.nanoTime();
        while (!surface.isCloseRequested()) {
            long now = System.nanoTime();
            double elapsed = (now - lastNanos) / 1_000_000_000.0;
            lastNanos = now;

            clock.advance(elapsed, () -> { /* world.step() lands here later */ });

            surface.beginFrame();
            surface.clear(1f, 1f, 1f);
            surface.endFrame();
        }
    }

    private static boolean hasFlag(String[] args, String flag) {
        for (String a : args) {
            if (flag.equals(a)) {
                return true;
            }
        }
        return false;
    }
}
