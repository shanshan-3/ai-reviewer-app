export function buildMaterialPages(sections) {
    const pages = [];
    let length = 0;
    for (const section of sections) {
        if (section.reference.page) {
            pages.push({ title: `Page ${section.reference.page}`, sections: [section] });
            length = 0;
            continue;
        }
        const previous = pages[pages.length - 1];
        if (!previous || previous.sections[0].reference.page || length + section.text.length + 2 > 3000) {
            pages.push({ title: `Reader page ${pages.length + 1}`, sections: [] });
            length = 0;
        }
        pages[pages.length - 1].sections.push(section);
        length += section.text.length + 2;
    }
    return pages;
}

export function getPageSelection(page, selected) {
    const usableIds = page.sections.filter(section => /[\p{L}\p{N}]/u.test(section.text)).map(section => section.id);
    const count = usableIds.filter(id => selected.includes(id)).length;
    return { usableIds, checked: count === 0 ? false : count === usableIds.length ? true : 'mixed' };
}

export function togglePageSelection(page, selected) {
    const { usableIds, checked } = getPageSelection(page, selected);
    return checked === true ? selected.filter(id => !usableIds.includes(id)) : [...new Set([...selected, ...usableIds])];
}
