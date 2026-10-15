# ==============================================================================
# Pomofocus Pro - Backend Production Multi-Stage Dockerfile (Java 21)
# ==============================================================================

# Stage 1: Build JAR using Maven
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Copy Maven wrapper & pom.xml first to leverage Docker layer caching
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source code and build production fat-JAR
COPY src src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Minimal, Secure Runtime Image (JRE only)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root user for security best practices
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy built JAR from builder stage
COPY --from=builder --chown=spring:spring /workspace/target/pomofocus-pro-0.0.1-SNAPSHOT.jar app.jar

# Expose Spring Boot port
EXPOSE 8085

# Optimized JVM memory settings for lightweight VPS cohabitation
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

