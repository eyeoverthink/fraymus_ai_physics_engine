package fraymus.core;

/** Fixed-step simulation clock. Rendering and wall-clock timing stay outside the simulation. */
public final class SimulationClock {
    private final double fixedStepSeconds;
    private double accumulatorSeconds;
    private long tick;
    private double simulationSeconds;

    public SimulationClock() { this(1.0 / 60.0); }

    public SimulationClock(double fixedStepSeconds) {
        if (!(fixedStepSeconds > 0.0) || Double.isInfinite(fixedStepSeconds)) {
            throw new IllegalArgumentException("fixedStepSeconds must be finite and > 0");
        }
        this.fixedStepSeconds = fixedStepSeconds;
    }

    public int advance(double elapsedSeconds, Runnable step) {
        if (elapsedSeconds < 0.0 || Double.isNaN(elapsedSeconds) || Double.isInfinite(elapsedSeconds)) {
            throw new IllegalArgumentException("elapsedSeconds must be finite and >= 0");
        }
        if (step == null) throw new NullPointerException("step");
        accumulatorSeconds += elapsedSeconds;
        int steps = 0;
        while (accumulatorSeconds + 1e-12 >= fixedStepSeconds) {
            step.run();
            accumulatorSeconds -= fixedStepSeconds;
            tick++;
            simulationSeconds += fixedStepSeconds;
            steps++;
        }
        return steps;
    }

    public double getFixedStepSeconds() { return fixedStepSeconds; }
    public double getAccumulatorSeconds() { return accumulatorSeconds; }
    public long getTick() { return tick; }
    public double getSimulationSeconds() { return simulationSeconds; }
}
