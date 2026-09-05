package fraymus.cell;

public class Cell implements AutoCloseable {
    public Cell() {
        System.out.println("Entered fraymus.cell.Cell");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.cell.Cell");
    }
}