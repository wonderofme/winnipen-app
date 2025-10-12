@echo off
echo Cleaning and reinstalling Winnipen dependencies...

echo.
echo Step 1: Cleaning existing node_modules...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "backend\node_modules" rmdir /s /q "backend\node_modules"
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"

echo.
echo Step 2: Cleaning package-lock files...
if exist "package-lock.json" del "package-lock.json"
if exist "backend\package-lock.json" del "backend\package-lock.json"
if exist "frontend\package-lock.json" del "frontend\package-lock.json"

echo.
echo Step 3: Installing root dependencies...
npm install

echo.
echo Step 4: Installing backend dependencies...
cd backend
npm install
cd ..

echo.
echo Step 5: Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo Installation complete! You can now run:
echo   npm run dev
echo.
pause







