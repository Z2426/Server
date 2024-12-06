const Users = require('../models/userModel');
exports.getFriendSuggestions = async (userId, limit = 20) => {
    try {
        const user = await Users.findById(userId)
            .select('firstName lastName profileUrl suggestfriends friends blockedUsers')
            .exec();

        if (!user) {
            throw new Error('User does not exist');
        }
        let suggestions = user.suggestfriends;
        const additionalUsersRequired = limit - suggestions.length;
        if (additionalUsersRequired > 0) {
            const additionalUsers = await Users.find({
                _id: { $ne: userId },
                _id: { $nin: user.friends },
                _id: { $nin: user.blockedUsers }
            })
                .select('firstName lastName profileUrl')
                .limit(additionalUsersRequired)
                .exec();
            suggestions = [...suggestions, ...additionalUsers];
        }
        return suggestions.slice(0, 20);
    } catch (error) {
        console.error(error);
        throw new Error('An error occurred while fetching friend suggestions');
    }
}