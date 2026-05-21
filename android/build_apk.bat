@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "C:\Users\cleit\OneDrive\Documentos\fabricalog\android"
call gradlew.bat assembleDebug
echo EXIT_CODE=%ERRORLEVEL%
