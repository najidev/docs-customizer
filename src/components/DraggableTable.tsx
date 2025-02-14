import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Box,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';

export interface Column {
  id: string;
  label: string;
  visible: boolean;
}

interface DraggableTableProps {
  columns: Column[];
  setColumns: (cols: Column[]) => void;
}

const DraggableTable: React.FC<DraggableTableProps> = ({ columns, setColumns }) => {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(columns);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setColumns(reordered);
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter((col) => col.id !== id));
  };

  return (
    <Paper sx={{ p: 2 }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="columns" direction="horizontal">
          {(provided) => (
            <Table ref={provided.innerRef} {...provided.droppableProps}>
              <TableHead>
                <TableRow>
                  {columns.map((col, index) => (
                    <Draggable key={col.id} draggableId={col.id} index={index}>
                      {(provided) => (
                        <TableCell
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{ border: '1px solid #ccc' }}
                        >
                          <Box display="flex" alignItems="center">
                            {col.label}
                            <IconButton
                              size="small"
                              onClick={() => removeColumn(col.id)}
                            >
                              <DeleteIcon fontSize="inherit" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      {/* Placeholder content for table row */}
                      Data
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          )}
        </Droppable>
      </DragDropContext>
    </Paper>
  );
};

export default DraggableTable;
