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
        if (entity == null) {
            throw new IllegalStateException("Component is not attached to an entity");
        }
        return entity;
    }

    public final boolean isAttached() {
        return entity != null;
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
        if (closed) {
            throw new IllegalStateException("Closed components cannot be attached");
        }
        if (entity != null) {
            throw new IllegalStateException("Component is already attached to an entity");
        }
        entity = owner;
    }

    final void detach() {
        entity = null;
    }

    final void startIfNeeded() {
        if (!started && !closed) {
            started = true;
            start();
        }
    }

    final void runUpdate(double fixedStepSeconds) {
        if (!closed) {
            update(fixedStepSeconds);
        }
    }

    @Override
    public final void close() {
        if (!closed) {
            closed = true;
            onClose();
        }
    }

    /** Optional resource cleanup hook. */
    protected void onClose() {
    }
}