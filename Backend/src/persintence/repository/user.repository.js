import { User } from "../models/User.js"



/*
User Repository
Estas son funciones que se usar para manipular datos en la BD
 */


export async function getUsers_(){
    try {
        const users = await User.findAll({
          attributes: ["id","name", "mail"],
        });
        return users
      } catch (error) {
        throw new Error("Sucedio un error......")
      }
}

export async function createUser_(user){
    const { name, mail, password } = user;
    try{ 
        let newUser = await User.create(
            {
            name,
            mail,
            password
            },
            {
            fields: ["name", "mail","password"],
            }
        );
      return newUser
    } catch (error) {
        throw new Error("Sucedio un error......")
    }
}
export async function getUser_(id){
    try {
        const user = await User.findOne({
          where: {
            id,
          },
        });
        return user
      } catch (error) {
        throw new Error("Sucedio un error......")
      }
}

export async function updateUser_(user){
    const {id, name, mail} = user 
    try {
        const user = await User.findByPk(id);
        user.name = name;
        user.mail = mail;
        await user.save();
        return "Usuario Modificado"
    } catch (error) {
        throw new Error("Sucedio un error......")
    }
}

export async function deleteUser_(id){
    try {
        await User.destroy({
            where: {
            id,
        },
        });
        return "Se elimino el usuario correctamente.. "
    } catch (error) {
        throw new Error("Sucedio un error......")
    }
}

export async function findOrCreateGoogleUser_({ providerid, mail, name }) {
  try {
    let user = await User.findOne({
      where: { providerid, provider: "google" },
    });

    if (!user) {
      user = await User.create({
        name,
        mail,
        provider: "google",
        providerid,
        admin: false,
      });
    }

    return user;
  } catch (error) {
    throw new Error("Sucedio un error......");
  }
}