const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization;   
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const [, token] = authHeader.split(' ');

    try {

        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        req.userId = decoded.id;
        req.userType = decoded.type;

        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}