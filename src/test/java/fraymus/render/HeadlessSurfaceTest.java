package fraymus.render;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class HeadlessSurfaceTest {
    @Test
    void requiresOpenBeforeUse() {
        HeadlessSurface surface = new HeadlessSurface();
        assertThrows(IllegalStateException.class, surface::beginFrame);
    }

    @Test
    void countsFramesAfterOpen() {
        HeadlessSurface surface = new HeadlessSurface();
        surface.open();
        for (int i = 0; i < 5; i++) {
            surface.beginFrame();
            surface.clear(1f, 1f, 1f);
            surface.endFrame();
        }
        assertEquals(5, surface.getFrameCount());
        surface.close();
    }

    @Test
    void requestCloseIsObserved() {
        HeadlessSurface surface = new HeadlessSurface();
        surface.open();
        assertEquals(false, surface.isCloseRequested());
        surface.requestClose();
        assertEquals(true, surface.isCloseRequested());
    }
}
