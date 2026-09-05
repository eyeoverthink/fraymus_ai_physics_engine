package fraymus.core;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * FOUNDATION-002 acceptance test: fixed simulation timestep is explicit,
 * the accumulator consumes all elapsed simulation time correctly, and
 * running N fixed steps produces reproducible state.
 */
class SimulationClockTest {

    @Test
    void advanceConsumesWholeStepsAndKeepsRemainderInAccumulator() {
        SimulationClock clock = new SimulationClock(0.1);
        int[] runs = {0};

        int steps = clock.advance(0.35, () -> runs[0]++);

        assertEquals(3, steps);
        assertEquals(3, runs[0]);
        assertEquals(3L, clock.getTick());
        assertEquals(0.3, clock.getSimulationSeconds(), 1e-9);
        assertEquals(0.05, clock.getAccumulatorSeconds(), 1e-9);
    }

    @Test
    void repeatedFixedStepsProduceReproducibleState() {
        SimulationClock a = new SimulationClock(1.0 / 60.0);
        SimulationClock b = new SimulationClock(1.0 / 60.0);

        for (int i = 0; i < 120; i++) {
            a.advance(1.0 / 60.0, () -> {});
            b.advance(1.0 / 60.0, () -> {});
        }

        assertEquals(a.getTick(), b.getTick());
        assertEquals(a.getSimulationSeconds(), b.getSimulationSeconds(), 1e-9);
        assertEquals(a.getAccumulatorSeconds(), b.getAccumulatorSeconds(), 1e-9);
    }

    @Test
    void rejectsNegativeOrNonFiniteElapsedTime() {
        SimulationClock clock = new SimulationClock();
        assertThrows(IllegalArgumentException.class, () -> clock.advance(-1.0, () -> {}));
        assertThrows(IllegalArgumentException.class, () -> clock.advance(Double.NaN, () -> {}));
    }
}
