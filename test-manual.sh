#!/bin/bash

# Manual test script for create-net
# This script runs the three main scenarios and leaves the results for manual inspection
# Run this from the create-net project root directory

set -e  # Exit on error

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

TEST_DIR="test-manual"
CREATE_NET_SCRIPT="$(pwd)/bin/create-net.js"

echo -e "${YELLOW}=== Manual Testing for create-net ===${NC}"
echo -e "${YELLOW}Results will be saved in: $TEST_DIR${NC}\n"

# Clean up any previous test runs
if [ -d "$TEST_DIR" ]; then
  echo "Cleaning up previous test directory..."
  rm -rf "$TEST_DIR"
fi

mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Test 1: With repo name and ProjectName
echo -e "\n${YELLOW}================================================${NC}"
echo -e "${GREEN}Test 1: With repo name and ProjectName${NC}"
echo -e "${YELLOW}Command: node $CREATE_NET_SCRIPT nextjs AcmeCorp${NC}"
echo -e "${YELLOW}================================================${NC}\n"

node "$CREATE_NET_SCRIPT" nextjs AcmeCorp

echo -e "\n${GREEN}✓ Test 1 complete. Check $TEST_DIR/AcmeCorp${NC}"

# Test 2: With organization and repo name and ProjectName
echo -e "\n${YELLOW}================================================${NC}"
echo -e "${GREEN}Test 2: With org/repo and ProjectName${NC}"
echo -e "${YELLOW}Command: node $CREATE_NET_SCRIPT NetCoreTemplates/vue-vite VueProject${NC}"
echo -e "${YELLOW}================================================${NC}\n"

node "$CREATE_NET_SCRIPT" NetCoreTemplates/vue-vite VueProject

echo -e "\n${GREEN}✓ Test 2 complete. Check $TEST_DIR/VueProject${NC}"

# Test 3: Without ProjectName (extract to current directory)
echo -e "\n${YELLOW}================================================${NC}"
echo -e "${GREEN}Test 3: Without ProjectName (current directory)${NC}"
echo -e "${YELLOW}Commands:${NC}"
echo -e "${YELLOW}  mkdir CurrentDirTest${NC}"
echo -e "${YELLOW}  cd CurrentDirTest${NC}"
echo -e "${YELLOW}  node $CREATE_NET_SCRIPT nextjs${NC}"
echo -e "${YELLOW}================================================${NC}\n"

mkdir CurrentDirTest
cd CurrentDirTest
node "$CREATE_NET_SCRIPT" nextjs
cd ..

echo -e "\n${GREEN}✓ Test 3 complete. Check $TEST_DIR/CurrentDirTest${NC}"

# Summary
echo -e "\n${YELLOW}================================================${NC}"
echo -e "${GREEN}All manual tests complete!${NC}"
echo -e "${YELLOW}================================================${NC}"
echo -e "\nTest results are in: ${YELLOW}$TEST_DIR${NC}"
echo -e "\nYou can inspect the following directories:"
echo -e "  1. ${YELLOW}$TEST_DIR/AcmeCorp${NC} - Created with repo name and ProjectName"
echo -e "  2. ${YELLOW}$TEST_DIR/VueProject${NC} - Created with org/repo and ProjectName"
echo -e "  3. ${YELLOW}$TEST_DIR/CurrentDirTest${NC} - Created without ProjectName\n"
echo -e "Verify that:"
echo -e "  • Files contain project-specific names (AcmeCorp, VueProject, CurrentDirTest)"
echo -e "  • 'MyApp' variations have been replaced with project name variations"
echo -e "  • node_modules directories exist (npm install ran)\n"
echo -e "To clean up: ${YELLOW}rm -rf $TEST_DIR${NC}\n"
