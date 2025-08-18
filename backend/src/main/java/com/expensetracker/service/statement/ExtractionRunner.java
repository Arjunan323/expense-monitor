package com.expensetracker.service.statement;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

@Component
public class ExtractionRunner {

    @Value("${openai.api.key:}")
    private String openAiApiKeyProp;

    @Value("${extraction.script.path}")
    private String extractionScriptPath;

    @Value("${python.cmd:python}")
    private String pythonCmd;
    public String run(File tempFile, String password) throws IOException, InterruptedException {
        List<String> cmd = new ArrayList<>();
        cmd.add(pythonCmd);
        cmd.add(extractionScriptPath);
        cmd.add(tempFile.getAbsolutePath());
        if (password != null && !password.isEmpty()) {
            cmd.add(password);
        }
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectOutput(new File("python_out.log"));
        pb.redirectError(new File("python_err.log"));
        pb.redirectErrorStream(true);
        try {
            // Prefer Spring property (can come from application.properties or env via relaxed binding) then fallback to direct env var
            String key = (openAiApiKeyProp != null && !openAiApiKeyProp.isEmpty()) ? openAiApiKeyProp : System.getenv("OPENAI_API_KEY");
            if (key != null && !key.isEmpty()) {
                pb.environment().put("OPENAI_API_KEY", key);
            }
        } catch (Exception ignored) {
        }
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
