#!/bin/bash
# Script to export keystore using PEPK tool for Google Play App Signing

echo "=== Export Keystore with PEPK Tool ==="
echo ""

# Configuration - Update these values
KEYSTORE_FILE="android/app/release.keystore"
KEY_ALIAS="nationpress-release"
KEYSTORE_PASSWORD="nationpress2024"
KEY_PASSWORD="nationpress2024"
OUTPUT_FILE="encrypted_key.zip"
ENCRYPTION_KEY_PATH="encryption_public_key.pem"

echo "Configuration:"
echo "  Keystore: $KEYSTORE_FILE"
echo "  Alias: $KEY_ALIAS"
echo "  Output: $OUTPUT_FILE"
echo "  Encryption Key: $ENCRYPTION_KEY_PATH"
echo ""

# Check if PEPK tool exists and is valid
if [ ! -f "pepk.jar" ]; then
    echo "❌ Error: pepk.jar not found!"
    echo ""
    echo "Please download PEPK tool from Google Play Console:"
    echo "  1. Go to: https://play.google.com/console"
    echo "  2. Select your app"
    echo "  3. Navigate to: Release > Setup > App integrity"
    echo "  4. Under 'Play App Signing' > 'Settings'"
    echo "  5. Click 'Download the Play Encrypt Private Key (PEPK) tool'"
    echo "  6. Save it as 'pepk.jar' in this directory"
    echo ""
    exit 1
fi

# Verify it's a valid JAR file
if ! file pepk.jar | grep -q "Java archive\|Zip archive"; then
    echo "❌ Error: pepk.jar is not a valid JAR file!"
    echo ""
    echo "The file appears to be corrupted. Please:"
    echo "  1. Delete the current pepk.jar file"
    echo "  2. Download it again from Google Play Console"
    echo "  3. Make sure the download completed successfully"
    echo ""
    echo "File info:"
    file pepk.jar
    ls -lh pepk.jar
    echo ""
    exit 1
fi

# Check if keystore exists
if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "❌ Error: Keystore file not found: $KEYSTORE_FILE"
    exit 1
fi

# Check if encryption key exists
if [ ! -f "$ENCRYPTION_KEY_PATH" ]; then
    echo "⚠️  Warning: Encryption key not found: $ENCRYPTION_KEY_PATH"
    echo ""
    echo "You need to download the encryption public key from Google Play Console:"
    echo "  1. Go to: Release > Setup > App integrity"
    echo "  2. Under 'Play App Signing', click 'Settings'"
    echo "  3. Scroll to 'Request key upgrade' or 'App signing key' section"
    echo "  4. Download the encryption_public_key.pem file"
    echo "  5. Save it in the project root as: encryption_public_key.pem"
    echo ""
    read -p "Do you have the encryption key file? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please download the encryption key first, then run this script again."
        exit 1
    fi
fi

echo "Running PEPK tool..."
echo ""

# Run PEPK tool
java -jar pepk.jar \
    --keystore="$KEYSTORE_FILE" \
    --alias="$KEY_ALIAS" \
    --output="$OUTPUT_FILE" \
    --include-cert \
    --rsa-aes-encryption \
    --encryption-key-path="$ENCRYPTION_KEY_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Encrypted key exported to: $OUTPUT_FILE"
    echo ""
    echo "Next steps:"
    echo "  1. Go to Google Play Console"
    echo "  2. Navigate to: Release > Setup > App integrity"
    echo "  3. Under 'Play App Signing' > 'Settings'"
    echo "  4. Click 'Request key upgrade'"
    echo "  5. Upload the file: $OUTPUT_FILE"
    echo ""
else
    echo ""
    echo "❌ Error: Failed to export keystore"
    echo "Please check:"
    echo "  - Keystore file path is correct"
    echo "  - Alias and passwords are correct"
    echo "  - Encryption key file exists"
    echo "  - Java is installed and accessible"
    exit 1
fi

