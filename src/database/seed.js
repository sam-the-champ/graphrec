import bcrypt from 'bcryptjs';
import { closeDriver, verifyConnectivity } from './driver.js';
import { withSession } from './session.js';

const now = new Date().toISOString();
const SEED_PASSWORD = 'Password123!';

/*
|--------------------------------------------------------------------------
| TOPICS
|--------------------------------------------------------------------------
*/

const topics = [
  { id: 'topic-javascript', name: 'JavaScript', slug: 'javascript' },
  { id: 'topic-react', name: 'React', slug: 'react' },
  { id: 'topic-typescript', name: 'TypeScript', slug: 'typescript' },
  { id: 'topic-nodejs', name: 'Node.js', slug: 'nodejs' },
  { id: 'topic-express', name: 'Express.js', slug: 'express' },
  { id: 'topic-nextjs', name: 'Next.js', slug: 'nextjs' },
  { id: 'topic-postgresql', name: 'PostgreSQL', slug: 'postgresql' },
  { id: 'topic-mongodb', name: 'MongoDB', slug: 'mongodb' },
  { id: 'topic-redis', name: 'Redis', slug: 'redis' },
  { id: 'topic-docker', name: 'Docker', slug: 'docker' },
  { id: 'topic-aws', name: 'AWS', slug: 'aws' },
  { id: 'topic-git', name: 'Git', slug: 'git' },
  { id: 'topic-testing', name: 'Testing', slug: 'testing' },
  { id: 'topic-system-design', name: 'System Design', slug: 'system-design' },
  { id: 'topic-security', name: 'Application Security', slug: 'security' },
  { id: 'topic-graphql', name: 'GraphQL', slug: 'graphql' },
  { id: 'topic-graph-databases', name: 'Graph Databases', slug: 'graph-databases' },
  { id: 'topic-cicd', name: 'CI/CD', slug: 'cicd' },
  { id: 'topic-kubernetes', name: 'Kubernetes', slug: 'kubernetes' },
  { id: 'topic-web-performance', name: 'Web Performance', slug: 'web-performance' },
];

/*
|--------------------------------------------------------------------------
| TOPIC RELATIONSHIPS
|--------------------------------------------------------------------------
*/

const topicRelations = [
  ['topic-javascript', 'topic-typescript'],
  ['topic-javascript', 'topic-react'],
  ['topic-javascript', 'topic-nodejs'],
  ['topic-javascript', 'topic-testing'],

  ['topic-react', 'topic-nextjs'],
  ['topic-react', 'topic-typescript'],
  ['topic-react', 'topic-web-performance'],

  ['topic-typescript', 'topic-nodejs'],
  ['topic-typescript', 'topic-nextjs'],
  ['topic-typescript', 'topic-testing'],

  ['topic-nodejs', 'topic-express'],
  ['topic-nodejs', 'topic-redis'],
  ['topic-nodejs', 'topic-postgresql'],
  ['topic-nodejs', 'topic-mongodb'],
  ['topic-nodejs', 'topic-graphql'],
  ['topic-nodejs', 'topic-docker'],
  ['topic-nodejs', 'topic-security'],

  ['topic-express', 'topic-security'],
  ['topic-express', 'topic-postgresql'],
  ['topic-express', 'topic-mongodb'],

  ['topic-nextjs', 'topic-web-performance'],
  ['topic-nextjs', 'topic-aws'],

  ['topic-postgresql', 'topic-redis'],
  ['topic-postgresql', 'topic-system-design'],
  ['topic-postgresql', 'topic-security'],

  ['topic-mongodb', 'topic-redis'],
  ['topic-mongodb', 'topic-system-design'],

  ['topic-docker', 'topic-aws'],
  ['topic-docker', 'topic-kubernetes'],
  ['topic-docker', 'topic-cicd'],

  ['topic-aws', 'topic-kubernetes'],
  ['topic-aws', 'topic-cicd'],
  ['topic-aws', 'topic-security'],
  ['topic-aws', 'topic-system-design'],

  ['topic-git', 'topic-cicd'],
  ['topic-git', 'topic-testing'],

  ['topic-testing', 'topic-cicd'],
  ['topic-testing', 'topic-security'],

  ['topic-system-design', 'topic-redis'],
  ['topic-system-design', 'topic-graph-databases'],

  ['topic-security', 'topic-graphql'],
  ['topic-security', 'topic-web-performance'],

  ['topic-graphql', 'topic-graph-databases'],

  ['topic-kubernetes', 'topic-cicd'],
  ['topic-kubernetes', 'topic-system-design'],
];

/*
|--------------------------------------------------------------------------
| SKILLS
|--------------------------------------------------------------------------
*/

const skills = [
  {
    id: 'skill-js-fundamentals',
    name: 'JavaScript Fundamentals',
    slug: 'js-fundamentals',
  },
  {
    id: 'skill-js-async',
    name: 'Asynchronous JavaScript',
    slug: 'js-async',
  },
  {
    id: 'skill-js-dom',
    name: 'DOM Manipulation',
    slug: 'js-dom',
  },
  {
    id: 'skill-js-modules',
    name: 'JavaScript Modules',
    slug: 'js-modules',
  },
  {
    id: 'skill-js-performance',
    name: 'JavaScript Performance',
    slug: 'js-performance',
  },
  {
    id: 'skill-react-components',
    name: 'React Components',
    slug: 'react-components',
  },
  {
    id: 'skill-react-hooks',
    name: 'React Hooks',
    slug: 'react-hooks',
  },
  {
    id: 'skill-react-state',
    name: 'React State Management',
    slug: 'react-state',
  },
  {
    id: 'skill-react-performance',
    name: 'React Performance',
    slug: 'react-performance',
  },
  {
    id: 'skill-typescript-basics',
    name: 'TypeScript Basics',
    slug: 'typescript-basics',
  },
  {
    id: 'skill-typescript-generics',
    name: 'TypeScript Generics',
    slug: 'typescript-generics',
  },
  {
    id: 'skill-type-safety',
    name: 'Type Safety',
    slug: 'type-safety',
  },
  {
    id: 'skill-node-fundamentals',
    name: 'Node.js Fundamentals',
    slug: 'node-fundamentals',
  },
  {
    id: 'skill-rest-apis',
    name: 'Building REST APIs',
    slug: 'rest-apis',
  },
  {
    id: 'skill-api-auth',
    name: 'API Authentication',
    slug: 'api-auth',
  },
  {
    id: 'skill-express',
    name: 'Express.js Development',
    slug: 'express-development',
  },
  {
    id: 'skill-nextjs-routing',
    name: 'Next.js Routing',
    slug: 'nextjs-routing',
  },
  {
    id: 'skill-ssr',
    name: 'Server-Side Rendering',
    slug: 'ssr',
  },
  {
    id: 'skill-sql',
    name: 'SQL Querying',
    slug: 'sql',
  },
  {
    id: 'skill-database-design',
    name: 'Database Design',
    slug: 'database-design',
  },
  {
    id: 'skill-indexing',
    name: 'Database Indexing',
    slug: 'indexing',
  },
  {
    id: 'skill-mongodb',
    name: 'MongoDB Development',
    slug: 'mongodb',
  },
  {
    id: 'skill-redis',
    name: 'Redis Caching',
    slug: 'redis',
  },
  {
    id: 'skill-containerization',
    name: 'Containerization',
    slug: 'containerization',
  },
  {
    id: 'skill-cloud-deploy',
    name: 'Cloud Deployment',
    slug: 'cloud-deploy',
  },
  {
    id: 'skill-git',
    name: 'Git Version Control',
    slug: 'git',
  },
  {
    id: 'skill-testing',
    name: 'Automated Testing',
    slug: 'testing',
  },
  {
    id: 'skill-system-design',
    name: 'System Design',
    slug: 'system-design',
  },
  {
    id: 'skill-security',
    name: 'Application Security',
    slug: 'security',
  },
  {
    id: 'skill-graphql',
    name: 'GraphQL APIs',
    slug: 'graphql',
  },
];

