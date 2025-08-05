"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Upload } from "lucide-react";
import { useState } from "react";

export default function PDFTextExtractor() {
  const [extractedText, setExtractedText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [pdfInfo, setPdfInfo] = useState<{
    pages: number;
    textLength: number;
  } | null>(null);

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("pdf") as File;

    if (!file) {
      alert("Iltimos PDF fayl tanlang");
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Faqat PDF fayllar qabul qilinadi");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      //(10MB limit)
      alert("Fayl hajmi 10MB dan oshmasligi kerak");
      return;
    }
    setLoading(true);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const pdfjsLib = await import("pdfjs-dist");

      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
      });
      const pdfDocument = await loadingTask.promise;

      let extractedText = "";
      const numPages = pdfDocument.numPages;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();

          const pageText = textContent.items
            .map((item: any) => ("str" in item ? item.str : ""))
            .join(" ");

          extractedText += pageText + "\n\n";
        } catch (pageError) {
          console.warn(`Sahifa ${pageNum} da xatolik:`, pageError);
          extractedText += `[Sahifa ${pageNum} o'qilmadi]\n\n`;
        }
      }

      const finalText = extractedText.trim();

      setExtractedText(finalText);
      setPdfInfo({
        pages: numPages,
        textLength: finalText.length,
      });
    } catch (error) {
      console.error("PDF ni qayta ishlashda xatolik:", error);

      let errorMessage = "PDF ni qayta ishlashda xatolik yuz berdi.";

      if (error instanceof Error) {
        if (error.message.includes("Invalid PDF")) {
          errorMessage = "PDF fayl buzilgan yoki noto'g'ri formatda.";
        } else if (error.message.includes("password")) {
          errorMessage = "PDF fayl parol bilan himoyalangan.";
        } else if (error.message.includes("fetch")) {
          errorMessage = "PDF ni yuklashda tarmoq xatoligi.";
        }
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadText = () => {
    if (!extractedText) return;

    const blob = new Blob([extractedText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(".pdf", "")}_extracted_text.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PDF Matn Ajratuvchi
          </h1>
          <p className="text-gray-600">PDF fayldan matnni ajratib oling</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                PDF Yuklash
              </CardTitle>
              <CardDescription>
                PDF faylni tanlang va matnni ajratib oling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="pdf">PDF Fayl</Label>
                  <Input
                    id="pdf"
                    name="pdf"
                    type="file"
                    accept="application/pdf"
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Qayta ishlanmoqda...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Matnni Ajratish
                    </>
                  )}
                </Button>
              </form>

              {pdfInfo && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">
                    PDF Ma'lumotlari:
                  </h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>📄 Sahifalar: {pdfInfo.pages}</p>
                    <p>
                      📝 Matn uzunligi: {pdfInfo.textLength.toLocaleString()}{" "}
                      belgi
                    </p>
                    <p>📁 Fayl: {fileName}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ajratilgan Matn
              </CardTitle>
              <CardDescription>
                {fileName ? `Fayl: ${fileName}` : "Matn bu yerda ko'rsatiladi"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={extractedText}
                placeholder="PDF yuklangandan so'ng matn bu yerda ko'rsatiladi..."
                className="min-h-[300px] resize-none"
                readOnly
              />
              {extractedText && (
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      ✅ Matn muvaffaqiyatli ajratildi!
                      <br />
                      <span className="text-xs">
                        Hohlasangiz .txt formatda yuklab oling
                      </span>
                    </p>
                  </div>
                  <Button
                    onClick={downloadText}
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Matnni Yuklab Olish
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Qo'llanma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                1
              </span>
              <p className="text-sm">PDF faylni tanlang (maksimal 10MB)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                2
              </span>
              <p className="text-sm">"Matnni Ajratish" tugmasini bosing</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                3
              </span>
              <p className="text-sm">
                Ajratilgan matn o'ng tomonda ko'rsatiladi
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                4
              </span>
              <p className="text-sm">
                "Matnni Yuklab Olish" tugmasi orqali matnni fayl sifatida
                saqlang
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
