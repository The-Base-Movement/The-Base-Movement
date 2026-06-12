export interface AgendaObjective {
  title: string
  items: string[]
}

export interface AgendaPillar {
  id: string
  number: string
  title: string
  icon: string
  color: string
  summary: string
  objectives: AgendaObjective[]
}

export const agendaPillars: AgendaPillar[] = [
  {
    id: 'education',
    number: '01',
    title: 'Quality Education for Every Ghanaian',
    icon: 'school',
    color: 'hsl(var(--primary))',
    summary:
      'Ensure universal access to quality formal and informal education that produces informed, capable, and civically responsible Ghanaian citizens at every level of society.',
    objectives: [
      {
        title: 'Universal Access',
        items: [
          'Fully fund free quality education covering tuition, materials and meals for every child.',
          'Build or rehabilitate at least one equipped school in every community of 500+.',
          'Introduce credible scholarships for deserving students from low-income households.',
        ],
      },
      {
        title: 'Curriculum & Civic Reform',
        items: [
          'Integrate critical thinking, financial literacy, entrepreneurship and civic responsibility into the national curriculum at every level.',
          'Launch community learning centres and adult literacy programmes to reach those who missed formal schooling.',
        ],
      },
      {
        title: 'Teacher Quality',
        items: [
          'Improve teacher conditions of service, making the profession well-compensated and respected.',
          'Invest in continuous professional development, especially in science, mathematics and technical education.',
        ],
      },
    ],
  },
  {
    id: 'government',
    number: '02',
    title: 'Lean, Accountable Government',
    icon: 'account_balance',
    color: 'hsl(var(--destructive))',
    summary:
      'Build a right-sized, fiscally disciplined government where public office is a service to the nation, not a path to personal enrichment, and where every cedi of public money is accounted for.',
    objectives: [
      {
        title: 'Right-Sizing Government',
        items: [
          'Audit all ministries and agencies within 90 days of assuming office and publish findings publicly.',
          'Reduce ministers to the constitutional minimum.',
          'Merge overlapping agencies to eliminate duplication.',
        ],
      },
      {
        title: 'Fiscal Discipline & Anti-Corruption',
        items: [
          'Enforce transparent, performance-linked public sector pay.',
          'Strengthen anti-corruption institutions.',
          'Mandate publicly accessible asset declarations for all political appointees.',
          'Prosecute all documented corruption regardless of party.',
        ],
      },
    ],
  },
  {
    id: 'industry',
    number: '03',
    title: 'Industrialisation, Tourism & Agro-Processing',
    icon: 'factory',
    color: 'hsl(var(--accent))',
    summary:
      'Drive economic growth and mass employment through three powerful engines: building factories and industries across all 16 regions, developing Ghana into a world-class tourism destination, and transforming raw agricultural produce into high-value processed goods that keep wealth and jobs inside Ghana.',
    objectives: [
      {
        title: 'Industrialisation Factories Across All 16 Regions',
        items: [
          'Establish manufacturing plants and processing facilities in all 16 regions, beginning with five regions in the first phase.',
          'Develop industrial zones with fiscal incentives including tax holidays and import duty waivers on machinery.',
          'Prioritise regions with the highest youth unemployment.',
          'Build a pharmaceutical manufacturing hub in Gomoa Okyereko to produce medicines locally for Ghana and for export across Africa.',
        ],
      },
      {
        title: "Tourism Unlocking Ghana's Economic Potential",
        items: [
          "Transform Ghana's beaches, national parks, including Mole National Park, and heritage sites into world-class tourism destinations through targeted infrastructure investment.",
          'Develop the Volta Region as a dedicated creative economy and eco-tourism hub.',
          'Establish a landmark national monument to position Ghana on the global tourism map.',
          'Use tourism receipts to strengthen the Cedi and reduce pressure on foreign exchange.',
        ],
      },
      {
        title: 'Agro-Processing Keeping Value in Ghana',
        items: [
          'Build agro-processing hubs in key agricultural zones to process cassava into ethanol and starch, plantain stems into textile fibre and paper, coconut into oil and activated carbon, and yam into pharmaceutical-grade flour.',
          'Eliminate the export of raw agricultural commodities at low prices.',
          'Ensure that every harvest creates not just farm income but factory jobs, packaging jobs, and export revenue that stays inside Ghana.',
        ],
      },
    ],
  },
  {
    id: 'infrastructure',
    number: '04',
    title: 'Quality Infrastructure From Cities to Villages',
    icon: 'construction',
    color: 'hsl(var(--primary))',
    summary:
      'Deliver world-class roads, energy, water, and digital infrastructure across Ghana, with deliberate priority given to rural and village communities that have been left behind.',
    objectives: [
      {
        title: 'Rural Road Development',
        items: [
          'Develop a National Rural Roads Master Plan to fund construction and rehabilitation of all critical feeder roads.',
          'Ensure every farming community has an all-season road within two terms.',
          'Create a dedicated Rural Roads Maintenance Fund.',
        ],
      },
      {
        title: 'Urban & Housing',
        items: [
          'Invest in urban road networks, drainage and public transport.',
          'Develop an affordable housing programme with accessible financing for working families.',
        ],
      },
      {
        title: 'Energy & Digital',
        items: [
          'Achieve 100% household electrification within two terms.',
          'Extend broadband internet access to all districts, enabling a digital economy beyond the major cities.',
        ],
      },
    ],
  },
  {
    id: 'reform',
    number: '05',
    title: 'Comprehensive Institutional Reform',
    icon: 'gavel',
    color: 'hsl(var(--destructive))',
    summary:
      'Restructure, streamline, and strengthen all public institutions so that government serves the people efficiently, transparently, and without unnecessary duplication or waste.',
    objectives: [
      {
        title: 'Restructuring Institutions',
        items: [
          'Conduct a full functional review of all state institutions in year one.',
          'Merge overlapping ministries guided by service delivery, not politics.',
          'Establish a permanent independent Public Sector Reform Commission.',
        ],
      },
      {
        title: 'Judicial & Law Enforcement',
        items: [
          'Strengthen judicial independence and speed.',
          'Reform the Ghana Police Service with better training, welfare and accountability.',
          'Create independent oversight for all law enforcement.',
        ],
      },
      {
        title: 'Electoral & Democratic Reform',
        items: [
          "Strengthen the Electoral Commission's independence.",
          'Introduce campaign finance legislation to limit the influence of money in democratic processes.',
        ],
      },
    ],
  },
  {
    id: 'agriculture',
    number: '06',
    title: 'Expertise-Led Agriculture Sector',
    icon: 'eco',
    color: 'hsl(var(--accent))',
    summary:
      "Place qualified agricultural experts, scientists, and practitioners in charge of Ghana's food and farming sector, driving evidence-based policy, agro-processing, and genuine food security.",
    objectives: [
      {
        title: 'Expert Leadership',
        items: [
          'Appoint Ministers and senior officials based on agricultural expertise, not political loyalty.',
          'Establish an independent Agricultural Advisory Council.',
          'Deploy trained extension officers to every district.',
        ],
      },
      {
        title: 'Agro-Processing & Value Addition',
        items: [
          'Build processing hubs in key agricultural zones to produce ethanol, starch, oils and derivatives locally.',
          'Develop a National Irrigation Programme for year-round productivity.',
        ],
      },
      {
        title: 'Farmer Welfare & Food Security',
        items: [
          'Introduce a Farmer Support Programme covering subsidised inputs, crop insurance, guaranteed minimum pricing and market access.',
          'Build strategic grain reserves and mechanise farming at scale in northern regions.',
        ],
      },
    ],
  },
]
