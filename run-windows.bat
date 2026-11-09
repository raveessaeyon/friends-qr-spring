@echo off
cd /d "%~dp0"
echo Starting Friends QR website...
echo When Spring Boot is ready, open http://localhost:8080
call mvn spring-boot:run
pause
