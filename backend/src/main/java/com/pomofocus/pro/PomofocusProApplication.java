package com.pomofocus.pro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@SpringBootApplication
public class PomofocusProApplication {

	public static void main(String[] args) {
		loadDotEnv();
		SpringApplication.run(PomofocusProApplication.class, args);
	}

	private static void loadDotEnv() {
		List<Path> candidatePaths = List.of(Path.of(".env"), Path.of("backend/.env"), Path.of("../backend/.env"));
		for (Path p : candidatePaths) {
			if (Files.exists(p)) {
				try {
					List<String> lines = Files.readAllLines(p);
					for (String line : lines) {
						String trimmed = line.trim();
						if (!trimmed.isEmpty() && !trimmed.startsWith("#") && trimmed.contains("=")) {
							int eqIdx = trimmed.indexOf('=');
							String key = trimmed.substring(0, eqIdx).trim();
							String val = trimmed.substring(eqIdx + 1).trim();
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, val);
							}
						}
					}
					break;
				} catch (Exception ignored) {
				}
			}
		}
	}
}
