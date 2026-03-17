const User = require('../../models').User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {

    async store(req, res) {

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, type: user.type },
        process.env.TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    return res.json({
        user: {
            id: user.id,
            email: user.email,
            type: user.type,
        },
        token

    });
    },
};
