#!/bin/bash

# Test script for create-net
# Tests different scenarios for creating projects from templates

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TEST_DIR="test-projects"
CREATE_NET_SCRIPT="$(pwd)/bin/create-net.js"

echo -e "${YELLOW}=== Testing create-net ===${NC}\n"

# Clean up any previous test runs
if [ -d "$TEST_DIR" ]; then
  echo "Cleaning up previous test directory..."
  rm -rf "$TEST_DIR"
fi

mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to check if a project was created successfully
check_project() {
  local project_name=$1
  local project_path=$2

  echo -e "\n${YELLOW}Verifying project: $project_name${NC}"

  # Check if directory exists
  if [ ! -d "$project_path" ]; then
    echo -e "${RED}✗ FAILED: Directory $project_path does not exist${NC}"
    ((TESTS_FAILED++))
    return 1
  fi

  # Check if files were extracted
  if [ -z "$(ls -A $project_path)" ]; then
    echo -e "${RED}✗ FAILED: Directory $project_path is empty${NC}"
    ((TESTS_FAILED++))
    return 1
  fi

  # Check if project name replacements were made
  # Look for any files containing the project name variations
  local found_replacement=false

  # Check for lowercase version in files
  local lowercase_name=$(echo "$project_name" | tr '[:upper:]' '[:lower:]')
  if grep -r "$lowercase_name" "$project_path" --include="*.json" --include="*.md" --include="*.txt" --include="*.cs" --include="*.js" --include="*.ts" >/dev/null 2>&1; then
    found_replacement=true
  fi

  if [ "$found_replacement" = false ]; then
    echo -e "${YELLOW}⚠ WARNING: Could not verify project name replacement (this may be normal if template doesn't have MyApp references)${NC}"
  fi

  echo -e "${GREEN}✓ PASSED: Project $project_name created successfully${NC}"
  ((TESTS_PASSED++))
  return 0
}

# Test 1: Create project with repo name and ProjectName
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 1: With repo name and ProjectName${NC}"
echo -e "${YELLOW}Command: node $CREATE_NET_SCRIPT nextjs AcmeCorp${NC}"
echo -e "${YELLOW}========================================${NC}\n"

node "$CREATE_NET_SCRIPT" nextjs AcmeCorp
check_project "AcmeCorp" "AcmeCorp"

# Test 2: Create project with organization/repo name and ProjectName
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 2: With org/repo name and ProjectName${NC}"
echo -e "${YELLOW}Command: node $CREATE_NET_SCRIPT NetCoreTemplates/vue-vite VueProject${NC}"
echo -e "${YELLOW}========================================${NC}\n"

node "$CREATE_NET_SCRIPT" NetCoreTemplates/vue-vite VueProject
check_project "VueProject" "VueProject"

# Test 3: Create project without ProjectName (extract to current directory)
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 3: Without ProjectName (current directory)${NC}"
echo -e "${YELLOW}Commands: mkdir CurrentDirTest && cd CurrentDirTest && node $CREATE_NET_SCRIPT nextjs${NC}"
echo -e "${YELLOW}========================================${NC}\n"

mkdir CurrentDirTest
cd CurrentDirTest
node "$CREATE_NET_SCRIPT" nextjs
check_project "CurrentDirTest" "."
cd ..

# Test 4: Error case - Directory already exists
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 4: Error handling - Directory exists${NC}"
echo -e "${YELLOW}Command: node $CREATE_NET_SCRIPT nextjs AcmeCorp (should fail)${NC}"
echo -e "${YELLOW}========================================${NC}\n"

if node "$CREATE_NET_SCRIPT" nextjs AcmeCorp 2>&1 | grep -q "already exists"; then
  echo -e "${GREEN}✓ PASSED: Correctly detected existing directory${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ FAILED: Should have detected existing directory${NC}"
  ((TESTS_FAILED++))
fi

# Test 5: Error case - Non-empty current directory
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 5: Error handling - Non-empty directory${NC}"
echo -e "${YELLOW}Commands: mkdir NonEmptyTest && cd NonEmptyTest && touch file.txt && node $CREATE_NET_SCRIPT nextjs${NC}"
echo -e "${YELLOW}========================================${NC}\n"

mkdir NonEmptyTest
cd NonEmptyTest
touch file.txt
if node "$CREATE_NET_SCRIPT" nextjs 2>&1 | grep -q "not empty"; then
  echo -e "${GREEN}✓ PASSED: Correctly detected non-empty directory${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ FAILED: Should have detected non-empty directory${NC}"
  ((TESTS_FAILED++))
fi
cd ..

# Summary
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

# Clean up
cd ..
echo -e "\n${YELLOW}Cleaning up test directory...${NC}"
rm -rf "$TEST_DIR"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed! ✓${NC}\n"
  exit 0
else
  echo -e "\n${RED}Some tests failed! ✗${NC}\n"
  exit 1
fi
