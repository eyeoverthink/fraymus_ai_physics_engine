package fraymus.render;

/**
 * Renderer-agnostic surface. Core/simulation code depends only on this
 * interface, never on a specific graphics API (FRAYMUS_BUILD_ORDER.md,
 * FOUNDATION-001: Core must be renderer-independent).
 */
public interface RenderSurface extends AutoCloseable {
    void open();

    boolean isCloseRequested();

    void beginFrame();

    void clear(float r, float g, float b);

    void endFrame();

    @Override
    void close();
}
