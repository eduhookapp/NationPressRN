#!/bin/bash
# Script to check keystore SHA1 fingerprint

EXPECTED_SHA1="69:F5:BA:D2:45:31:78:4C:99:34:80:EB:3C:55:A9:E0:57:A1:E8:73"

echo "=== Keystore Fingerprint Checker ==="
echo ""
echo "Expected SHA1: $EXPECTED_SHA1"
echo ""

if [ -z "$1" ]; then
    echo "Usage: $0 <keystore-file> [alias] [storepass]"
    echo ""
    echo "Example:"
    echo "  $0 release.keystore nationpress-release nationpress2024"
    echo ""
    exit 1
fi

KEYSTORE_FILE="$1"
ALIAS="${2:-nationpress-release}"
STOREPASS="${3:-nationpress2024}"

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "❌ Error: Keystore file not found: $KEYSTORE_FILE"
    exit 1
fi

echo "Checking keystore: $KEYSTORE_FILE"
echo "Alias: $ALIAS"
echo ""

# Get SHA1 fingerprint
SHA1=$(keytool -list -v -keystore "$KEYSTORE_FILE" -alias "$ALIAS" -storepass "$STOREPASS" 2>/dev/null | grep -i "SHA1:" | head -1 | awk '{print $2}')

if [ -z "$SHA1" ]; then
    echo "❌ Error: Could not read keystore. Check alias and password."
    exit 1
fi

echo "Found SHA1: $SHA1"
echo ""

# Compare (case-insensitive)
if [ "${SHA1^^}" = "${EXPECTED_SHA1^^}" ]; then
    echo "✅ MATCH! This is the correct keystore."
else
    echo "❌ NO MATCH. This is NOT the correct keystore."
    echo ""
    echo "Expected: $EXPECTED_SHA1"
    echo "Found:    $SHA1"
fi

