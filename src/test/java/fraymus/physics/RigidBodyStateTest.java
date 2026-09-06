package fraymus.physics;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RigidBodyStateTest {
    @Test
    void preservesIndependentThreeDimensionalStateAndDeterministicTime() {
        RigidBodyState state = new RigidBodyState(
                1.25, -2.5, 3.75,
                0.8, 12.0, 100.0, 40.0,
                24, 0.4);

        assertEquals(1.25, state.velocityX());
        assertEquals(-2.5, state.velocityY());
        assertEquals(3.75, state.velocityZ());
        assertEquals(0.8, state.gravityResponse());
        assertEquals(12.0, state.mass());
        assertEquals(100.0, state.capacity());
        assertEquals(40.0, state.energy());
        assertEquals(24, state.tick());
        assertEquals(0.4, state.simulationSeconds());
    }

    @Test
    void hasValueSemanticsWithoutMutableSetters() {
        RigidBodyState first = new RigidBodyState(0, 0, 0, 1, 1, 10, 5, 0, 0);
        RigidBodyState same = new RigidBodyState(0, 0, 0, 1, 1, 10, 5, 0, 0);
        RigidBodyState changed = new RigidBodyState(1, 0, 0, 1, 1, 10, 5, 0, 0);

        assertEquals(first, same);
        assertEquals(first.hashCode(), same.hashCode());
        assertNotEquals(first, changed);
    }

    @Test
    void acceptsEmptyCapacityAndEnergyButRequiresPositiveMass() {
        RigidBodyState empty = new RigidBodyState(0, 0, 0, 0, 0.01, 0, 0, 0, 0);

        assertEquals(0, empty.capacity());
        assertEquals(0, empty.energy());
        assertThrows(IllegalArgumentException.class,
                () -> new RigidBodyState(0, 0, 0, 1, 0, 10, 5, 0, 0));
        assertThrows(IllegalArgumentException.class,
                () -> new RigidBodyState(0, 0, 0, 1, -1, 10, 5, 0, 0));
    }

    @Test
    void rejectsNonFiniteAndInvalidScalarState() {
        assertInvalid(Double.NaN, 0, 0, 1, 1, 10, 5, 0, 0);
        assertInvalid(0, Double.POSITIVE_INFINITY, 0, 1, 1, 10, 5, 0, 0);
        assertInvalid(0, 0, Double.NEGATIVE_INFINITY, 1, 1, 10, 5, 0, 0);
        assertInvalid(0, 0, 0, -0.1, 1, 10, 5, 0, 0);
        assertInvalid(0, 0, 0, 1, 1, -1, 0, 0, 0);
        assertInvalid(0, 0, 0, 1, 1, 10, -1, 0, 0);
        assertInvalid(0, 0, 0, 1, 1, 10, 11, 0, 0);
        assertInvalid(0, 0, 0, 1, 1, 10, 5, -1, 0);
        assertInvalid(0, 0, 0, 1, 1, 10, 5, 0, -0.1);
        assertInvalid(0, 0, 0, 1, 1, 10, 5, 0, Double.NaN);
    }

    private static void assertInvalid(
            double velocityX,
            double velocityY,
            double velocityZ,
            double gravityResponse,
            double mass,
            double capacity,
            double energy,
            long tick,
            double simulationSeconds) {
        assertThrows(IllegalArgumentException.class, () -> new RigidBodyState(
                velocityX, velocityY, velocityZ,
                gravityResponse, mass, capacity, energy,
                tick, simulationSeconds));
    }
}