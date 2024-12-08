require('dotenv').config();
const requestWithCircuitBreaker = require('../shared/utils/circuitBreaker.js');
exports.findUser = async (criteria) => {
    const params = new URLSearchParams({
        age: criteria.age,
        name: criteria.name,
        workplace: criteria.workplace,
        province: criteria.province,
        school: criteria.school,
        address: criteria.address,
        interest: criteria.interest
    });
    const apiUrl = `${process.env.URL_USER_SERVICE}/find-users?${params.toString()}`;
    try {
        const response = await requestWithCircuitBreaker(apiUrl, 'GET', null, {});
        if (response) {
            return response.data;
        } else {
            throw new Error('User search failed: No response received');
        }
    } catch (error) {
        console.error('Error finding users:', error.message);
        throw new Error('User search failed');
    }
};

exports.processInputFindUser = (inputData) => {
    const criteria = {};
    const allowedKeys = ['age', 'name', 'workplace', 'interest', 'address', 'province', 'school'];
    const fieldMappings = {
        "ADDRESS:ADDRESS": "address",
        "AGE:AGE": "age",
        "HOBBY:HOBBY": "interest",
        "NAME:NAME": "name",
        "Province:Province": "province",
        "SCHOOL:SCHOOL": "school",
        "WORKPLACE:WORKPLACE": "workplace"
    };
    for (const key in inputData) {
        if (fieldMappings[key] && allowedKeys.includes(fieldMappings[key])) {
            if (inputData[key] && inputData[key].length > 0) {
                criteria[fieldMappings[key]] = inputData[key].join(', ');
            }
        }
    }
    return criteria;
};
exports.filterEntitiesByConfidence = (entities, confidenceThreshold = 0.9) => {
    const filteredEntities = {};
    for (const key in entities) {
        if (entities.hasOwnProperty(key)) {
            filteredEntities[key] = entities[key]
                .filter(entity => entity.confidence > confidenceThreshold)
                .map(entity => entity.value);
        }
    }
    return filteredEntities;
}
exports.generateText = async (prompt) => {
    const apiUrl = `${process.env.URL_SUGGEST_SERVICE}/generate-text`;
    try {
        const response = await requestWithCircuitBreaker(apiUrl, 'POST', { prompt });
        if (response) {
            return response.generated_text;
        } else {
            throw new Error('Text generation failed: No response received');
        }
    } catch (error) {
        console.error('Error generating text:', error.message);
        throw new Error('Text generation failed');
    }
};
exports.generateImage = async (prompt) => {
    const apiUrl = `${process.env.URL_SUGGEST_SERVICE}/generate-image`;
    try {
        const response = await requestWithCircuitBreaker(apiUrl, 'POST', { prompt });
        if (response) {
            return response.image;
        } else {
            throw new Error('Image generation failed: No image returned');
        }
    } catch (error) {
        console.error('Error generating image:', error.message);
        throw new Error('Image generation failed');
    }
};
