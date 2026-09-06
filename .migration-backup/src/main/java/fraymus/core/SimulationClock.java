package fraymus.core;

/**
 * Fixed-step simulation clock. Rendering and wall-clock timing stay outside the simulation.
 *
 * <p>Each {@link #advance(double, Runnable)} call performs at most
 * {@link #getMaxStepsPerAdvance()} updates. Any remaining elapsed time stays in the accumulator
 * and is processed by later calls, including calls with zero elapsed time. This bounds frame
 * recovery work without silently dropping simulation time.</p>
 */
public final class SimulationClock {
    public static final int DEFAULT_MAX_STEPS_PER_ADVANCE = 8;

    private final double fixedStepSeconds;
    private final int maxStepsPerAdvance;
    private double accumulatorSeconds;
    private long tick;
    private double simulationSeconds;
    private boolean advancing;

    public SimulationClock() { this(1.0 / 60.0, DEFAULT_MAX_STEPS_PER_ADVANCE); }

    public SimulationClock(double fixedStepSeconds) {
        this(fixedStepSeconds, DEFAULT_MAX_STEPS_PER_ADVANCE);
    }

    public SimulationClock(double fixedStepSeconds, int maxStepsPerAdvance) {
        if (!(fixedStepSeconds > 0.0) || Double.isInfinite(fixedStepSeconds)) {
            throw new IllegalArgumentException("fixedStepSeconds must be finite and > 0");
        }
        if (maxStepsPerAdvance <= 0) {
            throw new IllegalArgumentException("maxStepsPerAdvance must be > 0");
        }
        this.fixedStepSeconds = fixedStepSeconds;
        this.maxStepsPerAdvance = maxStepsPerAdvance;
    }

    public int advance(double elapsedSeconds, Runnable step) {
        if (elapsedSeconds < 0.0 || Double.isNaN(elapsedSeconds) || Double.isInfinite(elapsedSeconds)) {
            throw new IllegalArgumentException("elapsedSeconds must be finite and >= 0");
        }
        if (step == null) throw new NullPointerException("step");
        if (advancing) {
            throw new IllegalStateException("SimulationClock.advance cannot be called from a step callback");
        }
        if (elapsedSeconds > Double.MAX_VALUE - accumulatorSeconds) {
            throw new IllegalArgumentException("elapsedSeconds would overflow the clock accumulator");
        }

        advancing = true;
        try {
            accumulatorSeconds += elapsedSeconds;
            int steps = 0;
            while (steps < maxStepsPerAdvance
                    && accumulatorSeconds + 1e-12 >= fixedStepSeconds) {
                step.run();
                accumulatorSeconds -= fixedStepSeconds;
                tick++;
                simulationSeconds += fixedStepSeconds;
                steps++;
            }
            return steps;
        } finally {
            advancing = false;
        }
    }

    public double getFixedStepSeconds() { return fixedStepSeconds; }
    public int getMaxStepsPerAdvance() { return maxStepsPerAdvance; }
    public double getAccumulatorSeconds() { return accumulatorSeconds; }
    public long getPendingStepCount() {
        return (long) Math.floor((accumulatorSeconds + 1e-12) / fixedStepSeconds);
    }
    public long getTick() { return tick; }
    public double getSimulationSeconds() { return simulationSeconds; }
}
