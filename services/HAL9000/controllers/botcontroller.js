const { aiRequestHandler } = require('../services/botService')
exports.AIGenerationAndSearchController = async (req, res) => {
    const prompt = req.query.prompt
    console.log(prompt)
    try {
        if (!prompt) {
            return res.status(400).json({ error: 'prompt is required' });
        }
        // Gọi hàm handlerAI xử lý
        const result = await aiRequestHandler(prompt);
        if (result)
            if (result.message === "input invalid") {
                return res.status(400).json({ error: 'Vui lòng cung cấp thông tin rõ ràng hơn để tôi có thể hiểu rõ hơn về yêu cầu của bạn.' });
            }
        // Kiểm tra type và trả về kết quả phù hợp
        // Kiểm tra type và trả về kết quả phù hợp
        if (result.type === 'image_prompt') {
            console.log("Da xu li tao anh")
            // Kiểm tra xem dữ liệu có phải là buffer hay Base64
            if (Buffer.isBuffer(result.image)) {
                console.log('Buffer detected');
                // Nếu dữ liệu là buffer, trả về ảnh dưới dạng buffer
                res.setHeader('Content-Type', 'image/png'); // Thiết lập header cho ảnh PNG
                return res.send(result.image); // Trả về ảnh dưới dạng buffer
            } else if (typeof result.image === 'string' && result.image.startsWith('data:image/png;base64,')) {
                console.log('Base64 detected');
                // Nếu dữ liệu là chuỗi Base64 hợp lệ
                const base64Data = result.image.split(',')[1]; // Lấy phần base64 từ chuỗi
                const imageBuffer = Buffer.from(base64Data, 'base64'); // Chuyển base64 thành buffer
                res.setHeader('Content-Type', 'image/png'); // Thiết lập header cho ảnh PNG
                return res.send(imageBuffer); // Trả về ảnh dưới dạng buffer
            } else {
                // Nếu dữ liệu không phải là buffer hay Base64 hợp lệ, trả về lỗi
                return res.status(500).json({ error: 'Image data is not valid' });
            }
        }
        else {
            // Trả về JSON cho các loại dữ liệu khác (text hoặc user_list)
            return res.json(result);
        }
    } catch (error) {
        console.error('Error processing AI generation:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}