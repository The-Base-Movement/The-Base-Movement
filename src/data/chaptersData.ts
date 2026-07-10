/**
 * @file chaptersData.ts
 * @description Defines static chapters data (representing regional branches and diaspora networks)
 * and exports parsed list of allChapters with helper utility conversions (like generating slugs/IDs).
 */

/**
 * Array of raw chapter data templates containing name, location, membership, status, website URL, and details.
 */
export const chaptersData = [
  {
    name: 'Accra Central',
    city_or_region: 'Accra',
    country: 'Ghana',
    members: null,
    status: 'Pending',
    details_url: 'https://www.thebasemovement.org.gh/chapters/5a5d5a6a-2a7b-42fe-af11-917e68047954',
    description:
      'The Accra Central Hub serves as the primary mobilization center for the movement in the heart of the capital. It focuses on youth engagement, policy advocacy, and urban development strategies for the Greater Accra area.',
  },
  {
    name: 'Berlin Chapter',
    city_or_region: 'Berlin',
    country: 'Germany',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/e97bce7c-7fa4-419a-ae38-319cc9c541bc',
    description:
      'Our Berlin Chapter is a key European hub, uniting the Ghanaian diaspora in Germany to contribute expertise and resources toward the Industrialization and Agro-Processing agenda.',
  },
  {
    name: 'Cape Coast Chapter',
    city_or_region: 'Cape Coast',
    country: 'Ghana',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/d8c1aad4-a958-4c59-84d3-373db300d480',
    description:
      "Focusing on the Central Region's rich potential, the Cape Coast Chapter prioritizes tourism development and educational excellence as part of the movement's national vision.",
  },
  {
    name: 'Kumasi Hub',
    city_or_region: 'Kumasi',
    country: 'Ghana',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/8853094c-2db9-4b07-ab52-46f27da2bcf9',
    description:
      "The Kumasi Hub is a strategic center for the Ashanti Region, driving the movement's mission for expertise-led agriculture and industrial growth in Ghana's commercial heartland.",
  },
  {
    name: 'London UK Chapter',
    city_or_region: 'London',
    country: 'United Kingdom',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/15a20a35-8042-4528-85ea-6aaa040fe5e7',
    description:
      'One of our most active diaspora hubs, the London Chapter coordinates international support and professional mentorship for the youth in Ghana.',
  },
  {
    name: 'Melbourne Chapter',
    city_or_region: 'Melbourne',
    country: 'Australia',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/09b67901-618a-4fcc-a893-f4d1c9758270',
    description:
      "The Melbourne Chapter connects the movement with supporters in Australia, focusing on global networking and resource mobilization for the movement's core aims.",
  },
  {
    name: 'New York Chapter',
    city_or_region: 'New York',
    country: 'United States',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/3feabe67-f628-45ce-b934-74fa811e416a',
    description:
      'Our New York presence acts as a bridge for the diaspora in the Americas, facilitating strategic partnerships and international advocacy for institutional reform in Ghana.',
  },
  {
    name: 'Takoradi Chapter',
    city_or_region: 'Takoradi',
    country: 'Ghana',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/0dea240d-093a-4ac1-ae07-5def9e42689f',
    description:
      "The Takoradi Chapter is dedicated to overseeing industrialization and infrastructure projects in the Western Region, ensuring local communities benefit from Ghana's natural resources.",
  },
  {
    name: 'Tamale Chapter',
    city_or_region: 'Tamale',
    country: 'Ghana',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/6431758a-9b0f-46a3-bf2c-1e46b1848a18',
    description:
      'Serving as the gateway to the Northern Region, this chapter focuses on large-scale agricultural transformation and quality education for every citizen in the north.',
  },
  {
    name: 'The Base - Ahafo Region',
    city_or_region: 'AHAFO',
    country: 'Ghana',
    members: 102,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/e573a4ef-3e08-43ff-b77b-d3c188082b76',
    description:
      "The Ahafo Regional headquarters oversees local implementation of the movement's agenda, prioritizing sustainable mining practices and agricultural modernization.",
  },
  {
    name: 'The Base - Ashanti Region',
    city_or_region: 'ASHANTI',
    country: 'Ghana',
    members: 2141,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/ba17c4de-21a2-41b4-9229-b946212b8bbf',
    description:
      'As one of our largest regional bodies, the Ashanti Regional Chapter is a powerhouse for mobilization and a key advocate for industrial growth across the region.',
  },
  {
    name: 'The Base - Australia Chapter',
    city_or_region: 'Australia',
    country: 'Australia',
    members: 39,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/13b9c701-b0c5-4979-97ee-cff6216a7b0d',
    description:
      'The National Australia Chapter coordinates all local city hubs within the country, building a unified diaspora voice for national development.',
  },
  {
    name: 'The Base - Austria Chapter',
    city_or_region: 'Austria',
    country: 'Austria',
    members: 5,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/d18ee575-de19-4f27-93f4-300b232a445c',
    description:
      "Our Austria Chapter brings together professionals and students in the diaspora to support technical expertise-sharing for Ghana's agricultural sector.",
  },
  {
    name: 'The Base - Belgium Chapter',
    city_or_region: 'Belgium',
    country: 'Belgium',
    members: 38,
    status: 'Member',
    details_url: 'https://www.thebasemovement.org.gh/chapters/94507d9e-6d4b-491a-aedc-e9fc1d53d612',
    description:
      "The Belgium Chapter is a strategic European presence, focusing on international cooperation and supporting the movement's institutional reform goals.",
  },
  {
    name: 'The Base - Bono East Region',
    city_or_region: 'BONO EAST',
    country: 'Ghana',
    members: 158,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/3898dc82-d348-4e6d-b642-b6375169949a',
    description:
      "Focusing on the breadbasket of the nation, the Bono East Chapter leads the movement's efforts in food security and agro-processing development.",
  },
  {
    name: 'The Base - Bono Region',
    city_or_region: 'BONO',
    country: 'Ghana',
    members: 220,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/15ab40d0-44b4-4ac7-ba7f-2feb5ee33518',
    description:
      'The Bono Regional Chapter works closely with local farmers and youth to implement expertise-led agriculture and drive economic growth in the region.',
  },
  {
    name: 'The Base - Brazil Chapter',
    city_or_region: 'Brazil',
    country: 'Brazil',
    members: 2,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/bf848af7-52af-4011-8eb5-9334e63fb728',
    description:
      'Our Brazil Chapter represents the movement in South America, fostering connections with the historical diaspora and sharing sustainable development insights.',
  },
  {
    name: 'The Base - Burkina Faso Chapter',
    city_or_region: 'Burkina Faso',
    country: 'Burkina Faso',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/6fd5cf50-ce70-4441-8147-51d4a58394bf',
    description:
      'Strengthening regional ties, the Burkina Faso Chapter focuses on cross-border cooperation and shared prosperity within the West African sub-region.',
  },
  {
    name: 'The Base - Cameroon Chapter',
    city_or_region: 'Cameroon',
    country: 'Cameroon',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/0279c710-6b20-45ca-a3bd-a2810933c8c9',
    description:
      "The Cameroon Chapter serves our supporters in Central Africa, promoting the movement's pan-African vision for lean and accountable governance.",
  },
  {
    name: 'The Base - Canada Chapter',
    city_or_region: 'Canada',
    country: 'Canada',
    members: 106,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/5bb0c9d4-ed8c-4d5e-9bee-c760d45717ff',
    description:
      "Our National Canada Chapter is a cornerstone of the diaspora, mobilizing resources and professional expertise for Ghana's institutional reform.",
  },
  {
    name: 'The Base - Central Region',
    city_or_region: 'CENTRAL',
    country: 'Ghana',
    members: 874,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/0f09bbbb-e86a-46e7-b55e-1570cd0fdbf5',
    description:
      'The Central Regional headquarters oversees our historic coastal hubs, focusing on tourism, fishing industry modernization, and quality education.',
  },
  {
    name: 'The Base - China Chapter',
    city_or_region: 'China',
    country: 'China',
    members: 3,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/eac64be8-ed63-4741-a1b2-3c5dc1176508',
    description:
      'Connecting with our community in Asia, the China Chapter focuses on technology transfer and industrialization insights for the Ghanaian economy.',
  },
  {
    name: 'The Base - Czech Republic Chapter',
    city_or_region: 'Czech Republic',
    country: 'Czech Republic',
    members: 2,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/df410a75-53fd-469a-beed-e827269a4740',
    description:
      "The Czech Republic Chapter brings together a vibrant community of students and professionals supporting the movement's educational agenda.",
  },
  {
    name: 'The Base - Denmark Chapter',
    city_or_region: 'Denmark',
    country: 'Denmark',
    members: 7,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/8aee33c0-e7c1-471c-8923-166bbf53b53b',
    description:
      "Our Denmark Chapter focuses on sustainable energy and institutional efficiency, drawing inspiration from Nordic models to benefit Ghana's development.",
  },
  {
    name: 'The Base - Eastern Region',
    city_or_region: 'EASTERN',
    country: 'Ghana',
    members: 735,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/50498a28-471c-46e9-829b-9d8afe440074',
    description:
      "The Eastern Regional Chapter leads the movement in agricultural diversification and industrialization, leveraging the region's diverse resources.",
  },
  {
    name: 'The Base - Egypt Chapter',
    city_or_region: 'Egypt',
    country: 'Egypt',
    members: 2,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/9791c742-0cd1-407e-b73d-55246cce8c03',
    description:
      'Our presence in North Africa, the Egypt Chapter, fosters ties across the continent and advocates for youth-led political change in Ghana.',
  },
  {
    name: 'The Base - Finland Chapter',
    city_or_region: 'Finland',
    country: 'Finland',
    members: 8,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/84eed463-388a-4dc7-be4b-5806938c7d1e',
    description:
      "The Finland Chapter emphasizes technology and innovation in education, supporting the movement's goal of quality learning for every Ghanaian.",
  },
  {
    name: 'The Base - France Chapter',
    city_or_region: 'France',
    country: 'France',
    members: 29,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/0273625a-9621-4362-b92a-ca5a36f89d29',
    description:
      'The France Chapter is a vital part of our European network, focused on international advocacy and building strong diaspora-led initiatives.',
  },
  {
    name: 'The Base - Germany Chapter',
    city_or_region: 'Germany',
    country: 'Germany',
    members: 210,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/60800a3b-bad1-4889-b189-65c47a5a4525',
    description:
      'Our German national body coordinates hubs across the country, prioritizing technical cooperation and industrialization support for Ghana.',
  },
  {
    name: 'The Base - Ghana Chapter',
    city_or_region: 'Ghana',
    country: 'Ghana',
    members: 136,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/caf669b9-b2c8-47ce-9443-5615ef66d68b',
    description:
      "The National Ghana Chapter coordinates all regional hubs, ensuring a unified and powerful voice for the movement's agenda across the nation.",
  },
  {
    name: 'The Base - Greater Accra Region',
    city_or_region: 'GREATER ACCRA',
    country: 'Ghana',
    members: 2505,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/a9d85f7b-3af9-4141-a32b-0c78ebfb19c9',
    description:
      "The Greater Accra Regional headquarters is the movement's strategic heart, overseeing urban mobilization and national advocacy in the capital.",
  },
  {
    name: 'The Base - India Chapter',
    city_or_region: 'India',
    country: 'India',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/6a30ca69-0a2c-4955-bc37-1a2e62064493',
    description:
      'Our India Chapter focuses on knowledge-sharing in agriculture and technology, bringing South-South cooperation insights to the movement.',
  },
  {
    name: 'The Base - Ireland Chapter',
    city_or_region: 'Ireland',
    country: 'Ireland',
    members: 9,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/110a224f-21c8-4fb4-98a7-ac632e1a1103',
    description:
      "The Ireland Chapter connects with our community across the Emerald Isle, supporting the movement's goals for economic growth and transparency.",
  },
  {
    name: 'The Base - Israel Chapter',
    city_or_region: 'Israel',
    country: 'Israel',
    members: 10,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/3f5da629-dd79-4847-904e-1db177cb093f',
    description:
      "Our Israel Chapter focuses on agricultural technology and innovation, bringing advanced irrigation and farming insights to the movement's agenda.",
  },
  {
    name: 'The Base - Italy Chapter',
    city_or_region: 'Italy',
    country: 'Italy',
    members: 115,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/8acb11d2-1a82-4547-8a9f-cd6c6c65fc9a',
    description:
      "The Italy Chapter is a key European hub, mobilizing a large diaspora community to support the movement's vision for a prosperous Ghana.",
  },
  {
    name: 'The Base - Ivory Coast Chapter',
    city_or_region: 'Ivory Coast',
    country: 'Ivory Coast',
    members: 12,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/78375d25-a893-480c-9d37-3335248d0174',
    description:
      'Strengthening our ties with ECOWAS neighbors, the Ivory Coast Chapter focuses on regional trade and shared economic development goals.',
  },
  {
    name: 'The Base - Japan Chapter',
    city_or_region: 'Japan',
    country: 'Japan',
    members: 12,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/51ad22c6-a9fa-440a-b909-b4d1c2539a13',
    description:
      "The Japan Chapter brings insights into discipline, industrial efficiency, and high-tech development to the movement's national strategy.",
  },
  {
    name: 'The Base - Kenya Chapter',
    city_or_region: 'Kenya',
    country: 'Kenya',
    members: 1,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/15602def-2410-4223-89d2-c3de0cf1d92b',
    description:
      'Our presence in East Africa, the Kenya Chapter, promotes continental integration and advocates for expertise-led governance across Africa.',
  },
  {
    name: 'The Base - Kuwait Chapter',
    city_or_region: 'Kuwait',
    country: 'Kuwait',
    members: 17,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/2993c943-4aa6-44fa-9996-7ef39f6badf3',
    description:
      "The Kuwait Chapter serves our community in the Middle East, focusing on member welfare and global advocacy for the movement's core aims.",
  },
  {
    name: 'The Base - Luxembourg Chapter',
    city_or_region: 'Luxembourg',
    country: 'Luxembourg',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/fb2f6219-d291-42d9-8b66-a377333d8526',
    description:
      "Our Luxembourg Chapter brings together professionals in finance and international development to support Ghana's economic reform agenda.",
  },
  {
    name: 'The Base - Malaysia Chapter',
    city_or_region: 'Malaysia',
    country: 'Malaysia',
    members: 3,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/6c02f711-e43c-4dff-9d26-d0655d86cf85',
    description:
      "The Malaysia Chapter focuses on education and technical training, sharing development models that can help drive Ghana's industrialization.",
  },
  {
    name: 'The Base - Mexico Chapter',
    city_or_region: 'Mexico',
    country: 'Mexico',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/41abcbf6-df71-40c9-8d10-522ba482cd2e',
    description:
      'Representing the movement in North America, the Mexico Chapter fosters international ties and advocates for institutional reform from abroad.',
  },
  {
    name: 'The Base - Morocco Chapter',
    city_or_region: 'Morocco',
    country: 'Morocco',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/4dd83117-96ec-4e71-b0ed-5b819440062d',
    description:
      'The Morocco Chapter strengthens our ties within the African Union, focusing on continental trade and shared prosperity for all Ghanaians.',
  },
  {
    name: 'The Base - Netherlands Chapter',
    city_or_region: 'Netherlands',
    country: 'Netherlands',
    members: 36,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/563a7eca-3aa0-4357-bf4c-8250c03c1e46',
    description:
      'Our Netherlands Chapter is a vital part of our European network, focusing on water management, logistics, and sustainable development.',
  },
  {
    name: 'The Base - New Zealand Chapter',
    city_or_region: 'New Zealand',
    country: 'New Zealand',
    members: 1,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/59fc0873-9981-4cc1-afa2-f1181074a346',
    description:
      "The New Zealand Chapter connects with our community in the Pacific, promoting the movement's vision for discipline and national integrity.",
  },
  {
    name: 'The Base - Nigeria Chapter',
    city_or_region: 'Nigeria',
    country: 'Nigeria',
    members: 4,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/4733f04f-ec8e-4bc6-bde6-fdba37512a20',
    description:
      'Our presence in Nigeria fosters deep regional cooperation and shares insights on large-scale development and governance in West Africa.',
  },
  {
    name: 'The Base - North East Region',
    city_or_region: 'NORTH EAST',
    country: 'Ghana',
    members: 11,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/5724062f-16a6-4577-acb5-1d93aac5a503',
    description:
      "The North East Regional headquarters leads the movement's efforts in rural infrastructure and agricultural development in the region.",
  },
  {
    name: 'The Base - Northern Region',
    city_or_region: 'NORTHERN',
    country: 'Ghana',
    members: 79,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/25625eb1-b7a8-4f2d-b84a-5ae337acf57c',
    description:
      "The Northern Regional headquarters is a key center for the movement's agricultural agenda, driving the transformation of Ghana's northern savanna.",
  },
  {
    name: 'The Base - Norway Chapter',
    city_or_region: 'Norway',
    country: 'Norway',
    members: 4,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/51ee5e59-0833-4dce-b554-8675eca9113e',
    description:
      "Our Norway Chapter focuses on resource management and social welfare, supporting the movement's goals for a prosperous and equitable Ghana.",
  },
  {
    name: 'The Base - Oti Region',
    city_or_region: 'OTI',
    country: 'Ghana',
    members: 31,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/a4b47a51-583e-41ca-a8d4-980bcae08be6',
    description:
      'The Oti Regional headquarters leads the movement in agricultural development and community-led infrastructure growth in the region.',
  },
  {
    name: 'The Base - Poland Chapter',
    city_or_region: 'Poland',
    country: 'Poland',
    members: 1,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/b7f457e2-e5db-4a7f-80ac-ea87724164a2',
    description:
      "The Poland Chapter connects with our community of students and professionals in Eastern Europe, supporting the movement's educational aims.",
  },
  {
    name: 'The Base - Portugal Chapter',
    city_or_region: 'Portugal',
    country: 'Portugal',
    members: 4,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/57e5394e-d554-4b99-9c9d-e67b22102f60',
    description:
      'Our Portugal Chapter focuses on international advocacy and building strong ties between the diaspora and local initiatives in Ghana.',
  },
  {
    name: 'The Base - Qatar Chapter',
    city_or_region: 'Qatar',
    country: 'Qatar',
    members: 36,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/7a34b6db-1488-40b9-8187-c86a049bee6b',
    description:
      "The Qatar Chapter serves our community in the Gulf, focusing on diaspora engagement and supporting the movement's national development goals.",
  },
  {
    name: 'The Base - Russia Chapter',
    city_or_region: 'Russia',
    country: 'Russia',
    members: 3,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/5df1e41d-cfd5-4581-b7f9-f4ed3ed3e291',
    description:
      'Connecting with our community in Eastern Europe and Asia, the Russia Chapter focuses on education and technical expertise sharing.',
  },
  {
    name: 'The Base - Saudi Arabia Chapter',
    city_or_region: 'Saudi Arabia',
    country: 'Saudi Arabia',
    members: 14,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/7d91a504-dbb4-4181-aaa8-205809712805',
    description:
      "The Saudi Arabia Chapter serves our community in the Middle East, fostering ties and advocating for the movement's vision of national prosperity.",
  },
  {
    name: 'The Base - Savannah Region',
    city_or_region: 'SAVANNAH',
    country: 'Ghana',
    members: 14,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/f1bbd676-b11f-4442-bba6-e1073851ae47',
    description:
      'The Savannah Regional headquarters focuses on large-scale agricultural transformation and sustainable resource management in the region.',
  },
  {
    name: 'The Base - Senegal Chapter',
    city_or_region: 'Senegal',
    country: 'Senegal',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/db060aeb-3604-4301-b0d4-c008bcb33257',
    description:
      'Strengthening our ties in Francophone West Africa, the Senegal Chapter promotes regional stability and shared economic development.',
  },
  {
    name: 'The Base - Singapore Chapter',
    city_or_region: 'Singapore',
    country: 'Singapore',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/81e2711e-1798-4940-a44b-513d46086981',
    description:
      "The Singapore Chapter brings insights into world-class efficiency and governance to the movement's agenda for national reform in Ghana.",
  },
  {
    name: 'The Base - South Africa Chapter',
    city_or_region: 'South Africa',
    country: 'South Africa',
    members: 59,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/323446fb-e1fe-4cd4-a5d3-f32888424f1c',
    description:
      "Our South Africa Chapter is a key hub for the diaspora in the south, focusing on regional integration and supporting the movement's national goals.",
  },
  {
    name: 'The Base - South Korea Chapter',
    city_or_region: 'South Korea',
    country: 'South Korea',
    members: 2,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/3395e795-7892-4d4c-89ad-7e23d0d8f73d',
    description:
      "The South Korea Chapter shares insights into rapid industrialization and education, helping drive the movement's strategy for Ghana's future.",
  },
  {
    name: 'The Base - Spain Chapter',
    city_or_region: 'Spain',
    country: 'Spain',
    members: 54,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/0dc3c3f2-1151-4a2d-a8e8-36153adfa772',
    description:
      "Our Spain Chapter connects with a large diaspora community, mobilizing support for the movement's vision of industrial and agricultural growth.",
  },
  {
    name: 'The Base - Sweden Chapter',
    city_or_region: 'Sweden',
    country: 'Sweden',
    members: 12,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/0dd33fcd-3f50-4220-ba5e-050ade1563d7',
    description:
      "The Sweden Chapter focuses on sustainability and institutional reform, supporting the movement's goals for a modern and transparent Ghana.",
  },
  {
    name: 'The Base - Switzerland Chapter',
    city_or_region: 'Switzerland',
    country: 'Switzerland',
    members: 7,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/6c8c842a-605f-422c-883a-29434be8bfeb',
    description:
      "Our Switzerland Chapter brings together professionals in global health and finance to support the movement's national development goals.",
  },
  {
    name: 'The Base - Tanzania Chapter',
    city_or_region: 'Tanzania',
    country: 'Tanzania',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/53d5c0ac-6003-4f03-923c-9d488c15ca38',
    description:
      'Our presence in East Africa, the Tanzania Chapter, promotes regional cooperation and advocates for political integrity across the continent.',
  },
  {
    name: 'The Base - Thailand Chapter',
    city_or_region: 'Thailand',
    country: 'Thailand',
    members: null,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/e61a3c10-9ebd-4562-9aa2-eecda4ed89a3',
    description:
      'The Thailand Chapter focuses on agricultural innovation and small-scale industrialization, sharing development models for the movement.',
  },
  {
    name: 'The Base - Togo Chapter',
    city_or_region: 'Togo',
    country: 'Togo',
    members: 1,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/54134992-2085-45b4-8151-d3638436d5cb',
    description:
      'Strengthening our ties with our immediate neighbor, the Togo Chapter focuses on cross-border cooperation and shared prosperity.',
  },
  {
    name: 'The Base - Turkey Chapter',
    city_or_region: 'Turkey',
    country: 'Turkey',
    members: 1,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/2262ac3f-6db5-4426-93f9-e2d23e13271c',
    description:
      "Our Turkey Chapter focuses on construction and industrial expertise-sharing to support the movement's infrastructure agenda for Ghana.",
  },
  {
    name: 'The Base - United Arab Emirates Chapter',
    city_or_region: 'United Arab Emirates',
    country: 'United Arab Emirates',
    members: 136,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/26d244a3-a168-4a33-98b4-d2bd2dcad546',
    description:
      'The UAE Chapter is a major hub for our community in the Gulf, mobilizing resources and advocacy for national transformation in Ghana.',
  },
  {
    name: 'The Base - United Kingdom Chapter',
    city_or_region: 'United Kingdom',
    country: 'United Kingdom',
    members: 584,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/5d9496e9-7cc0-4384-89d5-6202649c472a',
    description:
      'Our UK National Chapter coordinates a vast network of supporters, focusing on international advocacy and professional mentorship for the youth.',
  },
  {
    name: 'The Base - United States Chapter',
    city_or_region: 'United States',
    country: 'United States',
    members: 474,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/a66f3cc7-eb98-493d-a0d4-25b0f5be7946',
    description:
      "The US National Chapter is a cornerstone of our diaspora, mobilizing strategic partnerships and professional expertise for Ghana's reform.",
  },
  {
    name: 'The Base - Upper East Region',
    city_or_region: 'UPPER EAST',
    country: 'Ghana',
    members: 46,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/c3d75cbc-521f-44e7-823f-0d28bae15905',
    description:
      'The Upper East Regional headquarters focuses on border security, irrigation, and agricultural development in the north.',
  },
  {
    name: 'The Base - Upper West Region',
    city_or_region: 'UPPER WEST',
    country: 'Ghana',
    members: 11,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/ad75096d-e0fc-4baa-bf83-25e296d76f20',
    description:
      'The Upper West Regional headquarters leads the movement in agricultural modernization and education excellence in the region.',
  },
  {
    name: 'The Base - Volta Region',
    city_or_region: 'VOLTA',
    country: 'Ghana',
    members: 98,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/9c42293f-3e0c-4bfc-82de-6e35e0879711',
    description:
      "The Volta Regional headquarters focuses on tourism, agribusiness, and cross-border trade development as part of the movement's vision.",
  },
  {
    name: 'The Base - Western North Region',
    city_or_region: 'WESTERN NORTH',
    country: 'Ghana',
    members: 121,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/4eb9d868-5444-46df-b1a0-26172590ba13',
    description:
      'The Western North Regional headquarters prioritizes sustainable cocoa production and infrastructure development for local farmers.',
  },
  {
    name: 'The Base - Western Region',
    city_or_region: 'WESTERN',
    country: 'Ghana',
    members: 288,
    status: 'Join Chapter',
    details_url: 'https://www.thebasemovement.org.gh/chapters/4ccdba56-cd1e-4a3c-8439-e70a0e2be2f2',
    description:
      "The Western Regional headquarters oversees our oil and gas hubs, focusing on local content and industrialization for the region's prosperity.",
  },
  {
    name: 'Toronto Chapter',
    city_or_region: 'Toronto',
    country: 'Canada',
    members: null,
    status: 'Request to Join',
    details_url: 'https://www.thebasemovement.org.gh/chapters/a4a0e892-a736-4fde-9d4a-217c8d0a4967',
    description:
      "The Toronto Chapter connects with our community in Canada's commercial heart, focusing on economic partnerships and youth mentorship.",
  },
]

