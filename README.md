# Friends QR Circle

A small Java web app built with Spring Boot. The page uses a Spring REST endpoint to load the friend and payment QR list. QR images are served from the app's static assets.

## Requirements

- Java 25 (latest LTS) or newer
- Maven 3.6.3 or newer

## Run locally

From this folder, run:

```powershell
mvn spring-boot:run
```

Then open <http://localhost:8080>. The friend list API is at <http://localhost:8080/api/friends>.

To make a runnable jar:

```powershell
mvn clean package
java -jar target/friends-qr-0.0.1-SNAPSHOT.jar
```

The friend names and QR file names are listed in `FriendsController.java`. Add or replace QR images under `src/main/resources/static/assets`.
