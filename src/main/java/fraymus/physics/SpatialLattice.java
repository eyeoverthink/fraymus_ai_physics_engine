package fraymus.physics;

import java.util.Arrays;

/**
 * Fixed-size renderer-independent storage for one 16 x 16 x 16 data layer.
 *
 * <p>The lattice stores data only. It does not apply gravity, collisions,
 * rendering, or wall-clock timing. Additional layers can use the same
 * coordinates for rigid-body state, energy, framebuffer samples, or other
 * component data without coupling those concerns together.</p>
 */
public final class SpatialLattice<T> {
    public static final int WIDTH = 16;
    public static final int HEIGHT = 16;
    public static final int DEPTH = 16;
    public static final int CELL_COUNT = WIDTH * HEIGHT * DEPTH;

    private final Object[] cells = new Object[CELL_COUNT];

    public int width() {
        return WIDTH;
    }

    public int height() {
        return HEIGHT;
    }

    public int depth() {
        return DEPTH;
    }

    public int cellCount() {
        return CELL_COUNT;
    }

    public void set(int x, int y, int z, T value) {
        cells[indexOf(x, y, z)] = value;
    }

    @SuppressWarnings("unchecked")
    public T get(int x, int y, int z) {
        return (T) cells[indexOf(x, y, z)];
    }

    public void clear(int x, int y, int z) {
        cells[indexOf(x, y, z)] = null;
    }

    public void clear() {
        Arrays.fill(cells, null);
    }

    /**
     * Maps a coordinate to stable flat storage with x changing fastest,
     * followed by y and then z.
     */
    public static int indexOf(int x, int y, int z) {
        requireCoordinate("x", x, WIDTH);
        requireCoordinate("y", y, HEIGHT);
        requireCoordinate("z", z, DEPTH);
        return x + WIDTH * (y + HEIGHT * z);
    }

    private static void requireCoordinate(String axis, int coordinate, int limit) {
        if (coordinate < 0 || coordinate >= limit) {
            throw new IndexOutOfBoundsException(
                    axis + " coordinate " + coordinate + " is outside [0, " + (limit - 1) + "]");
        }
    }
}