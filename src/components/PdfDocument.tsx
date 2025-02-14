import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Column, DocumentTemplate } from "./DocumentEditor";

// You can optionally register custom fonts:
// Font.register({
//   family: "OpenSans",
//   src: "/fonts/OpenSans-Regular.ttf",
// });

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    padding: 20,
    fontFamily: "Helvetica",
  },
  headerContainer: {
    marginBottom: 10,
  },
  logo: {
    height: 40,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  companyAddress: {
    fontSize: 10,
  },
  documentTitle: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "bold",
  },
  customerInfo: {
    marginTop: 2,
    fontSize: 10,
  },
  dateText: {
    fontSize: 10,
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: 1,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    paddingVertical: 4,
  },
  tableCellHeader: {
    flex: 1,
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
  },
  footerContainer: {
    marginTop: 10,
    borderTop: 1,
    paddingTop: 5,
  },
  tableFooterContainer: {
    marginTop: 10,
    marginLeft: "auto",
    width: "50%", // or whatever
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  footerLabel: {
    fontWeight: "bold",
  },
  footerLinesContainer: {
    marginTop: 10,
    marginLeft: "auto",
    width: "50%", // or any style you want
  },
  footerLineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  labelText: {
    fontWeight: "bold",
  },
});

interface PdfDocumentProps {
  template: DocumentTemplate;
  rowData?: Array<Record<string, any>>;
}

const PdfDocument: React.FC<PdfDocumentProps> = ({ template, rowData = [] }) => {
  const { header, columns, footer, tableFooter  } = template;
  console.log("rowData", rowData);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.companyName}>{header.companyName}</Text>
          <Text style={styles.companyAddress}>{header.companyAddress}</Text>
          <Text style={styles.documentTitle}>{header.documentTitle}</Text>
          <Text style={styles.customerInfo}>Customer: {header.customerInfo}</Text>
          <Text style={styles.dateText}>Date: {header.date}</Text>
        </View>

        {/* Table */}
        <View style={styles.tableHeader}>
          {columns.filter((c) => c.visible).map((col) => (
            <Text key={col.id} style={[styles.tableCellHeader]}>
              {col.label}
            </Text>
          ))}
        </View>
        {rowData.map((row, rowIndex) => (
          <View style={styles.tableRow} key={`row-${rowIndex}`}>
            {columns.filter((c) => c.visible).map((col) => (
              <Text key={col.id} style={styles.tableCell}>
                {row[col.id] ?? ""}
              </Text>
            ))}
          </View>
        ))}
        {/* Table Footer */}
        <View style={styles.footerLinesContainer}>
          {tableFooter.map((line) => (
            <View key={line.id} style={styles.footerLineRow}>
              <Text style={styles.labelText}>{line.label}:</Text>
              <Text>{line.value}</Text>
            </View>
          ))}
        </View>

        {/* Footer section (rich text simplified or plain text) */}
        {/* Footer */}
        <View style={styles.footerContainer}>
          {/* Render rich text as plain text for simplicity; 
              or parse HTML -> PDF. For advanced usage, you'll need an HTML-to-PDF parser. */}
          <Text>{footer.text}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PdfDocument;
