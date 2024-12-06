const suggestFriends = require('../services/suggestFriends')
/** ================================================
 *                  SUGGEST FRIENDS
 * ================================================ */

// Controller to get the list of suggested friends
exports.getSuggestedFriends = async (req, res) => {
    try {
        // Get userId from the token or request body
        const { userId } = req.body.user;
        // Get the number of suggested friends from the query, default is 10
        const { limit } = req.query;
        // Call service to get the list of suggested friends
        const suggestedFriends = await suggestFriends.getFriendSuggestions(userId, limit);
        // Return the list of suggested friends
        return res.status(200).json({
            message: 'Suggested friends list',
            suggestedFriends
        });
    } catch (error) {
        console.error(error);
        // If there is an error in getting the suggested friends, return an error
        return res.status(500).json({
            message: 'Error in getting friend suggestions',
            error: error.message
        });
    }
};
