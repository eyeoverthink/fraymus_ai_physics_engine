package fraymus.core;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WorldTest {
    @Test
    void componentsStartOnceAndUpdateInInsertionOrder() {
        List<String> events = new ArrayList<>();
        try (World world = new World()) {
            Entity entity = world.addEntity(new Entity("test"));
            entity.addComponent(new RecordingComponent("first", events));
            entity.addComponent(new RecordingComponent("second", events));

            world.step(0.25);
            world.step(0.25);

            assertEquals(List.of(
                    "first:start", "second:start",
                    "first:update", "second:update",
                    "first:update", "second:update"), events);
        }
    }

    @Test
    void findsComponentsByAssignableTypeAndProtectsOwnedCollections() {
        try (World world = new World()) {
            Entity entity = world.addEntity(new Entity("test"));
            RecordingComponent component = entity.addComponent(
                    new RecordingComponent("component", new ArrayList<>()));

            assertEquals(component, entity.getComponent(Component.class).orElseThrow());
            assertEquals(List.of(component), world.getComponents(RecordingComponent.class));
            assertThrows(UnsupportedOperationException.class, () -> entity.getComponents().clear());
            assertThrows(UnsupportedOperationException.class, () -> world.getEntities().clear());
        }
    }

    @Test
    void mutationsRequestedDuringStepAreAppliedAfterTraversal() {
        try (World world = new World()) {
            Entity first = world.addEntity(new Entity("first"));
            Entity second = new Entity("second");
            first.addComponent(new Component() {
                @Override
                protected void update(double fixedStepSeconds) {
                    world.addEntity(second);
                    world.removeEntity(first);
                }
            });

            world.step(1.0);

            assertEquals(List.of(second), world.getEntities());
            assertTrue(first.isClosed());
            assertFalse(second.isClosed());
        }
    }

    @Test
    void duplicateDeferredAdditionIsRejectedAndCannotCreateDuplicateMembership() {
        try (World world = new World()) {
            Entity pending = new Entity("pending");
            Entity driver = world.addEntity(new Entity("driver"));
            driver.addComponent(new Component() {
                @Override
                protected void update(double fixedStepSeconds) {
                    world.addEntity(pending);
                    assertThrows(IllegalStateException.class, () -> world.addEntity(pending));
                }
            });

            world.step(1.0);

            assertEquals(List.of(driver, pending), world.getEntities());
            assertEquals(2, world.getEntities().stream().map(Entity::getId).distinct().count());
        }
    }

    @Test
    void addThenRemoveDuringOneStepCancelsPendingMembership() {
        try (World world = new World()) {
            Entity pending = new Entity("pending");
            Entity driver = world.addEntity(new Entity("driver"));
            driver.addComponent(new Component() {
                @Override
                protected void update(double fixedStepSeconds) {
                    world.addEntity(pending);
                    assertTrue(world.removeEntity(pending));
                }
            });

            world.step(1.0);

            assertEquals(List.of(driver), world.getEntities());
            assertTrue(pending.isClosed());
        }
    }

    @Test
    void removeThenAddOfExistingEntityIsRejectedUntilRemovalCompletes() {
        try (World world = new World()) {
            Entity target = world.addEntity(new Entity("target"));
            Entity driver = world.addEntity(new Entity("driver"));
            driver.addComponent(new Component() {
                @Override
                protected void update(double fixedStepSeconds) {
                    assertTrue(world.removeEntity(target));
                    assertThrows(IllegalStateException.class, () -> world.addEntity(target));
                }
            });

            world.step(1.0);

            assertEquals(List.of(driver), world.getEntities());
            assertTrue(target.isClosed());
        }
    }

    @Test
    void closesOwnedComponentsAndRejectsCrossWorldOwnership() {
        World firstWorld = new World();
        World secondWorld = new World();
        Entity entity = firstWorld.addEntity(new Entity("owned"));
        RecordingComponent component = entity.addComponent(
                new RecordingComponent("component", new ArrayList<>()));

        assertThrows(IllegalStateException.class, () -> secondWorld.addEntity(entity));
        firstWorld.close();

        assertTrue(entity.isClosed());
        assertTrue(component.isClosed());
        secondWorld.close();
    }

    @Test
    void transformCopyIsIndependent() {
        Transform original = new Transform(2.0, 3.0).setRotation(0.5).setScale(4.0, 5.0);
        Transform copy = original.copy();

        copy.translate(10.0, 20.0);

        assertNotSame(original, copy);
        assertEquals(2.0, original.getX());
        assertEquals(12.0, copy.getX());
        assertEquals(original.getRotation(), copy.getRotation());
        assertEquals(original.getScaleY(), copy.getScaleY());
    }

    private static final class RecordingComponent extends Component {
        private final String name;
        private final List<String> events;

        private RecordingComponent(String name, List<String> events) {
            this.name = name;
            this.events = events;
        }

        @Override
        protected void start() {
            events.add(name + ":start");
        }

        @Override
        protected void update(double fixedStepSeconds) {
            events.add(name + ":update");
        }
    }
}