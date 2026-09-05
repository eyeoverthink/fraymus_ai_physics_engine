package fraymus.cell;

public class CellState implements AutoCloseable {
    public CellState() {
        System.out.println("Entered fraymus.cell.CellState");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.cell.CellState");
    }
}