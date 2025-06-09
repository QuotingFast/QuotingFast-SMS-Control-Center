/**
 * Timezone Utilities
 * 
 * Functions to handle timezone lookups based on ZIP code
 */

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { PrismaClient } = require('@prisma/client');

// Configure dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient();

// Map of US state abbreviations to their primary timezone
const STATE_TIMEZONE_MAP = {
  'AL': 'America/Chicago',
  'AK': 'America/Anchorage',
  'AZ': 'America/Phoenix',
  'AR': 'America/Chicago',
  'CA': 'America/Los_Angeles',
  'CO': 'America/Denver',
  'CT': 'America/New_York',
  'DE': 'America/New_York',
  'FL': 'America/New_York', // Most of FL is Eastern, panhandle is Central
  'GA': 'America/New_York',
  'HI': 'Pacific/Honolulu',
  'ID': 'America/Denver', // Northern ID is in Pacific
  'IL': 'America/Chicago',
  'IN': 'America/New_York', // Most of IN is Eastern
  'IA': 'America/Chicago',
  'KS': 'America/Chicago', // Western KS is Mountain
  'KY': 'America/New_York', // Western KY is Central
  'LA': 'America/Chicago',
  'ME': 'America/New_York',
  'MD': 'America/New_York',
  'MA': 'America/New_York',
  'MI': 'America/New_York', // Western MI is Central
  'MN': 'America/Chicago',
  'MS': 'America/Chicago',
  'MO': 'America/Chicago',
  'MT': 'America/Denver',
  'NE': 'America/Chicago', // Western NE is Mountain
  'NV': 'America/Los_Angeles',
  'NH': 'America/New_York',
  'NJ': 'America/New_York',
  'NM': 'America/Denver',
  'NY': 'America/New_York',
  'NC': 'America/New_York',
  'ND': 'America/Chicago', // Western ND is Mountain
  'OH': 'America/New_York',
  'OK': 'America/Chicago',
  'OR': 'America/Los_Angeles', // Eastern OR is Mountain
  'PA': 'America/New_York',
  'RI': 'America/New_York',
  'SC': 'America/New_York',
  'SD': 'America/Chicago', // Western SD is Mountain
  'TN': 'America/New_York', // Western TN is Central
  'TX': 'America/Chicago', // Western TX is Mountain, far western is Pacific
  'UT': 'America/Denver',
  'VT': 'America/New_York',
  'VA': 'America/New_York',
  'WA': 'America/Los_Angeles',
  'WV': 'America/New_York',
  'WI': 'America/Chicago',
  'WY': 'America/Denver',
  'DC': 'America/New_York',
  'PR': 'America/Puerto_Rico',
  'VI': 'America/St_Thomas'
};

// Special ZIP code ranges that differ from their state's primary timezone
const ZIP_TIMEZONE_EXCEPTIONS = [
  // Florida panhandle (Central Time)
  { start: '32401', end: '32592', timezone: 'America/Chicago' },
  
  // Western Indiana (Central Time)
  { start: '46301', end: '47997', timezone: 'America/Chicago' },
  
  // Western Kentucky (Central Time)
  { start: '42000', end: '42099', timezone: 'America/Chicago' },
  
  // Western Michigan (Central Time)
  { start: '49900', end: '49999', timezone: 'America/Chicago' },
  
  // Western North Dakota (Mountain Time)
  { start: '58600', end: '58699', timezone: 'America/Denver' },
  
  // Western South Dakota (Mountain Time)
  { start: '57700', end: '57799', timezone: 'America/Denver' },
  
  // Western Nebraska (Mountain Time)
  { start: '69000', end: '69399', timezone: 'America/Denver' },
  
  // Western Kansas (Mountain Time)
  { start: '67700', end: '67999', timezone: 'America/Denver' },
  
  // Eastern Oregon (Mountain Time)
  { start: '97800', end: '97899', timezone: 'America/Denver' },
  
  // Western Texas (Mountain Time)
  { start: '79800', end: '79999', timezone: 'America/Denver' },
  { start: '88500', end: '88599', timezone: 'America/Denver' },
  
  // El Paso area (Mountain Time)
  { start: '79900', end: '79999', timezone: 'America/Denver' },
  
  // Idaho panhandle (Pacific Time)
  { start: '83800', end: '83899', timezone: 'America/Los_Angeles' }
];

