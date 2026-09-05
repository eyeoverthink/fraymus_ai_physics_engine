package fraymus.cell;

public class CellOutput implements AutoCloseable {
    public CellOutput() {
        System.out.println("Entered fraymus.cell.CellOutput");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.cell.CellOutput");
    }
}