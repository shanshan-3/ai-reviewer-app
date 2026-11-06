export const BSIT_CURRICULUM_SECTIONS = [
    {
        title: '1st Year – Programming & Computing Fundamentals',
        data: [
            'Introduction to Computing',
            'Fundamentals of Programming',
            'Intermediate Programming',
            'Computer Organization',
            'Discrete Mathematics',
        ],
    },
    {
        title: '2nd Year – Core IT Fundamentals',
        data: [
            'Data Structures and Algorithms',
            'Object Oriented Programming',
            'Human Computer Interaction 1',
            'Information Management 1 (Fundamentals of Database)',
            'Human Computer Interaction 2',
            'Multimedia Technologies',
            'Network 1 (Fundamentals of Networking)',
            'System Analysis and Design',
            'Web Development',
        ],
    },
    {
        title: '3rd Year – Application & System Development',
        data: [
            'Application Development and Emerging Technologies',
            'Information Management 2 (Advanced Database Systems)',
            'Mobile Application Development 1',
            'Network 2 (Advanced Networking)',
            'SP 101 – Social and Professional Issues',
            'Web Systems and Technologies 1',
            'Information Assurance and Security 1',
            'Integrative Programming and Technologies',
            'Elective 1 (Web Systems and Technologies 2)',
            'Elective 2 (Mobile Application Development 2)',
            'Capstone Project 1',
        ],
    },
    {
        title: '4th Year – Advanced IT & Capstone',
        data: [
            'Capstone Project 2',
            'Elective 3 (Special Topics on Web and Mobile 1)',
            'Elective 4 (Special Topics on Web and Mobile 2)',
            'Information Assurance and Security 2',
            'Operating System Applications',
            'System Administration and Maintenance',
            'Systems Integration and Architecture',
        ],
    },
];

export function filterCurriculum(searchTerm) {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return BSIT_CURRICULUM_SECTIONS;
    return BSIT_CURRICULUM_SECTIONS
        .map(section => ({
            ...section,
            data: section.data.filter(subject => subject.toLowerCase().includes(term)),
        }))
        .filter(section => section.data.length > 0);
}
