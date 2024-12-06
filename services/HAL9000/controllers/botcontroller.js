const { aiRequestHandler } = require('../services/botService')
exports.AIGenerationAndSearchController = async (req, res) => {
    const prompt = req.query.prompt
    try {
        if (!prompt) {
            return res.status(400).json({ error: 'prompt is required' });
        }
        const result = await aiRequestHandler(prompt);
        if (result)
            if (result.message === "input invalid") {
                return res.status(400).json({ error: 'Please provide more clear information so I can better understand your request.' });
            }
        if (result.type === 'image_prompt') {
            console.log("Compelted process generate image")
            if (Buffer.isBuffer(result.image)) {
                res.setHeader('Content-Type', 'image/png');
                return res.send(result.image);
            } else if (typeof result.image === 'string' && result.image.startsWith('data:image/png;base64,')) {
                const base64Data = result.image.split(',')[1];
                const imageBuffer = Buffer.from(base64Data, 'base64');
                res.setHeader('Content-Type', 'image/png');
                return res.send(imageBuffer);
            } else {
                return res.status(500).json({ error: 'Image data is not valid' });
            }
        }
        else {
            return res.json(result);
        }
    } catch (error) {
        console.error('Error processing AI generation:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}