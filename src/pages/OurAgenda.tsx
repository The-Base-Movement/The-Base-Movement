import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Building2, Factory, Construction, Landmark, Sprout, ArrowRight } from 'lucide-react'

const agendaPillars = [
  {
    id: 'education',
    number: '01',
    title: 'Quality Education for Every Ghanaian',
    icon: GraduationCap,
    color: 'var(--brand-green)',
    summary: 'Ensure universal access to quality formal and informal education that produces informed, capable, and civically responsible Ghanaian citizens at every level of society.',
    objectives: [
      {
        title: 'Universal Access',
        items: [
          'Fully fund free quality education covering tuition, materials and meals for every child.',
          'Build or rehabilitate at least one equipped school in every community of 500+.',
          'Introduce credible scholarships for deserving students from low-income households.'
        ]
      },
      {
        title: 'Curriculum & Civic Reform',
        items: [
          'Integrate critical thinking, financial literacy, entrepreneurship and civic responsibility into the national curriculum at every level.',
          'Launch community learning centres and adult literacy programmes to reach those who missed formal schooling.'
        ]
      },
      {
        title: 'Teacher Quality',
        items: [
          'Improve teacher conditions of service, making the profession well-compensated and respected.',
          'Invest in continuous professional development, especially in science, mathematics and technical education.'
        ]
      }
    ]
  },
  {
    id: 'government',
    number: '02',
    title: 'Lean, Accountable Government',
    icon: Building2,
    color: 'var(--brand-red)',
    summary: 'Build a right-sized, fiscally disciplined government where public office is a service to the nation, not a path to personal enrichment, and where every cedi of public money is accounted for.',
    objectives: [
      {
        title: 'Right-Sizing Government',
        items: [
          'Audit all ministries and agencies within 90 days of assuming office and publish findings publicly.',
          'Reduce ministers to the constitutional minimum.',
          'Merge overlapping agencies to eliminate duplication.'
        ]
      },
      {
        title: 'Fiscal Discipline & Anti-Corruption',
        items: [
          'Enforce transparent, performance-linked public sector pay.',
          'Strengthen anti-corruption institutions.',
          'Mandate publicly accessible asset declarations for all political appointees.',
          'Prosecute all documented corruption regardless of party.'
        ]
      }
    ]
  },
  {
    id: 'industry',
    number: '03',
    title: 'Industrialisation, Tourism & Agro-Processing',
    icon: Factory,
    color: 'var(--brand-gold)',
    summary: 'Drive economic growth and mass employment through three powerful engines: building factories and industries across all 16 regions, developing Ghana into a world-class tourism destination, and transforming raw agricultural produce into high-value processed goods that keep wealth and jobs inside Ghana.',
    objectives: [
      {
        title: 'Industrialisation Factories Across All 16 Regions',
        items: [
          'Establish manufacturing plants and processing facilities in all 16 regions, beginning with five regions in the first phase.',
          'Develop industrial zones with fiscal incentives including tax holidays and import duty waivers on machinery.',
          'Prioritise regions with the highest youth unemployment.',
          'Build a pharmaceutical manufacturing hub in Gomoa Okyereko to produce medicines locally for Ghana and for export across Africa.'
        ]
      },
      {
        title: 'Tourism Unlocking Ghana\'s Economic Potential',
        items: [
          'Transform Ghana\'s beaches, national parks, including Mole National Park, and heritage sites into world-class tourism destinations through targeted infrastructure investment.',
          'Develop the Volta Region as a dedicated creative economy and eco-tourism hub.',
          'Establish a landmark national monument to position Ghana on the global tourism map.',
          'Use tourism receipts to strengthen the Cedi and reduce pressure on foreign exchange.'
        ]
      },
      {
        title: 'Agro-Processing Keeping Value in Ghana',
        items: [
          'Build agro-processing hubs in key agricultural zones to process cassava into ethanol and starch, plantain stems into textile fibre and paper, coconut into oil and activated carbon, and yam into pharmaceutical-grade flour.',
          'Eliminate the export of raw agricultural commodities at low prices.',
          'Ensure that every harvest creates not just farm income but factory jobs, packaging jobs, and export revenue that stays inside Ghana.'
        ]
      }
    ]
  },
  {
    id: 'infrastructure',
    number: '04',
    title: 'Quality Infrastructure From Cities to Villages',
    icon: Construction,
    color: 'var(--brand-green)',
    summary: 'Deliver world-class roads, energy, water, and digital infrastructure across Ghana, with deliberate priority given to rural and village communities that have been left behind.',
    objectives: [
      {
        title: 'Rural Road Development',
        items: [
          'Develop a National Rural Roads Master Plan to fund construction and rehabilitation of all critical feeder roads.',
          'Ensure every farming community has an all-season road within two terms.',
          'Create a dedicated Rural Roads Maintenance Fund.'
        ]
      },
      {
        title: 'Urban & Housing',
        items: [
          'Invest in urban road networks, drainage and public transport.',
          'Develop an affordable housing programme with accessible financing for working families.'
        ]
      },
      {
        title: 'Energy & Digital',
        items: [
          'Achieve 100% household electrification within two terms.',
          'Extend broadband internet access to all districts, enabling a digital economy beyond the major cities.'
        ]
      }
    ]
  },
  {
    id: 'reform',
    number: '05',
    title: 'Comprehensive Institutional Reform',
    icon: Landmark,
    color: 'var(--brand-red)',
    summary: 'Restructure, streamline, and strengthen all public institutions so that government serves the people efficiently, transparently, and without unnecessary duplication or waste.',
    objectives: [
      {
        title: 'Restructuring Institutions',
        items: [
          'Conduct a full functional review of all state institutions in year one.',
          'Merge overlapping ministries guided by service delivery, not politics.',
          'Establish a permanent independent Public Sector Reform Commission.'
        ]
      },
      {
        title: 'Judicial & Law Enforcement',
        items: [
          'Strengthen judicial independence and speed.',
          'Reform the Ghana Police Service with better training, welfare and accountability.',
          'Create independent oversight for all law enforcement.'
        ]
      },
      {
        title: 'Electoral & Democratic Reform',
        items: [
          'Strengthen the Electoral Commission\'s independence.',
          'Introduce campaign finance legislation to limit the influence of money in democratic processes.'
        ]
      }
    ]
  },
  {
    id: 'agriculture',
    number: '06',
    title: 'Expertise-Led Agriculture Sector',
    icon: Sprout,
    color: 'var(--brand-gold)',
    summary: 'Place qualified agricultural experts, scientists, and practitioners in charge of Ghana\'s food and farming sector, driving evidence-based policy, agro-processing, and genuine food security.',
    objectives: [
      {
        title: 'Expert Leadership',
        items: [
          'Appoint Ministers and senior officials based on agricultural expertise, not political loyalty.',
          'Establish an independent Agricultural Advisory Council.',
          'Deploy trained extension officers to every district.'
        ]
      },
      {
        title: 'Agro-Processing & Value Addition',
        items: [
          'Build processing hubs in key agricultural zones to produce ethanol, starch, oils and derivatives locally.',
          'Develop a National Irrigation Programme for year-round productivity.'
        ]
      },
      {
        title: 'Farmer Welfare & Food Security',
        items: [
          'Introduce a Farmer Support Programme covering subsidised inputs, crop insurance, guaranteed minimum pricing and market access.',
          'Build strategic grain reserves and mechanise farming at scale in northern regions.'
        ]
      }
    ]
  }
]

