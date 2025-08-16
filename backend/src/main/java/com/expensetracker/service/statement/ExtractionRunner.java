package com.expensetracker.service.statement;

import com.expensetracker.util.AppConstants;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

@Component
public class ExtractionRunner {
    public String run(File tempFile, String password) throws IOException, InterruptedException {
        List<String> cmd = new ArrayList<>();
        cmd.add("python");
        cmd.add(AppConstants.EXTRACTION_SCRIPT_PATH);
        cmd.add(tempFile.getAbsolutePath());
        if (password != null && !password.isEmpty()) {
            cmd.add(password);
        }
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        try {
            String openAiKey = System.getenv("OPENAI_API_KEY");
            if (openAiKey != null && !openAiKey.isEmpty()) {
                pb.environment().put("OPENAI_API_KEY", openAiKey);
            }
        } catch (Exception ignored) {}
        Process process = pb.start();
        StringBuilder output = new StringBuilder();
        try (Scanner scanner = new Scanner(process.getInputStream())) {
            while (scanner.hasNextLine()) {
                output.append(scanner.nextLine());
            }
        }
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            return null;
        }
        return output.toString();
    }
}
