package fraymus.core;

import org.junit.jupiter.api.Test;

import java.nio.ByteBuffer;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
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
    private static final long FRAYMUS_SEED = 0x465241594D55534CL;
    private static final String FRAYMUS_GOLDEN_HASH =
            "9d17aa5ee5bcd816f6126b893ad669e31e3917c18d27c560e2573d447c4df5e1";
    private static final long CALENDAR_SEED = 20260905L;
    private static final String CALENDAR_GOLDEN_HASH =
            "27a88d3e67cb1a7b48cffc40d20816c162fb51462e64f6cc4ca93c090d095b24";

    @Test
    void approvedSeededScenariosRetainTheirGoldenHashes() {
        SimulationRun fraymusScenario = run(FRAYMUS_SEED, fixedFrames());
        SimulationRun calendarScenario = run(CALENDAR_SEED, unevenFrames());

        assertEquals(TICKS, fraymusScenario.tick());
        assertEquals(TICKS, calendarScenario.tick());
        assertEquals(FRAYMUS_GOLDEN_HASH, fraymusScenario.stateHash());
        assertEquals(CALENDAR_GOLDEN_HASH, calendarScenario.stateHash());
    }

    @Test
    void identicalSeedsProduceIdenticalStateHashesAfterFixedSteps() {
        SimulationRun first = run(FRAYMUS_SEED, fixedFrames());
        SimulationRun second = run(FRAYMUS_SEED, fixedFrames());
        SimulationRun differentSeed = run(FRAYMUS_SEED + 1, fixedFrames());

        assertEquals(first, second);
        assertNotEquals(first.stateHash(), differentSeed.stateHash());
    }

    @Test
    void frameTimeChunkingDoesNotChangeFixedStepOutcome() {
        SimulationRun oneStepPerFrame = run(CALENDAR_SEED, fixedFrames());
        SimulationRun unevenFrames = run(CALENDAR_SEED, unevenFrames());

        assertEquals(TICKS, unevenFrames.tick());
        assertEquals(oneStepPerFrame.stateHash(), unevenFrames.stateHash());
        assertEquals(oneStepPerFrame.simulationSeconds(), unevenFrames.simulationSeconds());
    }

    private static SimulationRun run(long seed, double[] frameTimes) {
        SimulationClock clock = new SimulationClock(FIXED_STEP);
        SeededScenario scenario = new SeededScenario(seed, ENTITY_COUNT);

        try (World world = scenario.world()) {
            for (double frameTime : frameTimes) {
                clock.advance(frameTime, () -> world.step(FIXED_STEP));
            }
            return new SimulationRun(clock.getTick(), clock.getSimulationSeconds(), scenario.stateHash());
        }
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
     * A small integer-only behavior running through the real renderer-independent
     * World, Entity, Component, Transform, and SimulationClock contracts.
     */
    private static final class SeededScenario {
        private final World world = new World();
        private final List<MotionComponent> motions = new ArrayList<>();

        private SeededScenario(long seed, int entityCount) {
            SplittableRandom random = new SplittableRandom(seed);
            for (int i = 0; i < entityCount; i++) {
                Entity entity = new Entity("seeded-" + i);
                MotionComponent motion = entity.addComponent(new MotionComponent(
                        random.nextLong(-1_000_000L, 1_000_001L),
                        random.nextLong(-10_000L, 10_001L)));
                motions.add(motion);
                world.addEntity(entity);
            }
        }

        private World world() {
            return world;
        }

        private String stateHash() {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                ByteBuffer value = ByteBuffer.allocate(Long.BYTES);
                for (Entity entity : world.getEntities()) {
                    MotionComponent motion = motions.get((int) entity.getId() - 1);
                    digest.update(value.clear().putLong(entity.getId()).array());
                    digest.update(value.clear().putLong(motion.position).array());
                    digest.update(value.clear().putLong(motion.velocity).array());
                    digest.update(value.clear().putLong(
                            Double.doubleToLongBits(entity.getTransform().getX())).array());
                }
                return HexFormat.of().formatHex(digest.digest());
            } catch (NoSuchAlgorithmException exception) {
                throw new IllegalStateException("Java runtime must provide SHA-256", exception);
            }
        }
    }

    private static final class MotionComponent extends Component {
        private long position;
        private long velocity;

        private MotionComponent(long position, long velocity) {
            this.position = position;
            this.velocity = velocity;
        }

        @Override
        protected void update(double fixedStepSeconds) {
            List<Entity> entities = getEntity().getWorld().getEntities();
            MotionComponent neighbor = entities.get((int) (getEntity().getId() % entities.size()))
                    .getComponent(MotionComponent.class)
                    .orElseThrow();
            long acceleration = Math.floorMod(neighbor.position - position, 17L) - 8L;
            velocity += acceleration;
            position += velocity;
            getEntity().getTransform().setPosition(position, 0.0);
        }
    }
}