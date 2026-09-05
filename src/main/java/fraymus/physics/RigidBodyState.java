package fraymus.physics;

/**
 * Immutable renderer-independent data stored in a rigid-body lattice layer.
 *
 * <p>This record describes state only. It does not integrate forces, apply
 * gravity, resolve collisions, own ECS components, or perform rendering.</p>
 */
public record RigidBodyState(
        double velocityX,
        double velocityY,
        double velocityZ,
        double gravityResponse,
        double mass,
        double capacity,
        double energy,
        long tick,
        double simulationSeconds) {

    public RigidBodyState {
        requireFinite("velocityX", velocityX);
        requireFinite("velocityY", velocityY);
        requireFinite("velocityZ", velocityZ);
        requireNonNegative("gravityResponse", gravityResponse);
        requirePositive("mass", mass);
        requireNonNegative("capacity", capacity);
        requireNonNegative("energy", energy);
        requireNonNegative("simulationSeconds", simulationSeconds);

        if (energy > capacity) {
            throw new IllegalArgumentException("energy must not exceed capacity");
        }
        if (tick < 0) {
            throw new IllegalArgumentException("tick must be >= 0");
        }
    }

    private static void requireFinite(String name, double value) {
        if (!Double.isFinite(value)) {
            throw new IllegalArgumentException(name + " must be finite");
        }
    }

    private static void requireNonNegative(String name, double value) {
        requireFinite(name, value);
        if (value < 0.0) {
            throw new IllegalArgumentException(name + " must be >= 0");
        }
    }

    private static void requirePositive(String name, double value) {
        requireFinite(name, value);
        if (!(value > 0.0)) {
            throw new IllegalArgumentException(name + " must be > 0");
        }
    }
}