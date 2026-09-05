package fraymus.core;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * FOUNDATION-002 acceptance test: fixed simulation timestep is explicit,
 * the accumulator preserves all elapsed simulation time correctly, and
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
        assertThrows(IllegalArgumentException.class, () -> clock.advance(Double.POSITIVE_INFINITY, () -> {}));
        assertThrows(NullPointerException.class, () -> clock.advance(0.0, null));
    }

    @Test
    void rejectsInvalidFixedSteps() {
        assertThrows(IllegalArgumentException.class, () -> new SimulationClock(0.0));
        assertThrows(IllegalArgumentException.class, () -> new SimulationClock(-0.1));
        assertThrows(IllegalArgumentException.class, () -> new SimulationClock(Double.NaN));
        assertThrows(IllegalArgumentException.class, () -> new SimulationClock(Double.POSITIVE_INFINITY));
        assertThrows(IllegalArgumentException.class, () -> new SimulationClock(0.1, 0));
        assertThrows(IllegalArgumentException.class, () -> new SimulationClock(0.1, -1));
    }

    @Test
    void boundsCatchUpWorkAndExposesUnprocessedSimulationTime() {
        SimulationClock clock = new SimulationClock(0.1, 3);
        int[] runs = {0};

        assertEquals(3, clock.advance(1.05, () -> runs[0]++));

        assertEquals(3, runs[0]);
        assertEquals(3L, clock.getTick());
        assertEquals(7L, clock.getPendingStepCount());
        assertEquals(0.75, clock.getAccumulatorSeconds(), 1e-9);
    }

    @Test
    void drainsCatchUpBacklogWithoutDroppingElapsedTime() {
        SimulationClock clock = new SimulationClock(0.1, 3);
        int[] runs = {0};

        int steps = clock.advance(1.05, () -> runs[0]++);
        while (clock.getPendingStepCount() > 0) {
            steps += clock.advance(0.0, () -> runs[0]++);
        }

        assertEquals(10, steps);
        assertEquals(10, runs[0]);
        assertEquals(10L, clock.getTick());
        assertEquals(1.0, clock.getSimulationSeconds(), 1e-9);
        assertEquals(0.05, clock.getAccumulatorSeconds(), 1e-9);
    }

    @Test
    void catchUpResultIsDeterministicAcrossElapsedTimeChunking() {
        SimulationClock oneStall = new SimulationClock(0.1, 3);
        SimulationClock severalFrames = new SimulationClock(0.1, 3);

        oneStall.advance(1.05, () -> {});
        severalFrames.advance(0.21, () -> {});
        severalFrames.advance(0.34, () -> {});
        severalFrames.advance(0.50, () -> {});

        while (oneStall.getPendingStepCount() > 0) {
            oneStall.advance(0.0, () -> {});
        }
        while (severalFrames.getPendingStepCount() > 0) {
            severalFrames.advance(0.0, () -> {});
        }

        assertEquals(oneStall.getTick(), severalFrames.getTick());
        assertEquals(oneStall.getSimulationSeconds(), severalFrames.getSimulationSeconds(), 1e-9);
        assertEquals(oneStall.getAccumulatorSeconds(), severalFrames.getAccumulatorSeconds(), 1e-9);
    }

    @Test
    void rejectsReentrantAdvanceAndRemainsUsableAfterCallbackFailure() {
        SimulationClock clock = new SimulationClock(0.1);

        assertThrows(IllegalStateException.class,
                () -> clock.advance(0.1, () -> clock.advance(0.1, () -> {})));
        assertEquals(0L, clock.getTick());

        assertEquals(2, clock.advance(0.1, () -> {}));
        assertEquals(2L, clock.getTick());
    }

    @Test
    void rejectsAccumulatorOverflowWithoutChangingClockState() {
        SimulationClock clock = new SimulationClock(Double.MAX_VALUE);

        clock.advance(Double.MAX_VALUE / 2.0, () -> {});
        assertThrows(IllegalArgumentException.class,
                () -> clock.advance(Double.MAX_VALUE, () -> {}));

        assertEquals(0L, clock.getTick());
        assertEquals(Double.MAX_VALUE / 2.0, clock.getAccumulatorSeconds());
    }
}
