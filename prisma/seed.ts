import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COUNTRIES = [
  { name: "Afghanistan", code: "AF" },
  { name: "Albania", code: "AL" },
  { name: "Algeria", code: "DZ" },
  { name: "Andorra", code: "AD" },
  { name: "Angola", code: "AO" },
  { name: "Antigua and Barbuda", code: "AG" },
  { name: "Argentina", code: "AR" },
  { name: "Armenia", code: "AM" },
  { name: "Australia", code: "AU" },
  { name: "Austria", code: "AT" },
  { name: "Azerbaijan", code: "AZ" },
  { name: "Bahamas", code: "BS" },
  { name: "Bahrain", code: "BH" },
  { name: "Bangladesh", code: "BD" },
  { name: "Barbados", code: "BB" },
  { name: "Belarus", code: "BY" },
  { name: "Belgium", code: "BE" },
  { name: "Belize", code: "BZ" },
  { name: "Benin", code: "BJ" },
  { name: "Bhutan", code: "BT" },
  { name: "Bolivia", code: "BO" },
  { name: "Bosnia and Herzegovina", code: "BA" },
  { name: "Botswana", code: "BW" },
  { name: "Brazil", code: "BR" },
  { name: "Brunei", code: "BN" },
  { name: "Bulgaria", code: "BG" },
  { name: "Burkina Faso", code: "BF" },
  { name: "Burundi", code: "BI" },
  { name: "Cabo Verde", code: "CV" },
  { name: "Cambodia", code: "KH" },
  { name: "Cameroon", code: "CM" },
  { name: "Canada", code: "CA" },
  { name: "Central African Republic", code: "CF" },
  { name: "Chad", code: "TD" },
  { name: "Chile", code: "CL" },
  { name: "China", code: "CN" },
  { name: "Colombia", code: "CO" },
  { name: "Comoros", code: "KM" },
  { name: "Congo (Brazzaville)", code: "CG" },
  { name: "Congo (Kinshasa)", code: "CD" },
  { name: "Costa Rica", code: "CR" },
  { name: "Croatia", code: "HR" },
  { name: "Cuba", code: "CU" },
  { name: "Cyprus", code: "CY" },
  { name: "Czech Republic", code: "CZ" },
  { name: "Denmark", code: "DK" },
  { name: "Djibouti", code: "DJ" },
  { name: "Dominica", code: "DM" },
  { name: "Dominican Republic", code: "DO" },
  { name: "Ecuador", code: "EC" },
  { name: "Egypt", code: "EG" },
  { name: "El Salvador", code: "SV" },
  { name: "Equatorial Guinea", code: "GQ" },
  { name: "Eritrea", code: "ER" },
  { name: "Estonia", code: "EE" },
  { name: "Eswatini", code: "SZ" },
  { name: "Ethiopia", code: "ET" },
  { name: "Fiji", code: "FJ" },
  { name: "Finland", code: "FI" },
  { name: "France", code: "FR" },
  { name: "Gabon", code: "GA" },
  { name: "Gambia", code: "GM" },
  { name: "Georgia", code: "GE" },
  { name: "Germany", code: "DE" },
  { name: "Ghana", code: "GH" },
  { name: "Greece", code: "GR" },
  { name: "Grenada", code: "GD" },
  { name: "Guatemala", code: "GT" },
  { name: "Guinea", code: "GN" },
  { name: "Guinea-Bissau", code: "GW" },
  { name: "Guyana", code: "GY" },
  { name: "Haiti", code: "HT" },
  { name: "Honduras", code: "HN" },
  { name: "Hungary", code: "HU" },
  { name: "Iceland", code: "IS" },
  { name: "India", code: "IN" },
  { name: "Indonesia", code: "ID" },
  { name: "Iran", code: "IR" },
  { name: "Iraq", code: "IQ" },
  { name: "Ireland", code: "IE" },
  { name: "Israel", code: "IL" },
  { name: "Italy", code: "IT" },
  { name: "Jamaica", code: "JM" },
  { name: "Japan", code: "JP" },
  { name: "Jordan", code: "JO" },
  { name: "Kazakhstan", code: "KZ" },
  { name: "Kenya", code: "KE" },
  { name: "Kiribati", code: "KI" },
  { name: "Kosovo", code: "XK" },
  { name: "Kuwait", code: "KW" },
  { name: "Kyrgyzstan", code: "KG" },
  { name: "Laos", code: "LA" },
  { name: "Latvia", code: "LV" },
  { name: "Lebanon", code: "LB" },
  { name: "Lesotho", code: "LS" },
  { name: "Liberia", code: "LR" },
  { name: "Libya", code: "LY" },
  { name: "Liechtenstein", code: "LI" },
  { name: "Lithuania", code: "LT" },
  { name: "Luxembourg", code: "LU" },
  { name: "Madagascar", code: "MG" },
  { name: "Malawi", code: "MW" },
  { name: "Malaysia", code: "MY" },
  { name: "Maldives", code: "MV" },
  { name: "Mali", code: "ML" },
  { name: "Malta", code: "MT" },
  { name: "Marshall Islands", code: "MH" },
  { name: "Mauritania", code: "MR" },
  { name: "Mauritius", code: "MU" },
  { name: "Mexico", code: "MX" },
  { name: "Micronesia", code: "FM" },
  { name: "Moldova", code: "MD" },
  { name: "Monaco", code: "MC" },
  { name: "Mongolia", code: "MN" },
  { name: "Montenegro", code: "ME" },
  { name: "Morocco", code: "MA" },
  { name: "Mozambique", code: "MZ" },
  { name: "Myanmar", code: "MM" },
  { name: "Namibia", code: "NA" },
  { name: "Nauru", code: "NR" },
  { name: "Nepal", code: "NP" },
  { name: "Netherlands", code: "NL" },
  { name: "New Zealand", code: "NZ" },
  { name: "Nicaragua", code: "NI" },
  { name: "Niger", code: "NE" },
  { name: "Nigeria", code: "NG" },
  { name: "North Korea", code: "KP" },
  { name: "North Macedonia", code: "MK" },
  { name: "Norway", code: "NO" },
  { name: "Oman", code: "OM" },
  { name: "Pakistan", code: "PK" },
  { name: "Palau", code: "PW" },
  { name: "Palestine", code: "PS" },
  { name: "Panama", code: "PA" },
  { name: "Papua New Guinea", code: "PG" },
  { name: "Paraguay", code: "PY" },
  { name: "Peru", code: "PE" },
  { name: "Philippines", code: "PH" },
  { name: "Poland", code: "PL" },
  { name: "Portugal", code: "PT" },
  { name: "Qatar", code: "QA" },
  { name: "Romania", code: "RO" },
  { name: "Russia", code: "RU" },
  { name: "Rwanda", code: "RW" },
  { name: "Saint Kitts and Nevis", code: "KN" },
  { name: "Saint Lucia", code: "LC" },
  { name: "Saint Vincent and the Grenadines", code: "VC" },
  { name: "Samoa", code: "WS" },
  { name: "San Marino", code: "SM" },
  { name: "São Tomé and Príncipe", code: "ST" },
  { name: "Saudi Arabia", code: "SA" },
  { name: "Senegal", code: "SN" },
  { name: "Serbia", code: "RS" },
  { name: "Seychelles", code: "SC" },
  { name: "Sierra Leone", code: "SL" },
  { name: "Singapore", code: "SG" },
  { name: "Slovakia", code: "SK" },
  { name: "Slovenia", code: "SI" },
  { name: "Solomon Islands", code: "SB" },
  { name: "Somalia", code: "SO" },
  { name: "South Africa", code: "ZA" },
  { name: "South Korea", code: "KR" },
  { name: "South Sudan", code: "SS" },
  { name: "Spain", code: "ES" },
  { name: "Sri Lanka", code: "LK" },
  { name: "Sudan", code: "SD" },
  { name: "Suriname", code: "SR" },
  { name: "Sweden", code: "SE" },
  { name: "Switzerland", code: "CH" },
  { name: "Syria", code: "SY" },
  { name: "Taiwan", code: "TW" },
  { name: "Tajikistan", code: "TJ" },
  { name: "Tanzania", code: "TZ" },
  { name: "Thailand", code: "TH" },
  { name: "Timor-Leste", code: "TL" },
  { name: "Togo", code: "TG" },
  { name: "Tonga", code: "TO" },
  { name: "Trinidad and Tobago", code: "TT" },
  { name: "Tunisia", code: "TN" },
  { name: "Turkey", code: "TR" },
  { name: "Turkmenistan", code: "TM" },
  { name: "Tuvalu", code: "TV" },
  { name: "Uganda", code: "UG" },
  { name: "Ukraine", code: "UA" },
  { name: "United Arab Emirates", code: "AE" },
  { name: "United Kingdom", code: "GB" },
  { name: "United States", code: "US" },
  { name: "Uruguay", code: "UY" },
  { name: "Uzbekistan", code: "UZ" },
  { name: "Vanuatu", code: "VU" },
  { name: "Vatican City", code: "VA" },
  { name: "Venezuela", code: "VE" },
  { name: "Vietnam", code: "VN" },
  { name: "Yemen", code: "YE" },
  { name: "Zambia", code: "ZM" },
  { name: "Zimbabwe", code: "ZW" },
];

