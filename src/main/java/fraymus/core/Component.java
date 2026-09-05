package fraymus.core;

/**
 * Reusable behavior owned by one {@link Entity}.
 *
 * <p>The lifecycle mirrors the original engine while remaining independent of
 * rendering and physics libraries.</p>
 */
public class Component implements AutoCloseable {
    private Entity entity;
    private boolean started;
    private boolean closed;

    public final Entity getEntity() {
        return entity;
    }

    public final boolean isStarted() {
        return started;
    }

    public final boolean isClosed() {
        return closed;
    }

    /** Called once, immediately before this component's first update. */
    protected void start() {
    }

    /** Called once per world step after {@link #start()}. */
    protected void update(double fixedStepSeconds) {
    }

    final void attach(Entity owner) {
        if (entity != null && entity != owner) {
            throw new IllegalStateException("Component is already attached to another entity");
        }
        if (closed) {
            throw new IllegalStateException("Closed components cannot be attached");
        }
        entity = owner;
    }

    final void runUpdate(double fixedStepSeconds) {
        if (closed) {
            return;
        }
        if (!started) {
            started = true;
            start();
        }
        update(fixedStepSeconds);
    }

    @Override
    public void close() {
        closed = true;
    }
}