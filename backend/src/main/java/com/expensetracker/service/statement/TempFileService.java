package com.expensetracker.service.statement;

import com.expensetracker.util.AppConstants;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@Component
public class TempFileService {
    public File saveTempPdf(MultipartFile file) throws IOException {
        File tempFile = File.createTempFile(AppConstants.TEMP_FILE_PREFIX, AppConstants.TEMP_FILE_SUFFIX);
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(file.getBytes());
        }
        return tempFile;
    }
}
