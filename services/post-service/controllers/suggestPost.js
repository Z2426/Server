const suggestPost = require('../services/suggestPost')

/** ================================================
 *               Newsfeed 
 * ================================================ */
exports.getNewsfeed = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { page = 1, limit = 10 } = req.query;
        const newsfeed = await suggestPost.getNewsfeed(userId, page, limit);

        return res.status(200).json({
            message: 'Newsfeed list',
            data: newsfeed,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Error retrieving newsfeed',
            error: error.message,
        });
    }
};