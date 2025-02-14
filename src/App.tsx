import React from "react";
import { Container, Typography } from "@mui/material";
import DocumentEditor from "./components/DocumentEditor";

function App() {
  return (
    <Container maxWidth="lg" style={{ marginTop: "2rem" }}>
      <Typography variant="h4" gutterBottom>
        Custom Document Editor with PDF Preview
      </Typography>
      <DocumentEditor />
    </Container>
  );
}

export default App;