const CITIES: {
  name: string;
  countryCode: string;
  lat: number;
  lng: number;
}[] = [
  // France
  { name: "Paris", countryCode: "FR", lat: 48.8566, lng: 2.3522 },
  { name: "Lyon", countryCode: "FR", lat: 45.764, lng: 4.8357 },
  { name: "Marseille", countryCode: "FR", lat: 43.2965, lng: 5.3698 },
  { name: "Nice", countryCode: "FR", lat: 43.7102, lng: 7.262 },
  { name: "Bordeaux", countryCode: "FR", lat: 44.8378, lng: -0.5792 },
  // Germany
  { name: "Berlin", countryCode: "DE", lat: 52.52, lng: 13.405 },
  { name: "Munich", countryCode: "DE", lat: 48.1351, lng: 11.582 },
  { name: "Hamburg", countryCode: "DE", lat: 53.5753, lng: 10.0153 },
  { name: "Frankfurt", countryCode: "DE", lat: 50.1109, lng: 8.6821 },
  { name: "Cologne", countryCode: "DE", lat: 50.9333, lng: 6.95 },
  // Italy
  { name: "Rome", countryCode: "IT", lat: 41.9028, lng: 12.4964 },
  { name: "Milan", countryCode: "IT", lat: 45.4654, lng: 9.1859 },
  { name: "Venice", countryCode: "IT", lat: 45.4408, lng: 12.3155 },
  { name: "Florence", countryCode: "IT", lat: 43.7696, lng: 11.2558 },
  { name: "Naples", countryCode: "IT", lat: 40.8518, lng: 14.2681 },
  // Spain
  { name: "Madrid", countryCode: "ES", lat: 40.4168, lng: -3.7038 },
  { name: "Barcelona", countryCode: "ES", lat: 41.3851, lng: 2.1734 },
  { name: "Seville", countryCode: "ES", lat: 37.3891, lng: -5.9845 },
  { name: "Valencia", countryCode: "ES", lat: 39.4699, lng: -0.3763 },
  { name: "Granada", countryCode: "ES", lat: 37.1773, lng: -3.5986 },
  // United Kingdom
  { name: "London", countryCode: "GB", lat: 51.5074, lng: -0.1278 },
  { name: "Edinburgh", countryCode: "GB", lat: 55.9533, lng: -3.1883 },
  { name: "Manchester", countryCode: "GB", lat: 53.4808, lng: -2.2426 },
  { name: "Oxford", countryCode: "GB", lat: 51.752, lng: -1.2577 },
  { name: "Bath", countryCode: "GB", lat: 51.3758, lng: -2.3599 },
  // United States
  { name: "New York", countryCode: "US", lat: 40.7128, lng: -74.006 },
  { name: "Los Angeles", countryCode: "US", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", countryCode: "US", lat: 41.8781, lng: -87.6298 },
  { name: "San Francisco", countryCode: "US", lat: 37.7749, lng: -122.4194 },
  { name: "Miami", countryCode: "US", lat: 25.7617, lng: -80.1918 },
  { name: "Las Vegas", countryCode: "US", lat: 36.1699, lng: -115.1398 },
  { name: "New Orleans", countryCode: "US", lat: 29.9511, lng: -90.0715 },
  { name: "Washington D.C.", countryCode: "US", lat: 38.9072, lng: -77.0369 },
  // Japan
  { name: "Tokyo", countryCode: "JP", lat: 35.6762, lng: 139.6503 },
  { name: "Kyoto", countryCode: "JP", lat: 35.0116, lng: 135.7681 },
  { name: "Osaka", countryCode: "JP", lat: 34.6937, lng: 135.5023 },
  { name: "Hiroshima", countryCode: "JP", lat: 34.3853, lng: 132.4553 },
  { name: "Nara", countryCode: "JP", lat: 34.6851, lng: 135.8048 },
  // Australia
  { name: "Sydney", countryCode: "AU", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", countryCode: "AU", lat: -37.8136, lng: 144.9631 },
  { name: "Brisbane", countryCode: "AU", lat: -27.4698, lng: 153.0251 },
  { name: "Perth", countryCode: "AU", lat: -31.9505, lng: 115.8605 },
  { name: "Cairns", countryCode: "AU", lat: -16.9186, lng: 145.7781 },
  // Canada
  { name: "Toronto", countryCode: "CA", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", countryCode: "CA", lat: 49.2827, lng: -123.1207 },
  { name: "Montreal", countryCode: "CA", lat: 45.5017, lng: -73.5673 },
  { name: "Quebec City", countryCode: "CA", lat: 46.8139, lng: -71.2082 },
  { name: "Calgary", countryCode: "CA", lat: 51.0447, lng: -114.0719 },
  // Thailand
  { name: "Bangkok", countryCode: "TH", lat: 13.7563, lng: 100.5018 },
  { name: "Chiang Mai", countryCode: "TH", lat: 18.7883, lng: 98.9853 },
  { name: "Phuket", countryCode: "TH", lat: 7.8804, lng: 98.3923 },
  { name: "Pattaya", countryCode: "TH", lat: 12.9236, lng: 100.8825 },
  // Turkey
  { name: "Istanbul", countryCode: "TR", lat: 41.0082, lng: 28.9784 },
  { name: "Ankara", countryCode: "TR", lat: 39.9334, lng: 32.8597 },
  { name: "Cappadocia", countryCode: "TR", lat: 38.6431, lng: 34.8289 },
  { name: "Antalya", countryCode: "TR", lat: 36.8969, lng: 30.7133 },
  // Greece
  { name: "Athens", countryCode: "GR", lat: 37.9838, lng: 23.7275 },
  { name: "Thessaloniki", countryCode: "GR", lat: 40.6401, lng: 22.9444 },
  { name: "Santorini", countryCode: "GR", lat: 36.3932, lng: 25.4615 },
  { name: "Mykonos", countryCode: "GR", lat: 37.4467, lng: 25.3289 },
  // Portugal
  { name: "Lisbon", countryCode: "PT", lat: 38.7223, lng: -9.1393 },
  { name: "Porto", countryCode: "PT", lat: 41.1579, lng: -8.6291 },
  { name: "Faro", countryCode: "PT", lat: 37.0194, lng: -7.9322 },
  // Netherlands
  { name: "Amsterdam", countryCode: "NL", lat: 52.3676, lng: 4.9041 },
  { name: "Rotterdam", countryCode: "NL", lat: 51.9225, lng: 4.4792 },
  { name: "The Hague", countryCode: "NL", lat: 52.0705, lng: 4.3007 },
  // Switzerland
  { name: "Zurich", countryCode: "CH", lat: 47.3769, lng: 8.5417 },
  { name: "Geneva", countryCode: "CH", lat: 46.2044, lng: 6.1432 },
  { name: "Bern", countryCode: "CH", lat: 46.9481, lng: 7.4474 },
  { name: "Interlaken", countryCode: "CH", lat: 46.6863, lng: 7.8632 },
  // Brazil
  { name: "São Paulo", countryCode: "BR", lat: -23.5505, lng: -46.6333 },
  { name: "Rio de Janeiro", countryCode: "BR", lat: -22.9068, lng: -43.1729 },
  { name: "Brasília", countryCode: "BR", lat: -15.7975, lng: -47.8919 },
  { name: "Salvador", countryCode: "BR", lat: -12.9714, lng: -38.5014 },
  // Mexico
  { name: "Mexico City", countryCode: "MX", lat: 19.4326, lng: -99.1332 },
  { name: "Cancún", countryCode: "MX", lat: 21.1619, lng: -86.8515 },
  { name: "Guadalajara", countryCode: "MX", lat: 20.6597, lng: -103.3496 },
  { name: "Tulum", countryCode: "MX", lat: 20.2114, lng: -87.4654 },
  // Argentina
  { name: "Buenos Aires", countryCode: "AR", lat: -34.6037, lng: -58.3816 },
  { name: "Córdoba", countryCode: "AR", lat: -31.4201, lng: -64.1888 },
  { name: "Mendoza", countryCode: "AR", lat: -32.8895, lng: -68.8458 },
  { name: "Bariloche", countryCode: "AR", lat: -41.1335, lng: -71.3103 },
  // India
  { name: "Mumbai", countryCode: "IN", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", countryCode: "IN", lat: 28.7041, lng: 77.1025 },
  { name: "Jaipur", countryCode: "IN", lat: 26.9124, lng: 75.7873 },
  { name: "Agra", countryCode: "IN", lat: 27.1767, lng: 78.0081 },
  { name: "Goa", countryCode: "IN", lat: 15.2993, lng: 74.124 },
  { name: "Bangalore", countryCode: "IN", lat: 12.9716, lng: 77.5946 },
  // China
  { name: "Beijing", countryCode: "CN", lat: 39.9042, lng: 116.4074 },
  { name: "Shanghai", countryCode: "CN", lat: 31.2304, lng: 121.4737 },
  { name: "Guangzhou", countryCode: "CN", lat: 23.1291, lng: 113.2644 },
  { name: "Xi'an", countryCode: "CN", lat: 34.3416, lng: 108.9398 },
  { name: "Chengdu", countryCode: "CN", lat: 30.5728, lng: 104.0668 },
  // South Korea
  { name: "Seoul", countryCode: "KR", lat: 37.5665, lng: 126.978 },
  { name: "Busan", countryCode: "KR", lat: 35.1796, lng: 129.0756 },
  { name: "Jeju", countryCode: "KR", lat: 33.4996, lng: 126.5312 },
  // Vietnam
  { name: "Hanoi", countryCode: "VN", lat: 21.0285, lng: 105.8542 },
  { name: "Ho Chi Minh City", countryCode: "VN", lat: 10.8231, lng: 106.6297 },
  { name: "Hoi An", countryCode: "VN", lat: 15.8801, lng: 108.338 },
  { name: "Da Nang", countryCode: "VN", lat: 16.0544, lng: 108.2022 },
  // Indonesia
  { name: "Bali", countryCode: "ID", lat: -8.3405, lng: 115.092 },
  { name: "Jakarta", countryCode: "ID", lat: -6.2088, lng: 106.8456 },
  { name: "Yogyakarta", countryCode: "ID", lat: -7.7956, lng: 110.3695 },
  // Morocco
  { name: "Marrakech", countryCode: "MA", lat: 31.6295, lng: -7.9811 },
  { name: "Fes", countryCode: "MA", lat: 34.0181, lng: -5.0078 },
  { name: "Casablanca", countryCode: "MA", lat: 33.5731, lng: -7.5898 },
  // Egypt
  { name: "Cairo", countryCode: "EG", lat: 30.0444, lng: 31.2357 },
  { name: "Luxor", countryCode: "EG", lat: 25.6872, lng: 32.6396 },
  { name: "Aswan", countryCode: "EG", lat: 24.0889, lng: 32.8998 },
  { name: "Sharm El Sheikh", countryCode: "EG", lat: 27.9158, lng: 34.3299 },
  // United Arab Emirates
  { name: "Dubai", countryCode: "AE", lat: 25.2048, lng: 55.2708 },
  { name: "Abu Dhabi", countryCode: "AE", lat: 24.4539, lng: 54.3773 },
  // Austria
  { name: "Vienna", countryCode: "AT", lat: 48.2082, lng: 16.3738 },
  { name: "Salzburg", countryCode: "AT", lat: 47.8095, lng: 13.055 },
  { name: "Innsbruck", countryCode: "AT", lat: 47.2692, lng: 11.4041 },
  // Czech Republic
  { name: "Prague", countryCode: "CZ", lat: 50.0755, lng: 14.4378 },
  { name: "Brno", countryCode: "CZ", lat: 49.1951, lng: 16.6068 },
  // Hungary
  { name: "Budapest", countryCode: "HU", lat: 47.4979, lng: 19.0402 },
  // Poland
  { name: "Warsaw", countryCode: "PL", lat: 52.2297, lng: 21.0122 },
  { name: "Krakow", countryCode: "PL", lat: 50.0647, lng: 19.945 },
  { name: "Gdańsk", countryCode: "PL", lat: 54.352, lng: 18.6466 },
  // Norway
  { name: "Oslo", countryCode: "NO", lat: 59.9139, lng: 10.7522 },
  { name: "Bergen", countryCode: "NO", lat: 60.3913, lng: 5.3221 },
  // Sweden
  { name: "Stockholm", countryCode: "SE", lat: 59.3293, lng: 18.0686 },
  { name: "Gothenburg", countryCode: "SE", lat: 57.7089, lng: 11.9746 },
  // Denmark
  { name: "Copenhagen", countryCode: "DK", lat: 55.6761, lng: 12.5683 },
  // Finland
  { name: "Helsinki", countryCode: "FI", lat: 60.1699, lng: 24.9384 },
  // Iceland
  { name: "Reykjavik", countryCode: "IS", lat: 64.1355, lng: -21.8954 },
  // Ireland
  { name: "Dublin", countryCode: "IE", lat: 53.3498, lng: -6.2603 },
  { name: "Galway", countryCode: "IE", lat: 53.2707, lng: -9.0568 },
  // New Zealand
  { name: "Auckland", countryCode: "NZ", lat: -36.8485, lng: 174.7633 },
  { name: "Queenstown", countryCode: "NZ", lat: -45.0312, lng: 168.6626 },
  { name: "Wellington", countryCode: "NZ", lat: -41.2865, lng: 174.7762 },
  // South Africa
  { name: "Cape Town", countryCode: "ZA", lat: -33.9249, lng: 18.4241 },
  { name: "Johannesburg", countryCode: "ZA", lat: -26.2041, lng: 28.0473 },
  // Peru
  { name: "Lima", countryCode: "PE", lat: -12.0464, lng: -77.0428 },
  { name: "Cusco", countryCode: "PE", lat: -13.532, lng: -71.9675 },
  // Colombia
  { name: "Bogotá", countryCode: "CO", lat: 4.711, lng: -74.0721 },
  { name: "Medellín", countryCode: "CO", lat: 6.2442, lng: -75.5812 },
  { name: "Cartagena", countryCode: "CO", lat: 10.3932, lng: -75.4832 },
  // Malaysia
  { name: "Kuala Lumpur", countryCode: "MY", lat: 3.139, lng: 101.6869 },
  { name: "Penang", countryCode: "MY", lat: 5.4164, lng: 100.3327 },
  // Singapore
  { name: "Singapore", countryCode: "SG", lat: 1.3521, lng: 103.8198 },
  // Nepal
  { name: "Kathmandu", countryCode: "NP", lat: 27.7172, lng: 85.324 },
  { name: "Pokhara", countryCode: "NP", lat: 28.2096, lng: 83.9856 },
  // Jordan
  { name: "Amman", countryCode: "JO", lat: 31.9454, lng: 35.9284 },
  { name: "Petra", countryCode: "JO", lat: 30.3285, lng: 35.4444 },
  // Israel
  { name: "Tel Aviv", countryCode: "IL", lat: 32.0853, lng: 34.7818 },
  { name: "Jerusalem", countryCode: "IL", lat: 31.7683, lng: 35.2137 },
];

async function main() {
  console.log("Seeding countries…");
  for (const country of COUNTRIES) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: { name: country.name },
      create: { name: country.name, code: country.code },
    });
  }
  console.log(`  ${COUNTRIES.length} countries seeded.`);

  console.log("Seeding cities…");
  let cityCount = 0;
  for (const city of CITIES) {
    const country = await prisma.country.findUnique({
      where: { code: city.countryCode },
    });
    if (!country) continue;

    await prisma.city.upsert({
      where: {
        // Unique on name + countryId combination
        name_countryId: { name: city.name, countryId: country.id },
      },
      update: { lat: city.lat, lng: city.lng },
      create: {
        name: city.name,
        countryId: country.id,
        lat: city.lat,
        lng: city.lng,
      },
    });
    cityCount++;
  }
  console.log(`  ${cityCount} cities seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