/*
|--------------------------------------------------------------------------
| SKILL RELATIONSHIPS
|--------------------------------------------------------------------------
*/

const skillRelations = [
  ['skill-js-fundamentals', 'skill-js-async'],
  ['skill-js-fundamentals', 'skill-js-dom'],
  ['skill-js-fundamentals', 'skill-js-modules'],
  ['skill-js-async', 'skill-node-fundamentals'],
  ['skill-js-modules', 'skill-typescript-basics'],

  ['skill-react-components', 'skill-react-hooks'],
  ['skill-react-hooks', 'skill-react-state'],
  ['skill-react-state', 'skill-react-performance'],
  ['skill-react-components', 'skill-typescript-basics'],

  ['skill-typescript-basics', 'skill-type-safety'],
  ['skill-typescript-basics', 'skill-typescript-generics'],
  ['skill-typescript-generics', 'skill-type-safety'],

  ['skill-node-fundamentals', 'skill-rest-apis'],
  ['skill-rest-apis', 'skill-api-auth'],
  ['skill-rest-apis', 'skill-express'],
  ['skill-api-auth', 'skill-security'],

  ['skill-nextjs-routing', 'skill-ssr'],
  ['skill-ssr', 'skill-react-performance'],

  ['skill-sql', 'skill-database-design'],
  ['skill-database-design', 'skill-indexing'],
  ['skill-indexing', 'skill-redis'],

  ['skill-mongodb', 'skill-redis'],
  ['skill-containerization', 'skill-cloud-deploy'],

  ['skill-git', 'skill-testing'],
  ['skill-testing', 'skill-security'],

  ['skill-system-design', 'skill-database-design'],
  ['skill-system-design', 'skill-redis'],

  ['skill-security', 'skill-api-auth'],
  ['skill-graphql', 'skill-rest-apis'],
];

/*
|--------------------------------------------------------------------------
| INSTRUCTORS
|--------------------------------------------------------------------------
*/

const instructors = [
  {
    id: 'instructor-ada',
    name: 'Ada Kim',
    bio: 'Full-stack engineer and educator specializing in JavaScript, Node.js and modern web architecture.',
  },
  {
    id: 'instructor-leo',
    name: 'Leo Martins',
    bio: 'Cloud infrastructure specialist and AWS-certified trainer focused on scalable systems.',
  },
  {
    id: 'instructor-priya',
    name: 'Priya Nair',
    bio: 'Frontend architect focused on React, Next.js and design systems.',
  },
  {
    id: 'instructor-daniel',
    name: 'Daniel Brooks',
    bio: 'Backend engineer specializing in Node.js, APIs, databases and distributed systems.',
  },
  {
    id: 'instructor-maya',
    name: 'Maya Chen',
    bio: 'TypeScript engineer and developer educator focused on reliable application architecture.',
  },
  {
    id: 'instructor-james',
    name: 'James Okoro',
    bio: 'DevOps and platform engineer specializing in Docker, Kubernetes and CI/CD.',
  },
  {
    id: 'instructor-sophia',
    name: 'Sophia Williams',
    bio: 'Application security engineer focused on secure APIs, authentication and threat modeling.',
  },
  {
    id: 'instructor-ethan',
    name: 'Ethan Carter',
    bio: 'Database engineer specializing in PostgreSQL, MongoDB, Redis and data-intensive systems.',
  },
  {
    id: 'instructor-nina',
    name: 'Nina Patel',
    bio: 'Software architect teaching system design, scalability and distributed systems.',
  },
  {
    id: 'instructor-victor',
    name: 'Victor Adeyemi',
    bio: 'Graph database engineer focused on knowledge graphs, recommendations and GraphQL.',
  },
];

/*
|--------------------------------------------------------------------------
| COURSES
|--------------------------------------------------------------------------
*/

const courses = [
  {
    id: 'course-modern-javascript',
    title: 'Modern JavaScript Engineering',
    description: 'Master JavaScript fundamentals, asynchronous programming, modules and browser APIs.',
  },
  {
    id: 'course-react-engineering',
    title: 'React Engineering',
    description: 'Build scalable React applications using hooks, state management and performance techniques.',
  },
  {
    id: 'course-typescript',
    title: 'TypeScript for Software Engineers',
    description: 'Build safer applications using TypeScript, generics, advanced types and architectural patterns.',
  },
  {
    id: 'course-node-backend',
    title: 'Node.js Backend Engineering',
    description: 'Build production-ready Node.js and Express APIs with authentication and validation.',
  },
  {
    id: 'course-nextjs',
    title: 'Production Next.js',
    description: 'Build modern full-stack applications using Next.js rendering and routing capabilities.',
  },
  {
    id: 'course-database-engineering',
    title: 'Database Engineering',
    description: 'Learn PostgreSQL, MongoDB, indexing, schema design and database performance.',
  },
  {
    id: 'course-cloud-native',
    title: 'Cloud-Native Engineering',
    description: 'Containers, AWS, Kubernetes and modern cloud deployment practices.',
  },
  {
    id: 'course-devops',
    title: 'DevOps and CI/CD',
    description: 'Automate testing, builds and deployments using Git, containers and CI/CD pipelines.',
  },
  {
    id: 'course-architecture',
    title: 'System Design and Architecture',
    description: 'Learn how to design scalable and reliable software systems.',
  },
  {
    id: 'course-application-security',
    title: 'Application Security',
    description: 'Secure APIs and applications against common web and infrastructure threats.',
  },
  {
    id: 'course-graphql',
    title: 'GraphQL and Graph Data',
    description: 'Build GraphQL APIs and understand graph-oriented application architectures.',
  },
  {
    id: 'course-performance',
    title: 'Web Performance Engineering',
    description: 'Understand and improve frontend and backend application performance.',
  },
];

/*
|--------------------------------------------------------------------------
| 100 TUTORIALS
|
| Format:
| [
|   id,
|   title,
|   description,
|   difficulty,
|   duration,
|   topicIds,
|   skillIds,
|   courseId,
|   instructorId
| ]
|--------------------------------------------------------------------------
*/

