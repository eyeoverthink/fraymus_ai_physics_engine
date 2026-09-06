package fraymus.core;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WorldEntityComponentTest {
    @Test
    void entityComposesTransformAndAssignableComponents() {
        Transform transform = new Transform(2.0, 3.0);
        Entity entity = new Entity("runner", transform);
        CountingComponent component = entity.addComponent(new CountingComponent());

        assertSame(transform, entity.getTransform());
        assertSame(entity, component.getEntity());
        assertSame(component, entity.getComponent(Component.class).orElseThrow());
        assertSame(component, entity.getComponent(CountingComponent.class).orElseThrow());

        assertTrue(entity.removeComponent(component));
        assertTrue(component.isClosed());
        assertFalse(component.isAttached());
    }

    @Test
    void worldStartsOnceAndUpdatesEntitiesInInsertionOrder() {
        List<String> events = new ArrayList<>();
        Entity first = new Entity("first");
        Entity second = new Entity("second");
        RecordingComponent firstComponent = first.addComponent(new RecordingComponent(events));
        RecordingComponent secondComponent = second.addComponent(new RecordingComponent(events));

        try (World world = new World()) {
            world.addEntity(first);
            world.addEntity(second);
            world.update(0.25);
            world.update(0.25);

            assertEquals(List.of(
                    "start:first", "start:second",
                    "update:first", "update:second",
                    "update:first", "update:second"), events);
            assertEquals(1, firstComponent.starts);
            assertEquals(2, firstComponent.updates);
            assertEquals(1, secondComponent.starts);
            assertEquals(2, secondComponent.updates);
        }
    }

    @Test
    void mutationsDuringUpdateAreAppliedAtTheStepBoundary() {
        try (World world = new World()) {
            Entity departing = new Entity("departing");
            Entity arriving = new Entity("arriving");
            CountingComponent departingCounter = departing.addComponent(new CountingComponent());
            CountingComponent arrivingCounter = arriving.addComponent(new CountingComponent());
            Entity controller = new Entity("controller");
            controller.addComponent(new Component() {
                private boolean changedWorld;

                @Override
                protected void update(double deltaSeconds) {
                    if (!changedWorld) {
                        changedWorld = true;
                        world.removeEntity(departing);
                        world.addEntity(arriving);
                    }
                }
            });
            world.addEntity(controller);
            world.addEntity(departing);

            world.update(1.0);
            assertEquals(0, departingCounter.updates);
            assertEquals(0, arrivingCounter.updates);
            assertEquals(List.of(controller, arriving), world.getEntities());

            world.update(1.0);
            assertEquals(1, arrivingCounter.updates);
        }
    }

    @Test
    void closedObjectsCannotReenterTheLifecycle() {
        Entity entity = new Entity("closed");
        entity.close();
        assertThrows(IllegalStateException.class, () -> entity.addComponent(new CountingComponent()));

        World world = new World();
        world.close();
        assertThrows(IllegalStateException.class, () -> world.addEntity(new Entity("late")));
        assertThrows(IllegalStateException.class, () -> world.update(0.1));
    }

    @Test
    void componentAddedWhileDetachedStartsOnNextWorldEntry() {
        Entity entity = new Entity("traveler");
        CountingComponent first = entity.addComponent(new CountingComponent());

        try (World firstWorld = new World(); World secondWorld = new World()) {
            firstWorld.addEntity(entity);
            firstWorld.start();
            assertEquals(1, first.starts);

            firstWorld.detachEntity(entity);
            CountingComponent addedWhileDetached = entity.addComponent(new CountingComponent());
            assertEquals(0, addedWhileDetached.starts);
            assertSame(null, entity.getWorld());

            secondWorld.start();
            secondWorld.addEntity(entity);
            assertSame(secondWorld, entity.getWorld());
            assertEquals(1, first.starts);
            assertEquals(1, addedWhileDetached.starts);
        }
    }

    @Test
    void headlessFixedStepsProduceObservableTransformUpdates() {
        Entity entity = new Entity("moving");
        entity.addComponent(new Component() {
            @Override
            protected void update(double deltaSeconds) {
                getEntity().getTransform().translate(4.0 * deltaSeconds, -2.0 * deltaSeconds);
            }
        });
        SimulationClock clock = new SimulationClock(0.25);

        try (World world = new World()) {
            world.addEntity(entity);
            for (int i = 0; i < 8; i++) {
                clock.advance(0.25, () -> world.update(0.25));
            }

            assertEquals(8.0, entity.getTransform().getX());
            assertEquals(-4.0, entity.getTransform().getY());
            assertEquals(8, clock.getTick());
        }
    }

    private static class CountingComponent extends Component {
        int starts;
        int updates;

        @Override
        protected void start() {
            starts++;
        }

        @Override
        protected void update(double deltaSeconds) {
            updates++;
        }
    }

    private static final class RecordingComponent extends CountingComponent {
        private final List<String> events;

        private RecordingComponent(List<String> events) {
            this.events = events;
        }

        @Override
        protected void start() {
            super.start();
            events.add("start:" + getEntity().getName());
        }

        @Override
        protected void update(double deltaSeconds) {
            super.update(deltaSeconds);
            events.add("update:" + getEntity().getName());
        }
    }
}