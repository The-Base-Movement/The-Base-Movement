const fs = require('fs');
const regions = ['Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'];
const regionConstituencies = {
  'Ahafo': ['Asunafo North', 'Asunafo South', 'Asutifi North', 'Asutifi South', 'Tano North', 'Tano South'],
  'Ashanti': ['Adansi-Asokwa', 'Fomena', 'New Edubease', 'Afigya Kwabre North', 'Afigya Kwabre South', 'Ahafo Ano North', 'Ahafo Ano South East', 'Ahafo Ano South West', 'Akrofuom', 'Odotobri', 'Manso Nkwanta', 'Manso Edubia', 'Asante Akim Central', 'Asante Akim North', 'Asante Akim South', 'Asawase', 'Asokwa', 'Atwima-Kwanwoma', 'Atwima Mponua', 'Atwima-Nwabiagya South', 'Atwima-Nwabiagya North', 'Bekwai', 'Bosome-Freho', 'Bosomtwe', 'Ejisu', 'Ejura-Sekyedumase', 'Juaben', 'Bantama', 'Manhyia North', 'Manhyia South', 'Nhyiaeso', 'Subin', 'Kwabre East', 'Kwadaso', 'Mampong', 'Obuasi East', 'Obuasi West', 'Offinso South', 'Offinso North', 'Oforikrom', 'Old Tafo', 'Sekyere Afram Plains', 'Nsuta-Kwamang-Beposo', 'Afigya Sekyere East', 'Kumawu', 'Effiduase-Asokore', 'Suame'],
  'Bono': ['Banda Ahenkro', 'Berekum East', 'Berekum West', 'Dormaa Central', 'Dormaa East', 'Dormaa West', 'Jaman North', 'Jaman South', 'Sunyani East', 'Sunyani West', 'Tain', 'Wenchi'],
  'Bono East': ['Atebubu-Amantin', 'Kintampo North', 'Kintampo South', 'Nkoranza North', 'Nkoranza South', 'Pru East', 'Pru West', 'Sene East', 'Sene West', 'Techiman South', 'Techiman North'],
  'Central': ['Abura-Asebu-Kwamankese', 'Agona East', 'Agona West', 'Ajumako-Enyan-Essiam', 'Asikuma-Odoben-Brakwa', 'Assin Central', 'Assin North', 'Assin South', 'Awutu-Senya East', 'Awutu-Senya West', 'Cape Coast North', 'Cape Coast South', 'Effutu', 'Ekumfi', 'Gomoa East', 'Gomoa Central', 'Gomoa West', 'Komenda-Edina-Eguafo-Abirem', 'Mfantseman', 'Twifo-Atii Morkwaa', 'Hemang Lower Denkyira', 'Upper Denkyira East', 'Upper Denkyira West'],
  'Eastern': ['Abuakwa North', 'Abuakwa South', 'Achiase', 'Akropong', 'Akwapim South', 'Ofoase-Ayirebi', 'Asene Akroso Manso', 'Asuogyaman', 'Atiwa East', 'Atiwa West', 'Ayensuano', 'Akim Oda', 'Abirem', 'Akim Swedru', 'Akwatia', 'Fanteakwa North', 'Fanteakwa South', 'Kade', 'Afram Plains North', 'Afram Plains South', 'Abetifi', 'Mpraeso', 'Nkawkaw', 'Lower Manya', 'New Juaben North', 'New Juaben South', 'Nsawam Adoagyiri', 'Okere', 'Suhum', 'Upper Manya', 'Upper West Akim', 'Lower West Akim', 'Yilo Krobo'],
  'Greater Accra': ['Ablekuma Central', 'Ablekuma North', 'Ablekuma West', 'Ablekuma South', 'Odododiodio', 'Okaikwei Central', 'Okaikwei South', 'Ada', 'Sege', 'Adenta', 'Ashaiman', 'Ayawaso Central', 'Ayawaso East', 'Ayawaso North', 'Ayawaso West', 'Anyaa-Sowutuom', 'Dome-Kwabenya', 'Trobu', 'Bortianor-Ngleshie-Amanfrom', 'Domeabra-Obom', 'Amasaman', 'Korle Klottey', 'Kpone-Katamanso', 'Krowor', 'Dade Kotopon', 'Abokobi-Madina', 'Ledzokuku', 'Ningo-Prampram', 'Okaikwei North', 'Shai-Osudoku', 'Tema Central', 'Tema East', 'Tema West', 'Weija'],
  'North East': ['Bunkpurugu', 'Chereponi', 'Nalerigu', 'Yagaba-Kubori', 'Walewale', 'Yunyoo'],
  'Northern': ['Gushegu', 'Karaga', 'Kpandai', 'Kumbungu', 'Mion', 'Nanton', 'Bimbilla', 'Wulensi', 'Saboba', 'Sagnarigu', 'Savelugu', 'Tamale Central', 'Tamale North', 'Tamale South', 'Yendi'],
  'Oti': ['Krachi East', 'Krachi West', 'Krachi Nchumuru', 'Nkwanta North', 'Nkwanta South', 'Biakoye', 'Jasikan', 'Kadjebi', 'Guan'],
  'Savannah': ['Bole', 'Sawla-Tuna-Kalba', 'Damongo', 'Daboya-Mankarigu', 'Salaga North', 'Salaga South', 'Yapei-Kusawgu'],
  'Upper East': ['Bolgatanga Central', 'Bolgatanga East', 'Chiana-Paga', 'Navrongo Central', 'Builsa North', 'Builsa South', 'Bawku Central', 'Binduri', 'Pusiga', 'Zebilla', 'Garu', 'Tempane', 'Talensi', 'Nabdam', 'Bongo'],
  'Upper West': ['Wa Central', 'Wa West', 'Wa East', 'Nadowli-Kaleo', 'Jirapa', 'Lambussie', 'Lawra', 'Nandom', 'Daffiama-Bussie-Issa', 'Sissala West', 'Sissala East'],
  'Volta': ['Ho Central', 'Ho West', 'Hohoe', 'Kpando', 'North Dayi', 'South Dayi', 'Afadzato South', 'Agotime-Ziope', 'Adaklu', 'North Tongu', 'South Tongu', 'Central Tongu', 'Akatsi South', 'Akatsi North', 'Ketu South', 'Ketu North', 'Keta', 'Anlo'],
  'Western': ['Takoradi', 'Sekondi', 'Essikado-Ketan', 'Kwesimintsim', 'Effia', 'Ahanta West', 'Mpohor', 'Shama', 'Wassa East', 'Tarkwa-Nsuaem', 'Prestea Huni-Valley', 'Evalue-Ajomoro-Gwira', 'Ellembelle', 'Jomoro'],
  'Western North': ['Sefwi-Wiawso', 'Sefwi Akontombra', 'Bodi', 'Juaboso', 'Bia West', 'Bia East', 'Bibiani-Anhwiaso-Bekwai', 'Aowin', 'Suaman']
};

let sql = 'INSERT INTO ghana_constituencies (region_id, name) VALUES\n';
let values = [];
regions.forEach((r, idx) => {
  const c = regionConstituencies[r];
  c.forEach(con => {
    values.push(`( (SELECT id FROM ghana_regions WHERE name = '${r}'), '${con.replace(/'/g, "''")}' )`);
  });
});
sql += values.join(',\n') + ' ON CONFLICT DO NOTHING;';
fs.writeFileSync('seed.sql', sql);
