const User = require('../../models').User; 
const bcrypt = require('bcryptjs'); 

module.exports = {
  
  async store(req, res) {
    try {
      
      const { name, email, phone, password } = req.body;

      
      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return res.status(400).json({ error: 'Usuário já cadastrado com este email.' });
      }

      
      const passwordHash = await bcrypt.hash(password, 8);

      
      const user = await User.create({
        name,
        email,
        phone,
        password: passwordHash, 
        type: 'cliente'
      });

      
      return res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type
      });

    } catch (error) {
      console.error(error); 
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  }
};