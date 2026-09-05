package fraymus.app;

import static org.junit.jupiter.api.Assertions.assertEquals;

import fraymus.render.HeadlessSurface;
import org.junit.jupiter.api.Test;

/**
 * FOUNDATION-004 acceptance: the same loop Main.main() would hand to a real
 * window runs headless and produces a bounded, deterministic number of
 * frames with no display attached.
 */
class MainHeadlessTest {
    @Test
    void headlessRunProducesExactlySixtyFrames() {
        HeadlessSurface surface = new HeadlessSurface();
        Main.run(surface, true);
        assertEquals(60, surface.getFrameCount());
    }

    @Test
    void headlessRunStopsEarlyIfCloseIsRequested() {
        StopAfterNFrames surface = new StopAfterNFrames(3);
        Main.run(surface, true);
        assertEquals(3, surface.getFrameCount());
    }

    /** Wraps a HeadlessSurface to request close after a fixed frame count. */
    private static final class StopAfterNFrames implements fraymus.render.RenderSurface {
        private final HeadlessSurface delegate = new HeadlessSurface();
        private final int stopAfter;

        StopAfterNFrames(int stopAfter) {
            this.stopAfter = stopAfter;
        }

        long getFrameCount() {
            return delegate.getFrameCount();
        }

        @Override
        public void open() {
            delegate.open();
        }

        @Override
        public boolean isCloseRequested() {
            return delegate.isCloseRequested();
        }

        @Override
        public void beginFrame() {
            delegate.beginFrame();
        }

        @Override
        public void clear(float r, float g, float b) {
            delegate.clear(r, g, b);
        }

        @Override
        public void endFrame() {
            delegate.endFrame();
            if (delegate.getFrameCount() == stopAfter) {
                delegate.requestClose();
            }
        }

        @Override
        public void close() {
            delegate.close();
        }
    }
}
