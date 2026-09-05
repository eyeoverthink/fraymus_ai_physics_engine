package fraymus.cell;

public class CellInput implements AutoCloseable {
    public CellInput() {
        System.out.println("Entered fraymus.cell.CellInput");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.cell.CellInput");
    }
}