const tutorialSpecs = [
  // -----------------------------------------------------------------------
  // JAVASCRIPT — 1-10
  // -----------------------------------------------------------------------

  [
    'tutorial-js-fundamentals',
    'JavaScript Fundamentals',
    'Variables, functions, objects, arrays and modern JavaScript syntax.',
    'beginner',
    45,
    ['topic-javascript'],
    ['skill-js-fundamentals'],
    'course-modern-javascript',
    'instructor-ada',
  ],
  [
    'tutorial-js-functions',
    'Understanding JavaScript Functions',
    'Function declarations, expressions, arrow functions and higher-order functions.',
    'beginner',
    40,
    ['topic-javascript'],
    ['skill-js-fundamentals'],
    'course-modern-javascript',
    'instructor-ada',
  ],
  [
    'tutorial-js-closures',
    'JavaScript Closures Explained',
    'Understand lexical scope, closures and practical closure-based patterns.',
    'intermediate',
    50,
    ['topic-javascript'],
    ['skill-js-fundamentals'],
    'course-modern-javascript',
    'instructor-maya',
  ],
  [
    'tutorial-js-promises',
    'Promises and Async JavaScript',
    'Learn promises, chaining, error handling and asynchronous control flow.',
    'intermediate',
    55,
    ['topic-javascript', 'topic-nodejs'],
    ['skill-js-async'],
    'course-modern-javascript',
    'instructor-ada',
  ],
  [
    'tutorial-js-async-await',
    'Async Await Deep Dive',
    'Build readable asynchronous JavaScript with async and await.',
    'intermediate',
    45,
    ['topic-javascript'],
    ['skill-js-async'],
    'course-modern-javascript',
    'instructor-ada',
  ],
  [
    'tutorial-js-event-loop',
    'Understanding the JavaScript Event Loop',
    'Explore the call stack, task queues, microtasks and event loop.',
    'advanced',
    60,
    ['topic-javascript', 'topic-nodejs'],
    ['skill-js-async'],
    'course-modern-javascript',
    'instructor-daniel',
  ],
  [
    'tutorial-js-dom',
    'DOM Manipulation with JavaScript',
    'Select, create, update and remove DOM elements programmatically.',
    'beginner',
    45,
    ['topic-javascript'],
    ['skill-js-dom'],
    'course-modern-javascript',
    'instructor-ada',
  ],
  [
    'tutorial-js-browser-events',
    'Browser Events and Event Delegation',
    'Handle browser events efficiently using propagation and delegation.',
    'intermediate',
    50,
    ['topic-javascript'],
    ['skill-js-dom'],
    'course-modern-javascript',
    'instructor-priya',
  ],
  [
    'tutorial-js-es-modules',
    'ES Modules Explained',
    'Understand import, export, module boundaries and dependency management.',
    'intermediate',
    45,
    ['topic-javascript'],
    ['skill-js-modules'],
    'course-modern-javascript',
    'instructor-maya',
  ],
  [
    'tutorial-js-performance',
    'JavaScript Performance Optimization',
    'Identify expensive JavaScript operations and improve runtime performance.',
    'advanced',
    65,
    ['topic-javascript', 'topic-web-performance'],
    ['skill-js-performance'],
    'course-performance',
    'instructor-priya',
  ],

  // -----------------------------------------------------------------------
  // REACT — 11-20
  // -----------------------------------------------------------------------

  [
    'tutorial-react-components',
    'Building Reusable React Components',
    'Component composition, props and reusable UI architecture.',
    'beginner',
    50,
    ['topic-react'],
    ['skill-react-components'],
    'course-react-engineering',
    'instructor-priya',
  ],
  [
    'tutorial-react-props',
    'React Props and Component Communication',
    'Pass data between React components and design clean component APIs.',
    'beginner',
    40,
    ['topic-react'],
    ['skill-react-components'],
    'course-react-engineering',
    'instructor-priya',
  ],
  [
    'tutorial-react-hooks',
    'React Hooks Deep Dive',
    'useState, useEffect, useMemo and building custom hooks.',
    'intermediate',
    60,
    ['topic-react'],
    ['skill-react-hooks'],
    'course-react-engineering',
    'instructor-priya',
  ],
  [
    'tutorial-react-custom-hooks',
    'Building Custom React Hooks',
    'Extract reusable application logic into custom hooks.',
    'intermediate',
    55,
    ['topic-react'],
    ['skill-react-hooks'],
    'course-react-engineering',
    'instructor-priya',
  ],
  [
    'tutorial-react-context',
    'React Context API',
    'Manage shared application state using React Context.',
    'intermediate',
    45,
    ['topic-react'],
    ['skill-react-state'],
    'course-react-engineering',
    'instructor-priya',
  ],
  [
    'tutorial-react-state',
    'React State Management Patterns',
    'Understand local state, derived state and application state architecture.',
    'intermediate',
    60,
    ['topic-react'],
    ['skill-react-state'],
    'course-react-engineering',
    'instructor-priya',
  ],
  [
    'tutorial-react-forms',
    'Building Forms in React',
    'Controlled inputs, validation and reusable form components.',
    'intermediate',
    55,
    ['topic-react'],
    ['skill-react-state'],
    'course-react-engineering',
    'instructor-ada',
  ],
  [
    'tutorial-react-performance',
    'React Performance Optimization',
    'Memoization, rendering behavior and component performance optimization.',
    'advanced',
    70,
    ['topic-react', 'topic-web-performance'],
    ['skill-react-performance'],
    'course-performance',
    'instructor-priya',
  ],
  [
    'tutorial-react-rendering',
    'Understanding React Rendering',
    'Learn what causes React components to render and how reconciliation works.',
    'advanced',
    60,
    ['topic-react'],
    ['skill-react-performance'],
    'course-react-engineering',
    'instructor-priya',
  ],
  [
    'tutorial-react-typescript',
    'React with TypeScript',
    'Build type-safe React components and hooks using TypeScript.',
    'intermediate',
    65,
    ['topic-react', 'topic-typescript'],
    ['skill-react-components', 'skill-typescript-basics'],
    'course-typescript',
    'instructor-maya',
  ],

  // -----------------------------------------------------------------------
  // TYPESCRIPT — 21-28
  // -----------------------------------------------------------------------

  [
    'tutorial-typescript-intro',
    'TypeScript for JavaScript Developers',
    'Static typing, interfaces and migrating JavaScript code to TypeScript.',
    'beginner',
    55,
    ['topic-typescript', 'topic-javascript'],
    ['skill-typescript-basics'],
    'course-typescript',
    'instructor-maya',
  ],
  [
    'tutorial-typescript-types',
    'TypeScript Types and Interfaces',
    'Primitive types, interfaces, aliases and structural typing.',
    'beginner',
    50,
    ['topic-typescript'],
    ['skill-typescript-basics'],
    'course-typescript',
    'instructor-maya',
  ],
  [
    'tutorial-typescript-unions',
    'Union and Intersection Types',
    'Model complex application data with union and intersection types.',
    'intermediate',
    50,
    ['topic-typescript'],
    ['skill-type-safety'],
    'course-typescript',
    'instructor-maya',
  ],
  [
    'tutorial-typescript-generics',
    'TypeScript Generics',
    'Create reusable and type-safe functions, classes and components.',
    'intermediate',
    60,
    ['topic-typescript'],
    ['skill-typescript-generics'],
    'course-typescript',
    'instructor-maya',
  ],
  [
    'tutorial-typescript-utility-types',
    'TypeScript Utility Types',
    'Use Partial, Pick, Omit, Record and other utility types.',
    'intermediate',
    55,
    ['topic-typescript'],
    ['skill-type-safety'],
    'course-typescript',
    'instructor-maya',
  ],
  [
    'tutorial-typescript-narrowing',
    'Type Narrowing in TypeScript',
    'Use guards, discriminated unions and control-flow analysis.',
    'advanced',
    55,
    ['topic-typescript'],
    ['skill-type-safety'],
    'course-typescript',
    'instructor-maya',
  ],
  [
    'tutorial-typescript-node',
    'Building a Node.js API with TypeScript',
    'Create a strongly typed Node.js backend using TypeScript.',
    'intermediate',
    70,
    ['topic-typescript', 'topic-nodejs'],
    ['skill-typescript-basics', 'skill-node-fundamentals'],
    'course-node-backend',
    'instructor-daniel',
  ],
  [
    'tutorial-typescript-architecture',
    'Type-Safe Application Architecture',
    'Use TypeScript to enforce boundaries across a larger application.',
    'advanced',
    75,
    ['topic-typescript', 'topic-system-design'],
    ['skill-type-safety', 'skill-system-design'],
    'course-architecture',
    'instructor-maya',
  ],

  // -----------------------------------------------------------------------
  // NODE / EXPRESS — 29-38
  // -----------------------------------------------------------------------

  [
    'tutorial-node-fundamentals',
    'Node.js Fundamentals',
    'Understand Node.js runtime architecture, modules and the event loop.',
    'beginner',
    55,
    ['topic-nodejs'],
    ['skill-node-fundamentals'],
    'course-node-backend',
    'instructor-daniel',
  ],
  [
    'tutorial-node-npm',
    'Node.js Packages and npm',
    'Manage dependencies, package scripts and project configuration.',
    'beginner',
    40,
    ['topic-nodejs'],
    ['skill-node-fundamentals'],
    'course-node-backend',
    'instructor-daniel',
  ],
  [
    'tutorial-node-file-system',
    'Working with the Node.js File System',
    'Read, write and manage files using Node.js APIs.',
    'beginner',
    45,
    ['topic-nodejs'],
    ['skill-node-fundamentals'],
    'course-node-backend',
    'instructor-daniel',
  ],
  [
    'tutorial-node-rest-api',
    'Building REST APIs with Node.js',
    'Build RESTful endpoints, routing, validation and error handling.',
    'intermediate',
    70,
    ['topic-nodejs', 'topic-express'],
    ['skill-rest-apis', 'skill-express'],
    'course-node-backend',
    'instructor-ada',
  ],
  [
    'tutorial-express-routing',
    'Express.js Routing',
    'Design modular Express routes and controllers.',
    'intermediate',
    50,
    ['topic-express'],
    ['skill-express'],
    'course-node-backend',
    'instructor-daniel',
  ],
  [
    'tutorial-express-middleware',
    'Express Middleware Architecture',
    'Build reusable middleware for logging, validation and authentication.',
    'intermediate',
    55,
    ['topic-express'],
    ['skill-express'],
    'course-node-backend',
    'instructor-daniel',
  ],
  [
    'tutorial-node-jwt',
    'JWT Authentication in Node.js',
    'Implement access-token authentication for a Node.js API.',
    'intermediate',
    65,
    ['topic-nodejs', 'topic-security'],
    ['skill-api-auth', 'skill-security'],
    'course-node-backend',
    'instructor-sophia',
  ],
  [
    'tutorial-node-refresh-tokens',
    'Refresh Token Architecture',
    'Design secure access and refresh token flows for APIs.',
    'advanced',
    70,
    ['topic-nodejs', 'topic-security'],
    ['skill-api-auth', 'skill-security'],
    'course-application-security',
    'instructor-sophia',
  ],
  [
    'tutorial-node-error-handling',
    'Production Error Handling in Node.js',
    'Handle operational errors, validation errors and unexpected failures.',
    'advanced',
    60,
    ['topic-nodejs', 'topic-express'],
    ['skill-rest-apis', 'skill-express'],
    'course-node-backend',
    'instructor-daniel',
  ],
  [
    'tutorial-node-background-jobs',
    'Background Jobs with Node.js',
    'Design asynchronous background processing for backend applications.',
    'advanced',
    75,
    ['topic-nodejs', 'topic-redis'],
    ['skill-node-fundamentals', 'skill-redis'],
    'course-node-backend',
    'instructor-daniel',
  ],

  // -----------------------------------------------------------------------
  // NEXT.JS — 39-46
  // -----------------------------------------------------------------------

  [
    'tutorial-nextjs-routing',
    'Next.js App Router',
    'Build applications using layouts, nested routes and route segments.',
    'beginner',
    60,
    ['topic-nextjs'],
    ['skill-nextjs-routing'],
    'course-nextjs',
    'instructor-priya',
  ],
  [
    'tutorial-nextjs-server-components',
    'Next.js Server Components',
    'Understand server components and how they change application architecture.',
    'intermediate',
    65,
    ['topic-nextjs', 'topic-react'],
    ['skill-ssr'],
    'course-nextjs',
    'instructor-priya',
  ],
  [
    'tutorial-nextjs-client-components',
    'Next.js Client Components',
    'Understand when and why to use client components.',
    'intermediate',
    50,
    ['topic-nextjs', 'topic-react'],
    ['skill-nextjs-routing', 'skill-react-components'],
    'course-nextjs',
    'instructor-priya',
  ],
  [
    'tutorial-nextjs-ssr',
    'Server-Side Rendering with Next.js',
    'Explore rendering strategies, data fetching and server-side rendering.',
    'advanced',
    80,
    ['topic-nextjs'],
    ['skill-ssr'],
    'course-nextjs',
    'instructor-priya',
  ],
  [
    'tutorial-nextjs-api',
    'Next.js Route Handlers',
    'Build backend endpoints directly inside a Next.js application.',
    'intermediate',
    60,
    ['topic-nextjs', 'topic-nodejs'],
    ['skill-rest-apis', 'skill-nextjs-routing'],
    'course-nextjs',
    'instructor-ada',
  ],
  [
    'tutorial-nextjs-auth',
    'Authentication in Next.js',
    'Design authentication flows for modern Next.js applications.',
    'advanced',
    75,
    ['topic-nextjs', 'topic-security'],
    ['skill-api-auth', 'skill-security'],
    'course-application-security',
    'instructor-sophia',
  ],
  [
    'tutorial-nextjs-performance',
    'Next.js Performance Optimization',
    'Optimize rendering, loading and asset delivery in Next.js.',
    'advanced',
    70,
    ['topic-nextjs', 'topic-web-performance'],
    ['skill-ssr', 'skill-react-performance'],
    'course-performance',
    'instructor-priya',
  ],
  [
    'tutorial-nextjs-deployment',
    'Deploying Next.js Applications',
    'Prepare and deploy production Next.js applications.',
    'intermediate',
    60,
    ['topic-nextjs', 'topic-aws'],
    ['skill-cloud-deploy', 'skill-nextjs-routing'],
    'course-cloud-native',
    'instructor-leo',
  ],

  // -----------------------------------------------------------------------
  // POSTGRESQL / DATABASES — 47-54
  // -----------------------------------------------------------------------

  [
    'tutorial-postgresql-basics',
    'PostgreSQL Fundamentals',
    'Tables, rows, columns, constraints and relational database concepts.',
    'beginner',
    55,
    ['topic-postgresql'],
    ['skill-sql'],
    'course-database-engineering',
    'instructor-ethan',
  ],
  [
    'tutorial-postgresql-queries',
    'PostgreSQL Querying',
    'SELECT, filtering, joins, aggregation and subqueries.',
    'beginner',
    65,
    ['topic-postgresql'],
    ['skill-sql'],
    'course-database-engineering',
    'instructor-ethan',
  ],
  [
    'tutorial-postgresql-schema-design',
    'PostgreSQL Schema Design',
    'Design normalized schemas for production applications.',
    'intermediate',
    70,
    ['topic-postgresql'],
    ['skill-database-design'],
    'course-database-engineering',
    'instructor-ethan',
  ],
  [
    'tutorial-postgresql-indexes',
    'PostgreSQL Indexing',
    'Understand B-tree indexes, query performance and index trade-offs.',
    'advanced',
    75,
    ['topic-postgresql'],
    ['skill-indexing'],
    'course-database-engineering',
    'instructor-ethan',
  ],
  [
    'tutorial-postgresql-transactions',
    'Database Transactions and ACID',
    'Understand transaction isolation, consistency and atomicity.',
    'advanced',
    70,
    ['topic-postgresql', 'topic-system-design'],
    ['skill-database-design'],
    'course-database-engineering',
    'instructor-ethan',
  ],
  [
    'tutorial-postgresql-performance',
    'PostgreSQL Query Performance',
    'Use query plans and database techniques to improve performance.',
    'advanced',
    80,
    ['topic-postgresql', 'topic-web-performance'],
    ['skill-indexing', 'skill-sql'],
    'course-performance',
    'instructor-ethan',
  ],
  [
    'tutorial-postgresql-node',
    'PostgreSQL with Node.js',
    'Connect Node.js applications to PostgreSQL and execute queries safely.',
    'intermediate',
    65,
    ['topic-postgresql', 'topic-nodejs'],
    ['skill-sql', 'skill-rest-apis'],
    'course-node-backend',
    'instructor-daniel',
  ],
  [
    'tutorial-postgresql-security',
    'Securing PostgreSQL Applications',
    'Prevent injection attacks and protect application database access.',
    'advanced',
    60,
    ['topic-postgresql', 'topic-security'],
    ['skill-security', 'skill-sql'],
    'course-application-security',
    'instructor-sophia',
  ],

  // -----------------------------------------------------------------------
  // MONGODB — 55-59
  // -----------------------------------------------------------------------

  [
    'tutorial-mongodb-basics',
    'MongoDB Fundamentals',
    'Documents, collections and basic MongoDB operations.',
    'beginner',
    50,
    ['topic-mongodb'],
    ['skill-mongodb'],
    'course-database-engineering',
    'instructor-ethan',
  ],
  [
    'tutorial-mongodb-schema',
    'MongoDB Data Modeling',
    'Design document structures and choose embedding versus referencing.',
    'intermediate',
    65,
    ['topic-mongodb'],
    ['skill-mongodb', 'skill-database-design'],
    'course-database-engineering',
    'instructor-ethan',
  ],
  [
    'tutorial-mongodb-indexing',
    'MongoDB Indexing',
    'Create effective indexes and analyze MongoDB query performance.',
    'advanced',
    60,
    ['topic-mongodb'],
    ['skill-mongodb', 'skill-indexing'],
    'course-database-engineering',
    'instructor-ethan',
  ],
  [
    'tutorial-mongodb-node',
    'MongoDB with Node.js',
    'Build Node.js applications backed by MongoDB.',
    'intermediate',
    65,
    ['topic-mongodb', 'topic-nodejs'],
    ['skill-mongodb', 'skill-rest-apis'],
    'course-node-backend',
    'instructor-daniel',
  ],
  [
    'tutorial-mongodb-aggregation',
    'MongoDB Aggregation Pipelines',
    'Transform and analyze document data using aggregation pipelines.',
    'advanced',
    70,
    ['topic-mongodb'],
    ['skill-mongodb'],
    'course-database-engineering',
    'instructor-ethan',
  ],

  // -----------------------------------------------------------------------
  // REDIS — 60-63
  // -----------------------------------------------------------------------

  [
    'tutorial-redis-basics',
    'Redis Fundamentals',
    'Understand Redis data structures and common use cases.',
    'beginner',
    45,
    ['topic-redis'],
    ['skill-redis'],
    'course-database-engineering',
    'instructor-ethan',
  ],
  [
    'tutorial-redis-caching',
    'Application Caching with Redis',
    'Improve application response times using Redis caching.',
    'intermediate',
    60,
    ['topic-redis', 'topic-nodejs'],
    ['skill-redis'],
    'course-node-backend',
    'instructor-daniel',
  ],
  [
    'tutorial-redis-sessions',
    'Redis Session Storage',
    'Store sessions and authentication state using Redis.',
    'intermediate',
    55,
    ['topic-redis', 'topic-security'],
    ['skill-redis', 'skill-api-auth'],
    'course-application-security',
    'instructor-sophia',
  ],
  [
    'tutorial-redis-rate-limiting',
    'Rate Limiting with Redis',
    'Build distributed API rate limiting using Redis.',
    'advanced',
    65,
    ['topic-redis', 'topic-security'],
    ['skill-redis', 'skill-security'],
    'course-application-security',
    'instructor-sophia',
  ],

  // -----------------------------------------------------------------------
  // DOCKER — 64-70
  // -----------------------------------------------------------------------

  [
    'tutorial-docker-basics',
    'Docker Fundamentals',
    'Images, containers, registries and basic Docker workflows.',
    'beginner',
    50,
    ['topic-docker'],
    ['skill-containerization'],
    'course-cloud-native',
    'instructor-james',
  ],
  [
    'tutorial-dockerfile',
    'Writing Production Dockerfiles',
    'Create efficient Dockerfiles for backend applications.',
    'intermediate',
    60,
    ['topic-docker', 'topic-nodejs'],
    ['skill-containerization'],
    'course-cloud-native',
    'instructor-james',
  ],
  [
    'tutorial-docker-compose',
    'Docker Compose for Local Development',
    'Run multi-container development environments with Docker Compose.',
    'intermediate',
    60,
    ['topic-docker'],
    ['skill-containerization'],
    'course-cloud-native',
    'instructor-james',
  ],
  [
    'tutorial-docker-multistage',
    'Multi-Stage Docker Builds',
    'Reduce production image sizes using multi-stage builds.',
    'advanced',
    55,
    ['topic-docker'],
    ['skill-containerization'],
    'course-cloud-native',
    'instructor-james',
  ],
  [
    'tutorial-docker-node',
    'Containerizing Node.js Applications',
    'Package a Node.js application into a production-ready container.',
    'intermediate',
    65,
    ['topic-docker', 'topic-nodejs'],
    ['skill-containerization', 'skill-node-fundamentals'],
    'course-cloud-native',
    'instructor-james',
  ],
  [
    'tutorial-docker-security',
    'Docker Container Security',
    'Reduce container attack surfaces and improve image security.',
    'advanced',
    65,
    ['topic-docker', 'topic-security'],
    ['skill-containerization', 'skill-security'],
    'course-application-security',
    'instructor-sophia',
  ],
  [
    'tutorial-docker-aws',
    'Deploying Docker Containers to AWS',
    'Deploy containerized applications using AWS container services.',
    'advanced',
    75,
    ['topic-docker', 'topic-aws'],
    ['skill-containerization', 'skill-cloud-deploy'],
    'course-cloud-native',
    'instructor-leo',
  ],

  // -----------------------------------------------------------------------
  // AWS — 71-80
  // -----------------------------------------------------------------------

  [
    'tutorial-aws-introduction',
    'AWS Fundamentals',
    'Understand regions, availability zones and core AWS services.',
    'beginner',
    50,
    ['topic-aws'],
    ['skill-cloud-deploy'],
    'course-cloud-native',
    'instructor-leo',
  ],
  [
    'tutorial-aws-ec2',
    'Running Applications on EC2',
    'Deploy and manage applications using Amazon EC2.',
    'intermediate',
    65,
    ['topic-aws'],
    ['skill-cloud-deploy'],
    'course-cloud-native',
    'instructor-leo',
  ],
  [
    'tutorial-aws-s3',
    'Amazon S3 Fundamentals',
    'Store files and application assets using Amazon S3.',
    'beginner',
    50,
    ['topic-aws'],
    ['skill-cloud-deploy'],
    'course-cloud-native',
    'instructor-leo',
  ],
  [
    'tutorial-aws-vpc',
    'AWS VPC Networking',
    'Understand subnets, route tables, gateways and network security.',
    'advanced',
    80,
    ['topic-aws', 'topic-security'],
    ['skill-cloud-deploy', 'skill-security'],
    'course-cloud-native',
    'instructor-leo',
  ],
  [
    'tutorial-aws-load-balancing',
    'AWS Load Balancing',
    'Distribute application traffic using AWS load balancers.',
    'advanced',
    65,
    ['topic-aws', 'topic-system-design'],
    ['skill-cloud-deploy', 'skill-system-design'],
    'course-cloud-native',
    'instructor-leo',
  ],
  [
    'tutorial-aws-rds',
    'Amazon RDS for PostgreSQL',
    'Run managed PostgreSQL databases using Amazon RDS.',
    'intermediate',
    60,
    ['topic-aws', 'topic-postgresql'],
    ['skill-cloud-deploy', 'skill-database-design'],
    'course-cloud-native',
    'instructor-leo',
  ],
  [
    'tutorial-aws-lambda',
    'AWS Lambda Fundamentals',
    'Build serverless functions using AWS Lambda.',
    'intermediate',
    65,
    ['topic-aws', 'topic-nodejs'],
    ['skill-cloud-deploy', 'skill-node-fundamentals'],
    'course-cloud-native',
    'instructor-leo',
  ],
  [
    'tutorial-aws-iam',
    'AWS IAM and Permissions',
    'Design users, roles and policies for secure AWS environments.',
    'advanced',
    70,
    ['topic-aws', 'topic-security'],
    ['skill-cloud-deploy', 'skill-security'],
    'course-application-security',
    'instructor-sophia',
  ],
  [
    'tutorial-aws-cloudwatch',
    'AWS Monitoring with CloudWatch',
    'Monitor applications, logs and infrastructure using CloudWatch.',
    'intermediate',
    60,
    ['topic-aws'],
    ['skill-cloud-deploy'],
    'course-cloud-native',
    'instructor-leo',
  ],
  [
    'tutorial-aws-production',
    'Production Node.js Deployment on AWS',
    'Deploy a production Node.js application with networking and monitoring.',
    'advanced',
    90,
    ['topic-aws', 'topic-nodejs', 'topic-security'],
    ['skill-cloud-deploy', 'skill-node-fundamentals', 'skill-security'],
    'course-cloud-native',
    'instructor-leo',
  ],

  // -----------------------------------------------------------------------
  // GIT / CI-CD — 81-85
  // -----------------------------------------------------------------------

  [
    'tutorial-git-basics',
    'Git Fundamentals',
    'Commits, branches, staging and repository workflows.',
    'beginner',
    45,
    ['topic-git'],
    ['skill-git'],
    'course-devops',
    'instructor-james',
  ],
  [
    'tutorial-git-branching',
    'Git Branching Strategies',
    'Use branches effectively for team-based software development.',
    'intermediate',
    50,
    ['topic-git'],
    ['skill-git'],
    'course-devops',
    'instructor-james',
  ],
  [
    'tutorial-git-rebase',
    'Git Rebase and History Management',
    'Clean up commit history using rebase and interactive workflows.',
    'advanced',
    55,
    ['topic-git'],
    ['skill-git'],
    'course-devops',
    'instructor-james',
  ],
  [
    'tutorial-cicd-github-actions',
    'CI/CD with GitHub Actions',
    'Automate tests, builds and deployments with GitHub Actions.',
    'intermediate',
    70,
    ['topic-git', 'topic-cicd'],
    ['skill-git', 'skill-testing'],
    'course-devops',
    'instructor-james',
  ],
  [
    'tutorial-cicd-docker',
    'Docker CI/CD Pipeline',
    'Build and publish container images automatically.',
    'advanced',
    75,
    ['topic-docker', 'topic-cicd'],
    ['skill-containerization', 'skill-cloud-deploy'],
    'course-devops',
    'instructor-james',
  ],

  // -----------------------------------------------------------------------
  // TESTING — 86-90
  // -----------------------------------------------------------------------

  [
    'tutorial-testing-unit',
    'Unit Testing JavaScript',
    'Write maintainable unit tests for JavaScript applications.',
    'beginner',
    55,
    ['topic-testing', 'topic-javascript'],
    ['skill-testing'],
    'course-modern-javascript',
    'instructor-ada',
  ],
  [
    'tutorial-testing-api',
    'Testing REST APIs',
    'Test API endpoints, validation and authentication flows.',
    'intermediate',
    60,
    ['topic-testing', 'topic-nodejs'],
    ['skill-testing', 'skill-rest-apis'],
    'course-node-backend',
    'instructor-daniel',
  ],
  [
    'tutorial-testing-integration',
    'Integration Testing',
    'Test interactions between application components and databases.',
    'intermediate',
    65,
    ['topic-testing', 'topic-postgresql'],
    ['skill-testing', 'skill-database-design'],
    'course-database-engineering',
    'instructor-ethan',
  ],
  [
    'tutorial-testing-react',
    'Testing React Components',
    'Test React components, interactions and user workflows.',
    'intermediate',
    60,
    ['topic-testing', 'topic-react'],
    ['skill-testing', 'skill-react-components'],
    'course-react-engineering',
    'instructor-priya',
  ],
  [
    'tutorial-testing-e2e',
    'End-to-End Testing',
    'Build reliable end-to-end tests for full application workflows.',
    'advanced',
    70,
    ['topic-testing', 'topic-web-performance'],
    ['skill-testing'],
    'course-devops',
    'instructor-james',
  ],

  // -----------------------------------------------------------------------
  // SYSTEM DESIGN — 91-95
  // -----------------------------------------------------------------------

  [
    'tutorial-system-design-basics',
    'System Design Fundamentals',
    'Learn the core principles behind designing scalable systems.',
    'intermediate',
    65,
    ['topic-system-design'],
    ['skill-system-design'],
    'course-architecture',
    'instructor-nina',
  ],
  [
    'tutorial-system-design-caching',
    'Caching in Distributed Systems',
    'Use caching to reduce latency and database load.',
    'advanced',
    70,
    ['topic-system-design', 'topic-redis'],
    ['skill-system-design', 'skill-redis'],
    'course-architecture',
    'instructor-nina',
  ],
  [
    'tutorial-system-design-load-balancing',
    'Load Balancing and Horizontal Scaling',
    'Design systems that distribute traffic across multiple servers.',
    'advanced',
    75,
    ['topic-system-design', 'topic-aws'],
    ['skill-system-design', 'skill-cloud-deploy'],
    'course-architecture',
    'instructor-nina',
  ],
  [
    'tutorial-system-design-database',
    'Database Scaling Strategies',
    'Understand replication, partitioning and database scaling.',
    'advanced',
    80,
    ['topic-system-design', 'topic-postgresql'],
    ['skill-system-design', 'skill-database-design'],
    'course-architecture',
    'instructor-nina',
  ],
  [
    'tutorial-system-design-notifications',
    'Designing a Notification System',
    'Design a scalable notification platform using queues and workers.',
    'advanced',
    85,
    ['topic-system-design', 'topic-nodejs', 'topic-redis'],
    ['skill-system-design', 'skill-node-fundamentals', 'skill-redis'],
    'course-architecture',
    'instructor-nina',
  ],

  // -----------------------------------------------------------------------
  // SECURITY — 96-98
  // -----------------------------------------------------------------------

  [
    'tutorial-security-web-basics',
    'Web Application Security Fundamentals',
    'Understand common application security risks and defenses.',
    'beginner',
    60,
    ['topic-security'],
    ['skill-security'],
    'course-application-security',
    'instructor-sophia',
  ],
  [
    'tutorial-security-api',
    'Securing REST APIs',
    'Protect APIs using authentication, authorization and validation.',
    'intermediate',
    70,
    ['topic-security', 'topic-nodejs'],
    ['skill-security', 'skill-api-auth'],
    'course-application-security',
    'instructor-sophia',
  ],
  [
    'tutorial-security-injection',
    'Preventing Injection Attacks',
    'Understand SQL injection, NoSQL injection and safe query practices.',
    'advanced',
    65,
    ['topic-security', 'topic-postgresql', 'topic-mongodb'],
    ['skill-security', 'skill-sql', 'skill-mongodb'],
    'course-application-security',
    'instructor-sophia',
  ],

  // -----------------------------------------------------------------------
  // GRAPH / GRAPHQL / KUBERNETES — 99-100
  // -----------------------------------------------------------------------

  [
    'tutorial-graphql-api',
    'Building GraphQL APIs',
    'Design schemas, resolvers and queries for GraphQL APIs.',
    'intermediate',
    70,
    ['topic-graphql', 'topic-nodejs'],
    ['skill-graphql', 'skill-rest-apis'],
    'course-graphql',
    'instructor-victor',
  ],
  [
    'tutorial-graph-recommendations',
    'Graph Databases for Recommendation Engines',
    'Model relationships between users, content and skills for graph-based recommendations.',
    'advanced',
    90,
    ['topic-graph-databases', 'topic-graphql', 'topic-system-design'],
    ['skill-graphql', 'skill-system-design'],
    'course-graphql',
    'instructor-victor',
  ],
];

