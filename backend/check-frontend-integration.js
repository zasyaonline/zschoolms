/**
 * Frontend-API Integration Test Script
 * 
 * This script tests which frontend pages are properly integrated with the backend API
 * vs which ones are using mock/static data.
 * 
 * Run: node check-frontend-integration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_SRC = path.join(__dirname, '..', 'frontend', 'src');
const PAGES_DIR = path.join(FRONTEND_SRC, 'pages');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  pass: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  fail: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}`),
  mock: (msg) => console.log(`${colors.magenta}📦 ${msg}${colors.reset}`)
};

// Patterns that indicate mock data usage
const MOCK_DATA_PATTERNS = [
  /useState\(\s*\[\s*\{[^}]+\}/,  // useState with hardcoded array of objects
  /const\s+\w+\s*=\s*\[\s*\{[^}]+\}/,  // const with hardcoded array
  /setStudents?\(\s*\[\s*\{/,  // setStudents with hardcoded data
  /setUsers?\(\s*\[\s*\{/,     // setUsers with hardcoded data
  /TODO.*API/i,                  // TODO comments about API
  /Mock\s*data/i,               // Comments about mock data
  /dummy\s*data/i,              // Comments about dummy data
  /static\s*data/i,             // Comments about static data
  /hardcoded/i                  // Hardcoded data comments
];

// Patterns that indicate real API usage
const API_USAGE_PATTERNS = [
  /import\s*{[^}]*get[^}]*}\s*from\s*['"].*api/,    // Import get from api
  /import\s*{[^}]*apiRequest[^}]*}/,                 // Import apiRequest
  /api\.get\(/,                                       // api.get calls
  /api\.post\(/,                                      // api.post calls
  /apiRequest\(/,                                     // apiRequest calls
  /fetch\(\s*[`'"].*\/api/,                          // fetch with /api
  /axios\.get\(/,                                     // axios.get
  /axios\.post\(/,                                    // axios.post
  /useEffect.*fetch/,                                // useEffect with fetch
  /\/api\/\w+/                                       // /api/ endpoints
];

// Specific API endpoints to look for
const API_ENDPOINTS = [
  '/students',
  '/sponsors', 
  '/users',
  '/auth',
  '/attendance',
  '/marks',
  '/report-cards',
  '/dashboard',
  '/analytics'
];

let results = {
  integrated: [],
  mockData: [],
  unclear: [],
  errors: []
};

function getAllJsxFiles(dir, files = []) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        getAllJsxFiles(fullPath, files);
      } else if (item.endsWith('.jsx') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist
  }
  
  return files;
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(FRONTEND_SRC, filePath);
    const fileName = path.basename(filePath);
    
    let hasMockData = false;
    let hasApiUsage = false;
    let mockIndicators = [];
    let apiIndicators = [];
    
    // Check for mock data patterns
    for (const pattern of MOCK_DATA_PATTERNS) {
      if (pattern.test(content)) {
        hasMockData = true;
        mockIndicators.push(pattern.toString().slice(1, 30) + '...');
      }
    }
    
    // Check for API usage patterns
    for (const pattern of API_USAGE_PATTERNS) {
      if (pattern.test(content)) {
        hasApiUsage = true;
        apiIndicators.push(pattern.toString().slice(1, 30) + '...');
      }
    }
    
    // Check for specific API endpoints
    let endpointsUsed = [];
    for (const endpoint of API_ENDPOINTS) {
      if (content.includes(endpoint)) {
        endpointsUsed.push(endpoint);
      }
    }
    
    // Determine integration status
    return {
      path: relativePath,
      fileName,
      hasMockData,
      hasApiUsage,
      mockIndicators,
      apiIndicators,
      endpointsUsed,
      lineCount: content.split('\n').length
    };
    
  } catch (error) {
    results.errors.push({ path: filePath, error: error.message });
    return null;
  }
}

function categorizeResult(analysis) {
  if (!analysis) return;
  
  const { hasMockData, hasApiUsage, endpointsUsed } = analysis;
  
  if (hasApiUsage && endpointsUsed.length > 0 && !hasMockData) {
    results.integrated.push(analysis);
  } else if (hasMockData && !hasApiUsage) {
    results.mockData.push(analysis);
  } else if (hasMockData && hasApiUsage) {
    // Has both - might be transitioning or has fallback
    results.mockData.push(analysis);
  } else {
    results.unclear.push(analysis);
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 FRONTEND-API INTEGRATION ANALYSIS');
  console.log('='.repeat(70));
  console.log(`Analyzed: ${PAGES_DIR}`);
  console.log(`Date: ${new Date().toISOString()}`);
  
  // ================================================================
  // PAGES WITH REAL API INTEGRATION
  // ================================================================
  log.section('Pages with REAL API Integration');
  
  if (results.integrated.length === 0) {
    log.warn('No pages found with clear API integration');
  } else {
    for (const page of results.integrated) {
      log.pass(`${page.path}`);
      if (page.endpointsUsed.length > 0) {
        console.log(`   Endpoints: ${page.endpointsUsed.join(', ')}`);
      }
    }
  }
  
  // ================================================================
  // PAGES USING MOCK DATA (CRITICAL)
  // ================================================================
  log.section('Pages Using MOCK/STATIC Data (NEEDS FIX)');
  
  if (results.mockData.length === 0) {
    log.pass('No pages found using mock data');
  } else {
    for (const page of results.mockData) {
      log.fail(`${page.path}`);
      if (page.mockIndicators.length > 0) {
        console.log(`   Evidence: ${page.mockIndicators.slice(0, 2).join(', ')}`);
      }
    }
  }
  
  // ================================================================
  // PAGES WITH UNCLEAR STATUS
  // ================================================================
  log.section('Pages with Unclear Integration Status');
  
  // Filter to show only page components (not small components)
  const significantUnclear = results.unclear.filter(p => p.lineCount > 50);
  
  if (significantUnclear.length === 0) {
    log.info('All significant pages have been categorized');
  } else {
    for (const page of significantUnclear) {
      log.warn(`${page.path} (${page.lineCount} lines)`);
    }
  }
  
  // ================================================================
  // SUMMARY
  // ================================================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 INTEGRATION ANALYSIS SUMMARY');
  console.log('='.repeat(70));
  console.log(`${colors.green}✅ API Integrated: ${results.integrated.length}${colors.reset}`);
  console.log(`${colors.red}❌ Using Mock Data: ${results.mockData.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Unclear/Components: ${results.unclear.length}${colors.reset}`);
  console.log(`${colors.red}💥 Errors: ${results.errors.length}${colors.reset}`);
  console.log('='.repeat(70));
  
  // ================================================================
  // PRIORITY FIX LIST
  // ================================================================
  if (results.mockData.length > 0) {
    console.log('\n' + colors.magenta + '📋 PRIORITY FIX LIST:' + colors.reset);
    console.log('The following pages need API integration:');
    console.log('');
    
    let priority = 1;
    for (const page of results.mockData) {
      console.log(`${priority}. ${page.path}`);
      priority++;
    }
    
    console.log('\nFor each page:');
    console.log('1. Import: import { get, post } from \'../../services/api\';');
    console.log('2. Add useEffect to fetch data on mount');
    console.log('3. Replace useState([{...}]) with useState([])');
    console.log('4. Add loading and error states');
  }
}

// ================================================================
// MAIN EXECUTION
// ================================================================

console.log('\n🔍 Scanning frontend pages for API integration...\n');

const allFiles = getAllJsxFiles(PAGES_DIR);
console.log(`Found ${allFiles.length} page files to analyze`);

for (const file of allFiles) {
  const analysis = analyzeFile(file);
  categorizeResult(analysis);
}

generateReport();

// Exit with error code if there are pages using mock data
const hasIssues = results.mockData.length > 0;
process.exit(hasIssues ? 1 : 0);
