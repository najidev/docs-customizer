import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";

// 1) Import from @hello-pangea/dnd instead of react-beautiful-dnd
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import PdfPreview from "./PdfPreview";
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
// If using MUI X date pickers, import them here
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { nanoid } from "nanoid";

// ------------------------------------------------------------------
// 1) Types
// ------------------------------------------------------------------
export type Column = {
  id: string;
  label: string;
  visible: boolean;
  readOnly?: boolean; // for columns like rowTotal
};

export interface TableFooterLine {
  id: string; // Unique for drag-and-drop
  label: string;
  value: string;
}

export interface DocumentHeader {
  companyName: string;
  companyAddress: string;
  documentTitle: string;
  customerInfo: string;
  // date?: string; // If you want date picking
}

export interface DocumentFooter {
  text: string; // Rich text from ReactQuill
}

export interface DocumentTemplate {
  header: DocumentHeader;
  columns: Column[];
  tableFooter: TableFooterLine[];
  footer: DocumentFooter;
}

// ------------------------------------------------------------------
// 2) Helper Functions
// ------------------------------------------------------------------
function parseNumber(val: any): number {
  if (typeof val !== "string") return Number(val) || 0;
  const cleaned = val.replace(/[^\d.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function makeFooterLine(label: string, value: string): TableFooterLine {
  return { id: nanoid(), label, value };
}

// Example helper to update or insert lines like Subtotal, Tax, Total
function upsertFooterLine(
  lines: TableFooterLine[],
  label: string,
  value: string
) {
  const lower = label.toLowerCase();
  const idx = lines.findIndex((ln) => ln.label.toLowerCase().trim() === lower);
  if (idx !== -1) {
    return lines.map((ln, i) =>
      i === idx ? { ...ln, value } : ln
    );
  } else {
    return [...lines, makeFooterLine(label, value)];
  }
}

// ------------------------------------------------------------------
// 3) Default Data
// ------------------------------------------------------------------
const DEFAULT_COLUMNS: Column[] = [
  { id: "product", label: "Product", visible: true },
  { id: "description", label: "Description", visible: true },
  { id: "quantity", label: "Quantity", visible: true },
  { id: "price", label: "Price", visible: true },

  // For packing slip style
  { id: "packages", label: "Packages", visible: false },
  { id: "unitsPerPackage", label: "Units/Package", visible: false },
  { id: "unitPrice", label: "Unit Price", visible: false },

  // A read-only column for row totals
  { id: "rowTotal", label: "Total", visible: true, readOnly: true },

  { id: "discount", label: "Discount", visible: false },
];

const DEFAULT_FOOTER_LINES: TableFooterLine[] = [
  { id: "tax-line", label: "Tax", value: "10.00" },
  { id: "subtotal-line", label: "Subtotal", value: "300.00" },
  { id: "total-line", label: "Total", value: "310.00" },
];

const defaultTemplates: Record<string, DocumentTemplate> = {
  invoice: {
    header: {
      companyName: "My Company Ltd.",
      companyAddress: "123 Main St, City, Country",
      documentTitle: "Invoice #0001",
      customerInfo: "John Doe, 456 Another St",
    },
    columns: DEFAULT_COLUMNS.map((col) => {
      // For invoice, hide packages-based columns
      if (["packages", "unitsPerPackage", "unitPrice"].includes(col.id)) {
        return { ...col, visible: false };
      }
      return col;
    }),
    tableFooter: [...DEFAULT_FOOTER_LINES],
    footer: { text: "Thank you for your business!" },
  },
  packingSlip: {
    header: {
      companyName: "My Company Ltd.",
      companyAddress: "123 Main St, City, Country",
      documentTitle: "Packing Slip #2001",
      customerInfo: "Warehouse A, City",
    },
    columns: DEFAULT_COLUMNS.map((col) => {
      // For packing slip, show packages/unitsPerPackage/unitPrice, hide quantity/price
      if (["packages", "unitsPerPackage", "unitPrice"].includes(col.id)) {
        return { ...col, visible: true };
      }
      if (["quantity", "price"].includes(col.id)) {
        return { ...col, visible: false };
      }
      return col;
    }),
    tableFooter: [
      ...DEFAULT_FOOTER_LINES,
      { id: "total-items", label: "Total Items", value: "0" },
    ],
    footer: { text: "Handle with care" },
  },
};

// ------------------------------------------------------------------
// 4) The Editor
// ------------------------------------------------------------------
const DocumentEditor: React.FC = () => {
  // Current docType
  const [docType, setDocType] = useState<string>("invoice");
  const { quill, quillRef } = useQuill({ placeholder: "Thank you for your business!" });
  // Current template
  const [template, setTemplate] = useState<DocumentTemplate>(
    defaultTemplates["invoice"]
  );

  // Example row data
  const [rowData, setRowData] = useState<Array<Record<string, any>>>([
    {
      product: "Chair",
      description: "Office chair",
      quantity: 2,
      price: "$100",
      packages: 0,
      unitsPerPackage: 0,
      unitPrice: 0,
      discount: 0,
      rowTotal: "0.00",
    },
    {
      product: "Table",
      description: "Standing desk",
      quantity: 1,
      price: "$300",
      packages: 0,
      unitsPerPackage: 0,
      unitPrice: 0,
      discount: 0,
      rowTotal: "0.00",
    },
  ]);

  // For preview dialog
  const [openPreview, setOpenPreview] = useState(false);

  // ------------------------------
  // Switch docType
  // ------------------------------
  const handleDocumentTypeChange = (e: SelectChangeEvent<string>) => {
    const newDocType = e.target.value;
    setDocType(newDocType);
    setTemplate({ ...defaultTemplates[newDocType] });

    // Also reset row data for the new doc type (optional)
    setRowData([
      {
        product: "Item A",
        description: "",
        quantity: 1,
        price: "$50",
        packages: 0,
        unitsPerPackage: 0,
        unitPrice: 0,
        discount: 0,
        rowTotal: "0.00",
      },
    ]);
  };

  // ------------------------------
  // Row-level calculations
  // ------------------------------
  function recalcRowTotals(newRows: Record<string, any>[]): Record<string, any>[] {
    const cols = template.columns;
    const packagesVis = cols.some((c) => c.id === "packages" && c.visible);
    const unitsPackVis = cols.some((c) => c.id === "unitsPerPackage" && c.visible);
    const unitPriceVis = cols.some((c) => c.id === "unitPrice" && c.visible);
    const qtyVis = cols.some((c) => c.id === "quantity" && c.visible);
    const priceVis = cols.some((c) => c.id === "price" && c.visible);
    const discountVis = cols.some((c) => c.id === "discount" && c.visible);

    return newRows.map((row) => {
      let total = 0;

      if (packagesVis && unitsPackVis && unitPriceVis) {
        // Packing slip style: packages * unitsPerPackage * unitPrice - discount
        const pk = parseNumber(row.packages);
        const up = parseNumber(row.unitsPerPackage);
        const upPrice = parseNumber(row.unitPrice);
        const disc = discountVis ? parseNumber(row.discount) : 0;
        total = pk * up * upPrice - disc;
      } else {
        // Invoice style: quantity * price - discount
        const q = qtyVis ? parseNumber(row.quantity) : 1;
        const p = priceVis ? parseNumber(row.price) : 0;
        const disc = discountVis ? parseNumber(row.discount) : 0;
        total = q * p - disc;
      }

      return {
        ...row,
        rowTotal: total.toFixed(2),
      };
    });
  }

  // Recalc footer lines (Subtotal, Tax, Total, or Total Items if packingSlip)
  function recalcFooter(newRows: Record<string, any>[]): TableFooterLine[] {
    let lines = [...template.tableFooter];

    // sumOfRowTotals
    const sumOfTotals = newRows.reduce((acc, row) => {
      return acc + parseNumber(row.rowTotal);
    }, 0);

    // Subtotal
    lines = upsertFooterLine(lines, "Subtotal", sumOfTotals.toFixed(2));

    // If there's a "Tax" line, add it to get "Total"
    const taxLine = lines.find((ln) => ln.label.toLowerCase() === "tax");
    const taxVal = taxLine ? parseNumber(taxLine.value) : 0;

    const grandTotal = sumOfTotals + taxVal;
    lines = upsertFooterLine(lines, "Total", grandTotal.toFixed(2));

    // If docType is packingSlip, also compute "Total Items"
    if (docType === "packingSlip") {
      const pkVis = template.columns.some((c) => c.id === "packages" && c.visible);
      const upVis = template.columns.some((c) => c.id === "unitsPerPackage" && c.visible);

      let totalItems = 0;
      if (pkVis && upVis) {
        totalItems = newRows.reduce((acc, row) => {
          const pk = parseNumber(row.packages);
          const up = parseNumber(row.unitsPerPackage);
          return acc + pk * up;
        }, 0);
      }
      lines = upsertFooterLine(lines, "Total Items", String(totalItems));
    }

    return lines;
  }

  // Combine row & footer recalculations
  function recalcAll(newRows: Record<string, any>[]) {
    const recalcedRows = recalcRowTotals(newRows);
    setRowData(recalcedRows);

    const newFooter = recalcFooter(recalcedRows);
    setTemplate((prev) => ({ ...prev, tableFooter: newFooter }));
  }

  // ------------------------------
  // Row handlers
  // ------------------------------
  const handleAddRow = () => {
    const newRows = [
      ...rowData,
      {
        product: "",
        description: "",
        quantity: 1,
        price: "0",
        packages: 0,
        unitsPerPackage: 0,
        unitPrice: 0,
        discount: 0,
        rowTotal: "0.00",
      },
    ];
    recalcAll(newRows);
  };

  const handleRemoveRow = (rowIndex: number) => {
    const newRows = rowData.filter((_, i) => i !== rowIndex);
    recalcAll(newRows);
  };

  const handleCellChange = (rowIndex: number, field: string, val: string) => {
    const newRows = rowData.map((row, i) =>
      i === rowIndex ? { ...row, [field]: val } : row
    );
    recalcAll(newRows);
  };

  // ------------------------------
  // onDragEnd for columns / footer lines
  // ------------------------------
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;

    // Reorder columns
    if (source.droppableId === "columns-droppable" && destination.droppableId === "columns-droppable") {
      const newCols = [...template.columns];
      const [moved] = newCols.splice(source.index, 1);
      newCols.splice(destination.index, 0, moved);
      setTemplate((prev) => ({ ...prev, columns: newCols }));
    }

    // Reorder footer lines
    if (source.droppableId === "footerLines-droppable" && destination.droppableId === "footerLines-droppable") {
      const newLines = [...template.tableFooter];
      const [moved] = newLines.splice(source.index, 1);
      newLines.splice(destination.index, 0, moved);
      setTemplate((prev) => ({ ...prev, tableFooter: newLines }));
    }
  };

  const toggleColumnVisibility = (colId: string) => {
    setTemplate((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === colId ? { ...col, visible: !col.visible } : col
      ),
    }));
  };

  const handleAddFooterLine = () => {
    const newLine = makeFooterLine("New Line", "0.00");
    setTemplate((prev) => ({
      ...prev,
      tableFooter: [...prev.tableFooter, newLine],
    }));
  };

  // ------------------------------
  // Footer Rich Text
  // ------------------------------
  const handleFooterTextChange = (value: string) => {
    setTemplate((prev) => ({
      ...prev,
      footer: { text: value },
    }));
  };

  // ------------------------------
  // Rendering
  // ------------------------------
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {/* DOC TYPE */}
      <FormControl fullWidth>
        <InputLabel>Document Type</InputLabel>
        <Select value={docType} onChange={handleDocumentTypeChange}>
          <MenuItem value="invoice">Invoice</MenuItem>
          <MenuItem value="packingSlip">Packing Slip</MenuItem>
        </Select>
      </FormControl>

      {/* HEADER */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Header
        </Typography>
        <TextField
          label="Company Name"
          fullWidth
          margin="normal"
          value={template.header.companyName}
          onChange={(e) =>
            setTemplate((prev) => ({
              ...prev,
              header: { ...prev.header, companyName: e.target.value },
            }))
          }
        />
        <TextField
          label="Company Address"
          fullWidth
          margin="normal"
          value={template.header.companyAddress}
          onChange={(e) =>
            setTemplate((prev) => ({
              ...prev,
              header: { ...prev.header, companyAddress: e.target.value },
            }))
          }
        />
        <TextField
          label="Document Title"
          fullWidth
          margin="normal"
          value={template.header.documentTitle}
          onChange={(e) =>
            setTemplate((prev) => ({
              ...prev,
              header: { ...prev.header, documentTitle: e.target.value },
            }))
          }
        />
        <TextField
          label="Customer Info"
          fullWidth
          margin="normal"
          value={template.header.customerInfo}
          onChange={(e) =>
            setTemplate((prev) => ({
              ...prev,
              header: { ...prev.header, customerInfo: e.target.value },
            }))
          }
        />
      </Paper>

      {/* DragDropContext from @hello-pangea/dnd (key=docType to re-mount on docType changes) */}
      <DragDropContext key={docType} onDragEnd={handleDragEnd}>
        {/* Columns Droppable */}
        <Droppable droppableId="columns-droppable" direction="horizontal">
          {(provided) => (
            <Paper
              variant="outlined"
              sx={{ p: 2, mb: 2 }}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <Typography variant="h6" gutterBottom>
                Table Columns
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Drag & drop to reorder. Click a column to toggle visibility.
              </Typography>
              <Box display="flex" gap={2}>
                {template.columns.map((col, index) => (
                  <Draggable key={col.id} draggableId={col.id} index={index}>
                    {(providedDraggable) => (
                      <Box
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        {...providedDraggable.dragHandleProps}
                        onClick={() => toggleColumnVisibility(col.id)}
                        p="0.5rem 1rem"
                        border="1px solid #ccc"
                        borderRadius="4px"
                        sx={{
                          backgroundColor: col.visible ? "#fff" : "#f0f0f0",
                          cursor: "move",
                        }}
                        style={{
                          ...providedDraggable.draggableProps.style,
                        }}
                      >
                        {col.label}
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            </Paper>
          )}
        </Droppable>

        {/* TABLE ROWS (not draggable, just a simple table) */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Table Rows
          </Typography>
          <Button variant="contained" onClick={handleAddRow} sx={{ mb: 2 }}>
            Add Row
          </Button>
          <Table size="small">
            <TableHead>
              <TableRow>
                {template.columns
                  .filter((c) => c.visible)
                  .map((c) => (
                    <TableCell key={c.id}>{c.label}</TableCell>
                  ))}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rowData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {template.columns
                    .filter((c) => c.visible)
                    .map((c) => (
                      <TableCell key={c.id}>
                        {c.readOnly ? (
                          <TextField
                            variant="standard"
                            value={row[c.id] ?? ""}
                            InputProps={{ readOnly: true }}
                          />
                        ) : (
                          <TextField
                            variant="standard"
                            value={row[c.id] ?? ""}
                            onChange={(e) =>
                              handleCellChange(rowIndex, c.id, e.target.value)
                            }
                          />
                        )}
                      </TableCell>
                    ))}
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveRow(rowIndex)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* Footer Lines Droppable */}
        <Droppable droppableId="footerLines-droppable">
          {(provided) => (
            <Paper
              variant="outlined"
              sx={{ p: 2, mb: 2 }}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <Typography variant="h6" gutterBottom>
                Table Footer
              </Typography>
              <Button variant="contained" onClick={handleAddFooterLine} sx={{ mb: 2 }}>
                Add Footer Line
              </Button>
              <Box>
                {template.tableFooter.map((line, index) => (
                  <Draggable key={line.id} draggableId={line.id} index={index}>
                    {(providedDraggable) => (
                      <Box
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        sx={{
                          display: "flex",
                          gap: 2,
                          alignItems: "center",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          p: 1,
                          mb: 1,
                        }}
                        style={{
                          ...providedDraggable.draggableProps.style,
                        }}
                      >
                        {/* Reorder handle */}
                        <Box
                          {...providedDraggable.dragHandleProps}
                          sx={{
                            cursor: "move",
                            backgroundColor: "#efefef",
                            p: "4px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          ⇅
                        </Box>
                        <TextField
                          label="Label"
                          value={line.label}
                          onChange={(e) =>
                            setTemplate((prev) => ({
                              ...prev,
                              tableFooter: prev.tableFooter.map((ln) =>
                                ln.id === line.id
                                  ? { ...ln, label: e.target.value }
                                  : ln
                              ),
                            }))
                          }
                        />
                        <TextField
                          label="Value"
                          value={line.value}
                          onChange={(e) =>
                            setTemplate((prev) => ({
                              ...prev,
                              tableFooter: prev.tableFooter.map((ln) =>
                                ln.id === line.id
                                  ? { ...ln, value: e.target.value }
                                  : ln
                              ),
                            }))
                          }
                        />
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            </Paper>
          )}
        </Droppable>
      </DragDropContext>

      {/* DOCUMENT FOOTER (Rich Text) */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Document Footer (Rich Text)
        </Typography>
        <div ref={quillRef} />
      </Paper>

      {/* PREVIEW BUTTON */}
      <Box textAlign="right">
        <Button variant="contained" onClick={() => setOpenPreview(true)}>
          Preview Document
        </Button>
      </Box>

      {/* PREVIEW DIALOG (for PDF or any preview) */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Preview</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Here you can render your PDF or any other preview component.
          </Typography>
           <PdfPreview template={template} rowData={rowData} /> 
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentEditor;
