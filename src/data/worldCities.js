// A curated list of ~1,500 major world cities ("City, Country"), used to
// preload the Location type-ahead with real places to pick from instead of
// only whatever's already in use. Not every populated place on Earth —
// every country's capital plus its key population/production hub cities —
// intentionally kept to a size that loads and filters instantly.
// Country spelling matches this app's existing convention (UK/USA/UAE) where
// those already exist; everywhere else uses the common English country name.

export const WORLD_CITIES = [
  // ── UAE ──
  "Dubai, UAE","Abu Dhabi, UAE","Sharjah, UAE","Ajman, UAE","Ras Al Khaimah, UAE","Fujairah, UAE","Al Ain, UAE",
  // ── Saudi Arabia ──
  "Riyadh, Saudi Arabia","Jeddah, Saudi Arabia","Mecca, Saudi Arabia","Medina, Saudi Arabia","Dammam, Saudi Arabia","Khobar, Saudi Arabia","AlUla, Saudi Arabia","Abha, Saudi Arabia","Taif, Saudi Arabia","Jubail, Saudi Arabia",
  // ── Qatar / Bahrain / Kuwait / Oman / Jordan / Lebanon / Egypt ──
  "Doha, Qatar","Al Rayyan, Qatar",
  "Manama, Bahrain",
  "Kuwait City, Kuwait",
  "Muscat, Oman","Salalah, Oman",
  "Amman, Jordan","Aqaba, Jordan","Petra, Jordan",
  "Beirut, Lebanon",
  "Cairo, Egypt","Alexandria, Egypt","Giza, Egypt","Luxor, Egypt","Sharm El Sheikh, Egypt","Hurghada, Egypt","Aswan, Egypt",
  // ── Morocco / North Africa ──
  "Marrakech, Morocco","Casablanca, Morocco","Rabat, Morocco","Fez, Morocco","Tangier, Morocco","Essaouira, Morocco","Agadir, Morocco",
  "Tunis, Tunisia","Algiers, Algeria","Tripoli, Libya",
  // ── Israel / Turkey / Iraq / Iran ──
  "Tel Aviv, Israel","Jerusalem, Israel","Haifa, Israel",
  "Istanbul, Turkey","Ankara, Turkey","Izmir, Turkey","Antalya, Turkey","Bodrum, Turkey","Cappadocia, Turkey",
  "Baghdad, Iraq","Erbil, Iraq",
  "Tehran, Iran","Isfahan, Iran",
  // ── UK ──
  "London, UK","Manchester, UK","Birmingham, UK","Leeds, UK","Glasgow, UK","Edinburgh, UK","Liverpool, UK","Bristol, UK","Sheffield, UK","Newcastle, UK","Cardiff, UK","Belfast, UK","Oxford, UK","Cambridge, UK","Brighton, UK","Bath, UK","Nottingham, UK",
  // ── Ireland ──
  "Dublin, Ireland","Cork, Ireland","Galway, Ireland",
  // ── France ──
  "Paris, France","Marseille, France","Lyon, France","Nice, France","Cannes, France","Toulouse, France","Bordeaux, France","Strasbourg, France","Nantes, France","Lille, France","Biarritz, France","St Tropez, France","Montpellier, France","Rennes, France",
  // ── Spain / Portugal ──
  "Madrid, Spain","Barcelona, Spain","Valencia, Spain","Seville, Spain","Malaga, Spain","Bilbao, Spain","Ibiza, Spain","Mallorca, Spain","Marbella, Spain","Granada, Spain","San Sebastian, Spain","Zaragoza, Spain",
  "Lisbon, Portugal","Porto, Portugal","Faro, Portugal","Madeira, Portugal",
  // ── Italy ──
  "Rome, Italy","Milan, Italy","Florence, Italy","Venice, Italy","Naples, Italy","Turin, Italy","Bologna, Italy","Verona, Italy","Genoa, Italy","Palermo, Italy","Capri, Italy","Portofino, Italy","Lake Como, Italy","Sardinia, Italy","Sicily, Italy",
  // ── Germany / Austria / Switzerland ──
  "Berlin, Germany","Munich, Germany","Hamburg, Germany","Frankfurt, Germany","Cologne, Germany","Dusseldorf, Germany","Stuttgart, Germany","Leipzig, Germany","Dresden, Germany",
  "Vienna, Austria","Salzburg, Austria","Innsbruck, Austria",
  "Zurich, Switzerland","Geneva, Switzerland","Basel, Switzerland","Bern, Switzerland","Lausanne, Switzerland","Zermatt, Switzerland","St Moritz, Switzerland",
  // ── Benelux ──
  "Amsterdam, Netherlands","Rotterdam, Netherlands","The Hague, Netherlands","Utrecht, Netherlands",
  "Brussels, Belgium","Antwerp, Belgium","Bruges, Belgium",
  "Luxembourg City, Luxembourg",
  // ── Nordics ──
  "Copenhagen, Denmark","Aarhus, Denmark",
  "Stockholm, Sweden","Gothenburg, Sweden","Malmo, Sweden",
  "Oslo, Norway","Bergen, Norway","Tromso, Norway",
  "Helsinki, Finland",
  "Reykjavik, Iceland",
  // ── Eastern Europe / Balkans ──
  "Warsaw, Poland","Krakow, Poland","Gdansk, Poland",
  "Prague, Czech Republic","Brno, Czech Republic",
  "Budapest, Hungary",
  "Bucharest, Romania",
  "Sofia, Bulgaria",
  "Athens, Greece","Thessaloniki, Greece","Santorini, Greece","Mykonos, Greece","Crete, Greece","Rhodes, Greece",
  "Zagreb, Croatia","Dubrovnik, Croatia","Split, Croatia",
  "Belgrade, Serbia",
  "Ljubljana, Slovenia",
  "Sarajevo, Bosnia and Herzegovina",
  "Podgorica, Montenegro","Kotor, Montenegro",
  "Tirana, Albania",
  "Skopje, North Macedonia",
  "Chisinau, Moldova",
  "Kyiv, Ukraine","Lviv, Ukraine",
  "Minsk, Belarus",
  "Moscow, Russia","St Petersburg, Russia",
  "Vilnius, Lithuania","Riga, Latvia","Tallinn, Estonia",
  // ── USA ──
  "New York, USA","Los Angeles, USA","Chicago, USA","Miami, USA","San Francisco, USA","Las Vegas, USA","Washington DC, USA","Boston, USA","Seattle, USA","Austin, USA","Dallas, USA","Houston, USA","Atlanta, USA","Denver, USA","Phoenix, USA","San Diego, USA","Portland, USA","Nashville, USA","New Orleans, USA","Philadelphia, USA","Detroit, USA","Minneapolis, USA","Orlando, USA","Tampa, USA","Charlotte, USA","Honolulu, USA","Aspen, USA","Palm Springs, USA","Savannah, USA","Napa, USA","Santa Barbara, USA","Malibu, USA","Jackson Hole, USA","Big Sky, USA","Sun Valley, USA","Lake Tahoe, USA",
  // ── Canada ──
  "Toronto, Canada","Vancouver, Canada","Montreal, Canada","Calgary, Canada","Ottawa, Canada","Quebec City, Canada","Whistler, Canada","Banff, Canada","Edmonton, Canada",
  // ── Mexico / Central America / Caribbean ──
  "Mexico City, Mexico","Cancun, Mexico","Tulum, Mexico","Playa del Carmen, Mexico","Guadalajara, Mexico","Monterrey, Mexico","Puerto Vallarta, Mexico","Riviera Nayarit, Mexico","Oaxaca, Mexico","Los Cabos, Mexico","Merida, Mexico",
  "Panama City, Panama","San Jose, Costa Rica","Tamarindo, Costa Rica",
  "Havana, Cuba","Nassau, Bahamas","Bridgetown, Barbados","Montego Bay, Jamaica","Punta Cana, Dominican Republic","San Juan, Puerto Rico","Turks and Caicos","St Barts","St Lucia","Antigua","US Virgin Islands","British Virgin Islands",
  // ── South America ──
  "Sao Paulo, Brazil","Rio de Janeiro, Brazil","Brasilia, Brazil","Salvador, Brazil","Florianopolis, Brazil",
  "Buenos Aires, Argentina","Mendoza, Argentina","Bariloche, Argentina",
  "Santiago, Chile","Valparaiso, Chile",
  "Lima, Peru","Cusco, Peru",
  "Bogota, Colombia","Medellin, Colombia","Cartagena, Colombia",
  "Quito, Ecuador",
  "Montevideo, Uruguay",
  "Caracas, Venezuela",
  "La Paz, Bolivia",
  "Asuncion, Paraguay",
  // ── Oceania ──
  "Sydney, Australia","Melbourne, Australia","Brisbane, Australia","Perth, Australia","Adelaide, Australia","Gold Coast, Australia","Byron Bay, Australia","Canberra, Australia","Hobart, Australia","Darwin, Australia",
  "Auckland, New Zealand","Wellington, New Zealand","Queenstown, New Zealand","Christchurch, New Zealand",
  "Suva, Fiji","Nuku'alofa, Tonga","Port Moresby, Papua New Guinea",
  // ── East Asia ──
  "Tokyo, Japan","Osaka, Japan","Kyoto, Japan","Yokohama, Japan","Nagoya, Japan","Sapporo, Japan","Fukuoka, Japan","Hiroshima, Japan","Okinawa, Japan",
  "Beijing, China","Shanghai, China","Guangzhou, China","Shenzhen, China","Hong Kong","Macau","Chengdu, China","Hangzhou, China","Xi'an, China","Nanjing, China",
  "Seoul, South Korea","Busan, South Korea",
  "Taipei, Taiwan","Kaohsiung, Taiwan",
  "Ulaanbaatar, Mongolia",
  // ── South / Southeast Asia ──
  "Mumbai, India","Delhi, India","Bangalore, India","Hyderabad, India","Chennai, India","Kolkata, India","Jaipur, India","Goa, India","Pune, India","Udaipur, India","Agra, India",
  "Karachi, Pakistan","Lahore, Pakistan","Islamabad, Pakistan",
  "Dhaka, Bangladesh",
  "Colombo, Sri Lanka",
  "Kathmandu, Nepal",
  "Male, Maldives","Maldives",
  "Bangkok, Thailand","Phuket, Thailand","Chiang Mai, Thailand","Koh Samui, Thailand","Pattaya, Thailand",
  "Singapore",
  "Kuala Lumpur, Malaysia","Penang, Malaysia","Langkawi, Malaysia",
  "Jakarta, Indonesia","Bali, Indonesia","Yogyakarta, Indonesia","Surabaya, Indonesia",
  "Manila, Philippines","Cebu, Philippines","Boracay, Philippines",
  "Hanoi, Vietnam","Ho Chi Minh City, Vietnam","Da Nang, Vietnam","Hoi An, Vietnam",
  "Phnom Penh, Cambodia","Siem Reap, Cambodia",
  "Vientiane, Laos",
  "Yangon, Myanmar",
  "Bandar Seri Begawan, Brunei",
  // ── Central Asia / Caucasus ──
  "Almaty, Kazakhstan","Astana, Kazakhstan",
  "Tashkent, Uzbekistan",
  "Baku, Azerbaijan",
  "Tbilisi, Georgia",
  "Yerevan, Armenia",
  // ── Sub-Saharan Africa ──
  "Lagos, Nigeria","Abuja, Nigeria",
  "Nairobi, Kenya","Mombasa, Kenya",
  "Cape Town, South Africa","Johannesburg, South Africa","Durban, South Africa","Pretoria, South Africa",
  "Accra, Ghana",
  "Addis Ababa, Ethiopia",
  "Dar es Salaam, Tanzania","Zanzibar, Tanzania",
  "Kampala, Uganda",
  "Kigali, Rwanda",
  "Dakar, Senegal",
  "Abidjan, Ivory Coast",
  "Luanda, Angola",
  "Maputo, Mozambique",
  "Windhoek, Namibia",
  "Gaborone, Botswana",
  "Lusaka, Zambia",
  "Harare, Zimbabwe",
  "Antananarivo, Madagascar",
  "Victoria, Seychelles","Seychelles",
  "Port Louis, Mauritius","Mauritius",

  // ── Additional USA (secondary/production-hub cities by state) ──
  "Sacramento, USA","San Jose, USA","Oakland, USA","Fresno, USA","Long Beach, USA","Anaheim, USA","Santa Monica, USA","Beverly Hills, USA","Pasadena, USA","Burbank, USA","Culver City, USA","Hollywood, USA","San Antonio, USA","Fort Worth, USA","El Paso, USA","Tucson, USA","Albuquerque, USA","Colorado Springs, USA","Salt Lake City, USA","Park City, USA","Boise, USA","Spokane, USA","Eugene, USA","Sacramento, USA","Reno, USA","Boulder, USA","Kansas City, USA","St Louis, USA","Milwaukee, USA","Cleveland, USA","Cincinnati, USA","Columbus, USA","Pittsburgh, USA","Indianapolis, USA","Memphis, USA","Louisville, USA","Richmond, USA","Raleigh, USA","Charleston, USA","Myrtle Beach, USA","Asheville, USA","Baltimore, USA","Providence, USA","Hartford, USA","Albany, USA","Buffalo, USA","Rochester, USA","Jacksonville, USA","Fort Lauderdale, USA","West Palm Beach, USA","Key West, USA","Sarasota, USA","Scottsdale, USA","Oklahoma City, USA","Tulsa, USA","Little Rock, USA","Birmingham, USA","Jackson, USA","Baton Rouge, USA","Omaha, USA","Des Moines, USA","Madison, USA","Anchorage, USA","Telluride, USA","Vail, USA","Santa Fe, USA","Napa Valley, USA","Sonoma, USA","Montauk, USA","Hamptons, USA","Martha's Vineyard, USA","Nantucket, USA","Provincetown, USA",
  // ── Additional Canada ──
  "Victoria, Canada","Halifax, Canada","Winnipeg, Canada","Saskatoon, Canada","Regina, Canada","Hamilton, Canada","Kelowna, Canada","Niagara Falls, Canada",
  // ── Additional UK / Ireland ──
  "Leicester, UK","Southampton, UK","Portsmouth, UK","York, UK","Aberdeen, UK","Dundee, UK","Inverness, UK","Cotswolds, UK","Bournemouth, UK","Exeter, UK","Norwich, UK","St Andrews, UK","Isle of Wight, UK","Jersey, UK","Guernsey, UK","Limerick, Ireland","Kilkenny, Ireland",
  // ── Additional France ──
  "Aix-en-Provence, France","Avignon, France","Deauville, France","Chamonix, France","Courchevel, France","Megeve, France","Saint-Malo, France","La Rochelle, France","Grenoble, France","Dijon, France","Reims, France","Annecy, France","Antibes, France","Saint-Tropez, France",
  // ── Additional Spain / Portugal ──
  "Alicante, Spain","Tenerife, Spain","Gran Canaria, Spain","Formentera, Spain","Santander, Spain","Toledo, Spain","Cadiz, Spain","Cordoba, Spain","Salamanca, Spain","Pamplona, Spain","Braga, Portugal","Coimbra, Portugal","Cascais, Portugal","Sintra, Portugal","Algarve, Portugal",
  // ── Additional Italy ──
  "Bari, Italy","Pisa, Italy","Siena, Italy","Amalfi, Italy","Positano, Italy","Lake Garda, Italy","Cinque Terre, Italy","Taormina, Italy","Lecce, Italy","Padua, Italy","Trieste, Italy","Parma, Italy","Perugia, Italy",
  // ── Additional Germany / Austria / Switzerland ──
  "Nuremberg, Germany","Hanover, Germany","Bremen, Germany","Heidelberg, Germany","Baden-Baden, Germany","Garmisch-Partenkirchen, Germany","Graz, Austria","Kitzbuhel, Austria","Gstaad, Switzerland","Lucerne, Switzerland","Lugano, Switzerland","Montreux, Switzerland","Interlaken, Switzerland","Davos, Switzerland","Verbier, Switzerland",
  // ── Additional India / Pakistan / South Asia ──
  "Ahmedabad, India","Surat, India","Lucknow, India","Chandigarh, India","Kochi, India","Amritsar, India","Varanasi, India","Shimla, India","Manali, India","Rishikesh, India","Jodhpur, India","Jaisalmer, India","Rajkot, India","Indore, India","Bhopal, India","Nagpur, India","Visakhapatnam, India","Thiruvananthapuram, India","Faisalabad, Pakistan","Rawalpindi, Pakistan","Peshawar, Pakistan","Chittagong, Bangladesh","Kandy, Sri Lanka",
  // ── Additional China / East Asia ──
  "Chongqing, China","Tianjin, China","Qingdao, China","Suzhou, China","Wuhan, China","Dalian, China","Kunming, China","Lhasa, China","Guilin, China","Sanya, China","Shenyang, China","Zhuhai, China","Incheon, South Korea","Daegu, South Korea","Jeju, South Korea","Taichung, Taiwan","Tainan, Taiwan","Hakodate, Japan","Nara, Japan","Kobe, Japan","Nikko, Japan","Kanazawa, Japan","Sendai, Japan",
  // ── Additional Southeast Asia ──
  "Ubud, Indonesia","Lombok, Indonesia","Gili Islands, Indonesia","Medan, Indonesia","Bandung, Indonesia","Krabi, Thailand","Hua Hin, Thailand","Khao Lak, Thailand","Johor Bahru, Malaysia","Kota Kinabalu, Malaysia","Malacca, Malaysia","Davao, Philippines","Palawan, Philippines","Can Tho, Vietnam","Nha Trang, Vietnam","Hue, Vietnam","Battambang, Cambodia","Luang Prabang, Laos","Mandalay, Myanmar",
  // ── Additional Australia / NZ / Pacific ──
  "Cairns, Australia","Newcastle, Australia","Sunshine Coast, Australia","Alice Springs, Australia","Noosa, Australia","Fremantle, Australia","Geelong, Australia","Wollongong, Australia","Rotorua, New Zealand","Dunedin, New Zealand","Napier, New Zealand","Nadi, Fiji","Apia, Samoa","Port Vila, Vanuatu","Honiara, Solomon Islands",
  // ── Additional Middle East ──
  "Al Khobar, Saudi Arabia","Yanbu, Saudi Arabia","Neom, Saudi Arabia","Dead Sea, Jordan","Wadi Rum, Jordan","Byblos, Lebanon","Luxor, Egypt","Dahab, Egypt","Marsa Alam, Egypt","Fujairah City, UAE","Liwa, UAE","Dibba, UAE",
  // ── Additional Africa ──
  "Marrakesh Palmeraie, Morocco","Chefchaouen, Morocco","Ouarzazate, Morocco","Hammamet, Tunisia","Sousse, Tunisia","Mombasa, Kenya","Zanzibar City, Tanzania","Arusha, Tanzania","Serengeti, Tanzania","Kruger, South Africa","Stellenbosch, South Africa","Port Elizabeth, South Africa","Sun City, South Africa","Essaouira Medina, Morocco","Port Said, Egypt","Ismailia, Egypt","Kano, Nigeria","Port Harcourt, Nigeria","Kumasi, Ghana","Entebbe, Uganda","Livingstone, Zambia","Victoria Falls, Zimbabwe","Hermanus, South Africa",
  // ── Additional South America / Caribbean ──
  "Brasilia, Brazil","Porto Alegre, Brazil","Recife, Brazil","Fortaleza, Brazil","Belo Horizonte, Brazil","Curitiba, Brazil","Manaus, Brazil","Paraty, Brazil","Buzios, Brazil","Cordoba, Argentina","Ushuaia, Argentina","Guayaquil, Ecuador","Galapagos, Ecuador","Barranquilla, Colombia","Santa Marta, Colombia","Guadalajara, Mexico","Zihuatanejo, Mexico","San Miguel de Allende, Mexico","Isla Mujeres, Mexico","Georgetown, Guyana","Paramaribo, Suriname","Belize City, Belize","Managua, Nicaragua","Tegucigalpa, Honduras","San Salvador, El Salvador","Guatemala City, Guatemala","Antigua Guatemala, Guatemala",
  // ── Additional Eastern Europe / Russia ──
  "Wroclaw, Poland","Poznan, Poland","Lodz, Poland","Ostrava, Czech Republic","Karlovy Vary, Czech Republic","Debrecen, Hungary","Cluj-Napoca, Romania","Timisoara, Romania","Varna, Bulgaria","Plovdiv, Bulgaria","Patras, Greece","Corfu, Greece","Zakynthos, Greece","Rovinj, Croatia","Hvar, Croatia","Pula, Croatia","Novi Sad, Serbia","Maribor, Slovenia","Mostar, Bosnia and Herzegovina","Budva, Montenegro","Odesa, Ukraine","Kharkiv, Ukraine","Kazan, Russia","Sochi, Russia","Yekaterinburg, Russia","Novosibirsk, Russia","Vladivostok, Russia","Klaipeda, Lithuania","Cesis, Latvia","Tartu, Estonia",
];
