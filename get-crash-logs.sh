#!/bin/bash
# Script to retrieve crash logs from Android device

PACKAGE_NAME="com.nationpress.app"
ADB_PATH="/Users/fuel/Library/Android/sdk/platform-tools/adb"

echo "=== Nation Press Crash Log Retriever ==="
echo ""

# Check if device is connected
if ! $ADB_PATH devices | grep -q "device$"; then
    echo "❌ No Android device connected!"
    echo "Please connect your device via USB and enable USB debugging."
    exit 1
fi

echo "✅ Device connected"
echo ""

# Try multiple paths for external storage (varies by device)
EXTERNAL_PATHS=(
    "/sdcard/Android/data/${PACKAGE_NAME}/files/NationPressCrashLogs"
    "/storage/emulated/0/Android/data/${PACKAGE_NAME}/files/NationPressCrashLogs"
    "/storage/sdcard0/Android/data/${PACKAGE_NAME}/files/NationPressCrashLogs"
)
INTERNAL_PATH="/data/data/${PACKAGE_NAME}/files/NationPressCrashLogs"

echo "Checking for crash logs..."
echo ""

# Check external storage (multiple possible paths)
FOUND_LOGS=false
for EXTERNAL_PATH in "${EXTERNAL_PATHS[@]}"; do
    if $ADB_PATH shell "test -d '$EXTERNAL_PATH' 2>/dev/null" 2>/dev/null; then
        echo "📁 Found logs directory: $EXTERNAL_PATH"
        LOG_COUNT=$($ADB_PATH shell "ls '$EXTERNAL_PATH'/*.txt 2>/dev/null | wc -l" 2>/dev/null | tr -d ' ' | tr -d '\r')

        if [ -n "$LOG_COUNT" ] && [ "$LOG_COUNT" -gt 0 ]; then
            echo "   Found $LOG_COUNT crash log file(s)"
            echo ""
            echo "📥 Pulling crash logs..."
            mkdir -p ./crash_logs
            $ADB_PATH pull "$EXTERNAL_PATH/." ./crash_logs/ 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "✅ Crash logs saved to: ./crash_logs/"
                FOUND_LOGS=true
                break
            else
                echo "   ⚠️  Failed to pull logs, trying alternative method..."
                # Try pulling individual files
                FILES=$($ADB_PATH shell "ls '$EXTERNAL_PATH'/*.txt" 2>/dev/null | tr -d '\r')
                for file in $FILES; do
                    if [ -n "$file" ]; then
                        FILENAME=$(basename "$file" | tr -d '\r')
                        echo "   Copying $FILENAME..."
                        $ADB_PATH shell "cat '$file'" > "./crash_logs/$FILENAME" 2>/dev/null
                    fi
                done
                if [ -d "./crash_logs" ] && [ "$(ls -A ./crash_logs 2>/dev/null)" ]; then
                    echo "✅ Crash logs saved to: ./crash_logs/"
                    FOUND_LOGS=true
                    break
                fi
            fi
        else
            echo "   No crash log files found in this location"
        fi
    fi
done

if [ "$FOUND_LOGS" = false ]; then
    echo "   No logs found in external storage"
fi

# Check internal storage (requires root or run-as)
echo ""
echo "Checking internal storage (requires app debugging permissions)..."
if $ADB_PATH shell "run-as $PACKAGE_NAME test -d '$INTERNAL_PATH' 2>/dev/null" 2>/dev/null; then
    echo "📁 Found logs in internal storage"
    LOG_COUNT=$($ADB_PATH shell "run-as $PACKAGE_NAME ls '$INTERNAL_PATH'/*.txt 2>/dev/null | wc -l" 2>/dev/null | tr -d ' ' | tr -d '\r')

    if [ -n "$LOG_COUNT" ] && [ "$LOG_COUNT" -gt 0 ]; then
        echo "   Found $LOG_COUNT crash log file(s)"
        echo ""
        echo "📥 Pulling crash logs from internal storage..."
        mkdir -p ./crash_logs_internal
        
        # List files
        FILES=$($ADB_PATH shell "run-as $PACKAGE_NAME ls '$INTERNAL_PATH'/*.txt" 2>/dev/null | tr -d '\r')
        for file in $FILES; do
            if [ -n "$file" ]; then
                FILENAME=$(basename "$file" | tr -d '\r')
                echo "   Copying $FILENAME..."
                $ADB_PATH shell "run-as $PACKAGE_NAME cat '$file'" > "./crash_logs_internal/$FILENAME" 2>/dev/null
            fi
        done
        if [ -d "./crash_logs_internal" ] && [ "$(ls -A ./crash_logs_internal 2>/dev/null)" ]; then
            echo "✅ Crash logs saved to: ./crash_logs_internal/"
        fi
    else
        echo "   No crash log files found"
    fi
else
    echo "   Cannot access internal storage (requires app debugging or root)"
    echo "   💡 Tip: Make sure the app is installed in debug mode"
fi

# Check if app is installed
echo ""
echo "Checking app installation..."
if $ADB_PATH shell "pm list packages | grep -q $PACKAGE_NAME" 2>/dev/null; then
    echo "✅ App is installed: $PACKAGE_NAME"
    
    # Try to get log directory path from app
    echo ""
    echo "Checking app's log directory path..."
    LOG_PATH=$($ADB_PATH logcat -d | grep "Crash logs directory" | tail -1 | sed -n 's/.*directory: \([^ ]*\).*/\1/p' || echo "")

    if [ -n "$LOG_PATH" ]; then
        echo "   App log directory: $LOG_PATH"
        echo "   💡 You can access this path directly if you have the right permissions"
    fi
else
    echo "❌ App is not installed: $PACKAGE_NAME"
    echo "   Install the app first: adb install -r android/app/build/outputs/apk/debug/app-debug.apk"
fi

echo ""
echo "=== Done ==="
echo ""
echo "💡 Tip: View logs in Firebase Console at:"
echo "   https://console.firebase.google.com/"
echo ""

