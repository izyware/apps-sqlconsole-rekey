const modtask = () => {};
modtask.loadById = (queryObject, cb) => {
    const { id } = queryObject;
    try {
        if (typeof(id) == 'string') {
            id = JSON.parse(require('fs').readFileSync(id));
        }
        cb({ success: true, data: id });
    } catch(e) {
        cb({ reason: e.message });
    }
}