/**
 * Look up timezone based on ZIP code
 * First checks if we have the timezone stored in the database
 * If not, uses the state and ZIP code exceptions to determine timezone
 * 
 * @param {string} zip - The ZIP code to look up
 * @returns {Promise<string>} - The timezone identifier
 */
exports.lookupTimezone = async (zip) => {
  if (!zip) {
    return 'America/New_York'; // Default to Eastern Time if no ZIP provided
  }
  
  try {
    // First, check if we have this ZIP code's timezone cached in the database
    const zipSetting = await prisma.setting.findUnique({
      where: { key: `zip_timezone_${zip}` }
    });
    
    if (zipSetting) {
      return zipSetting.value;
    }
    
    // If not in database, determine based on state or ZIP code exceptions
    let timezone = await determineTimezoneFromZip(zip);
    
    // Cache the result in the database for future lookups
    await prisma.setting.create({
      data: {
        key: `zip_timezone_${zip}`,
        value: timezone,
        description: `Timezone for ZIP code ${zip}`
      }
    });
    
    return timezone;
  } catch (error) {
    console.error('Error looking up timezone:', error);
    return 'America/New_York'; // Default to Eastern Time on error
  }
};

/**
 * Determine timezone from ZIP code using state and exception rules
 * 
 * @param {string} zip - The ZIP code
 * @returns {Promise<string>} - The timezone identifier
 */
async function determineTimezoneFromZip(zip) {
  // Check if ZIP is in any exception ranges
  for (const exception of ZIP_TIMEZONE_EXCEPTIONS) {
    if (zip >= exception.start && zip <= exception.end) {
      return exception.timezone;
    }
  }
  
  // If not in exceptions, determine state from ZIP code prefix
  const state = getStateFromZip(zip);
  
  // Return the state's primary timezone or default to Eastern
  return STATE_TIMEZONE_MAP[state] || 'America/New_York';
}

/**
 * Get state abbreviation from ZIP code
 * Uses the first digit(s) of ZIP code to determine state
 * 
 * @param {string} zip - The ZIP code
 * @returns {string} - The state abbreviation
 */
