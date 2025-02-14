import React from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import PdfDocument from "./PdfDocument";
import { Button, Box } from "@mui/material";
import type { DocumentTemplate } from "./DocumentEditor";

interface PdfPreviewProps {
  template: DocumentTemplate;
  rowData?: Array<Record<string, any>>;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ template, rowData }) => {
  const handleDownloadPDF = async () => {
    const blob = await pdf(
      <PdfDocument template={template} rowData={rowData} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.header.documentTitle || "document"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <PDFViewer
        width="100%"
        height="600"
        showToolbar={true}
        style={{ border: "1px solid #ccc" }}
      >
        <PdfDocument template={template} rowData={rowData} />
      </PDFViewer>

      <Box>
        <Button variant="contained" onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </Box>
    </Box>
  );
};

export default PdfPreview;
