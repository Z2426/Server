require('dotenv').config();
const axios = require('axios');
const { findUser, processInputFindUser, filterEntitiesByConfidence, generateText, generateImage } = require('../utils/handleApi.js')
exports.aiRequestHandler = async (prompt) => {
    const tokenWitAi = process.env.TOKEN_WITAI;
    if (!tokenWitAi) {
        console.error('Wit.ai token is missing. Please check your .env configuration.');
        throw new Error('Wit.ai token is not defined');
    }
    const witApiUrl = `https://api.wit.ai/message?v=20240304&q=${encodeURIComponent(prompt)}`;
    try {
        // Gọi API Wit.ai để nhận thông tin về intents
        const response = await axios.get(witApiUrl, {
            headers: {
                Authorization: `Bearer ${tokenWitAi}`,
            },
        });
        // Lấy thông tin về intents và entities từ phản hồi
        const { intents, entities, text } = response.data;
        console.log("truoc khi loc")
        console.log(entities)
        const filteredEntities = filterEntitiesByConfidence(entities, 0.9);
        console.log("SAU khi loc")
        console.log(filteredEntities)
        console.log(filteredEntities);
        if (!intents || intents.length === 0) {
            console.log('No intents detected.');
            return { message: "input invalid", text };
        }
        if (Object.keys(entities).length === 0 || !Object.values(entities).some(arr => arr.length > 0)) {
            console.log('No enities detected.');
            return { message: "input invalid", text };
        }

        // Xác định intent chính với độ tin cậy cao nhất
        const primaryIntent = intents[0];
        console.log(`Detected intent: ${primaryIntent.name} with confidence ${primaryIntent.confidence}`);

        // Xử lý dựa trên tên intent
        let result = { type: "other" };
        switch (primaryIntent.name) {
            case 'find_person':
                result.type = "find person";
                const criteria = processInputFindUser(filteredEntities)
                console.log(criteria);
                result.info = await findUser(criteria)
                break;
            case 'text_prompt':
                console.log("text_prompt", filteredEntities['textSubject:textSubject']);
                result.type = "text_prompt";
                result.text = await generateText(prompt)
                console.log(result.text)
                break;
            case 'image_prompt':

                console.log("image_prompt");
                result.type = "image prompt";  // Đặt loại kết quả là "image prompt"

                try {
                    // Gọi hàm generateImage với prompt để tạo hình ảnh
                    const image = await generateImage(prompt);  // Gọi hàm tạo hình ảnh
                    result.image = image;  // Lưu hình ảnh vào kết quả trả về
                    console.log("Tạo ảnh thành công ")
                } catch (error) {
                    // Nếu có lỗi, log ra và trả về kết quả lỗi
                    console.error('Error generating image:', error.message);
                    result = { message: 'Failed to generate image', error: error.message };
                }
                break;
            default:
                console.log(`Unhandled intent: ${primaryIntent.name}`);
                result = { message: `Intent ${primaryIntent.name} is not supported.`, text };
        }

        return result;
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error('Error fetching data from Wit.ai:', error.response ? error.response.data : error.message);
        throw new Error(`Error fetching data from Wit.ai: ${error.message}`);
    }
};