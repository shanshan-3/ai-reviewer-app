export const BSIT_SUBJECTS = [
    // 1st Year
    'Introduction to Computing',
    'Fundamentals of Programming',
    'Intermediate Programming',
    'Computer Organization',
    'Discrete Mathematics',
    // 2nd Year
    'Data Structures and Algorithms',
    'Object Oriented Programming',
    'Human Computer Interaction 1',
    'Information Management 1 (Fundamentals of Database)',
    'Human Computer Interaction 2',
    'Multimedia Technologies',
    'Network 1 (Fundamentals of Networking)',
    'System Analysis and Design',
    'Web Development',
    // 3rd Year
    'Application Development and Emerging Technologies',
    'Information Management 2 (Advanced Database Systems)',
    'Mobile Application Development 1',
    'Network 2 (Advanced Networking)',
    'Web Systems and Technologies 1',
    'Information Assurance and Security 1',
    'Integrative Programming and Technologies',
    'Elective 1 (Web Systems and Technologies 2)',
    'Elective 2 (Mobile Application Development 2)',
    'Capstone Project 1',
    // 4th Year
    'Capstone Project 2',
    'Elective 3 (Special Topics on Web and Mobile 1)',
    'Elective 4 (Special Topics on Web and Mobile 2)',
    'Information Assurance and Security 2',
    'Operating System Applications',
    'System Administration and Maintenance',
    'Systems Integration and Architecture',
];

const NORMALIZED = new Set(BSIT_SUBJECTS.map(s => s.trim().toLowerCase()));

export function isCurriculumSubject(name) {
    if (typeof name !== 'string') return false;
    return NORMALIZED.has(name.trim().toLowerCase());
}
