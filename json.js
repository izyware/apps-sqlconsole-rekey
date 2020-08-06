const modtask = () => {};
modtask.loadById = (queryObject, cb) => {
    const { id } = queryObject;
    try {
        cb({ success: true, data: JSON.parse(require('fs').readFileSync(`${id}`)) })
    } catch(e) {
        cb({ reason: e.message });
    }
}

