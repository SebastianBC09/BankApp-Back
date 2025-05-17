import accountService from "../services/accountService.js";

class AccountController {
    async getBalance(req, res, next) {
        try {
            const accountId = req.params.accountId;
            const userId = req.currentUser._id;
            const clientIp = req.ip || req.socket.remoteAddress;

            const balanceData = await accountService.getAccountBalance({ accountId, userId, clientIp });

            res.status(200).json({
                status: 'success',
                data: balanceData,
            });
        } catch (error) {
            next(error);
        }
    }
};

export default new AccountController();