export default function OurAgenda() {
  const [activeSection, setActiveSection] = useState('education')
  const [isLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('userName')
    }
    return false
  })

  useEffect(() => {
    const handleScroll = () => {
      const sections = agendaPillars.map(p => document.getElementById(p.id))
      const scrollPosition = window.scrollY + 200

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(agendaPillars[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="bg-surface-warm font-body-md min-h-screen pb-24">
      {/* Header */}
      <div className="bg-charcoal-dark text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-hero-gradient"></div>
        <div className="max-w-[1280px] mx-auto px-8 relative z-10 text-center">
          <h1 className="uppercase tracking-tighter mb-4">Our Agenda</h1>
          <div className="flex h-1 w-24 mx-auto mb-6">
            <div className="flex-1 bg-[var(--brand-red)]"></div>
            <div className="flex-1 bg-[var(--brand-gold)]"></div>
            <div className="flex-1 bg-[var(--brand-green)]"></div>
          </div>
          <p className="text-slate-300 max-w-2xl mx-auto mb-0">
            The Six Aims of The Base. A detailed, actionable blueprint to build a stronger, more prosperous nation through patriotism, honesty, and discipline.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-8 mt-16">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sticky Navigation */}
          <aside className="lg:w-1/4 hidden lg:block">
            <div className="sticky top-20 space-y-4 font-meta">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6">Agenda Pillars</p>
              <nav className="flex flex-col space-y-2">
                {agendaPillars.map((pillar) => (
                  <a 
                    key={pillar.id}
                    href={`#${pillar.id}`}
                    className={`block py-2 text-sm transition-all ${activeSection === pillar.id ? 'sticky-nav-active' : 'text-slate-600 hover:text-brand-green border-l-3 border-transparent pl-4'}`}
                  >
                    {pillar.number}. {pillar.title}
                  </a>
                ))}
              </nav>

              {/* Leader Portrait */}
              <div className="mt-8 overflow-hidden rounded-sm relative group">
                <img
                  src="/founder.jpg"
                  alt="Dr. George Oti Bonsu The Base Movement Founder"
                  className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-green/90 via-brand-green/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-[10px] font-bold uppercase tracking-widest leading-tight mb-0">
                    Dr. George Oti Bonsu
                  </p>
                  <p className="text-white/70 text-[9px] font-bold uppercase tracking-wider mt-0.5 mb-0">
                    Movement Founder
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:w-3/4 space-y-16">
            
            {/* Intro Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white p-8 border border-slate-200 rounded-none shadow-sm">
                <h3 className="text-brand-green uppercase tracking-tight mb-4">What is an Aim?</h3>
                <p className="text-slate-600 leading-relaxed text-sm mb-0">
                  An Aim is a broad, long-term statement of intent. It describes the desired end state or the overall direction a movement or organisation wishes to pursue. Aims are visionary in nature. They answer the question: "What kind of Ghana are we trying to build?" They are not time-bound or immediately measurable, but they provide the moral compass and purpose that guides all action.
                </p>
              </div>
              <div className="bg-white p-8 border border-slate-200 rounded-none shadow-sm">
                <h3 className="text-brand-green uppercase tracking-tight mb-4">What is an Objective?</h3>
                <p className="text-slate-600 leading-relaxed text-sm mb-0">
                  An Objective is a specific, actionable, and measurable step taken in pursuit of an Aim. Objectives answer the question: "Exactly what will we do and how?" They are concrete, time-oriented, and directly deliverable. Where an Aim sets the destination, an Objective maps the route. Every objective in this document is derived from one of THE BASE's six core Aims.
                </p>
              </div>
            </div>

            {/* Pillar Content */}
            {agendaPillars.map((pillar) => (
              <section key={pillar.id} id={pillar.id} className="pillar-card bg-white border border-slate-200 rounded-none p-8 md:p-12 shadow-sm border-l-4 scroll-mt-24" style={{ borderLeftColor: pillar.color }}>
                <div className="space-y-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-surface-warm" style={{ color: pillar.color }}>
                      <pillar.icon className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-bold tracking-widest uppercase mb-0" style={{ color: pillar.color }}>Aim {pillar.number}</p>
                  </div>
                  <h2 className="mb-0">{pillar.title}</h2>
                </div>
                
                <p className="text-slate-700 leading-relaxed font-medium mb-10 pb-10 border-b border-slate-100">
                  {pillar.summary}
                </p>

                <div className="space-y-8">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0">Objectives</p>
                  {pillar.objectives.map((obj, idx) => (
                    <div key={idx} className="bg-surface-warm p-6 rounded-none">
                      <h3 className="mb-4">{obj.title}</h3>
                      <ul className="space-y-3">
                        {obj.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
                            <span className="w-1.5 h-1.5 mt-2 bg-warm-gold shrink-0 rounded-none"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Covenant CTA */}
            <div className="bg-charcoal-dark text-white p-6 md:p-12 text-center mt-24">
              <div className="w-16 h-16 bg-brand-green mx-auto mb-6 flex items-center justify-center">
                <Landmark className="w-8 h-8 text-white" />
              </div>
              <h2 className="mb-6">Our Covenant with Ghana</h2>
              <div className="max-w-2xl mx-auto space-y-4 text-slate-300 mb-8">
                <p>These Aims define the Ghana we are building. These Objectives are the steps we will be held accountable to. Together, they form THE BASE's covenant with every Ghanaian who believes this country can, and must, do better.</p>
                <p>We do not offer vague promises. We offer an honest, detailed, and actionable agenda rooted in the realities of ordinary Ghanaians and the potential of an extraordinary nation.</p>
                <p className="text-warm-gold font-bold uppercase tracking-widest mt-4 mb-0">Ghana First. Always.</p>
              </div>
              {isLoggedIn ? (
                <Link to="/dashboard/members" className="inline-flex items-center gap-2 px-6 sm:px-8 py-4 bg-brand-green text-white font-meta font-bold uppercase tracking-wide hover:opacity-90 transition-all active:scale-95 text-sm sm:text-base">
                  View Members <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link to="/register" className="inline-flex items-center gap-2 px-6 sm:px-8 py-4 bg-brand-green text-white font-meta font-bold uppercase tracking-wide hover:opacity-90 transition-all active:scale-95 text-sm sm:text-base">
                  Join The Movement <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