/**
 * Static Chapter profile structure representing standard properties
 * required for UI render and map visualization.
 */
export interface StaticChapter {
  /** Clean unique string identifier matching the name slug */
  id: string
  /** Name of the chapter */
  name: string
  /** City or geographical region */
  city_or_region: string
  /** Country of the chapter */
  country: string
  /** Number of members (null if not defined/fetched) */
  members: number | null
  /** Estimated members count or randomized default fallback for visualization */
  membersCount: number
  /** Registration or join button status label */
  status: string
  /** Website/details page url for this chapter */
  details_url: string
  /** Detailed description of the chapter mission */
  description: string
}

/**
 * Parsed collection of all movement chapters mapped into the StaticChapter interface format,
 * generating unique hyphenated url slugs/IDs, matching standard description defaults,
 * and mapping membersCount fields.
 */
export const allChapters: StaticChapter[] = (
  chaptersData as Array<{
    name: string
    city_or_region: string
    country: string
    members: number | null
    status: string
    details_url: string
    description: string
  }>
).map((c) => {
  const slug = c.name
    .toLowerCase()
    .replace(/ - /g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')

  return {
    ...c,
    id: slug,
    membersCount: c.members || Math.floor(Math.random() * 50) + 5,
    description:
      c.description ||
      "This chapter is a vital hub of The Base movement, dedicated to mobilizing citizens and building a stronger foundation for Ghana's future.",
  }
})
