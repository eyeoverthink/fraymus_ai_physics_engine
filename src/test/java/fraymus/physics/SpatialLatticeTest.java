package fraymus.physics;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SpatialLatticeTest {
    @Test
    void exposesFixedSixteenCubedDimensions() {
        SpatialLattice<String> lattice = new SpatialLattice<>();

        assertEquals(16, lattice.width());
        assertEquals(16, lattice.height());
        assertEquals(16, lattice.depth());
        assertEquals(4096, lattice.cellCount());
    }

    @Test
    void storesIndependentValuesAtStableThreeDimensionalCoordinates() {
        SpatialLattice<String> lattice = new SpatialLattice<>();

        lattice.set(0, 0, 0, "origin");
        lattice.set(15, 15, 15, "far-corner");
        lattice.set(4, 8, 12, "interior");

        assertEquals("origin", lattice.get(0, 0, 0));
        assertEquals("far-corner", lattice.get(15, 15, 15));
        assertEquals("interior", lattice.get(4, 8, 12));
        assertEquals(0, SpatialLattice.indexOf(0, 0, 0));
        assertEquals(4095, SpatialLattice.indexOf(15, 15, 15));
    }

    @Test
    void clearsOneCellOrTheEntireLayerWithoutChangingItsShape() {
        SpatialLattice<Integer> lattice = new SpatialLattice<>();
        lattice.set(1, 2, 3, 10);
        lattice.set(4, 5, 6, 20);

        lattice.clear(1, 2, 3);
        assertNull(lattice.get(1, 2, 3));
        assertEquals(20, lattice.get(4, 5, 6));

        lattice.clear();
        assertNull(lattice.get(4, 5, 6));
        assertEquals(4096, lattice.cellCount());
    }

    @Test
    void rejectsEveryCoordinateOutsideTheLattice() {
        SpatialLattice<Object> lattice = new SpatialLattice<>();

        assertThrows(IndexOutOfBoundsException.class, () -> lattice.get(-1, 0, 0));
        assertThrows(IndexOutOfBoundsException.class, () -> lattice.get(16, 0, 0));
        assertThrows(IndexOutOfBoundsException.class, () -> lattice.set(0, -1, 0, new Object()));
        assertThrows(IndexOutOfBoundsException.class, () -> lattice.set(0, 16, 0, new Object()));
        assertThrows(IndexOutOfBoundsException.class, () -> lattice.clear(0, 0, -1));
        assertThrows(IndexOutOfBoundsException.class, () -> lattice.clear(0, 0, 16));
    }
}