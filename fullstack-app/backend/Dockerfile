FROM docker.io/library/eclipse-temurin:17-jdk-jammy

# Set working directory
WORKDIR /app

# Install Maven and wget (for healthcheck)
RUN apt-get update && \
    apt-get install -y wget && \
    wget https://archive.apache.org/dist/maven/maven-3/3.9.5/binaries/apache-maven-3.9.5-bin.tar.gz && \
    tar -xzf apache-maven-3.9.5-bin.tar.gz && \
    mv apache-maven-3.9.5 /opt/maven && \
    ln -s /opt/maven/bin/mvn /usr/local/bin/mvn && \
    rm apache-maven-3.9.5-bin.tar.gz && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set Maven environment
ENV MAVEN_HOME=/opt/maven
ENV PATH="${MAVEN_HOME}/bin:${PATH}"

# Copy pom.xml first for better caching
COPY pom.xml ./

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -B

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8080

# JVM options optimized for containers
ENV JAVA_OPTS="-Xmx1g -Xms512m -XX:+UseContainerSupport"

# Run the application
CMD ["sh", "-c", "java $JAVA_OPTS -jar target/backend-*.jar"]