function getStateFromZip(zip) {
  const prefix = zip.substring(0, 3);
  const firstDigit = parseInt(zip.charAt(0), 10);
  
  // Map ZIP code prefixes to states
  if (firstDigit === 0) {
    if (prefix <= '005') return 'NY'; // 00001-00599
    if (prefix <= '069') return 'MA'; // 00600-06999
    if (prefix <= '079') return 'RI'; // 07000-07999
    if (prefix <= '089') return 'NH'; // 08000-08999
    return 'ME'; // 09000-09999
  } else if (firstDigit === 1) {
    if (prefix <= '119') return 'NY'; // 10000-11999
    if (prefix <= '129') return 'NJ'; // 12000-12999
    if (prefix <= '139') return 'NY'; // 13000-13999
    if (prefix <= '149') return 'PA'; // 14000-14999
    if (prefix <= '159') return 'NY'; // 15000-15999
    if (prefix <= '169') return 'PA'; // 16000-16999
    if (prefix <= '179') return 'NJ'; // 17000-17999
    if (prefix <= '199') return 'PA'; // 18000-19999
  } else if (firstDigit === 2) {
    if (prefix <= '219') return 'VA'; // 20000-21999
    if (prefix <= '229') return 'MD'; // 22000-22999
    if (prefix <= '239') return 'VA'; // 23000-23999
    if (prefix <= '244') return 'NC'; // 24000-24499
    if (prefix <= '246') return 'VA'; // 24500-24699
    if (prefix <= '259') return 'NC'; // 24700-25999
    if (prefix <= '279') return 'SC'; // 26000-27999
    if (prefix <= '289') return 'GA'; // 28000-28999
    if (prefix <= '299') return 'FL'; // 29000-29999
  } else if (firstDigit === 3) {
    if (prefix <= '319') return 'FL'; // 30000-31999
    if (prefix <= '339') return 'GA'; // 32000-33999
    if (prefix <= '349') return 'FL'; // 34000-34999
    if (prefix <= '369') return 'AL'; // 35000-36999
    if (prefix <= '379') return 'TN'; // 37000-37999
    if (prefix <= '385') return 'MS'; // 38000-38599
    if (prefix <= '399') return 'TN'; // 38600-39999
  } else if (firstDigit === 4) {
    if (prefix <= '419') return 'OH'; // 40000-41999
    if (prefix <= '429') return 'KY'; // 42000-42999
    if (prefix <= '459') return 'OH'; // 43000-45999
    if (prefix <= '479') return 'IN'; // 46000-47999
    if (prefix <= '499') return 'MI'; // 48000-49999
  } else if (firstDigit === 5) {
    if (prefix <= '519') return 'IA'; // 50000-51999
    if (prefix <= '539') return 'WI'; // 52000-53999
    if (prefix <= '549') return 'MN'; // 54000-54999
    if (prefix <= '564') return 'WI'; // 55000-56499
    if (prefix <= '567') return 'MN'; // 56500-56799
    if (prefix <= '569') return 'SD'; // 56800-56999
    if (prefix <= '579') return 'ND'; // 57000-57999
    if (prefix <= '599') return 'SD'; // 58000-59999
  } else if (firstDigit === 6) {
    if (prefix <= '629') return 'IL'; // 60000-62999
    if (prefix <= '639') return 'MO'; // 63000-63999
    if (prefix <= '649') return 'IL'; // 64000-64999
    if (prefix <= '659') return 'MO'; // 65000-65999
    if (prefix <= '674') return 'KS'; // 66000-67499
    if (prefix <= '679') return 'MO'; // 67500-67999
    if (prefix <= '699') return 'NE'; // 68000-69999
  } else if (firstDigit === 7) {
    if (prefix <= '729') return 'LA'; // 70000-72999
    if (prefix <= '749') return 'AR'; // 73000-74999
    if (prefix <= '769') return 'OK'; // 75000-76999
    if (prefix <= '799') return 'TX'; // 77000-79999
  } else if (firstDigit === 8) {
    if (prefix <= '819') return 'TX'; // 80000-81999
    if (prefix <= '829') return 'CO'; // 82000-82999
    if (prefix <= '839') return 'WY'; // 83000-83999
    if (prefix <= '849') return 'ID'; // 84000-84999
    if (prefix <= '859') return 'UT'; // 85000-85999
    if (prefix <= '869') return 'AZ'; // 86000-86999
    if (prefix <= '879') return 'NM'; // 87000-87999
    if (prefix <= '889') return 'TX'; // 88000-88999
    if (prefix <= '899') return 'NV'; // 89000-89999
  } else if (firstDigit === 9) {
    if (prefix <= '919') return 'CA'; // 90000-91999
    if (prefix <= '929') return 'CA'; // 92000-92999
    if (prefix <= '939') return 'CA'; // 93000-93999
    if (prefix <= '949') return 'CA'; // 94000-94999
    if (prefix <= '959') return 'CA'; // 95000-95999
    if (prefix <= '969') return 'CA'; // 96000-96999
    if (prefix <= '979') return 'OR'; // 97000-97999
    if (prefix <= '989') return 'WA'; // 98000-98999
    if (prefix <= '994') return 'AK'; // 99000-99499
    return 'HI'; // 99500-99999
  }
  
  return 'NY'; // Default to NY if no match
}
