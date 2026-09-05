package fraymus.core;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/** An ordered collection of reusable components with renderer-independent spatial state. */
public class Entity implements AutoCloseable {
    private final String name;
    private final Transform transform;
    private final List<Component> components = new ArrayList<>();
    private long id;
    private World world;
    private boolean started;
    private boolean closed;

    public Entity() {
        this("Entity");
    }

    public Entity(String name) {
        this(name, new Transform());
    }

    public Entity(String name, Transform transform) {
        this.name = Objects.requireNonNull(name, "name");
        this.transform = Objects.requireNonNull(transform, "transform");
    }

    public long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Transform getTransform() {
        return transform;
    }

    public World getWorld() {
        return world;
    }

    public boolean isStarted() {
        return started;
    }

    public boolean isClosed() {
        return closed;
    }

    public <T extends Component> T addComponent(T component) {
        ensureOpen();
        Objects.requireNonNull(component, "component").attach(this);
        components.add(component);
        if (world != null && world.isStarted()) {
            component.startIfNeeded();
        }
        return component;
    }

    public <T extends Component> Optional<T> getComponent(Class<T> type) {
        Objects.requireNonNull(type, "type");
        return components.stream().filter(type::isInstance).map(type::cast).findFirst();
    }

    public List<Component> getComponents() {
        return Collections.unmodifiableList(components);
    }

    public boolean removeComponent(Component component) {
        Objects.requireNonNull(component, "component");
        if (!components.remove(component)) {
            return false;
        }
        component.close();
        component.detach();
        return true;
    }

    void attach(World owner, long assignedId) {
        ensureOpen();
        if (world != null && world != owner) {
            throw new IllegalStateException("Entity already belongs to another world");
        }
        world = owner;
        id = assignedId;
    }

    void detach(World owner) {
        if (world == owner) {
            world = null;
        }
    }

    void startIfNeeded() {
        ensureOpen();
        started = true;
        for (Component component : List.copyOf(components)) {
            component.startIfNeeded();
        }
    }

    void update(double fixedStepSeconds) {
        ensureOpen();
        for (Component component : List.copyOf(components)) {
            if (components.contains(component)) {
                component.runUpdate(fixedStepSeconds);
            }
        }
    }

    @Override
    public void close() {
        if (closed) {
            return;
        }
        if (world != null) {
            world.removeEntity(this);
        }
        closed = true;
        for (Component component : List.copyOf(components)) {
            component.close();
            component.detach();
        }
        components.clear();
    }

    private void ensureOpen() {
        if (closed) {
            throw new IllegalStateException("Entity is closed");
        }
    }
}