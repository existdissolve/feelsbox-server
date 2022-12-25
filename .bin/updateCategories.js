import mongoose from 'mongoose';

import FeelSchema from '-/mongodb/schema/Feel';
import {connect} from '-/mongodb';

const updateCategories = async () => {
    await connect();

    const Feel = mongoose.model('Feel', FeelSchema);
    const feels = await Feel.find({});

    for (const feel of feels) {
        const {category} = feel

        const payload = {
            categories: !category ? [] : [category]
        };
        
        await feel.update(payload);
    }
};

updateCategories();