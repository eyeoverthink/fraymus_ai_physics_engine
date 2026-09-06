package fraymus.render;

/**
 * No-display surface. Backs FOUNDATION-004 (headless runner) and unit
 * tests that must run in CI/servers with no attached display.
 */
public final class HeadlessSurface implements RenderSurface {
    private boolean open;
    private boolean closeRequested;
    private long frameCount;

    @Override
    public void open() {
        open = true;
    }

    @Override
    public boolean isCloseRequested() {
        return closeRequested;
    }

    public void requestClose() {
        closeRequested = true;
    }

    @Override
    public void beginFrame() {
        requireOpen();
    }

    @Override
    public void clear(float r, float g, float b) {
        requireOpen();
    }

    @Override
    public void endFrame() {
        requireOpen();
        frameCount++;
    }

    public long getFrameCount() {
        return frameCount;
    }

    @Override
    public void close() {
        open = false;
    }

    private void requireOpen() {
        if (!open) {
            throw new IllegalStateException("Surface not open");
        }
    }
}
