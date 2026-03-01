import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// Configuration
// ============================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ANEX_URL = "https://anex.us/grades/getData/";
const RMP_URL = "https://www.ratemyprofessors.com/graphql";
const RMP_AUTH = "Basic dGVzdDp0ZXN0";
const TAMU_SCHOOL_ID = "U2Nob29sLTEwMDM=";
const CS_DEPT_ID = "RGVwYXJ0bWVudC0xMQ==";

// All CSCE course numbers with data on Anex
const CSCE_COURSES = [
  "110", "111", "120", "181",
  "221", "222",
  "305", "310", "312", "313", "314", "320", "331",
  "402", "410", "411", "412", "413", "416", "420", "421", "426", "429",
  "430", "431", "432", "433", "434", "435", "436", "438", "439",
  "440", "441", "442", "443", "444", "445", "446", "447", "448", "449", "450", "451", "452", "456",
  "461", "462", "463", "464", "465", "469", "470", "477",
  "481", "482", "483",
];

// ============================================================
// Course Metadata (from TAMU catalog)
// ============================================================

interface CourseMeta {
  name: string;
  credits: number;
  description: string;
  prereqs: string[][];
  coreqs: string[];
  semesters_offered: string[];
}

const COURSE_META: Record<string, CourseMeta> = {
  "110": {
    name: "Programming I",
    credits: 3,
    description: "Introduction to programming concepts using Python. Problem solving, data types, control structures, functions, lists, and file I/O.",
    prereqs: [],
    coreqs: [],
    semesters_offered: ["Fall", "Spring", "Summer"],
  },
  "111": {
    name: "Introduction to Computer Science Concepts and Programming",
    credits: 3,
    description: "Introduction to computer science concepts and programming in a high-level language.",
    prereqs: [],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "120": {
    name: "Program Design and Concepts",
    credits: 3,
    description: "Intermediate-level programming including object-oriented design, data structures, algorithms, and software engineering principles.",
    prereqs: [["CSCE 110"], ["CSCE 111"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "121": {
    name: "Introduction to Program Design and Concepts",
    credits: 4,
    description: "Design and implementation of programs using C++. Emphasis on structured programming, object-oriented design, and debugging.",
    prereqs: [["CSCE 110"], ["CSCE 111"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring", "Summer"],
  },
  "181": {
    name: "Introduction to Computing",
    credits: 1,
    description: "Introduction to the computing profession, ethics, and social issues in computing.",
    prereqs: [],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "221": {
    name: "Data Structures and Algorithms",
    credits: 4,
    description: "Design and analysis of data structures and algorithms. Lists, stacks, queues, trees, graphs, sorting, searching, hashing.",
    prereqs: [["CSCE 121"]],
    coreqs: ["CSCE 222"],
    semesters_offered: ["Fall", "Spring", "Summer"],
  },
  "222": {
    name: "Discrete Structures for Computing",
    credits: 3,
    description: "Mathematical foundations for computing. Logic, proofs, sets, relations, functions, combinatorics, graph theory, and Boolean algebra.",
    prereqs: [["MATH 151"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "310": {
    name: "Database Systems",
    credits: 3,
    description: "Database design, relational model, SQL, normalization, transaction processing, and data modeling.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "312": {
    name: "Computer Organization",
    credits: 4,
    description: "Computer architecture and organization. Machine language, assembly language, digital logic, processor design, memory hierarchy, I/O.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "313": {
    name: "Introduction to Computer Systems",
    credits: 4,
    description: "Introduction to system-level programming. Processes, threads, synchronization, memory management, file systems, networking.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "314": {
    name: "Programming Languages",
    credits: 3,
    description: "Concepts and principles of programming languages. Functional programming, type systems, abstraction, concurrency.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "315": {
    name: "Programming Studio",
    credits: 3,
    description: "Team-based software development using modern tools and methodologies. Agile practices, version control, testing, deployment.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "305": {
    name: "Computational Data Science",
    credits: 3,
    description: "Foundations of computational data science including data wrangling, visualization, and statistical modeling.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "320": {
    name: "Principles of Data Science",
    credits: 3,
    description: "Principles and techniques of data science including data mining, machine learning, and statistical analysis.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "331": {
    name: "Foundations of Software Engineering",
    credits: 4,
    description: "Software development lifecycle, requirements engineering, architecture, design patterns, testing, and project management. Writing intensive.",
    prereqs: [["CSCE 314"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "410": {
    name: "Operating Systems",
    credits: 3,
    description: "Process management, memory management, file systems, I/O systems, concurrency, and distributed systems.",
    prereqs: [["CSCE 312", "CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "411": {
    name: "Design and Analysis of Algorithms",
    credits: 3,
    description: "Algorithm design techniques: divide-and-conquer, dynamic programming, greedy algorithms, graph algorithms. NP-completeness.",
    prereqs: [["CSCE 221", "CSCE 222"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "402": {
    name: "Law and Policy in Cybersecurity",
    credits: 3,
    description: "Legal and policy issues in cybersecurity including privacy, intellectual property, and regulatory compliance.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "412": {
    name: "Cloud Computing",
    credits: 3,
    description: "Cloud computing concepts, virtualization, distributed systems, and cloud service models.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "413": {
    name: "Software Security",
    credits: 3,
    description: "Security principles in software design, secure coding practices, vulnerability analysis.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "416": {
    name: "Hardware Design and Verification",
    credits: 3,
    description: "Hardware description languages, digital design methodology, verification and testing.",
    prereqs: [["CSCE 312"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "420": {
    name: "Artificial Intelligence",
    credits: 3,
    description: "Search, knowledge representation, reasoning, planning, machine learning, natural language processing.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "421": {
    name: "Machine Learning",
    credits: 3,
    description: "Supervised learning, unsupervised learning, deep learning, reinforcement learning, and applications.",
    prereqs: [["CSCE 221", "MATH 304"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "426": {
    name: "Security of Embedded Systems",
    credits: 3,
    description: "Security analysis and design for embedded and IoT systems, hardware security primitives.",
    prereqs: [["CSCE 312"]],
    coreqs: [],
    semesters_offered: ["Fall"],
  },
  "429": {
    name: "Software Development, Globalization and Culture Abroad",
    credits: 3,
    description: "Software development in a global context, cultural considerations, study abroad component.",
    prereqs: [["CSCE 331"]],
    coreqs: [],
    semesters_offered: ["Summer"],
  },
  "430": {
    name: "Problem Solving Programming Strategies",
    credits: 3,
    description: "Competitive programming techniques. Algorithm design, optimization, and problem-solving strategies.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall"],
  },
  "431": {
    name: "Software Engineering",
    credits: 3,
    description: "Software development lifecycle, requirements engineering, architecture, design patterns, testing, and project management.",
    prereqs: [["CSCE 315"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "432": {
    name: "Accessible Computing",
    credits: 3,
    description: "Accessibility principles, assistive technologies, inclusive design, and universal usability.",
    prereqs: [["CSCE 331"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "433": {
    name: "Formal Languages and Automata",
    credits: 3,
    description: "Regular languages, context-free languages, Turing machines, decidability, complexity theory.",
    prereqs: [["CSCE 222"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "434": {
    name: "Compiler Design",
    credits: 3,
    description: "Lexical analysis, parsing, semantic analysis, code generation, and optimization.",
    prereqs: [["CSCE 314", "CSCE 312"]],
    coreqs: [],
    semesters_offered: ["Spring"],
  },
  "435": {
    name: "Parallel Computing",
    credits: 3,
    description: "Parallel algorithm design, shared memory and message passing, GPU computing, performance analysis.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "436": {
    name: "Computer-Human Interaction",
    credits: 3,
    description: "Usability, interface design, user-centered design, prototyping, evaluation methods.",
    prereqs: [["CSCE 315"]],
    coreqs: [],
    semesters_offered: ["Spring"],
  },
  "438": {
    name: "Distributed Objects Programming",
    credits: 3,
    description: "Distributed computing paradigms, middleware, RPC, message queues, and distributed system design.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "439": {
    name: "Data Analytics for Cybersecurity",
    credits: 3,
    description: "Data analytics techniques applied to cybersecurity problems, threat detection, and security monitoring.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall"],
  },
  "440": {
    name: "Quantum Algorithms, Complexity, and Cryptography",
    credits: 3,
    description: "Quantum computing fundamentals, quantum algorithms, quantum complexity, and quantum cryptography.",
    prereqs: [["CSCE 411"]],
    coreqs: [],
    semesters_offered: ["Spring"],
  },
  "441": {
    name: "Computer Graphics",
    credits: 3,
    description: "Rendering, modeling, animation, shading, ray tracing, and real-time graphics programming.",
    prereqs: [["CSCE 221", "MATH 304"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "442": {
    name: "Scientific Programming",
    credits: 3,
    description: "Numerical methods, scientific computing, simulation, and high-performance computing for science applications.",
    prereqs: [["CSCE 221", "MATH 304"]],
    coreqs: [],
    semesters_offered: ["Fall"],
  },
  "443": {
    name: "Game Development",
    credits: 3,
    description: "Game engines, physics simulation, AI for games, graphics pipelines, and team-based game projects.",
    prereqs: [["CSCE 315"]],
    coreqs: [],
    semesters_offered: ["Fall"],
  },
  "444": {
    name: "Structures of Interactive Information",
    credits: 3,
    description: "Design and implementation of interactive information systems and interfaces.",
    prereqs: [["CSCE 331"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "445": {
    name: "Computers and New Media",
    credits: 3,
    description: "Digital media, interactive systems, multimedia computing, and new media technologies.",
    prereqs: [["CSCE 331"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "446": {
    name: "Virtual Reality",
    credits: 3,
    description: "Virtual reality systems, 3D interaction, immersive environments, and VR application development.",
    prereqs: [["CSCE 441"]],
    coreqs: [],
    semesters_offered: ["Spring"],
  },
  "447": {
    name: "Data Visualization",
    credits: 3,
    description: "Principles and techniques of data visualization, interactive visual analytics.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall"],
  },
  "448": {
    name: "Computational Photography",
    credits: 3,
    description: "Computational imaging techniques, image processing, and photography algorithms.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Spring"],
  },
  "449": {
    name: "Applied Cryptography",
    credits: 3,
    description: "Cryptographic algorithms, protocols, and their practical applications in security systems.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall"],
  },
  "450": {
    name: "Computer Animation",
    credits: 3,
    description: "Animation principles, keyframing, motion capture, physics-based animation, and character animation.",
    prereqs: [["CSCE 441"]],
    coreqs: [],
    semesters_offered: ["Fall"],
  },
  "451": {
    name: "Software Reverse Engineering",
    credits: 3,
    description: "Techniques for analyzing and understanding compiled software, binary analysis, and disassembly.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "452": {
    name: "Robotics and Spatial Intelligence",
    credits: 3,
    description: "Robot kinematics, planning, perception, control, and spatial reasoning.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "456": {
    name: "Real-Time Computing",
    credits: 3,
    description: "Real-time system design, scheduling algorithms, timing analysis, and embedded real-time applications.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Spring"],
  },
  "461": {
    name: "Embedded Systems for Medical Applications",
    credits: 3,
    description: "Design and implementation of embedded systems for biomedical applications.",
    prereqs: [["CSCE 312"]],
    coreqs: [],
    semesters_offered: ["Spring"],
  },
  "462": {
    name: "Microcomputer Systems",
    credits: 3,
    description: "Embedded systems programming, microcontroller architecture, real-time systems, interfacing.",
    prereqs: [["CSCE 312"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "463": {
    name: "Networks and Distributed Processing",
    credits: 3,
    description: "Network protocols, distributed computing, socket programming, and network applications.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "464": {
    name: "Wireless and Mobile Systems",
    credits: 3,
    description: "Wireless networking, mobile computing, sensor networks, and mobile application development.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall"],
  },
  "465": {
    name: "Computer and Network Security",
    credits: 3,
    description: "Cryptography, access control, network security, web security, and secure software development.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "469": {
    name: "Advanced Computer Architecture",
    credits: 3,
    description: "Advanced processor design, memory hierarchy optimization, and multiprocessor systems.",
    prereqs: [["CSCE 312"]],
    coreqs: [],
    semesters_offered: ["Fall"],
  },
  "470": {
    name: "Information Storage and Retrieval",
    credits: 3,
    description: "Text processing, indexing, search algorithms, ranking, web search, and natural language processing.",
    prereqs: [["CSCE 221"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "477": {
    name: "Cybersecurity Risk",
    credits: 3,
    description: "Risk assessment, management, and mitigation strategies for cybersecurity.",
    prereqs: [["CSCE 313"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "481": {
    name: "Seminar",
    credits: 1,
    description: "Seminar course on current topics in computer science and engineering.",
    prereqs: [],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "482": {
    name: "Senior Capstone Design",
    credits: 3,
    description: "Team-based capstone design project. Requirements, design, implementation, testing, and presentation.",
    prereqs: [["CSCE 315", "CSCE 411"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
  "483": {
    name: "Senior Capstone Design",
    credits: 3,
    description: "Continuation of capstone design project.",
    prereqs: [["CSCE 482"]],
    coreqs: [],
    semesters_offered: ["Fall", "Spring"],
  },
};

// ============================================================
// Non-CSCE Courses (degree plan requirements)
// ============================================================

interface NonCsceCourse {
  department: string;
  number: string;
  name: string;
  credits: number;
}

const NON_CSCE_COURSES: NonCsceCourse[] = [
  // Mathematics
  { department: "MATH", number: "151", name: "Engineering Mathematics I", credits: 4 },
  { department: "MATH", number: "152", name: "Engineering Mathematics II", credits: 4 },
  { department: "MATH", number: "251", name: "Engineering Mathematics III", credits: 3 },
  { department: "MATH", number: "304", name: "Linear Algebra", credits: 3 },
  { department: "MATH", number: "308", name: "Differential Equations", credits: 3 },
  // Statistics
  { department: "STAT", number: "211", name: "Principles of Statistics I", credits: 3 },
  { department: "STAT", number: "212", name: "Principles of Statistics II", credits: 3 },
  // Physics
  { department: "PHYS", number: "206", name: "Newtonian Mechanics", credits: 3 },
  { department: "PHYS", number: "207", name: "Electricity and Magnetism", credits: 3 },
  { department: "PHYS", number: "216", name: "Mechanics Laboratory", credits: 2 },
  { department: "PHYS", number: "227", name: "Honors Physics II", credits: 3 },
  // Chemistry
  { department: "CHEM", number: "107", name: "General Chemistry for Engineering Students", credits: 3 },
  { department: "CHEM", number: "117", name: "Chemistry Laboratory for Engineering Students", credits: 1 },
  { department: "CHEM", number: "119", name: "Principles of Chemistry for Engineers", credits: 4 },
  { department: "CHEM", number: "120", name: "General Chemistry II", credits: 4 },
  // English & Communications
  { department: "ENGL", number: "103", name: "Rhetoric and Composition I", credits: 3 },
  { department: "ENGL", number: "104", name: "Rhetoric and Composition II", credits: 3 },
  { department: "ENGL", number: "210", name: "Technical and Business Writing", credits: 3 },
  { department: "COMM", number: "203", name: "Public Speaking", credits: 3 },
  { department: "COMM", number: "205", name: "Business and Professional Communication", credits: 3 },
  // Engineering
  { department: "ENGR", number: "102", name: "Engineering Lab I — Computation", credits: 2 },
  { department: "ENGR", number: "216", name: "Experimental Physics and Engineering Lab", credits: 2 },
  // History
  { department: "HIST", number: "105", name: "History of the United States", credits: 3 },
  { department: "HIST", number: "106", name: "History of the United States", credits: 3 },
  // Government
  { department: "POLS", number: "206", name: "American National Government", credits: 3 },
  { department: "POLS", number: "207", name: "State and Local Government", credits: 3 },
  // Creative Arts
  { department: "ARTS", number: "103", name: "Introduction to Visual Arts", credits: 3 },
  { department: "ARTS", number: "149", name: "Art and Design Appreciation", credits: 3 },
  { department: "ARTS", number: "150", name: "Design Fundamentals", credits: 3 },
  { department: "MUSC", number: "200", name: "Music in Society", credits: 3 },
  { department: "THAR", number: "201", name: "Introduction to Theatre", credits: 3 },
  { department: "FILM", number: "251", name: "Introduction to Film Studies", credits: 3 },
  { department: "ENDS", number: "101", name: "Design Thinking", credits: 3 },
  { department: "DCED", number: "120", name: "Dance Appreciation", credits: 3 },
  { department: "PERF", number: "201", name: "Introduction to Performance Studies", credits: 3 },
  // Social & Behavioral Sciences
  { department: "PSYC", number: "107", name: "Introduction to Psychology", credits: 3 },
  { department: "SOCI", number: "205", name: "Introduction to Sociology", credits: 3 },
  { department: "SOCI", number: "207", name: "Contemporary Social Issues", credits: 3 },
  { department: "ECON", number: "202", name: "Principles of Microeconomics", credits: 3 },
  { department: "ECON", number: "203", name: "Principles of Macroeconomics", credits: 3 },
  { department: "ANTH", number: "105", name: "Introduction to Anthropology", credits: 3 },
  { department: "GEOG", number: "201", name: "Geography of the Natural Environment", credits: 3 },
  // Language, Philosophy & Culture
  { department: "PHIL", number: "101", name: "Introduction to Philosophy", credits: 3 },
  { department: "PHIL", number: "203", name: "Logic", credits: 3 },
  { department: "PHIL", number: "240", name: "Introduction to Ethics", credits: 3 },
  { department: "PHIL", number: "251", name: "Philosophy of Religion", credits: 3 },
  { department: "RELS", number: "200", name: "Introduction to World Religions", credits: 3 },
  { department: "CLAS", number: "221", name: "Ancient Mediterranean Civilizations", credits: 3 },
  { department: "WGST", number: "200", name: "Introduction to Women's and Gender Studies", credits: 3 },
  // Science Electives
  { department: "BIOL", number: "101", name: "Contemporary Biology", credits: 4 },
  { department: "BIOL", number: "107", name: "Zoology", credits: 4 },
  { department: "BIOL", number: "111", name: "Introductory Biology I", credits: 4 },
  { department: "BIOL", number: "112", name: "Introductory Biology II", credits: 4 },
  { department: "GEOL", number: "101", name: "Principles of Geology", credits: 3 },
  { department: "GEOL", number: "102", name: "Historical Geology", credits: 3 },
  { department: "GEOL", number: "106", name: "Geology of National Parks", credits: 3 },
  { department: "GEOS", number: "210", name: "Earth System Dynamics", credits: 4 },
  { department: "ASTR", number: "314", name: "Introductory Astronomy", credits: 3 },
  { department: "ATMO", number: "201", name: "Weather and Climate", credits: 3 },
  { department: "ATMO", number: "202", name: "Severe and Unusual Weather", credits: 4 },
  { department: "BESC", number: "201", name: "Biomedical Science and Human Biology", credits: 4 },
  { department: "BESC", number: "204", name: "Nutrition", credits: 3 },
  { department: "ECCB", number: "205", name: "Ecology and Conservation Biology", credits: 4 },
  { department: "ECCB", number: "215", name: "Environmental Biology", credits: 4 },
  { department: "GEOG", number: "203", name: "Planet Earth", credits: 3 },
  { department: "GEOG", number: "213", name: "Physical Geography", credits: 3 },
  { department: "HORT", number: "201", name: "Introductory Horticulture", credits: 3 },
  { department: "HORT", number: "202", name: "Landscape Plants", credits: 3 },
  { department: "MARS", number: "102", name: "Introduction to Marine Science", credits: 3 },
  { department: "OCNG", number: "251", name: "Introduction to Oceanography", credits: 3 },
  { department: "OCNG", number: "252", name: "Advanced Introduction to Oceanography", credits: 3 },
];

// ============================================================
// Types
// ============================================================

interface AnexRecord {
  dept: string;
  number: string;
  section: string;
  A: string;
  B: string;
  C: string;
  D: string;
  F: string;
  I: string;
  S: string;
  U: string;
  Q: string;
  X: string;
  prof: string;
  year: string;
  semester: string;
  gpa: string;
}

interface RMPTeacher {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  avgRatingRounded: number;
  avgDifficultyRounded: number;
  numRatings: number;
  wouldTakeAgainPercentRounded: number;
  legacyId: number;
  teacherRatingTags: { tagName: string; tagCount: number }[];
}

interface AggregatedGrade {
  dept: string;
  number: string;
  profName: string;
  semester: string;
  a: number;
  b: number;
  c: number;
  d: number;
  f: number;
  q: number;
  totalGraded: number;
  totalEnrollment: number;
  avgGpa: number;
}

// ============================================================
// Utilities
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatSemester(semester: string, year: string): string {
  const map: Record<string, string> = {
    SPRING: "Spring",
    FALL: "Fall",
    SUMMER: "Summer",
  };
  return `${map[semester] || semester} ${year}`;
}

// ============================================================
// Anex Scraper
// ============================================================

async function fetchAnex(dept: string, num: string): Promise<AnexRecord[]> {
  const body = new URLSearchParams({ dept, number: num });
  const res = await fetch(ANEX_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return data.classes || [];
  } catch {
    return [];
  }
}

async function scrapeAllAnex(): Promise<AnexRecord[]> {
  const allRecords: AnexRecord[] = [];

  for (const num of CSCE_COURSES) {
    const records = await fetchAnex("CSCE", num);
    allRecords.push(...records);
    const profCount = new Set(records.map((r) => r.prof)).size;
    console.log(
      `  CSCE ${num}: ${records.length} sections, ${profCount} professors`
    );
    await sleep(100);
  }

  return allRecords;
}

// ============================================================
// RMP Scraper
// ============================================================

async function fetchAllRMPTeachers(): Promise<RMPTeacher[]> {
  const teachers: RMPTeacher[] = [];
  let cursor: string | null = null;
  let hasNext = true;
  let page = 0;

  while (hasNext) {
    page++;
    const afterClause: string = cursor ? `after: "${cursor}"` : "";

    const query: string = `
      query {
        newSearch {
          teachers(
            query: { text: "", schoolID: "${TAMU_SCHOOL_ID}", departmentID: "${CS_DEPT_ID}" }
            first: 20
            ${afterClause}
          ) {
            resultCount
            pageInfo { hasNextPage endCursor }
            edges {
              node {
                id firstName lastName department
                avgRatingRounded avgDifficultyRounded numRatings
                wouldTakeAgainPercentRounded legacyId
                teacherRatingTags { tagName tagCount }
              }
            }
          }
        }
      }
    `;

    const res: Response = await fetch(RMP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: RMP_AUTH,
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ query }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const connection: any = data?.data?.newSearch?.teachers;

    if (!connection) {
      console.error("  RMP query failed:", JSON.stringify(data?.errors));
      break;
    }

    for (const edge of connection.edges) {
      teachers.push(edge.node);
    }

    hasNext = connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;

    console.log(
      `  Page ${page}: +${connection.edges.length} teachers (total: ${teachers.length})`
    );
    await sleep(200);
  }

  return teachers;
}

// ============================================================
// Professor Matching
// ============================================================

function parseAnexName(anexName: string): {
  lastName: string;
  firstInitial: string;
} | null {
  const parts = anexName.trim().split(/\s+/);
  if (parts.length < 2) return null;
  // Format: "DAUGHERITY W" → lastName=DAUGHERITY, firstInitial=W
  // Handle multi-word last names: take last token as initial, rest as last name
  const firstInitial = parts[parts.length - 1][0].toUpperCase();
  const lastName = parts
    .slice(0, -1)
    .join(" ")
    .toUpperCase();
  return { lastName, firstInitial };
}

function matchProfessor(
  anexName: string,
  rmpTeachers: RMPTeacher[]
): RMPTeacher | null {
  const parsed = parseAnexName(anexName);
  if (!parsed) return null;

  return (
    rmpTeachers.find(
      (t) =>
        t.lastName.toUpperCase() === parsed.lastName &&
        t.firstName[0]?.toUpperCase() === parsed.firstInitial
    ) || null
  );
}

// ============================================================
// Data Aggregation
// ============================================================

function aggregateGrades(records: AnexRecord[]): AggregatedGrade[] {
  // Group by (dept, number, prof, semester+year)
  const groups = new Map<string, AnexRecord[]>();

  for (const r of records) {
    if (!r.prof) continue;
    const key = `${r.dept}|${r.number}|${r.prof}|${r.semester} ${r.year}`;
    const group = groups.get(key) || [];
    group.push(r);
    groups.set(key, group);
  }

  const aggregated: AggregatedGrade[] = [];

  for (const [, group] of groups) {
    const first = group[0];
    let a = 0,
      b = 0,
      c = 0,
      d = 0,
      f = 0,
      q = 0,
      i = 0,
      s = 0,
      u = 0,
      x = 0;

    for (const r of group) {
      a += parseInt(r.A) || 0;
      b += parseInt(r.B) || 0;
      c += parseInt(r.C) || 0;
      d += parseInt(r.D) || 0;
      f += parseInt(r.F) || 0;
      q += parseInt(r.Q) || 0;
      i += parseInt(r.I) || 0;
      s += parseInt(r.S) || 0;
      u += parseInt(r.U) || 0;
      x += parseInt(r.X) || 0;
    }

    const totalGraded = a + b + c + d + f;
    const totalEnrollment = totalGraded + q + i + s + u + x;

    if (totalGraded === 0) continue;

    const avgGpa = (4 * a + 3 * b + 2 * c + 1 * d + 0 * f) / totalGraded;

    aggregated.push({
      dept: first.dept,
      number: first.number,
      profName: first.prof,
      semester: formatSemester(first.semester, first.year),
      a,
      b,
      c,
      d,
      f,
      q,
      totalGraded,
      totalEnrollment,
      avgGpa,
    });
  }

  return aggregated;
}

// ============================================================
// Database Operations
// ============================================================

async function clearTables(): Promise<void> {
  // Delete in order respecting foreign keys
  const tables = [
    "grade_distributions",
    "sections",
    "professors",
    "courses",
    "degree_plans",
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.error(`  Warning: could not clear ${table}: ${error.message}`);
    } else {
      console.log(`  Cleared ${table}`);
    }
  }
}

async function insertCourses(
  courseNumbers: Set<string>
): Promise<Map<string, string>> {
  const rows: {
    department: string;
    number: string;
    name: string;
    credits: number;
    description: string;
    prereqs: string[][];
    coreqs: string[];
    semesters_offered: string[];
  }[] = [];

  for (const num of courseNumbers) {
    const meta = COURSE_META[num];
    rows.push({
      department: "CSCE",
      number: num,
      name: meta?.name || `CSCE ${num}`,
      credits: meta?.credits || 3,
      description: meta?.description || "",
      prereqs: meta?.prereqs || [],
      coreqs: meta?.coreqs || [],
      semesters_offered: meta?.semesters_offered || ["Fall", "Spring"],
    });
  }

  const { data, error } = await supabase
    .from("courses")
    .upsert(rows, { onConflict: "department,number" })
    .select();

  if (error) {
    console.error("  Failed to insert courses:", error.message);
    return new Map();
  }

  // Build lookup: "CSCE 121" → uuid
  const lookup = new Map<string, string>();
  for (const row of data || []) {
    lookup.set(`${row.department} ${row.number}`, row.id);
  }

  return lookup;
}

async function insertNonCsceCourses(): Promise<number> {
  const rows = NON_CSCE_COURSES.map((c) => ({
    department: c.department,
    number: c.number,
    name: c.name,
    credits: c.credits,
    description: "",
    prereqs: [] as string[][],
    coreqs: [] as string[],
    semesters_offered: ["Fall", "Spring"],
  }));

  const { data, error } = await supabase
    .from("courses")
    .upsert(rows, { onConflict: "department,number" })
    .select();

  if (error) {
    console.error("  Failed to insert non-CSCE courses:", error.message);
    return 0;
  }

  return data?.length || 0;
}

async function insertProfessors(
  anexProfNames: Set<string>,
  rmpTeachers: RMPTeacher[]
): Promise<Map<string, string>> {
  const rows: {
    name: string;
    department: string;
    rmp_id: string | null;
    rmp_rating: number | null;
    rmp_difficulty: number | null;
    rmp_would_take_again: number | null;
    rmp_tags: string[];
  }[] = [];
  let matched = 0;

  for (const anexName of anexProfNames) {
    const rmp = matchProfessor(anexName, rmpTeachers);
    const parsed = parseAnexName(anexName);
    if (!parsed) continue;

    // Build display name
    let displayName: string;
    if (rmp) {
      displayName = `${rmp.lastName}, ${rmp.firstName}`;
      matched++;
    } else {
      // Best effort from Anex format: "DAUGHERITY W" → "Daugherity, W."
      const last =
        parsed.lastName.charAt(0) +
        parsed.lastName.slice(1).toLowerCase();
      displayName = `${last}, ${parsed.firstInitial}.`;
    }

    const topTags = rmp?.teacherRatingTags
      ?.sort((a, b) => b.tagCount - a.tagCount)
      .slice(0, 5)
      .map((t) => t.tagName) || [];

    rows.push({
      name: displayName,
      department: "CSCE",
      rmp_id: rmp?.legacyId?.toString() || null,
      rmp_rating: rmp?.avgRatingRounded || null,
      rmp_difficulty: rmp?.avgDifficultyRounded || null,
      rmp_would_take_again: rmp?.wouldTakeAgainPercentRounded ?? null,
      rmp_tags: topTags,
    });
  }

  console.log(
    `  ${matched}/${anexProfNames.size} professors matched to RMP profiles`
  );

  // Insert in batches
  const lookup = new Map<string, string>();
  const BATCH_SIZE = 50;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("professors")
      .insert(batch)
      .select();

    if (error) {
      console.error(
        `  Failed to insert professors batch ${i / BATCH_SIZE + 1}:`,
        error.message
      );
      continue;
    }

    for (const row of data || []) {
      lookup.set(row.name, row.id);
    }
  }

  return lookup;
}

function findProfId(
  anexName: string,
  rmpTeachers: RMPTeacher[],
  profLookup: Map<string, string>
): string | null {
  const rmp = matchProfessor(anexName, rmpTeachers);
  const parsed = parseAnexName(anexName);
  if (!parsed) return null;

  // Try RMP-matched name first
  if (rmp) {
    const rmpDisplayName = `${rmp.lastName}, ${rmp.firstName}`;
    const id = profLookup.get(rmpDisplayName);
    if (id) return id;
  }

  // Fallback to Anex-derived name
  const last =
    parsed.lastName.charAt(0) +
    parsed.lastName.slice(1).toLowerCase();
  const fallbackName = `${last}, ${parsed.firstInitial}.`;
  return profLookup.get(fallbackName) || null;
}

async function insertGradeDistributions(
  aggregated: AggregatedGrade[],
  courseLookup: Map<string, string>,
  profLookup: Map<string, string>,
  rmpTeachers: RMPTeacher[]
): Promise<number> {
  const rows: {
    course_id: string;
    professor_id: string | null;
    semester: string;
    a_pct: number;
    b_pct: number;
    c_pct: number;
    d_pct: number;
    f_pct: number;
    q_pct: number;
    avg_gpa: number;
    enrollment: number;
  }[] = [];

  for (const g of aggregated) {
    const courseKey = `${g.dept} ${g.number}`;
    const courseId = courseLookup.get(courseKey);
    const profId = findProfId(g.profName, rmpTeachers, profLookup);

    if (!courseId) continue;

    rows.push({
      course_id: courseId,
      professor_id: profId,
      semester: g.semester,
      a_pct: g.totalGraded > 0 ? g.a / g.totalGraded : 0,
      b_pct: g.totalGraded > 0 ? g.b / g.totalGraded : 0,
      c_pct: g.totalGraded > 0 ? g.c / g.totalGraded : 0,
      d_pct: g.totalGraded > 0 ? g.d / g.totalGraded : 0,
      f_pct: g.totalGraded > 0 ? g.f / g.totalGraded : 0,
      q_pct:
        g.totalEnrollment > 0 ? g.q / g.totalEnrollment : 0,
      avg_gpa: Math.round(g.avgGpa * 1000) / 1000,
      enrollment: g.totalEnrollment,
    });
  }

  // Insert in batches
  let inserted = 0;
  const BATCH_SIZE = 200;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error, count } = await supabase
      .from("grade_distributions")
      .insert(batch);

    if (error) {
      console.error(
        `  Failed to insert grades batch ${i / BATCH_SIZE + 1}:`,
        error.message
      );
    } else {
      inserted += batch.length;
    }
  }

  return inserted;
}

async function insertDegreePlan(): Promise<void> {
  // Track course lists (from CSCE department elective listing, 2025-2026 catalog)
  const TRACK_THEORY = ["CSCE 433", "CSCE 440", "CSCE 442"];
  const TRACK_SYSTEMS = [
    "CSCE 410", "CSCE 412", "CSCE 416", "CSCE 426", "CSCE 456",
    "CSCE 461", "CSCE 462", "CSCE 463", "CSCE 464", "CSCE 465", "CSCE 469",
  ];
  const TRACK_SOFTWARE = [
    "CSCE 413", "CSCE 429", "CSCE 430", "CSCE 431", "CSCE 434",
    "CSCE 435", "CSCE 438", "CSCE 451",
  ];
  const TRACK_IIS = [
    "CSCE 305", "CSCE 310", "CSCE 320", "CSCE 420", "CSCE 421",
    "CSCE 432", "CSCE 436", "CSCE 439", "CSCE 441", "CSCE 443",
    "CSCE 444", "CSCE 445", "CSCE 446", "CSCE 447", "CSCE 448",
    "CSCE 449", "CSCE 450", "CSCE 452", "CSCE 470",
  ];
  const UNTRACKED = ["CSCE 402", "CSCE 477"];
  const ALL_TRACKED = [...TRACK_THEORY, ...TRACK_SYSTEMS, ...TRACK_SOFTWARE, ...TRACK_IIS];
  const ALL_ELECTIVE = [...ALL_TRACKED, ...UNTRACKED];

  const requirements = [
    // === CS MAJOR COURSEWORK ===
    // 1. CS Core (33 credits, all required — includes CSCE 411 per 2025-2026 catalog)
    {
      type: "core",
      category: "CS Core",
      courses: ["CSCE 120", "CSCE 181", "CSCE 221", "CSCE 222", "CSCE 312", "CSCE 313", "CSCE 314", "CSCE 331", "CSCE 411", "CSCE 481", "CSCE 482"],
      credits_needed: 33,
      equivalents: { "CSCE 120": ["CSCE 121"], "CSCE 222": ["ECEN 222"], "CSCE 331": ["CSCE 315"] },
      credits_map: { "CSCE 120": 3, "CSCE 121": 4, "CSCE 181": 1, "CSCE 221": 4, "CSCE 222": 3, "CSCE 312": 4, "CSCE 313": 4, "CSCE 314": 3, "CSCE 331": 4, "CSCE 315": 3, "CSCE 411": 3, "CSCE 481": 1, "CSCE 482": 3 },
      selection_rule: "all",
    },
    // 2. Systems Directed Elective (pick 3cr)
    {
      type: "elective",
      category: "Systems Directed Elective",
      track: "Systems",
      courses: TRACK_SYSTEMS,
      credits_needed: 3,
      selection_rule: "pick",
    },
    // 3. Software Directed Elective (pick 3cr)
    {
      type: "elective",
      category: "Software Directed Elective",
      track: "Software",
      courses: TRACK_SOFTWARE,
      credits_needed: 3,
      selection_rule: "pick",
    },
    // 4. Info & Intelligent Systems Directed Elective (pick 3cr)
    {
      type: "elective",
      category: "Intelligence Directed Elective",
      track: "Info & Intelligent Systems",
      courses: TRACK_IIS,
      credits_needed: 3,
      selection_rule: "pick",
    },
    // 5. CSCE Tracked Electives (pick 6cr from any track)
    {
      type: "elective",
      category: "CSCE Tracked Electives",
      track: "Tracked",
      courses: ALL_TRACKED,
      credits_needed: 6,
      selection_rule: "pick",
    },
    // 6. CSCE Elective (pick 3cr from any CSCE elective)
    {
      type: "elective",
      category: "CSCE Elective",
      track: "Any CSCE",
      courses: ALL_ELECTIVE,
      credits_needed: 3,
      selection_rule: "pick",
    },

    // === MATHEMATICS ===
    // 7. Calculus (MATH 151 + MATH 152, 8cr)
    {
      type: "math",
      category: "Mathematics",
      courses: ["MATH 151", "MATH 152"],
      credits_needed: 8,
      credits_map: { "MATH 151": 4, "MATH 152": 4 },
      selection_rule: "all",
    },
    // 8. Linear Algebra (MATH 304, 3cr)
    {
      type: "math",
      category: "MATH 304",
      courses: ["MATH 304"],
      credits_needed: 3,
      selection_rule: "all",
    },
    // 9. Math/Stat Elective (pick 3cr)
    {
      type: "math",
      category: "Math/Stat Elective",
      courses: ["MATH 251", "MATH 308", "STAT 212"],
      credits_needed: 3,
      selection_rule: "pick",
    },
    // 10. Statistics (STAT 211, 3cr)
    {
      type: "math",
      category: "Statistics",
      courses: ["STAT 211"],
      credits_needed: 3,
      selection_rule: "all",
    },

    // === SCIENCE ===
    // 11. Required Science (CHEM 119 (4cr) or CHEM 107+117 (3+1cr), plus PHYS 206 (3cr) = 7cr)
    {
      type: "science",
      category: "Required Science",
      courses: ["CHEM 119", "CHEM 107", "CHEM 117", "PHYS 206"],
      credits_needed: 7,
      credits_map: { "CHEM 119": 4, "CHEM 107": 3, "CHEM 117": 1, "PHYS 206": 3 },
      selection_rule: "pick",
    },
    // 12. Science Electives (pick 7cr from approved list)
    {
      type: "science",
      category: "Science Electives",
      courses: [
        "PHYS 207", "PHYS 227", "CHEM 120",
        "BIOL 101", "BIOL 107", "BIOL 111", "BIOL 112",
        "GEOL 101", "GEOL 102", "GEOL 106", "GEOS 210",
        "ASTR 314", "ATMO 201", "ATMO 202",
        "BESC 201", "BESC 204", "ECCB 205", "ECCB 215",
        "GEOG 203", "GEOG 213", "HORT 201", "HORT 202",
        "MARS 102", "OCNG 251", "OCNG 252",
      ],
      credits_needed: 7,
      credits_map: { "CHEM 120": 4, "PHYS 207": 3, "BIOL 101": 4, "BIOL 107": 4, "BIOL 111": 4, "BIOL 112": 4, "ATMO 202": 4 },
      selection_rule: "pick",
    },

    // === ENGLISH & COMMUNICATIONS ===
    // 13. English (pick 3cr)
    {
      type: "core",
      category: "English",
      courses: ["ENGL 103", "ENGL 104"],
      credits_needed: 3,
      selection_rule: "pick",
    },
    // 14. Communications (pick 3cr)
    {
      type: "core",
      category: "Communications",
      courses: ["COMM 203", "COMM 205", "ENGL 210"],
      credits_needed: 3,
      selection_rule: "pick",
    },

    // === ENGINEERING FOUNDATIONS ===
    // 15. Engineering Lab & Physics Lab (4cr total)
    {
      type: "core",
      category: "Engineering Foundations",
      courses: ["ENGR 102", "PHYS 216"],
      credits_needed: 4,
      equivalents: { "PHYS 216": ["ENGR 216"] },
      credits_map: { "ENGR 102": 2, "PHYS 216": 2, "ENGR 216": 2 },
      selection_rule: "all",
    },

    // === UNIVERSITY CORE CURRICULUM (21cr total) ===
    // 16. American History (6cr)
    {
      type: "core",
      category: "American History",
      courses: ["HIST 105", "HIST 106"],
      credits_needed: 6,
      selection_rule: "all",
    },
    // 17. Government/Political Science (6cr)
    {
      type: "core",
      category: "Government",
      courses: ["POLS 206", "POLS 207"],
      credits_needed: 6,
      selection_rule: "all",
    },
    // 18. Creative Arts (3cr)
    {
      type: "core",
      category: "Creative Arts",
      courses: [
        "ARTS 103", "ARTS 149", "ARTS 150",
        "MUSC 200", "THAR 201", "FILM 251", "ENDS 101",
        "DCED 120", "PERF 201",
      ],
      credits_needed: 3,
      selection_rule: "pick",
    },
    // 19. Social & Behavioral Sciences (3cr)
    {
      type: "core",
      category: "Social & Behavioral Sciences",
      courses: [
        "PSYC 107", "SOCI 205", "ECON 202", "ECON 203",
        "ANTH 105", "GEOG 201", "SOCI 207",
      ],
      credits_needed: 3,
      selection_rule: "pick",
    },
    // 20. Language, Philosophy & Culture (3cr)
    {
      type: "core",
      category: "Language, Philosophy & Culture",
      courses: [
        "PHIL 240", "PHIL 251", "RELS 200", "CLAS 221",
        "WGST 200", "PHIL 101", "PHIL 203",
      ],
      credits_needed: 3,
      selection_rule: "pick",
    },

    // === EMPHASIS AREA (minor/concentration, 12cr) ===
    // 21. Emphasis Area — courses depend on student's chosen concentration
    {
      type: "elective",
      category: "Emphasis Area",
      courses: [],
      credits_needed: 12,
      selection_rule: "pick",
    },

    // === GENERAL ELECTIVE (1cr) ===
    // 22. General Elective
    {
      type: "elective",
      category: "General Elective",
      courses: [],
      credits_needed: 1,
      selection_rule: "pick",
    },
  ];

  const { error } = await supabase.from("degree_plans").upsert(
    {
      major: "CS",
      catalog_year: "2025-2026",
      requirements,
    },
    { onConflict: "major,catalog_year" }
  );

  if (error) {
    console.error("  Failed to insert degree plan:", error.message);
  }
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  console.log("=== Sift Data Scraper ===\n");

  // 1. Scrape Anex
  console.log("[1/6] Scraping Anex grade distributions...");
  const anexRecords = await scrapeAllAnex();
  console.log(`  Total: ${anexRecords.length} section records\n`);

  // 2. Scrape RMP
  console.log("[2/6] Scraping Rate My Professors...");
  const rmpTeachers = await fetchAllRMPTeachers();
  console.log(`  Total: ${rmpTeachers.length} CS professors\n`);

  // 3. Aggregate grade data
  console.log("[3/6] Aggregating grade distributions...");
  const aggregated = aggregateGrades(anexRecords);
  const courseNumbers = new Set(anexRecords.map((r) => r.number));
  const profNames = new Set(
    anexRecords.map((r) => r.prof).filter(Boolean)
  );
  console.log(
    `  ${aggregated.length} unique (course, professor, semester) combos`
  );
  console.log(`  ${courseNumbers.size} courses, ${profNames.size} professors\n`);

  // 4. Clear existing data
  console.log("[4/6] Clearing existing data...");
  await clearTables();
  console.log();

  // 5. Insert into Supabase
  console.log("[5/7] Inserting data into Supabase...");

  console.log("  Inserting CSCE courses...");
  const courseLookup = await insertCourses(courseNumbers);
  console.log(`  Inserted ${courseLookup.size} CSCE courses`);

  console.log("  Inserting non-CSCE degree plan courses...");
  const nonCsceCount = await insertNonCsceCourses();
  console.log(`  Inserted ${nonCsceCount} non-CSCE courses`);

  console.log("  Inserting professors...");
  const profLookup = await insertProfessors(profNames, rmpTeachers);
  console.log(`  Inserted ${profLookup.size} professors`);

  console.log("  Inserting grade distributions...");
  const gradeCount = await insertGradeDistributions(
    aggregated,
    courseLookup,
    profLookup,
    rmpTeachers
  );
  console.log(`  Inserted ${gradeCount} grade distributions`);
  console.log();

  // 6. Insert degree plan
  console.log("[6/7] Inserting degree plan...");
  await insertDegreePlan();
  console.log("  Inserted CS degree plan\n");

  // Summary
  console.log("=== Done ===");
  console.log(`  CSCE courses: ${courseLookup.size}`);
  console.log(`  Non-CSCE courses: ${nonCsceCount}`);
  console.log(`  Professors: ${profLookup.size}`);
  console.log(`  Grade distributions: ${gradeCount}`);
  console.log(`  Degree plans: 1`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
