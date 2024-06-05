import React, { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import "./App.css";

const convertPDFToBase64Images = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  });
  const pdf = await loadingTask.promise;

  const base64ImageList: string[] = [];
  const canvas = document.createElement("canvas");

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 3 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = canvas.getContext("2d");
    if (!renderContext) {
      console.error("Failed to get canvas context");
      return [];
    }
    const renderTask = page.render({
      canvasContext: renderContext,
      viewport,
    });
    await renderTask.promise;

    const base64Image = canvas.toDataURL("image/jpeg");
    base64ImageList.push(base64Image.split(",")[1]);
  }

  return base64ImageList;
};

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [base64ImageList, setBase64ImageList] = useState<string[]>([]);

  const onClickUploadPDF = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected PDF file:", file);
      setIsLoading(true);

      try {
        // PDFを画像にする
        setBase64ImageList(await convertPDFToBase64Images(file));
      } catch (error) {
        console.error("Error converting PDF to images:", error);
      }

      setIsLoading(false);
    }
  };

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc =
      window.location.origin + "/pdf.worker.min.mjs";
  }, []);

  return (
    <>
      <h1>Convert PDF to Image</h1>

      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      <button onClick={onClickUploadPDF}>
        {isLoading ? "Loading..." : "Upload PDF"}
      </button>

      {base64ImageList.length > 0 && (
        <div className="image-list">
          {base64ImageList.map((base64Image, index) => (
            <img
              key={index}
              src={`data:image/jpeg;base64,${base64Image}`}
              alt={`Page ${index + 1}`}
              style={{
                width: "800px",
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default App;