/*
|--------------------------------------------------------------------------
| BUILD TUTORIAL OBJECTS
|--------------------------------------------------------------------------
*/

const tutorials = tutorialSpecs.map(
  ([
    id,
    title,
    description,
    difficulty,
    duration,
    topicIds,
    skillIds,
    courseId,
    instructorId,
  ]) => ({
    id,
    title,
    description,
    contentUrl: `https://example.com/tutorials/${id.replace('tutorial-', '')}`,
    difficulty,
    duration,
    topicIds,
    skillIds,
    courseId,
    instructorId,
  })
);

/*
|--------------------------------------------------------------------------
| USERS
|--------------------------------------------------------------------------
*/

const users = [
  {
    id: 'user-alex',
    name: 'Alex Rivera',
    email: 'alex@example.com',
  },
  {
    id: 'user-sam',
    name: 'Sam Okafor',
    email: 'sam@example.com',
  },
  {
    id: 'user-jordan',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
  },
  {
    id: 'user-emma',
    name: 'Emma Davis',
    email: 'emma@example.com',
  },
  {
    id: 'user-liam',
    name: 'Liam Wilson',
    email: 'liam@example.com',
  },
];

/*
|--------------------------------------------------------------------------
| USER INTERACTIONS
|--------------------------------------------------------------------------
|
| These are deliberately spread across different areas of the graph.
| This gives the recommendation engine enough history to work with.
|
*/

