package fraymus.core;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/** Ordered, renderer-independent simulation world. */
public class World implements AutoCloseable {
    private final Map<Long, Entity> entities = new LinkedHashMap<>();
    private final Map<Long, Entity> pendingAdditions = new LinkedHashMap<>();
    private final Set<Entity> pendingRemovals = new LinkedHashSet<>();
    private long nextEntityId = 1;
    private boolean started;
    private boolean stepping;
    private boolean closed;

    public Entity addEntity(Entity entity) {
        ensureOpen();
        Objects.requireNonNull(entity, "entity");
        if (entity.getWorld() != null) {
            throw new IllegalStateException("Entity already belongs to a world");
        }
        if (stepping) {
            long id = nextEntityId++;
            entity.attach(this, id);
            pendingAdditions.put(id, entity);
        } else {
            addImmediately(entity);
        }
        return entity;
    }

    public boolean isStarted() {
        return started;
    }

    public boolean isClosed() {
        return closed;
    }

    public boolean removeEntity(Entity entity) {
        ensureOpen();
        Objects.requireNonNull(entity, "entity");
        if (entity.getWorld() != this) {
            return false;
        }
        if (stepping) {
            if (pendingAdditions.remove(entity.getId()) != null) {
                entity.detach(this);
                entity.close();
                return true;
            }
            pendingRemovals.add(entity);
            return true;
        }
        return removeImmediately(entity);
    }

    /**
     * Removes an entity without closing it so it may enter another world.
     * Detaching during a step is rejected; use {@link #removeEntity(Entity)}
     * for deferred destruction.
     */
    public boolean detachEntity(Entity entity) {
        ensureOpen();
        Objects.requireNonNull(entity, "entity");
        if (stepping) {
            throw new IllegalStateException("Entities cannot be detached during a world step");
        }
        if (entity.getWorld() != this || entities.remove(entity.getId()) == null) {
            return false;
        }
        entity.detach(this);
        return true;
    }

    public Optional<Entity> getEntity(long id) {
        return Optional.ofNullable(entities.get(id));
    }

    public List<Entity> getEntities() {
        return Collections.unmodifiableList(new ArrayList<>(entities.values()));
    }

    public <T extends Component> List<T> getComponents(Class<T> type) {
        Objects.requireNonNull(type, "type");
        List<T> matches = new ArrayList<>();
        for (Entity entity : entities.values()) {
            entity.getComponent(type).ifPresent(matches::add);
        }
        return Collections.unmodifiableList(matches);
    }

    public void start() {
        ensureOpen();
        if (started) {
            return;
        }
        started = true;
        for (Entity entity : List.copyOf(entities.values())) {
            entity.startIfNeeded();
        }
    }

    public void step(double fixedStepSeconds) {
        ensureOpen();
        if (!(fixedStepSeconds > 0.0) || !Double.isFinite(fixedStepSeconds)) {
            throw new IllegalArgumentException("fixedStepSeconds must be finite and > 0");
        }
        if (stepping) {
            throw new IllegalStateException("World step cannot be re-entered");
        }

        start();
        stepping = true;
        try {
            for (Entity entity : List.copyOf(entities.values())) {
                if (!pendingRemovals.contains(entity)) {
                    entity.update(fixedStepSeconds);
                }
            }
        } finally {
            stepping = false;
            for (Entity entity : pendingRemovals) {
                removeImmediately(entity);
            }
            pendingRemovals.clear();
            for (Entity entity : pendingAdditions.values()) {
                entities.put(entity.getId(), entity);
                entity.startIfNeeded();
            }
            pendingAdditions.clear();
        }
    }

    public void update(double deltaSeconds) {
        step(deltaSeconds);
    }

    @Override
    public void close() {
        if (closed) {
            return;
        }
        closed = true;
        for (Entity entity : pendingAdditions.values()) {
            entity.detach(this);
            entity.close();
        }
        pendingAdditions.clear();
        pendingRemovals.clear();
        for (Entity entity : List.copyOf(entities.values())) {
            entity.detach(this);
            entity.close();
        }
        entities.clear();
    }

    private void addImmediately(Entity entity) {
        long id = nextEntityId++;
        entity.attach(this, id);
        entities.put(id, entity);
        if (started) {
            entity.startIfNeeded();
        }
    }

    private boolean removeImmediately(Entity entity) {
        if (entities.remove(entity.getId()) == null) {
            return false;
        }
        entity.detach(this);
        entity.close();
        return true;
    }

    private void ensureOpen() {
        if (closed) {
            throw new IllegalStateException("World is closed");
        }
    }
}