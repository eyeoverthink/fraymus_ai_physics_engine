package fraymus.core;

import org.junit.jupiter.api.Test;

import java.nio.ByteBuffer;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.SplittableRandom;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

/**
 * End-to-end determinism contract for the renderer-independent simulation loop.
 */
class DeterministicSimulationTest {
    private static final double FIXED_STEP = 1.0 / 60.0;
    private static final int ENTITY_COUNT = 32;
    private static final int TICKS = 600;

    @Test
    void identicalSeedsProduceIdenticalStateHashesAfterFixedSteps() {
        SimulationRun first = run(0x465241594D55534CL, fixedFrames());
        SimulationRun second = run(0x465241594D55534CL, fixedFrames());
        SimulationRun differentSeed = run(0x465241594D55534DL, fixedFrames());

        assertEquals(TICKS, first.tick());
        assertEquals(first, second);
        assertNotEquals(first.stateHash(), differentSeed.stateHash());
    }

    @Test
    void frameTimeChunkingDoesNotChangeFixedStepOutcome() {
        long seed = 20260905L;

        SimulationRun oneStepPerFrame = run(seed, fixedFrames());
        SimulationRun unevenFrames = run(seed, unevenFrames());

        assertEquals(TICKS, unevenFrames.tick());
        assertEquals(oneStepPerFrame.stateHash(), unevenFrames.stateHash());
        assertEquals(oneStepPerFrame.simulationSeconds(), unevenFrames.simulationSeconds());
    }

    private static SimulationRun run(long seed, double[] frameTimes) {
        SimulationClock clock = new SimulationClock(FIXED_STEP);
        DeterministicWorld world = new DeterministicWorld(seed, ENTITY_COUNT);

        for (double frameTime : frameTimes) {
            clock.advance(frameTime, world::step);
        }

        return new SimulationRun(clock.getTick(), clock.getSimulationSeconds(), world.stateHash());
    }

    private static double[] fixedFrames() {
        double[] frames = new double[TICKS];
        java.util.Arrays.fill(frames, FIXED_STEP);
        return frames;
    }

    private static double[] unevenFrames() {
        double[] pattern = {FIXED_STEP * 0.25, FIXED_STEP * 2.5, FIXED_STEP * 0.75, FIXED_STEP * 1.5};
        double[] frames = new double[TICKS / 5 * pattern.length];
        for (int i = 0; i < frames.length; i++) {
            frames[i] = pattern[i % pattern.length];
        }
        return frames;
    }

    private record SimulationRun(long tick, double simulationSeconds, String stateHash) {
    }

    /**
     * A small integer-only evolving world. It represents the contract future
     * entity, physics, and Cell systems must preserve without introducing those dependencies here.
     */
    private static final class DeterministicWorld {
        private final long[] positions;
        private final long[] velocities;

        private DeterministicWorld(long seed, int entityCount) {
            SplittableRandom random = new SplittableRandom(seed);
            positions = new long[entityCount];
            velocities = new long[entityCount];
            for (int i = 0; i < entityCount; i++) {
                positions[i] = random.nextLong(-1_000_000L, 1_000_001L);
                velocities[i] = random.nextLong(-10_000L, 10_001L);
            }
        }

        private void step() {
            for (int i = 0; i < positions.length; i++) {
                long neighbor = positions[(i + 1) % positions.length];
                long acceleration = Math.floorMod(neighbor - positions[i], 17L) - 8L;
                velocities[i] += acceleration;
                positions[i] += velocities[i];
            }
        }

        private String stateHash() {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                ByteBuffer value = ByteBuffer.allocate(Long.BYTES);
                for (int i = 0; i < positions.length; i++) {
                    digest.update(value.clear().putLong(positions[i]).array());
                    digest.update(value.clear().putLong(velocities[i]).array());
                }
                return HexFormat.of().formatHex(digest.digest());
            } catch (NoSuchAlgorithmException exception) {
                throw new IllegalStateException("Java runtime must provide SHA-256", exception);
            }
        }
    }
}