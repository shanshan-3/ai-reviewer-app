function data(result) {
    if (result.error) throw result.error;
    return result.data;
}

export async function getLabels(client, ownerId) {
    const [subjects, topics] = await Promise.all([
        client.from('subjects').select('id,name').eq('owner_id', ownerId).order('name'),
        client.from('topics').select('id,subject_id,name').eq('owner_id', ownerId).order('name'),
    ]);
    return { subjects: data(subjects), topics: data(topics) };
}

export async function createLabel(client, table, row) {
    return data(await client.from(table).insert(row).select('id,name' + (table === 'topics' ? ',subject_id' : '')).single());
}
