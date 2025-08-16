package com.expensetracker.service.statement;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.nio.file.Files;

import java.io.IOException;

@Component
public class PdfPageCounter {
    public int countPages(MultipartFile file, String password) throws IOException {
        PDDocument pdfDoc = null;
        try {
            if (password != null && !password.isEmpty()) {
                pdfDoc = PDDocument.load(file.getBytes(), password);
            } else {
                pdfDoc = PDDocument.load(file.getBytes());
            }
            return pdfDoc.getNumberOfPages();
        } catch (InvalidPasswordException e) {
            throw new IOException("PDF password required or incorrect", e);
        } finally {
            if (pdfDoc != null) pdfDoc.close();
        }
    }

    public int countPages(File file, String password) throws IOException {
        PDDocument pdfDoc = null;
        byte[] bytes = Files.readAllBytes(file.toPath());
        try {
            if (password != null && !password.isEmpty()) {
                pdfDoc = PDDocument.load(bytes, password);
            } else {
                pdfDoc = PDDocument.load(bytes);
            }
            return pdfDoc.getNumberOfPages();
        } catch (InvalidPasswordException e) {
            throw new IOException("PDF password required or incorrect", e);
        } finally {
            if (pdfDoc != null) pdfDoc.close();
        }
    }
}