const interactions = [
  // Alex — JavaScript / React / TypeScript
  {
    userId: 'user-alex',
    tutorialId: 'tutorial-js-fundamentals',
    type: 'COMPLETED',
  },
  {
    userId: 'user-alex',
    tutorialId: 'tutorial-js-closures',
    type: 'VIEWED',
  },
  {
    userId: 'user-alex',
    tutorialId: 'tutorial-react-components',
    type: 'COMPLETED',
  },
  {
    userId: 'user-alex',
    tutorialId: 'tutorial-react-hooks',
    type: 'LIKED',
  },
  {
    userId: 'user-alex',
    tutorialId: 'tutorial-react-hooks',
    type: 'VIEWED',
  },
  {
    userId: 'user-alex',
    tutorialId: 'tutorial-react-typescript',
    type: 'VIEWED',
  },
  {
    userId: 'user-alex',
    tutorialId: 'tutorial-typescript-intro',
    type: 'COMPLETED',
  },
  {
    userId: 'user-alex',
    tutorialId: 'tutorial-typescript-generics',
    type: 'VIEWED',
  },
  {
    userId: 'user-alex',
    tutorialId: 'tutorial-nextjs-routing',
    type: 'VIEWED',
  },

  // Sam — backend / databases / Docker / AWS
  {
    userId: 'user-sam',
    tutorialId: 'tutorial-node-fundamentals',
    type: 'COMPLETED',
  },
  {
    userId: 'user-sam',
    tutorialId: 'tutorial-node-rest-api',
    type: 'COMPLETED',
  },
  {
    userId: 'user-sam',
    tutorialId: 'tutorial-express-routing',
    type: 'LIKED',
  },
  {
    userId: 'user-sam',
    tutorialId: 'tutorial-node-jwt',
    type: 'VIEWED',
  },
  {
    userId: 'user-sam',
    tutorialId: 'tutorial-postgresql-basics',
    type: 'COMPLETED',
  },
  {
    userId: 'user-sam',
    tutorialId: 'tutorial-postgresql-indexes',
    type: 'VIEWED',
  },
  {
    userId: 'user-sam',
    tutorialId: 'tutorial-redis-caching',
    type: 'LIKED',
  },
  {
    userId: 'user-sam',
    tutorialId: 'tutorial-docker-basics',
    type: 'COMPLETED',
  },
  {
    userId: 'user-sam',
    tutorialId: 'tutorial-docker-node',
    type: 'VIEWED',
  },
  {
    userId: 'user-sam',
    tutorialId: 'tutorial-aws-ec2',
    type: 'VIEWED',
  },
  {
    userId: 'user-sam',
    tutorialId: 'tutorial-aws-rds',
    type: 'VIEWED',
  },

  // Emma — cloud / DevOps
  {
    userId: 'user-emma',
    tutorialId: 'tutorial-docker-basics',
    type: 'COMPLETED',
  },
  {
    userId: 'user-emma',
    tutorialId: 'tutorial-docker-compose',
    type: 'LIKED',
  },
  {
    userId: 'user-emma',
    tutorialId: 'tutorial-cicd-github-actions',
    type: 'COMPLETED',
  },
  {
    userId: 'user-emma',
    tutorialId: 'tutorial-cicd-docker',
    type: 'VIEWED',
  },
  {
    userId: 'user-emma',
    tutorialId: 'tutorial-aws-introduction',
    type: 'COMPLETED',
  },
  {
    userId: 'user-emma',
    tutorialId: 'tutorial-aws-ec2',
    type: 'LIKED',
  },
  {
    userId: 'user-emma',
    tutorialId: 'tutorial-aws-vpc',
    type: 'VIEWED',
  },
  {
    userId: 'user-emma',
    tutorialId: 'tutorial-aws-cloudwatch',
    type: 'VIEWED',
  },

  // Liam — security
  {
    userId: 'user-liam',
    tutorialId: 'tutorial-security-web-basics',
    type: 'COMPLETED',
  },
  {
    userId: 'user-liam',
    tutorialId: 'tutorial-node-jwt',
    type: 'LIKED',
  },
  {
    userId: 'user-liam',
    tutorialId: 'tutorial-node-refresh-tokens',
    type: 'VIEWED',
  },
  {
    userId: 'user-liam',
    tutorialId: 'tutorial-security-api',
    type: 'COMPLETED',
  },
  {
    userId: 'user-liam',
    tutorialId: 'tutorial-security-injection',
    type: 'VIEWED',
  },
  {
    userId: 'user-liam',
    tutorialId: 'tutorial-aws-iam',
    type: 'LIKED',
  },

  // Jordan intentionally has NO interactions.
  // This exercises the cold-start/fallback recommendation path.
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

async function mergeNodes(session, label, items) {
  if (items.length === 0) return;

  await session.executeWrite((tx) =>
    tx.run(
      `
      UNWIND $items AS item
      MERGE (n:${label} {id: item.id})
      SET n += item.props
      `,
      {
        items: items.map(({ id, ...props }) => ({
          id,
          props: {
            ...props,
            id,
          },
        })),
      }
    )
  );
}

async function mergeRelations(session, cypher, pairs) {
  if (pairs.length === 0) return;

  await session.executeWrite((tx) =>
    tx.run(cypher, {
      pairs,
    })
  );
}

/*
|--------------------------------------------------------------------------
| SEED
|--------------------------------------------------------------------------
*/

async function seed() {
  console.log('[seed] Verifying CognoDB connectivity...');

  await verifyConnectivity();

  /*
   * Safety check.
   *
   * If somebody accidentally edits the catalog and it stops containing
   * exactly 100 tutorials, fail immediately instead of silently seeding
   * incomplete demo data.
   */
  if (tutorials.length !== 100) {
    throw new Error(
      `[seed] Expected exactly 100 tutorials, found ${tutorials.length}`
    );
  }

  console.log(`[seed] Preparing ${tutorials.length} tutorials...`);
  console.log(`[seed] Preparing ${topics.length} topics...`);
  console.log(`[seed] Preparing ${skills.length} skills...`);
  console.log(`[seed] Preparing ${courses.length} courses...`);
  console.log(`[seed] Preparing ${instructors.length} instructors...`);

  await withSession('WRITE', async (session) => {
    /*
     * ---------------------------------------------------------------
     * TOPICS
     * ---------------------------------------------------------------
     */

    console.log('[seed] Merging topics...');

    await mergeNodes(session, 'Topic', topics);

    /*
     * ---------------------------------------------------------------
     * SKILLS
     * ---------------------------------------------------------------
     */

    console.log('[seed] Merging skills...');

    await mergeNodes(session, 'Skill', skills);

    /*
     * ---------------------------------------------------------------
     * INSTRUCTORS
     * ---------------------------------------------------------------
     */

    console.log('[seed] Merging instructors...');

    await mergeNodes(session, 'Instructor', instructors);

    /*
     * ---------------------------------------------------------------
     * COURSES
     * ---------------------------------------------------------------
     */

    console.log('[seed] Merging courses...');

    await mergeNodes(
      session,
      'Course',
      courses.map((course) => ({
        ...course,
        createdAt: now,
      }))
    );

    /*
     * ---------------------------------------------------------------
     * TOPIC RELATIONSHIPS
     * ---------------------------------------------------------------
     */

    console.log('[seed] Merging topic relationships...');

    await mergeRelations(
      session,
      `
      UNWIND $pairs AS pair

      MATCH (a:Topic {id: pair[0]})
      MATCH (b:Topic {id: pair[1]})

      MERGE (a)-[:RELATED_TO]->(b)
      MERGE (b)-[:RELATED_TO]->(a)
      `,
      topicRelations
    );

    /*
     * ---------------------------------------------------------------
     * SKILL RELATIONSHIPS
     * ---------------------------------------------------------------
     */

    console.log('[seed] Merging skill relationships...');

    await mergeRelations(
      session,
      `
      UNWIND $pairs AS pair

      MATCH (a:Skill {id: pair[0]})
      MATCH (b:Skill {id: pair[1]})

      MERGE (a)-[:RELATED_TO]->(b)
      MERGE (b)-[:RELATED_TO]->(a)
      `,
      skillRelations
    );

    /*
     * ---------------------------------------------------------------
     * TUTORIALS
     * ---------------------------------------------------------------
     */

    console.log('[seed] Merging 100 tutorials...');

    for (const tutorial of tutorials) {
      const {
        topicIds,
        skillIds,
        courseId,
        instructorId,
        ...tutorialProps
      } = tutorial;

      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (t:Tutorial {id: $id})

          SET t += $props

          WITH t

          UNWIND $topicIds AS topicId

          MATCH (topic:Topic {id: topicId})

          MERGE (t)-[:ABOUT]->(topic)

          WITH t

          UNWIND $skillIds AS skillId

          MATCH (skill:Skill {id: skillId})

          MERGE (t)-[:TEACHES]->(skill)

          WITH t

          OPTIONAL MATCH (course:Course {id: $courseId})

          FOREACH (
            _ IN CASE
              WHEN course IS NOT NULL THEN [1]
              ELSE []
            END |
            MERGE (course)-[:CONTAINS]->(t)
          )

          WITH t

          OPTIONAL MATCH (instructor:Instructor {id: $instructorId})

          FOREACH (
            _ IN CASE
              WHEN instructor IS NOT NULL THEN [1]
              ELSE []
            END |
            MERGE (t)-[:TAUGHT_BY]->(instructor)
          )
          `,
          {
            id: tutorial.id,

            props: {
              ...tutorialProps,
              createdAt: now,
              updatedAt: now,
            },

            topicIds,
            skillIds,
            courseId: courseId ?? null,
            instructorId: instructorId ?? null,
          }
        )
      );
    }

    /*
     * ---------------------------------------------------------------
     * USERS
     * ---------------------------------------------------------------
     */

    console.log('[seed] Merging users...');

    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $users AS u

        MERGE (user:User {id: u.id})

        SET user.name = u.name,
            user.email = u.email,
            user.passwordHash = $passwordHash,
            user.createdAt = coalesce(user.createdAt, $now),
            user.updatedAt = $now
        `,
        {
          users,
          passwordHash,
          now,
        }
      )
    );

    /*
     * ---------------------------------------------------------------
     * USER INTERACTIONS
     * ---------------------------------------------------------------
     */

    console.log(
      `[seed] Merging ${interactions.length} user interactions...`
    );

    for (const { userId, tutorialId, type } of interactions) {
      let relationshipCypher;

      switch (type) {
        case 'VIEWED':
          relationshipCypher = `
            MERGE (u)-[r:VIEWED]->(t)

            ON CREATE SET
              r.viewCount = 1,
              r.firstViewedAt = $now,
              r.lastViewedAt = $now

            ON MATCH SET
              r.viewCount = coalesce(r.viewCount, 0) + 1,
              r.lastViewedAt = $now
          `;
          break;

        case 'LIKED':
          relationshipCypher = `
            MERGE (u)-[r:LIKED]->(t)

            ON CREATE SET
              r.createdAt = $now

            ON MATCH SET
              r.updatedAt = $now
          `;
          break;

        case 'COMPLETED':
          relationshipCypher = `
            MERGE (u)-[r:COMPLETED]->(t)

            ON CREATE SET
              r.completedAt = $now,
              r.progress = 100

            ON MATCH SET
              r.progress = 100,
              r.completedAt = coalesce(r.completedAt, $now)
          `;
          break;

        default:
          throw new Error(
            `[seed] Unsupported interaction type: ${type}`
          );
      }

      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (u:User {id: $userId})
          MATCH (t:Tutorial {id: $tutorialId})

          ${relationshipCypher}
          `,
          {
            userId,
            tutorialId,
            now,
          }
        )
      );
    }
  });

  /*
   * ---------------------------------------------------------------
   * FINAL OUTPUT
   * ---------------------------------------------------------------
   */

  console.log('');
  console.log('==============================================');
  console.log('              SEED COMPLETE');
  console.log('==============================================');
  console.log(`Topics:       ${topics.length}`);
  console.log(`Skills:       ${skills.length}`);
  console.log(`Instructors:  ${instructors.length}`);
  console.log(`Courses:      ${courses.length}`);
  console.log(`Tutorials:    ${tutorials.length}`);
  console.log(`Users:        ${users.length}`);
  console.log(`Interactions: ${interactions.length}`);
  console.log('==============================================');
  console.log('');
  console.log(
    `[seed] Seed users (password: "${SEED_PASSWORD}")`
  );

  for (const user of users) {
    console.log(`  - ${user.email}`);
  }
}

/*
|--------------------------------------------------------------------------
| RUN
|--------------------------------------------------------------------------
*/

seed()
  .then(async () => {
    await closeDriver();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[seed] Seed failed:', err);

    await closeDriver();

    process.exit(1);
  });